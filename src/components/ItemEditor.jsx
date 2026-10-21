import { useState } from 'react'
import { Sparkles, Star, Eye, PenLine } from 'lucide-react'
import { TYPES, hostname } from '../lib/vault'
import { generatePassword } from '../lib/generator'
import { renderMarkdown } from '../lib/misc'
import { parseTotp, base32Decode } from '../lib/totp'
import { PasswordField, StrengthMeter, RevealButton } from './ui'

export default function ItemEditor({ item, allTags, onSave, onCancel }) {
  const [d, setD] = useState(item)
  const [tagInput, setTagInput] = useState((item.tags || []).join(', '))
  const [preview, setPreview] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }))
  const isNew = !item.title && !item.password && !item.content && !item.value

  function submit(e) {
    e?.preventDefault()
    if (d.type === 'login' && d.totp) {
      try {
        base32Decode(parseTotp(d.totp).secret)
      } catch {
        return setErr('La clé 2FA ne semble pas valide (attendu : clé base32 ou lien otpauth://).')
      }
    }
    const tags = [...new Set(tagInput.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')).filter(Boolean))]
    const out = { ...d, tags, title: d.title.trim() || defaultTitle(d) }
    if (d.type === 'login' && item.password && d.password !== item.password) {
      out.history = [{ password: item.password, changedAt: Date.now() }, ...(item.history || [])].slice(0, 10)
      out.passwordChangedAt = Date.now()
    }
    onSave(out)
  }

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') onCancel()
  }

  const currentTags = tagInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
  const suggestions = allTags.filter((t) => !currentTags.includes(t)).slice(0, 8)

  return (
    <form className="detail editor" onSubmit={submit} onKeyDown={onKeyDown}>
      <header className="detail-head">
        <div className="detail-title">
          <small>{isNew ? 'Nouveau' : 'Modifier'} · {TYPES[d.type].label}</small>
          <input className="title-input" value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="Titre" autoFocus={isNew} />
        </div>
        <div className="actions">
          <button type="button" className={`icon-btn ${d.favorite ? 'fav' : ''}`} onClick={() => set('favorite', !d.favorite)} title="Favori" aria-label="Favori"><Star size={17} /></button>
          <button type="button" className="btn ghost sm" onClick={onCancel}>Annuler</button>
          <button className="btn primary sm">Enregistrer</button>
        </div>
      </header>

      <div className="detail-body form">
        {d.type === 'login' && (
          <>
            <label>
              Adresse du site
              <input value={d.url} onChange={(e) => set('url', e.target.value)} placeholder="exemple.com" inputMode="url" autoComplete="off" />
            </label>
            <label>
              Identifiant ou e-mail
              <input value={d.username} onChange={(e) => set('username', e.target.value)} autoComplete="off" spellCheck={false} />
            </label>
            <label>
              Mot de passe
              <div className="row-inline">
                <PasswordField value={d.password} onChange={(v) => set('password', v)} />
                <button type="button" className="btn ghost" onClick={() => set('password', generatePassword())} title="Générer un mot de passe fort">
                  <Sparkles size={15} /> Générer
                </button>
              </div>
              <StrengthMeter password={d.password} />
            </label>
            <label>
              Clé 2FA (optionnel)
              <SecretInput value={d.totp} onChange={(v) => set('totp', v)} placeholder="JBSW Y3DP EHPK 3PXP ou otpauth://…" />
              <small className="help">La clé affichée sous le QR code lors de l'activation de la double authentification. Les codes seront générés ici.</small>
            </label>
            <label>
              Notes
              <textarea rows={4} value={d.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Questions de sécurité, codes de secours… (Markdown accepté)" />
            </label>
          </>
        )}

        {d.type === 'secret' && (
          <>
            <label>
              Valeur
              <SecretInput value={d.value} onChange={(v) => set('value', v)} placeholder="sk-…, clé Wi-Fi, code PIN…" multiline />
            </label>
            <label>
              Notes
              <textarea rows={4} value={d.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Où elle est utilisée, date d'expiration…" />
            </label>
          </>
        )}

        {d.type === 'snippet' && (
          <>
            <label>
              Langage ou type
              <input value={d.language} onChange={(e) => set('language', e.target.value)} placeholder="bash, sql, prompt, js…" list="langs" />
              <datalist id="langs">
                {['prompt', 'bash', 'js', 'ts', 'python', 'sql', 'json', 'css', 'html', 'markdown'].map((l) => <option key={l} value={l} />)}
              </datalist>
            </label>
            <label>
              Contenu
              <textarea className="mono" rows={12} value={d.content} onChange={(e) => set('content', e.target.value)} spellCheck={false} placeholder="Colle ici ta commande, ton prompt ou ton bout de code" />
            </label>
            <label>
              Notes
              <textarea rows={3} value={d.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Quand l'utiliser, variantes…" />
            </label>
          </>
        )}

        {d.type === 'note' && (
          <div className="note-editor">
            <div className="segmented sm">
              <button type="button" className={!preview ? 'on' : ''} onClick={() => setPreview(false)}><PenLine size={14} /> Écrire</button>
              <button type="button" className={preview ? 'on' : ''} onClick={() => setPreview(true)}><Eye size={14} /> Aperçu</button>
            </div>
            {preview ? (
              <div className="markdown preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(d.content) }} />
            ) : (
              <textarea
                className="note-area"
                value={d.content}
                onChange={(e) => set('content', e.target.value)}
                placeholder={'# Titre\n\nÉcris en Markdown : **gras**, listes, `code`, cases à cocher - [ ] …'}
                autoFocus={!isNew}
              />
            )}
          </div>
        )}

        <label>
          Tags <small className="help">séparés par des virgules</small>
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="perso, travail, claude-code" />
          {suggestions.length > 0 && (
            <div className="tag-line">
              {suggestions.map((t) => (
                <button type="button" key={t} className="tag ghost" onClick={() => setTagInput((x) => [...currentTags, t].join(', '))}>+ {t}</button>
              ))}
            </div>
          )}
        </label>

        {err && <div className="notice err">{err}</div>}
        <p className="help">Astuce : <kbd>Ctrl</kbd> <kbd>S</kbd> pour enregistrer, <kbd>Échap</kbd> pour annuler.</p>
      </div>
    </form>
  )
}

function SecretInput({ value, onChange, placeholder, multiline }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="input-group">
      {multiline && shown ? (
        <textarea className="mono" rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} />
      ) : (
        <input type={shown ? 'text' : 'password'} className="mono" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} />
      )}
      <RevealButton shown={shown} onToggle={() => setShown((s) => !s)} />
    </div>
  )
}

function defaultTitle(d) {
  if (d.type === 'login') return hostname(d.url) || d.username || 'Identifiant'
  if (d.type === 'note') return (d.content || '').replace(/^#+\s*/, '').split('\n')[0].slice(0, 60) || 'Note'
  return 'Sans titre'
}
