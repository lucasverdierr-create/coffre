// Chiffrement côté navigateur uniquement (Web Crypto).
// Clé dérivée du mot de passe maître avec PBKDF2-SHA256, données chiffrées en AES-256-GCM.
// Le mot de passe maître et la clé ne quittent jamais l'appareil.

const enc = new TextEncoder()
const dec = new TextDecoder()

export const ITERATIONS = 600000

export function toB64(bytes) {
  const a = new Uint8Array(bytes)
  let s = ''
  for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000))
  return btoa(s)
}

export function fromB64(str) {
  const bin = atob(str)
  const a = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i)
  return a
}

export const newSalt = () => crypto.getRandomValues(new Uint8Array(16))

export async function deriveKey(password, salt, iterations = ITERATIONS) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptJSON(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)))
  return { iv: toB64(iv), data: toB64(ct) }
}

export async function decryptJSON(key, { iv, data }) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(data))
  return JSON.parse(dec.decode(pt))
}

// Enveloppe stockée (localement et sur Supabase) : rien n'y est lisible sans le mot de passe maître.
export async function seal(keyInfo, obj) {
  const { iv, data } = await encryptJSON(keyInfo.key, obj)
  return { v: 1, kdf: { alg: 'PBKDF2-SHA256', salt: keyInfo.salt, iter: keyInfo.iter }, iv, data }
}

export async function openEnvelope(password, envelope) {
  const key = await deriveKey(password, fromB64(envelope.kdf.salt), envelope.kdf.iter)
  const data = await decryptJSON(key, envelope)
  return { key, data }
}
