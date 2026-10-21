// Codes 2FA (TOTP, RFC 6238) calculés localement.
// Accepte une clé base32 ("JBSWY3DPEHPK3PXP") ou une URI otpauth://totp/...

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Decode(input) {
  const s = input.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase()
  let bits = 0
  let value = 0
  const out = []
  for (const c of s) {
    const i = ALPHABET.indexOf(c)
    if (i < 0) throw new Error('Clé 2FA invalide')
    value = ((value << 5) | i) & 0xffff
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  if (!out.length) throw new Error('Clé 2FA vide')
  return new Uint8Array(out)
}

export function parseTotp(raw) {
  let secret = (raw || '').trim()
  let period = 30
  let digits = 6
  let algorithm = 'SHA-1'
  if (secret.toLowerCase().startsWith('otpauth://')) {
    const u = new URL(secret)
    secret = u.searchParams.get('secret') || ''
    period = parseInt(u.searchParams.get('period'), 10) || 30
    digits = parseInt(u.searchParams.get('digits'), 10) || 6
    const alg = (u.searchParams.get('algorithm') || 'SHA1').toUpperCase()
    algorithm = alg === 'SHA256' ? 'SHA-256' : alg === 'SHA512' ? 'SHA-512' : 'SHA-1'
  }
  return { secret, period, digits, algorithm }
}

export async function totp(raw, now = Date.now()) {
  const { secret, period, digits, algorithm } = parseTotp(raw)
  const key = await crypto.subtle.importKey('raw', base32Decode(secret), { name: 'HMAC', hash: algorithm }, false, ['sign'])
  const seconds = Math.floor(now / 1000)
  const counter = Math.floor(seconds / period)
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)
  view.setUint32(0, Math.floor(counter / 2 ** 32))
  view.setUint32(4, counter >>> 0)
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf))
  const off = h[h.length - 1] & 0x0f
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]
  const code = String(bin % 10 ** digits).padStart(digits, '0')
  return { code, remaining: period - (seconds % period), period }
}
