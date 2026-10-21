import { useRef, useState } from 'react'
import { Download, Upload, FileSpreadsheet, KeyRound, LogOut, Trash2, Cloud, HardDrive, Sun, Moon, Monitor, TriangleAlert, ShieldCheck } from 'lucide-react'
import { csvToItems, itemsToCSV } from '../lib/csv'
import { downloadFile, today, timeAgo } from '../lib/misc'
import { strength } from '../lib/strength'
import { Modal, PasswordField, StrengthMeter, useToast } from './ui'

export default function SettingsView({ vault, ctx, updateSettings, importItems }) {
  const toast = useToast()
  const s = vault.settings || {}
  const [modal, setModal] = useState(null) // 'master' | {backup} | 'csv-export'
  const backupRef = useRef(null)
  const csvRef = useRef(null)

  async function onBackupFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const env = JSON.parse(await file.text())
      if (!env?.kdf?.salt || !env.iv || !env.data) throw new Error()
      setModal({ backup: env, name: file.name })
    } catch {
      toast('Ce fichier n\'est pas une sauvegarde Coffre valide', 'err')
    }
  }

  async function onCsvFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const items = csvToItems(await file.text())
    if (!items.length) return toast('Aucun identifiant reconnu dans ce CSV', 'err')
    importItems(items)
    toast(`${items.length} élément(s) importé(s)`)
    alert('Import terminé. Ce fichier CSV contient tes mots de passe en clair : pense à le supprimer de ton ordinateur (et de la corbeille).')
  }

  return (
    <div className="tool">
      <h2>Réglages</h2>

      <section className="card">
        <h3>Sécurité</h3>
        <div className="card-row">
          <div>
            <strong>Verrouillage automatique</strong>
            <p className="help">Après une période sans activité.</p>
          </div>
          <select value={s.autoLockMin ?? 10} onChange={(e) => updateSettings({ autoLockMin: +e.target.value })}>
            {[1, 5, 10, 15, 30, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
            <option value={0}>Jamais (déconseillé)</option>
          </select>
        </div>
        <div className="card-row">
          <div>
            <strong>Effacer le presse-papiers</strong>
            <p className="help">Après la copie d'un mot de passe, d'une clé ou d'un code 2FA.</p>
          </div>
          <select value={s.clipboardSec ?? 30} onChange={(e) => updateSettings({ clipboardSec: +e.target.value })}>
            {[10, 20, 30, 60, 120].map((m) => <option key={m} value={m}>{m} s</option>)}
            <option value={0}>Jamais</option>
          </select>
        </div>
        <div className="card-row">
          <div>
            <strong>Mot de passe maître</strong>
            <p className="help">Rechiffre tout le coffre avec une nouvelle clé.</p>
          </div>
          <button className="btn ghost" onClick={() => setModal('master')}><KeyRound size={15} /> Changer</button>
        </div>
      </section>

      <section className="card">
        <h3>Apparence</h3>
        <div className="segmented">
          {[['system', 'Système', Monitor], ['light', 'Clair', Sun], ['dark', 'Sombre', Moon]].map(([k, l, Icon]) => (
            <button key={k} className={(s.theme || 'system') === k ? 'on' : ''} onClick={() => updateSettings({ theme: k })}>
              <Icon size={14} /> {l}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Sauvegarde & import</h3>
        <div className="card-row">
          <div>
            <strong>Sauvegarde chiffrée</strong>
            <p className="help">Un fichier .json illisible sans ton mot de passe maître. À garder sur une clé USB ou un cloud perso.</p>
          </div>
          <div className="btn-row">
            <button className="btn ghost" onClick={() => ctx.exportBackup().then(() => toast('Sauvegarde téléchargée'))}><Download size={15} /> Exporter</button>
            <button className="btn ghost" onClick={() => backupRef.current.click()}><Upload size={15} /> Restaurer</button>
          </div>
          <input ref={backupRef} type="file" accept=".json,application/json" hidden onChange={onBackupFile} />
        </div>
        <div className="card-row">
          <div>
            <strong>Importer depuis un autre gestionnaire</strong>
            <p className="help">Fichier CSV exporté depuis Chrome, Edge, Firefox, Bitwarden, 1Password, Dashlane…</p>
          </div>
          <button className="btn ghost" onClick={() => csvRef.current.click()}><FileSpreadsheet size={15} /> Importer un CSV</button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={onCsvFile} />
        </div>
        <div className="card-row">
          <div>
            <strong>Exporter en clair (CSV)</strong>
            <p className="help">Pour migrer vers un autre outil. Le fichier n'est pas chiffré.</p>
          </div>
          <button className="btn ghost" onClick={() => setModal('csv-export')}><TriangleAlert size={15} /> Exporter</button>
        </div>
      </section>

      <section className="card">
        <h3>Synchronisation</h3>
        {ctx.cloud ? (
          <>
            <div className="card-row">
              <div>
                <strong><Cloud size={15} /> {ctx.account}</strong>
                <p className="help">
                  {ctx.sync.last ? `Dernière synchro ${timeAgo(ctx.sync.last)}.` : 'Pas encore synchronisé.'} Seule la version chiffrée est envoyée sur le serveur.
                </p>
              </div>
              <div className="btn-row">
                <button className="btn ghost" onClick={ctx.syncNow}>Synchroniser</button>
                <button className="btn ghost" onClick={ctx.signOut}><LogOut size={15} /> Déconnexion</button>
              </div>
            </div>
          </>
        ) : (
          <div className="notice">
            <HardDrive size={15} /> Mode local : aucun serveur Supabase n'est configuré, tout reste dans ce navigateur. Exporte régulièrement une sauvegarde chiffrée.
          </div>
        )}
        <div className="card-row">
          <div>
            <strong>Oublier cet appareil</strong>
            <p className="help">Efface la copie chiffrée stockée dans ce navigateur{ctx.cloud ? ' (le coffre reste sur ton compte)' : ' : sans sauvegarde, les données sont perdues'}.</p>
          </div>
          <button
            className="btn danger"
            onClick={() => confirm(ctx.cloud ? 'Effacer les données de cet appareil et se déconnecter ?' : 'Effacer définitivement le coffre de ce navigateur ? Sans sauvegarde, tout sera perdu.') && ctx.forgetDevice()}
          >
            <Trash2 size={15} /> Effacer
          </button>
        </div>
      </section>

      <section className="card about">
        <h3><ShieldCheck size={16} /> Comment tes données sont protégées</h3>
        <ul>
          <li>Ton mot de passe maître sert à dériver une clé (PBKDF2-SHA256, 600 000 itérations). Il n'est jamais stocké ni envoyé.</li>
          <li>Tout le coffre est chiffré en AES-256-GCM dans le navigateur avant d'être enregistré, localement comme sur le serveur.</li>
          <li>Le serveur (Supabase) ne reçoit qu'un bloc chiffré, protégé en plus par des règles d'accès par utilisateur.</li>
          <li>Mot de passe maître oublié = données irrécupérables. Garde une sauvegarde chiffrée et note-le en lieu sûr.</li>
        </ul>
      </section>

      {modal === 'master' && <ChangeMasterModal onClose={() => setModal(null)} onSubmit={ctx.changeMaster} />}
      {modal?.backup && (
        <RestoreModal
          name={modal.name}
          onClose={() => setModal(null)}
          onSubmit={async (pw) => {
            const n = await ctx.importBackup(modal.backup, pw)
            toast(`${n} élément(s) fusionné(s) depuis la sauvegarde`)
            setModal(null)
          }}
        />
      )}
      {modal === 'csv-export' && (
        <Modal title="Exporter en clair ?" onClose={() => setModal(null)}>
          <div className="notice warn"><TriangleAlert size={15} /> Le fichier contiendra tous tes mots de passe lisibles par n'importe qui. Supprime-le dès que tu n'en as plus besoin.</div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setModal(null)}>Annuler</button>
            <button
              className="btn danger"
              onClick={() => {
                downloadFile(`coffre-export-EN-CLAIR-${today()}.csv`, itemsToCSV(vault.items.filter((i) => !i.purged && !i.deletedAt)), 'text/csv')
                setModal(null)
              }}
            >
              Je comprends, exporter
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ChangeMasterModal({ onClose, onSubmit }) {
  const toast = useToast()
  const [oldPw, setOld] = useState('')
  const [pw, setPw] = useState('')
  const [confirm2, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (pw.length < 10) return setErr('10 caractères minimum.')
    if (strength(pw).score < 2) return setErr('Trop prévisible : allonge-le.')
    if (pw !== confirm2) return setErr('Les deux nouveaux mots de passe ne correspondent pas.')
    setBusy(true)
    try {
      await onSubmit(oldPw, pw)
      toast('Mot de passe maître changé. Tes autres appareils te le demanderont.')
      onClose()
    } catch (e2) {
      setErr(e2.message)
      setBusy(false)
    }
  }
  return (
    <Modal title="Changer le mot de passe maître" onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>Mot de passe maître actuel<PasswordField value={oldPw} onChange={setOld} autoFocus autoComplete="current-password" /></label>
        <label>Nouveau mot de passe maître<PasswordField value={pw} onChange={setPw} /></label>
        <StrengthMeter password={pw} />
        <label>Confirmation<PasswordField value={confirm2} onChange={setConfirm} /></label>
        <p className="help">Les sauvegardes chiffrées déjà exportées resteront lisibles avec l'ancien mot de passe.</p>
        {err && <div className="notice err">{err}</div>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Rechiffrement…' : 'Changer'}</button>
        </div>
      </form>
    </Modal>
  )
}

function RestoreModal({ name, onClose, onSubmit }) {
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await onSubmit(pw)
    } catch (e2) {
      setErr(e2.message)
      setBusy(false)
    }
  }
  return (
    <Modal title="Restaurer une sauvegarde" onClose={onClose}>
      <form onSubmit={submit} className="form">
        <p className="help">{name} · les éléments seront fusionnés avec ton coffre actuel (la version la plus récente de chaque élément est conservée).</p>
        <label>Mot de passe maître de cette sauvegarde<PasswordField value={pw} onChange={setPw} autoFocus autoComplete="current-password" /></label>
        {err && <div className="notice err">{err}</div>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
          <button className="btn primary" disabled={busy || !pw}>{busy ? 'Déchiffrement…' : 'Restaurer'}</button>
        </div>
      </form>
    </Modal>
  )
}
