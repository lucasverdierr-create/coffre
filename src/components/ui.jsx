import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Check, Copy, Eye, EyeOff, X } from 'lucide-react'
import { copyText, getClipboardSec } from '../lib/misc'
import { strength } from '../lib/strength'

const ToastCtx = createContext(() => {})
// Prévenu à chaque copie (sert au tri « Plus utilisés »)
export const CopyUsedCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, kind = 'ok') => {
    const id = Math.random()
    setToasts((t) => (t.some((x) => x.msg === msg) ? t : [...t, { id, msg, kind }]))
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="16" fill="var(--accent)" />
      <circle cx="32" cy="27" r="9" fill="none" stroke="var(--accent-ink)" strokeWidth="5" />
      <rect x="29" y="33" width="6" height="15" rx="3" fill="var(--accent-ink)" />
    </svg>
  )
}

export function Splash() {
  return (
    <div className="splash">
      <Logo size={44} />
      <div className="spinner" />
    </div>
  )
}

export function CopyButton({ value, label = 'Copier', secret = false, text }) {
  const toast = useToast()
  const onUsed = useContext(CopyUsedCtx)
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className={text ? 'btn ghost sm' : 'icon-btn'}
      title={label}
      aria-label={label}
      disabled={!value}
      onClick={async () => {
        try {
          await copyText(value, secret)
          onUsed?.()
          setDone(true)
          setTimeout(() => setDone(false), 1200)
          const sec = getClipboardSec()
          toast(secret && sec ? `Copié · effacé du presse-papiers dans ${sec} s` : 'Copié')
        } catch {
          toast('Copie impossible', 'err')
        }
      }}
    >
      {done ? <Check size={16} /> : <Copy size={16} />}
      {text && <span>{done ? 'Copié' : text}</span>}
    </button>
  )
}

export function RevealButton({ shown, onToggle }) {
  return (
    <button type="button" className="icon-btn" onClick={onToggle} title={shown ? 'Masquer' : 'Afficher'} aria-label={shown ? 'Masquer' : 'Afficher'}>
      {shown ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

export function Modal({ title, children, onClose, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function StrengthMeter({ password }) {
  const s = strength(password)
  return (
    <div className={`meter s${s.score}`}>
      <div className="bars">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={password && i <= Math.max(1, s.score) ? 'on' : ''} />
        ))}
      </div>
      <small>{password ? `${s.label} · ~${s.bits} bits` : ' '}</small>
    </div>
  )
}

export function PasswordField({ value, onChange, placeholder, autoFocus, autoComplete = 'new-password', id }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="input-group">
      <input id={id} type={shown ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} autoComplete={autoComplete} spellCheck={false} />
      <RevealButton shown={shown} onToggle={() => setShown((s) => !s)} />
    </div>
  )
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={28} />}
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  )
}
