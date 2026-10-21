import { KeyRound, StickyNote, Terminal, LockKeyhole } from 'lucide-react'
import { brandOf } from '../lib/categories'

const TYPE_ICONS = { login: KeyRound, note: StickyNote, snippet: Terminal, secret: LockKeyhole }

// Texte clair ou foncé selon la couleur de fond
function inkFor(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 165 ? '#14161a' : '#ffffff'
}

function hue(str) {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 360
}

function initials(title) {
  const words = (title || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/)
  return ((words[0]?.[0] || '?') + (words[1]?.[0] || '')).toUpperCase()
}

export default function Avatar({ item, size = 34 }) {
  const brand = brandOf(item)
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.27) }

  if (brand) {
    const ink = inkFor(brand.color)
    return (
      <span className="avatar brand" style={{ ...style, background: brand.color, color: ink }} title={brand.name}>
        {brand.icon ? (
          <svg viewBox="0 0 24 24" width={Math.round(size * 0.52)} height={Math.round(size * 0.52)} aria-hidden="true">
            <path d={brand.icon.path} fill="currentColor" />
          </svg>
        ) : (
          <b style={{ fontSize: Math.round(size * (brand.name.length > 3 ? 0.36 : 0.32)) }}>{initials(brand.name)}</b>
        )}
      </span>
    )
  }

  if (item.type === 'login') {
    const h = hue(item.title || item.url || '')
    return (
      <span className="avatar" style={{ ...style, background: `hsl(${h} 45% 42%)`, color: '#fff' }}>
        <b style={{ fontSize: Math.round(size * 0.36) }}>{initials(item.title)}</b>
      </span>
    )
  }

  const Icon = TYPE_ICONS[item.type]
  return (
    <span className={`type-icon t-${item.type}`} style={style}>
      <Icon size={Math.round(size * 0.47)} />
    </span>
  )
}
