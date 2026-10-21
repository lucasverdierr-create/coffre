import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo, PasswordField, useToast } from './ui'

export function AuthScreen() {
  const [mode, setMode] = useState('login') // login | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        if (password.length < 8) throw new Error('8 caractères minimum pour le mot de passe du compte.')
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
        if (error) throw error
        if (!data.session) setMsg({ ok: true, text: 'Compte créé. Clique sur le lien reçu par e-mail pour le confirmer, puis reviens te connecter.' })
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
        if (error) throw error
        setMsg({ ok: true, text: 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d\'être envoyé.' })
      }
    } catch (err) {
      setMsg({ ok: false, text: translate(err.message) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit}>
        <div className="gate-brand">
          <Logo size={40} />
          <div>
            <h1>Coffre</h1>
            <p>Mots de passe, notes et mémos, chiffrés sur ton appareil.</p>
          </div>
        </div>

        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Connexion</button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Créer un compte</button>
        </div>

        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
        </label>
        {mode !== 'reset' && (
          <label>
            Mot de passe du compte
            <PasswordField value={password} onChange={setPassword} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
        )}

        {msg && <div className={`notice ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}

        <button className="btn primary block" disabled={busy}>
          {busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}
        </button>

        <p className="hint">
          {mode === 'reset' ? (
            <button type="button" className="link" onClick={() => setMode('login')}>← Retour à la connexion</button>
          ) : (
            <button type="button" className="link" onClick={() => setMode('reset')}>Mot de passe du compte oublié ?</button>
          )}
        </p>
        <p className="fineprint">
          Le compte sert uniquement à synchroniser ton coffre entre tes appareils. Tes données sont chiffrées ensuite avec un <strong>mot de passe maître</strong> distinct, que le serveur ne voit jamais.
        </p>
      </form>
    </div>
  )
}

export function RecoveryScreen({ onDone }) {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (password.length < 8) return setErr('8 caractères minimum.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setErr(translate(error.message))
    toast('Mot de passe du compte mis à jour')
    onDone()
  }
  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit}>
        <div className="gate-brand">
          <Logo size={40} />
          <div>
            <h1>Nouveau mot de passe</h1>
            <p>Pour ton compte de synchronisation (pas le mot de passe maître).</p>
          </div>
        </div>
        <label>
          Nouveau mot de passe du compte
          <PasswordField value={password} onChange={setPassword} autoFocus />
        </label>
        {err && <div className="notice err">{err}</div>}
        <button className="btn primary block" disabled={busy}>Enregistrer</button>
      </form>
    </div>
  )
}

function translate(m = '') {
  if (/invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.'
  if (/email not confirmed/i.test(m)) return 'Adresse e-mail pas encore confirmée : vérifie ta boîte mail.'
  if (/already registered/i.test(m)) return 'Un compte existe déjà avec cette adresse.'
  if (/rate limit/i.test(m)) return 'Trop de tentatives, réessaie dans quelques minutes.'
  if (/failed to fetch|network/i.test(m)) return 'Serveur injoignable. Vérifie ta connexion.'
  return m
}
