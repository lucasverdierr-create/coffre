import { useEffect, useRef, useState } from 'react'
import { supabase, cloudEnabled } from './lib/supabase'
import { deriveKey, decryptJSON, newSalt, toB64, fromB64, ITERATIONS, seal, openEnvelope } from './lib/crypto'
import { loadLocal, saveLocal, clearLocal, fetchRemote, pushRemote } from './lib/storage'
import { initialVault, mergeVaults, DEFAULT_SETTINGS } from './lib/vault'
import { setClipboardSec, applyTheme, downloadFile, today } from './lib/misc'
import { AuthScreen, RecoveryScreen } from './components/AuthScreen'
import UnlockScreen from './components/UnlockScreen'
import Vault from './components/Vault'
import { ToastProvider, useToast, Splash } from './components/ui'

export default function App() {
  return (
    <ToastProvider>
      <Root />
    </ToastProvider>
  )
}

function Root() {
  const toast = useToast()
  const [session, setSession] = useState(cloudEnabled ? undefined : null)
  const [recovery, setRecovery] = useState(false)
  const [probe, setProbe] = useState(null)
  const [vault, setVault] = useState(null)
  const [lockReason, setLockReason] = useState('')
  const [sync, setSync] = useState({ state: cloudEnabled ? 'idle' : 'local', last: null })

  const keyRef = useRef(null) // { key, salt, iter }
  const revRef = useRef(0) // révision serveur connue
  const vaultRef = useRef(null)
  const seqRef = useRef(0)
  const timerRef = useRef(null)
  const pushingRef = useRef(false)
  const uidRef = useRef(null)

  const uid = cloudEnabled ? session?.user?.id : 'local'
  uidRef.current = uid

  // ---------- Session Supabase ----------
  useEffect(() => {
    if (!cloudEnabled) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // ---------- Recherche d'un coffre existant (local et/ou serveur) ----------
  useEffect(() => {
    if (!uid || vault) return
    let alive = true
    setProbe(null)
    ;(async () => {
      const local = loadLocal(uid)
      let remote = null
      let offline = false
      if (cloudEnabled) {
        try {
          remote = await fetchRemote(uid)
        } catch (e) {
          console.warn(e)
          offline = true
        }
      }
      if (alive) setProbe({ local, remote, offline })
    })()
    return () => {
      alive = false
    }
  }, [uid, vault])

  function setVaultState(v) {
    vaultRef.current = v
    setVault(v)
    if (v) setClipboardSec(v.settings?.clipboardSec ?? DEFAULT_SETTINGS.clipboardSec)
  }

  const sealCurrent = (v) => seal(keyRef.current, v)

  // ---------- Persistance ----------
  async function persist(v) {
    setVaultState(v)
    const seq = ++seqRef.current
    const env = await sealCurrent(v)
    if (seq !== seqRef.current) return
    saveLocal(uidRef.current, { envelope: env, revision: revRef.current, dirty: cloudEnabled })
    if (cloudEnabled) schedulePush()
  }
  const update = (fn) => persist(fn(vaultRef.current))

  function schedulePush(delay = 700) {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      doPush()
    }, delay)
  }

  async function doPush() {
    if (!cloudEnabled || !keyRef.current) return
    if (pushingRef.current) return schedulePush(1000)
    pushingRef.current = true
    setSync((s) => ({ ...s, state: 'syncing' }))
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const v = vaultRef.current
        const env = await sealCurrent(v)
        const res = await pushRemote(uidRef.current, env, revRef.current)
        if (!res.conflict) {
          revRef.current = res.revision
          if (vaultRef.current === v) saveLocal(uidRef.current, { envelope: env, revision: res.revision, dirty: false })
          else schedulePush()
          setSync({ state: 'synced', last: Date.now() })
          return
        }
        // Conflit : un autre appareil a écrit entre-temps → on récupère, on fusionne, on réessaie.
        const remote = await fetchRemote(uidRef.current)
        if (!remote) {
          revRef.current = 0
          continue
        }
        if (remote.envelope.kdf.salt !== keyRef.current.salt) {
          await lock('Le mot de passe maître a été changé sur un autre appareil. Déverrouille avec le nouveau.', false)
          return
        }
        const remoteData = await decryptJSON(keyRef.current.key, remote.envelope)
        setVaultState(mergeVaults(vaultRef.current, remoteData))
        revRef.current = remote.revision
      }
      setSync((s) => ({ ...s, state: 'error' }))
    } catch (e) {
      console.error(e)
      setSync((s) => ({ ...s, state: navigator.onLine ? 'error' : 'offline' }))
    } finally {
      pushingRef.current = false
    }
  }

  async function pull() {
    if (!cloudEnabled || !keyRef.current || pushingRef.current) return
    try {
      const remote = await fetchRemote(uidRef.current)
      const local = loadLocal(uidRef.current)
      if (!remote || remote.revision <= revRef.current) {
        if (local?.dirty) schedulePush(100)
        else setSync((s) => ({ state: 'synced', last: s.last || Date.now() }))
        return
      }
      if (remote.envelope.kdf.salt !== keyRef.current.salt) {
        await lock('Le mot de passe maître a été changé sur un autre appareil. Déverrouille avec le nouveau.', false)
        return
      }
      const remoteData = await decryptJSON(keyRef.current.key, remote.envelope)
      const merged = local?.dirty ? mergeVaults(vaultRef.current, remoteData) : remoteData
      revRef.current = remote.revision
      setVaultState(merged)
      if (local?.dirty) schedulePush(100)
      else {
        saveLocal(uidRef.current, { envelope: remote.envelope, revision: remote.revision, dirty: false })
        setSync({ state: 'synced', last: Date.now() })
      }
    } catch (e) {
      console.warn(e)
      setSync((s) => ({ ...s, state: navigator.onLine ? 'error' : 'offline' }))
    }
  }

  async function syncNow() {
    if (!cloudEnabled) return
    await pull()
    if (loadLocal(uidRef.current)?.dirty) await doPush()
  }

  // ---------- Verrouillage ----------
  async function lock(reason = '', flush = true) {
    if (flush && cloudEnabled && timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      try {
        await doPush()
      } catch {}
    }
    clearTimeout(timerRef.current)
    keyRef.current = null
    setVaultState(null)
    setLockReason(reason)
    setSync((s) => ({ ...s, state: cloudEnabled ? 'idle' : 'local' }))
  }

  async function unlock(password) {
    const { local, remote, offline } = probe
    const localEnv = local?.envelope
    const useRemote = remote && (!localEnv || local.dirty || remote.revision >= (local.revision || 0))
    const base = useRemote ? remote.envelope : localEnv
    const key = await deriveKey(password, fromB64(base.kdf.salt), base.kdf.iter)
    let data
    try {
      data = await decryptJSON(key, base)
    } catch {
      throw new Error('Mot de passe maître incorrect.')
    }
    keyRef.current = { key, salt: base.kdf.salt, iter: base.kdf.iter }
    revRef.current = remote ? remote.revision : offline ? local?.revision || 0 : 0

    let needPush = false
    if (useRemote && local?.dirty && localEnv) {
      // Modifications faites hors ligne sur cet appareil : on les fusionne avec la version serveur.
      try {
        const { data: localData } = await openEnvelope(password, localEnv)
        data = mergeVaults(data, localData)
        needPush = true
      } catch {}
    }
    if (cloudEnabled && !remote) needPush = true
    setLockReason('')
    if (needPush) await persist(data)
    else {
      setVaultState(data)
      if (useRemote) saveLocal(uid, { envelope: remote.envelope, revision: remote.revision, dirty: false })
      setSync({ state: cloudEnabled ? 'synced' : 'local', last: cloudEnabled ? Date.now() : null })
    }
  }

  async function create(password) {
    const salt = toB64(newSalt())
    const key = await deriveKey(password, fromB64(salt), ITERATIONS)
    keyRef.current = { key, salt, iter: ITERATIONS }
    revRef.current = 0
    setLockReason('')
    await persist(initialVault())
    toast('Coffre créé et chiffré')
  }

  async function changeMaster(oldPw, newPw) {
    const cur = keyRef.current
    const test = await deriveKey(oldPw, fromB64(cur.salt), cur.iter)
    try {
      await decryptJSON(test, await sealCurrent(vaultRef.current))
    } catch {
      throw new Error('Mot de passe maître actuel incorrect.')
    }
    const salt = toB64(newSalt())
    keyRef.current = { key: await deriveKey(newPw, fromB64(salt), ITERATIONS), salt, iter: ITERATIONS }
    await persist({ ...vaultRef.current })
  }

  async function exportBackup() {
    const env = await sealCurrent(vaultRef.current)
    downloadFile(`coffre-sauvegarde-${today()}.json`, JSON.stringify({ app: 'coffre', exportedAt: new Date().toISOString(), ...env }, null, 2))
  }

  async function importBackup(envelope, password) {
    let data
    try {
      ;({ data } = await openEnvelope(password, envelope))
    } catch {
      throw new Error('Mot de passe incorrect pour cette sauvegarde.')
    }
    await update((v) => mergeVaults(v, data))
    return data.items?.filter((i) => !i.purged).length || 0
  }

  async function signOut() {
    await lock()
    if (cloudEnabled) await supabase.auth.signOut()
  }

  async function forgetDevice() {
    const id = uidRef.current
    await lock()
    clearLocal(id)
    if (cloudEnabled) await supabase.auth.signOut()
    else setProbe({ local: null, remote: null, offline: false })
    toast('Données de cet appareil effacées')
  }

  // ---------- Synchro périodique ----------
  const unlocked = Boolean(vault)
  useEffect(() => {
    if (!unlocked || !cloudEnabled) return
    const onFocus = () => pull()
    const onOnline = () => syncNow()
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    const t = setInterval(pull, 30000)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      clearInterval(t)
    }
  }, [unlocked])

  // ---------- Verrouillage automatique ----------
  const autoLockMin = vault?.settings?.autoLockMin ?? 0
  useEffect(() => {
    if (!unlocked || !autoLockMin) return
    let last = Date.now()
    const bump = () => {
      last = Date.now()
    }
    const evs = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    const t = setInterval(() => {
      if (Date.now() - last > autoLockMin * 60000) lock('Verrouillé après inactivité.')
    }, 10000)
    return () => {
      evs.forEach((e) => window.removeEventListener(e, bump))
      clearInterval(t)
    }
  }, [unlocked, autoLockMin])

  // ---------- Thème ----------
  const theme = vault?.settings?.theme
  useEffect(() => {
    if (theme) applyTheme(theme)
  }, [theme])

  // ---------- Rendu ----------
  if (cloudEnabled && session === undefined) return <Splash />
  if (recovery && session) return <RecoveryScreen onDone={() => setRecovery(false)} />
  if (cloudEnabled && !session) return <AuthScreen />
  if (!vault) {
    if (!probe) return <Splash />
    return (
      <UnlockScreen
        probe={probe}
        reason={lockReason}
        account={session?.user?.email}
        onUnlock={unlock}
        onCreate={create}
        onSignOut={signOut}
        onRetry={() => window.location.reload()}
      />
    )
  }
  return (
    <Vault
      vault={vault}
      update={update}
      lock={() => lock()}
      ctx={{ cloud: cloudEnabled, sync, syncNow, account: session?.user?.email, signOut, forgetDevice, changeMaster, exportBackup, importBackup }}
    />
  )
}
