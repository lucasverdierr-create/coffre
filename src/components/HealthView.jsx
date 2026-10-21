import { useMemo, useState } from 'react'
import { ShieldAlert, Repeat, CalendarClock, ShieldCheck, ShieldOff, Radar } from 'lucide-react'
import { strength } from '../lib/strength'
import { pwnedCount } from '../lib/misc'
import { hostname } from '../lib/vault'

const YEAR = 365 * 864e5

export default function HealthView({ items, onOpen }) {
  const logins = items.filter((i) => i.type === 'login' && i.password)
  const [pwned, setPwned] = useState(null) // Map id -> count
  const [checking, setChecking] = useState(false)
  const [progress, setProgress] = useState(0)
  const [err, setErr] = useState('')

  const report = useMemo(() => {
    const byPw = new Map()
    logins.forEach((i) => byPw.set(i.password, (byPw.get(i.password) || 0) + 1))
    const weak = logins.filter((i) => strength(i.password).score < 3)
    const reused = logins.filter((i) => byPw.get(i.password) > 1)
    const old = logins.filter((i) => Date.now() - (i.passwordChangedAt || i.createdAt) > YEAR)
    const no2fa = logins.filter((i) => !i.totp)
    const bad = new Set([...weak, ...reused].map((i) => i.id))
    if (pwned) logins.forEach((i) => pwned.get(i.id) > 0 && bad.add(i.id))
    const score = logins.length ? Math.round((100 * (logins.length - bad.size)) / logins.length) : 100
    return { weak, reused, old, no2fa, score }
  }, [items, pwned])

  async function checkLeaks() {
    setChecking(true)
    setErr('')
    setProgress(0)
    const unique = [...new Set(logins.map((i) => i.password))]
    const res = new Map()
    try {
      for (let k = 0; k < unique.length; k++) {
        res.set(unique[k], await pwnedCount(unique[k]))
        setProgress(Math.round(((k + 1) / unique.length) * 100))
      }
      setPwned(new Map(logins.map((i) => [i.id, res.get(i.password) || 0])))
    } catch {
      setErr('Vérification impossible (connexion ou service indisponible).')
    } finally {
      setChecking(false)
    }
  }

  const leaked = pwned ? logins.filter((i) => pwned.get(i.id) > 0) : []

  return (
    <div className="tool">
      <h2>Santé des mots de passe</h2>
      <p className="lead">Analyse faite sur ton appareil, à partir de tes {logins.length} identifiant(s).</p>

      <div className="score-card">
        <div className={`score ${report.score >= 80 ? 'good' : report.score >= 50 ? 'mid' : 'bad'}`} style={{ '--p': report.score }}>
          <span>{report.score}</span>
        </div>
        <div className="score-stats">
          <Stat icon={ShieldAlert} n={report.weak.length} label="faibles" tone="bad" />
          <Stat icon={Repeat} n={report.reused.length} label="réutilisés" tone="warn" />
          <Stat icon={CalendarClock} n={report.old.length} label="de plus d'un an" tone="mid" />
          <Stat icon={ShieldOff} n={report.no2fa.length} label="sans 2FA enregistrée" tone="muted" />
        </div>
      </div>

      <div className="card">
        <div className="card-row">
          <div>
            <strong><Radar size={16} /> Fuites de données connues</strong>
            <p className="help">
              Vérifie tes mots de passe auprès de Have I Been Pwned. Seuls les 5 premiers caractères de l'empreinte SHA-1 sont envoyés (k-anonymat) : ni tes mots de passe ni leur empreinte complète ne quittent l'appareil.
            </p>
          </div>
          <button className="btn ghost" onClick={checkLeaks} disabled={checking || !logins.length}>
            {checking ? `${progress} %` : pwned ? 'Revérifier' : 'Vérifier'}
          </button>
        </div>
        {err && <div className="notice err">{err}</div>}
        {pwned && !leaked.length && <div className="notice ok"><ShieldCheck size={15} /> Aucun de tes mots de passe n'apparaît dans une fuite connue.</div>}
      </div>

      {leaked.length > 0 && <Group title="Trouvés dans des fuites : à changer en priorité" items={leaked} onOpen={onOpen} extra={(i) => `vu ${pwned.get(i.id).toLocaleString('fr-FR')} fois`} tone="bad" />}
      <Group title="Faibles" items={report.weak} onOpen={onOpen} extra={(i) => strength(i.password).label} tone="bad" />
      <Group title="Réutilisés" items={report.reused} onOpen={onOpen} tone="warn" />
      <Group title="Pas changés depuis plus d'un an" items={report.old} onOpen={onOpen} extra={(i) => new Date(i.passwordChangedAt || i.createdAt).toLocaleDateString('fr-FR')} tone="mid" />
    </div>
  )
}

function Stat({ icon: Icon, n, label, tone }) {
  return (
    <div className={`stat ${n ? tone : 'zero'}`}>
      <Icon size={16} />
      <strong>{n}</strong>
      <span>{label}</span>
    </div>
  )
}

function Group({ title, items, onOpen, extra, tone }) {
  if (!items.length) return null
  return (
    <section className="health-group">
      <h4 className={tone}>{title} <small>{items.length}</small></h4>
      {items.map((i) => (
        <button key={i.id} className="health-row" onClick={() => onOpen(i.id)}>
          <strong>{i.title}</strong>
          <small>{i.username || hostname(i.url)}</small>
          {extra && <em>{extra(i)}</em>}
        </button>
      ))}
    </section>
  )
}
