import { useState } from 'react'
import { LogOut, ShieldCheck, WifiOff } from 'lucide-react'
import { Logo, PasswordField, StrengthMeter } from './ui'
import { strength } from '../lib/strength'

export default function UnlockScreen({ probe, reason, account, onUnlock, onCreate, onSignOut, onRetry }) {
  const exists = Boolean(probe.remote || probe.local?.envelope)
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (!exists) {
      if (pw.length < 10) return setErr('10 caractères minimum pour le mot de passe maître.')
      if (strength(pw).score < 2) return setErr('Trop prévisible : allonge-le ou utilise une phrase de plusieurs mots.')
      if (pw !== confirm) return setErr('Les deux mots de passe ne correspondent pas.')
      if (!ack) return setErr('Coche la case pour confirmer que tu as bien noté ton mot de passe maître.')
    }
    setBusy(true)
    try {
      await (exists ? onUnlock(pw) : onCreate(pw))
    } catch (e2) {
      setErr(e2.message || 'Erreur')
      setBusy(false)
    }
  }

  const footer = account && (
    <p className="hint">
      {account} ·{' '}
      <button type="button" className="link" onClick={onSignOut}>
        <LogOut size={13} /> Se déconnecter
      </button>
    </p>
  )

  if (!exists && probe.offline) {
    return (
      <div className="gate">
        <div className="gate-card">
          <div className="gate-brand">
            <WifiOff size={36} />
            <div>
              <h1>Hors ligne</h1>
              <p>Impossible de vérifier si un coffre existe déjà sur ton compte.</p>
            </div>
          </div>
          <p className="fineprint">Reconnecte-toi à Internet pour récupérer ton coffre (ou en créer un). On ne crée rien ici pour éviter d'écraser un coffre existant.</p>
          <button className="btn primary block" onClick={onRetry}>Réessayer</button>
          {footer}
        </div>
      </div>
    )
  }

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit}>
        <div className="gate-brand">
          <Logo size={40} />
          <div>
            <h1>{exists ? 'Coffre verrouillé' : 'Crée ton mot de passe maître'}</h1>
            <p>{exists ? 'Entre ton mot de passe maître pour déchiffrer tes données.' : 'Il chiffre tout ton coffre. Il ne quitte jamais cet appareil.'}</p>
          </div>
        </div>

        {reason && <div className="notice">{reason}</div>}

        <label>
          Mot de passe maître
          <PasswordField value={pw} onChange={setPw} autoFocus autoComplete={exists ? 'current-password' : 'new-password'} />
        </label>

        {!exists && (
          <>
            <StrengthMeter password={pw} />
            <label>
              Confirmation
              <PasswordField value={confirm} onChange={setConfirm} />
            </label>
            <label className="check">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span>J'ai compris : si je l'oublie, <strong>personne ne pourra récupérer mes données</strong>, pas même moi.</span>
            </label>
            <p className="fineprint">
              Astuce : une phrase de 4 à 6 mots sans lien entre eux (« lynx-pastel-volcan-miel-7 ») est à la fois solide et facile à retenir.
            </p>
          </>
        )}

        {err && <div className="notice err">{err}</div>}

        <button className="btn primary block" disabled={busy || !pw}>
          {busy ? <><span className="spinner sm" /> Déchiffrement…</> : exists ? 'Déverrouiller' : 'Créer mon coffre'}
        </button>

        <p className="fineprint center">
          <ShieldCheck size={13} /> AES-256-GCM · clé dérivée par PBKDF2 (600 000 itérations)
        </p>
        {footer}
      </form>
    </div>
  )
}
