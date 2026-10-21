import { useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Star, Trash2, RotateCcw, CopyPlus, ExternalLink, History, TriangleAlert, Clock } from 'lucide-react'
import { TYPES, hostname, safeUrl } from '../lib/vault'
import { renderMarkdown, fmtDate } from '../lib/misc'
import { totp } from '../lib/totp'
import { CopyButton, RevealButton, StrengthMeter } from './ui'

export default function ItemDetail({ item, reused, onBack, onEdit, onFav, onTrash, onRestore, onPurge, onDuplicate, onTag, onChange }) {
  const inTrash = Boolean(item.deletedAt)
  const url = safeUrl(item.url)
  return (
    <article className="detail">
      <header className="detail-head">
        <button className="icon-btn only-mobile" onClick={onBack} aria-label="Retour"><ArrowLeft size={20} /></button>
        <div className="detail-title">
          <small>{TYPES[item.type]?.label}</small>
          <h2>{item.title || 'Sans titre'}</h2>
        </div>
        <div className="actions">
          {inTrash ? (
            <>
              <button className="btn ghost sm" onClick={onRestore}><RotateCcw size={15} /> Restaurer</button>
              <button className="btn danger sm" onClick={onPurge}><Trash2 size={15} /> Supprimer</button>
            </>
          ) : (
            <>
              <button className={`icon-btn ${item.favorite ? 'fav' : ''}`} onClick={onFav} title="Favori" aria-label="Favori"><Star size={17} /></button>
              <button className="icon-btn" onClick={onDuplicate} title="Dupliquer" aria-label="Dupliquer"><CopyPlus size={17} /></button>
              <button className="icon-btn" onClick={onTrash} title="Mettre à la corbeille" aria-label="Corbeille"><Trash2 size={17} /></button>
              <button className="btn primary sm" onClick={onEdit}><Pencil size={15} /> Modifier</button>
            </>
          )}
        </div>
      </header>

      <div className="detail-body">
        {item.type === 'login' && (
          <>
            {reused && (
              <div className="notice warn"><TriangleAlert size={15} /> Ce mot de passe est utilisé sur plusieurs comptes. Pense à le changer.</div>
            )}
            <div className="fields">
              {item.url && (
                <Row label="Site">
                  {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="value link-value">{hostname(item.url)} <ExternalLink size={13} /></a> : <span className="value">{item.url}</span>}
                  <CopyButton value={item.url} label="Copier l'adresse" />
                </Row>
              )}
              {item.username && (
                <Row label="Identifiant">
                  <span className="value mono">{item.username}</span>
                  <CopyButton value={item.username} label="Copier l'identifiant" />
                </Row>
              )}
              {item.password && <SecretRow label="Mot de passe" value={item.password} meter />}
              {item.totp && <TotpRow secret={item.totp} />}
            </div>
            {item.notes && <NotesBlock text={item.notes} />}
            {item.history?.length > 0 && <PasswordHistory history={item.history} />}
          </>
        )}

        {item.type === 'secret' && (
          <>
            <div className="fields">{item.value && <SecretRow label="Valeur" value={item.value} />}</div>
            {item.notes && <NotesBlock text={item.notes} />}
          </>
        )}

        {item.type === 'snippet' && (
          <>
            <div className="code-block">
              <div className="code-head">
                <span>{item.language || 'texte'}</span>
                <CopyButton value={item.content} text="Copier" />
              </div>
              <pre>{item.content}</pre>
            </div>
            {item.notes && <NotesBlock text={item.notes} />}
          </>
        )}

        {item.type === 'note' && (
          <div className="note-head-actions">
            <CopyButton value={item.content} text="Copier le texte" />
          </div>
        )}
        {item.type === 'note' && (
          <div
            className="markdown"
            onClick={(e) => {
              if (inTrash || e.target.type !== 'checkbox') return
              const boxes = [...e.currentTarget.querySelectorAll('input[type=checkbox]')]
              onChange({ content: toggleTask(item.content, boxes.indexOf(e.target)) })
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content).replace(/ disabled=""/g, '') }}
          />
        )}

        {item.tags?.length > 0 && (
          <div className="tag-line">
            {item.tags.map((t) => (
              <button key={t} className="tag" onClick={() => onTag(t)}>#{t}</button>
            ))}
          </div>
        )}

        <footer className="meta">
          <span>Créé le {fmtDate(item.createdAt)}</span>
          <span>Modifié le {fmtDate(item.updatedAt)}</span>
          {item.type === 'login' && item.passwordChangedAt && <span>Mot de passe changé le {fmtDate(item.passwordChangedAt)}</span>}
          {inTrash && <span>Mis à la corbeille le {fmtDate(item.deletedAt)}</span>}
        </footer>
      </div>
    </article>
  )
}

function Row({ label, children }) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <div className="field-value">{children}</div>
    </div>
  )
}

function SecretRow({ label, value, meter }) {
  const [shown, setShown] = useState(false)
  return (
    <Row label={label}>
      <span className={`value mono ${shown ? '' : 'masked'}`}>{shown ? value : '•'.repeat(Math.min(16, value.length))}</span>
      <RevealButton shown={shown} onToggle={() => setShown((s) => !s)} />
      <CopyButton value={value} label={`Copier ${label.toLowerCase()}`} secret />
      {meter && <div className="row-extra"><StrengthMeter password={value} /></div>}
    </Row>
  )
}

function TotpRow({ secret }) {
  const [state, setState] = useState(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const r = await totp(secret)
        if (alive) {
          setState(r)
          setErr(false)
        }
      } catch {
        if (alive) setErr(true)
      }
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [secret])
  if (err) return <Row label="Code 2FA"><span className="value muted">Clé 2FA invalide</span></Row>
  if (!state) return null
  const pct = (state.remaining / state.period) * 100
  return (
    <Row label="Code 2FA">
      <span className="value mono totp">{state.code.replace(/(\d{3})(?=\d)/g, '$1 ')}</span>
      <span className={`ring ${state.remaining <= 5 ? 'low' : ''}`} style={{ '--p': pct }} title={`${state.remaining} s`}>
        <Clock size={11} />
        {state.remaining}
      </span>
      <CopyButton value={state.code} label="Copier le code" secret />
    </Row>
  )
}

function NotesBlock({ text }) {
  return (
    <div className="notes-block">
      <label>Notes</label>
      <div className="markdown small" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
    </div>
  )
}

function PasswordHistory({ history }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="history">
      <button className="link" onClick={() => setOpen((o) => !o)}>
        <History size={14} /> Anciens mots de passe ({history.length})
      </button>
      {open && (
        <div className="fields">
          {history.map((h, i) => (
            <SecretRow key={i} label={`Jusqu'au ${new Date(h.changedAt).toLocaleDateString('fr-FR')}`} value={h.password} />
          ))}
        </div>
      )}
    </div>
  )
}

// Coche / décoche la n-ième case "- [ ]" d'une note Markdown
function toggleTask(md, n) {
  let k = -1
  return md.replace(/^(\s*(?:[-*+]|\d+\.)\s+)\[( |x|X)\]/gm, (m, pre, c) => (++k === n ? `${pre}[${c === ' ' ? 'x' : ' '}]` : m))
}
