import { marked } from 'marked'
import DOMPurify from 'dompurify'

// ---------- Presse-papiers (effacement automatique des secrets) ----------
let clipboardSec = 30
export const setClipboardSec = (s) => {
  clipboardSec = s
}
export const getClipboardSec = () => clipboardSec

export async function copyText(text, secret = false) {
  await navigator.clipboard.writeText(text)
  if (secret && clipboardSec > 0) {
    setTimeout(async () => {
      try {
        const cur = await navigator.clipboard.readText()
        if (cur === text) await navigator.clipboard.writeText('')
      } catch {
        try {
          await navigator.clipboard.writeText('')
        } catch {}
      }
    }, clipboardSec * 1000)
  }
}

// ---------- Markdown sécurisé ----------
marked.setOptions({ gfm: true, breaks: true })
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})
export const renderMarkdown = (md) => DOMPurify.sanitize(marked.parse(md || ''))

// ---------- Thème ----------
export function getStoredTheme() {
  try {
    return localStorage.getItem('coffre.theme') || 'system'
  } catch {
    return 'system'
  }
}
export function applyTheme(t) {
  const root = document.documentElement
  if (t === 'light' || t === 'dark') root.dataset.theme = t
  else delete root.dataset.theme
  try {
    localStorage.setItem('coffre.theme', t)
  } catch {}
}

// ---------- Fichiers ----------
export function downloadFile(name, content, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const today = () => new Date().toISOString().slice(0, 10)

export const fmtDate = (t) => (t ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(t)) : '—')

export function timeAgo(t) {
  if (!t) return ''
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  if (s < 86400 * 30) return `il y a ${Math.floor(s / 86400)} j`
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(t))
}

// ---------- Have I Been Pwned (k-anonymat : seuls 5 caractères du hash SHA-1 sont envoyés) ----------
export async function pwnedCount(pw) {
  const h = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw))
  const hex = [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  const res = await fetch(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' } })
  if (!res.ok) throw new Error(`HIBP ${res.status}`)
  const suffix = hex.slice(5)
  for (const line of (await res.text()).split('\n')) {
    const [s, count] = line.trim().split(':')
    if (s === suffix) return parseInt(count, 10) || 0
  }
  return 0
}
