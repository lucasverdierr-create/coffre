import { useEffect, useState } from 'react'
import { RefreshCw, KeyRound } from 'lucide-react'
import { generatePassword, generatePassphrase, passphraseBits, DEFAULT_OPTIONS } from '../lib/generator'
import { strength } from '../lib/strength'
import { CopyButton, StrengthMeter } from './ui'

export default function GeneratorView({ onUse }) {
  const [mode, setMode] = useState('password')
  const [opts, setOpts] = useState(DEFAULT_OPTIONS)
  const [phrase, setPhrase] = useState({ words: 5, separator: '-', capitalize: true, number: true })
  const [value, setValue] = useState('')
  const [recent, setRecent] = useState([])

  const regen = () => {
    const v = mode === 'password' ? generatePassword(opts) : generatePassphrase(phrase)
    setValue(v)
    setRecent((r) => [v, ...r].slice(0, 6))
  }
  useEffect(regen, [mode, opts, phrase])

  const setO = (k, v) => setOpts((o) => ({ ...o, [k]: v }))
  const setP = (k, v) => setPhrase((o) => ({ ...o, [k]: v }))
  const bits = mode === 'password' ? strength(value).bits : passphraseBits(phrase.words, phrase.number)

  return (
    <div className="tool">
      <h2>Générateur</h2>
      <p className="lead">Aléatoire cryptographique, calculé dans ton navigateur. Rien n'est enregistré tant que tu ne l'utilises pas.</p>

      <div className="segmented">
        <button className={mode === 'password' ? 'on' : ''} onClick={() => setMode('password')}>Mot de passe</button>
        <button className={mode === 'phrase' ? 'on' : ''} onClick={() => setMode('phrase')}>Phrase de passe</button>
      </div>

      <div className="gen-output">
        <code>{value}</code>
        <div className="gen-actions">
          <button className="icon-btn" onClick={regen} title="Régénérer" aria-label="Régénérer"><RefreshCw size={18} /></button>
          <CopyButton value={value} secret label="Copier" />
        </div>
      </div>
      {mode === 'password' ? <StrengthMeter password={value} /> : <p className="help">Entropie estimée : ~{bits} bits</p>}

      <div className="card">
        {mode === 'password' ? (
          <>
            <label className="range">
              <span>Longueur <strong>{opts.length}</strong></span>
              <input type="range" min={8} max={64} value={opts.length} onChange={(e) => setO('length', +e.target.value)} />
            </label>
            <div className="checks">
              {[
                ['lower', 'Minuscules (a-z)'],
                ['upper', 'Majuscules (A-Z)'],
                ['digits', 'Chiffres (0-9)'],
                ['symbols', 'Symboles (!@#…)'],
                ['avoidAmbiguous', 'Éviter les caractères ambigus (l, I, O, 0, 1)'],
              ].map(([k, l]) => (
                <label key={k} className="check">
                  <input type="checkbox" checked={opts[k]} onChange={(e) => setO(k, e.target.checked)} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="range">
              <span>Nombre de mots <strong>{phrase.words}</strong></span>
              <input type="range" min={3} max={10} value={phrase.words} onChange={(e) => setP('words', +e.target.value)} />
            </label>
            <label>
              Séparateur
              <select value={phrase.separator} onChange={(e) => setP('separator', e.target.value)}>
                <option value="-">Tiret ( - )</option>
                <option value=".">Point ( . )</option>
                <option value="_">Underscore ( _ )</option>
                <option value=" ">Espace</option>
                <option value="">Aucun</option>
              </select>
            </label>
            <div className="checks">
              <label className="check"><input type="checkbox" checked={phrase.capitalize} onChange={(e) => setP('capitalize', e.target.checked)} /><span>Majuscule à chaque mot</span></label>
              <label className="check"><input type="checkbox" checked={phrase.number} onChange={(e) => setP('number', e.target.checked)} /><span>Ajouter un chiffre</span></label>
            </div>
          </>
        )}
      </div>

      <button className="btn primary" onClick={() => onUse(value)}>
        <KeyRound size={16} /> Créer un identifiant avec ce mot de passe
      </button>

      {recent.length > 1 && (
        <div className="recent">
          <h4>Générés récemment (non enregistrés)</h4>
          {recent.slice(1).map((r, i) => (
            <div key={i} className="recent-row">
              <code>{r}</code>
              <CopyButton value={r} secret />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
