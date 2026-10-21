// Déverrouillage par Face ID / Touch ID / Windows Hello.
//
// Principe : on crée une passkey propre à cet appareil avec l'extension WebAuthn « PRF ».
// À chaque authentification biométrique, l'appareil renvoie un secret de 32 octets, toujours le même,
// qui ne sort jamais de la puce sécurisée sans Face ID. Ce secret sert à chiffrer (AES-GCM)
// le mot de passe maître, stocké uniquement sur cet appareil. Rien n'est envoyé au serveur.

import { toB64, fromB64 } from './crypto'

const enc = new TextEncoder()
const dec = new TextDecoder()
const storeKey = (uid) => `coffre.bio.${uid || 'local'}`
const rand = (n) => crypto.getRandomValues(new Uint8Array(n))

export function bioRecord(uid) {
  try {
    return JSON.parse(localStorage.getItem(storeKey(uid)))
  } catch {
    return null
  }
}

export function disableBio(uid) {
  try {
    localStorage.removeItem(storeKey(uid))
  } catch {}
}

export async function bioAvailable() {
  if (!window.isSecureContext || !window.PublicKeyCredential) return false
  try {
    if (PublicKeyCredential.getClientCapabilities) {
      const caps = await PublicKeyCredential.getClientCapabilities()
      if ('extension:prf' in caps && !caps['extension:prf']) return false
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function bioLabel() {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'Face ID'
  if (/Macintosh/.test(ua)) return 'Touch ID'
  if (/Windows/.test(ua)) return 'Windows Hello'
  return 'la biométrie'
}

async function wrapKey(prfOutput) {
  const base = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('coffre-bio-v1'), info: enc.encode('master-password') },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function getPrf(credentialId, prfSalt) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: rand(32),
      rpId: location.hostname,
      allowCredentials: [{ type: 'public-key', id: credentialId, transports: ['internal', 'hybrid'] }],
      userVerification: 'required',
      timeout: 60000,
      extensions: { prf: { eval: { first: prfSalt } } },
    },
  })
  const out = assertion?.getClientExtensionResults?.().prf?.results?.first
  if (!out) throw new Error('PRF')
  return new Uint8Array(out)
}

// Active le déverrouillage biométrique sur cet appareil (le mot de passe maître doit déjà avoir été vérifié).
export async function enableBio(uid, account, masterPassword) {
  const prfSalt = rand(32)
  let cred
  try {
    cred = await navigator.credentials.create({
      publicKey: {
        challenge: rand(32),
        rp: { name: 'Coffre', id: location.hostname },
        user: { id: rand(16), name: account || 'coffre', displayName: `Coffre${account ? ` · ${account}` : ''}` },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
        timeout: 60000,
        extensions: { prf: { eval: { first: prfSalt } } },
      },
    })
  } catch (e) {
    if (e?.name === 'NotAllowedError') throw new Error('Activation annulée.')
    throw new Error('Impossible de créer la clé biométrique sur cet appareil.')
  }

  const ext = cred.getClientExtensionResults?.() || {}
  if (ext.prf?.enabled === false) {
    throw new Error("Cet appareil ou ce navigateur ne permet pas encore le déverrouillage biométrique (il faut iOS 18 / macOS 15 ou plus récent, avec Safari ou Chrome).")
  }
  const credentialId = new Uint8Array(cred.rawId)

  // Certains appareils (dont l'iPhone) ne renvoient le secret qu'à la première authentification :
  // on redemande alors Face ID une seconde fois.
  let out = ext.prf?.results?.first ? new Uint8Array(ext.prf.results.first) : null
  if (!out) {
    try {
      out = await getPrf(credentialId, prfSalt)
    } catch {
      throw new Error("Cet appareil ne permet pas encore le déverrouillage biométrique (il faut iOS 18 / macOS 15 ou plus récent).")
    }
  }

  const key = await wrapKey(out)
  const iv = rand(12)
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(masterPassword))
  const record = { v: 1, credentialId: toB64(credentialId), prfSalt: toB64(prfSalt), iv: toB64(iv), data: toB64(data), createdAt: Date.now() }
  localStorage.setItem(storeKey(uid), JSON.stringify(record))
  return record
}

// Demande Face ID et renvoie le mot de passe maître déchiffré.
export async function bioUnlock(uid) {
  const r = bioRecord(uid)
  if (!r) throw new Error('Déverrouillage biométrique non activé sur cet appareil.')
  let out
  try {
    out = await getPrf(fromB64(r.credentialId), fromB64(r.prfSalt))
  } catch (e) {
    if (e?.name === 'NotAllowedError') throw Object.assign(new Error('Authentification annulée.'), { cancelled: true })
    throw new Error('La clé biométrique de cet appareil est introuvable. Déverrouille avec ton mot de passe maître puis réactive-la dans les réglages.')
  }
  try {
    const key = await wrapKey(out)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(r.iv) }, key, fromB64(r.data))
    return dec.decode(pt)
  } catch {
    throw new Error('Données biométriques illisibles. Déverrouille avec ton mot de passe maître puis réactive-la.')
  }
}
