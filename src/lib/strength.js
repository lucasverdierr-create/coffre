// Estimation simple de la robustesse d'un mot de passe (score 0 à 4).

const COMMON = ['password', 'motdepasse', 'azerty', 'qwerty', '123456', 'admin', 'soleil', 'bonjour', 'iloveyou', 'welcome', 'letmein', 'dragon', 'football', 'marseille', 'loulou', 'doudou', 'chouchou']
const LABELS = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']

export function strength(pw = '') {
  if (!pw) return { score: 0, bits: 0, label: 'Vide' }
  let pool = 0
  if (/[a-z]/.test(pw)) pool += 26
  if (/[A-Z]/.test(pw)) pool += 26
  if (/\d/.test(pw)) pool += 10
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33
  let bits = pw.length * Math.log2(pool || 1)
  const lower = pw.toLowerCase()
  if (COMMON.some((w) => lower.includes(w))) bits *= 0.5
  if (/(.)\1{2,}/.test(pw)) bits *= 0.8
  if (/^(?:\d+|[a-z]+|[A-Z]+)$/.test(pw)) bits *= 0.8
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|azer)/i.test(pw)) bits *= 0.8
  if (pw.length < 8) bits = Math.min(bits, 27)
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4
  return { score, bits: Math.round(bits), label: LABELS[score] }
}
