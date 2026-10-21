import { useEffect, useMemo, useRef, useState } from 'react'
import {
  KeyRound, StickyNote, Terminal, LockKeyhole, Star, Trash2, Search, Plus, Layers, Sparkles, HeartPulse,
  Settings as SettingsIcon, Lock, Tag, Cloud, CloudOff, RefreshCw, HardDrive, Menu, X, ArrowUpDown, Rows3,
} from 'lucide-react'
import { CATEGORIES, CATEGORY, categoryOf } from '../lib/categories'
import Avatar from './Avatar'
import { TYPES, newItem, searchText, subtitle, mergeVaults } from '../lib/vault'
import { timeAgo } from '../lib/misc'
import { Logo, Empty, useToast } from './ui'
import ItemDetail from './ItemDetail'
import ItemEditor from './ItemEditor'
import GeneratorView from './GeneratorView'
import HealthView from './HealthView'
import SettingsView from './SettingsView'

export const TYPE_ICONS = { login: KeyRound, note: StickyNote, snippet: Terminal, secret: LockKeyhole }
const TOOLS = ['generator', 'health', 'settings']
const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true })
const SORTS = {
  recent: { label: 'Récents', fn: (a, b) => b.updatedAt - a.updatedAt },
  az: { label: 'A → Z', fn: (a, b) => collator.compare(a.title || '', b.title || '') },
  used: { label: 'Plus utilisés', fn: (a, b) => (b.uses || 0) - (a.uses || 0) || (b.lastUsedAt || 0) - (a.lastUsedAt || 0) || b.updatedAt - a.updatedAt },
}
const GROUPS = { none: 'Sans groupe', category: 'Par catégorie', letter: 'Par lettre' }
const letterOf = (t) => {
  const c = (t || '#').normalize('NFD').replace(/[\u0300-\u036f]/g, '')[0]?.toUpperCase() || '#'
  return /[A-Z]/.test(c) ? c : '#'
}

export default function Vault({ vault, update, lock, ctx }) {
  const toast = useToast()
  const [view, setView] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [navOpen, setNavOpen] = useState(false)
  const [newMenu, setNewMenu] = useState(false)
  const searchRef = useRef(null)

  const items = vault.items.filter((i) => !i.purged)
  const live = items.filter((i) => !i.deletedAt)
  const trash = items.filter((i) => i.deletedAt)

  const counts = useMemo(() => {
    const c = { all: live.length, fav: live.filter((i) => i.favorite).length, trash: trash.length }
    Object.keys(TYPES).forEach((t) => (c[t] = live.filter((i) => i.type === t).length))
    live.forEach((i) => {
      const k = `cat:${categoryOf(i)}`
      c[k] = (c[k] || 0) + 1
    })
    return c
  }, [vault])

  const tags = useMemo(() => {
    const m = new Map()
    live.forEach((i) => (i.tags || []).forEach((t) => m.set(t, (m.get(t) || 0) + 1)))
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))
  }, [vault])

  const reusedIds = useMemo(() => {
    const byPw = new Map()
    live.filter((i) => i.type === 'login' && i.password).forEach((i) => byPw.set(i.password, [...(byPw.get(i.password) || []), i.id]))
    return new Set([...byPw.values()].filter((a) => a.length > 1).flat())
  }, [vault])

  const sortKey = SORTS[vault.settings?.listSort] ? vault.settings.listSort : 'recent'
  const groupKey = GROUPS[vault.settings?.listGroup] ? vault.settings.listGroup : 'none'

  const list = useMemo(() => {
    let base = view === 'trash' ? trash : live
    if (view === 'fav') base = base.filter((i) => i.favorite)
    else if (TYPES[view]) base = base.filter((i) => i.type === view)
    else if (view.startsWith('tag:')) base = base.filter((i) => i.tags?.includes(view.slice(4)))
    else if (view.startsWith('cat:')) base = base.filter((i) => categoryOf(i) === view.slice(4))
    const q = query.trim().toLowerCase()
    if (q) base = (view === 'trash' ? trash : live).filter((i) => searchText(i).includes(q) || CATEGORY[categoryOf(i)].label.toLowerCase().includes(q))
    const fn = SORTS[sortKey].fn
    if (view === 'trash') return [...base].sort((a, b) => b.deletedAt - a.deletedAt)
    return [...base].sort((a, b) => (groupKey === 'none' ? +!!b.favorite - +!!a.favorite : 0) || fn(a, b))
  }, [vault, view, query, sortKey, groupKey])

  const groups = useMemo(() => {
    if (groupKey === 'none' || view === 'trash' || view.startsWith('cat:') && groupKey === 'category') return [[null, list]]
    const m = new Map()
    for (const i of list) {
      const k = groupKey === 'category' ? categoryOf(i) : letterOf(i.title)
      m.set(k, [...(m.get(k) || []), i])
    }
    const keys = [...m.keys()]
    if (groupKey === 'category') keys.sort((a, b) => CATEGORIES.findIndex((c) => c.id === a) - CATEGORIES.findIndex((c) => c.id === b))
    else keys.sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    return keys.map((k) => [groupKey === 'category' ? CATEGORY[k].label : k, m.get(k)])
  }, [list, groupKey, view])

  const selected = items.find((i) => i.id === selectedId)
  const isTool = TOOLS.includes(view)

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isTool) setView('all')
        setTimeout(() => searchRef.current?.focus(), 0)
      } else if (mod && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        lock()
      } else if (e.key === 'Escape' && !draft && !document.querySelector('.modal')) {
        setSelectedId(null)
        setNewMenu(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isTool, draft])

  // ---------- Actions ----------
  const now = () => Date.now()
  const mapItem = (id, fn) => update((v) => ({ ...v, items: v.items.map((i) => (i.id === id ? fn(i) : i)) }))

  function go(v) {
    setView(v)
    setSelectedId(null)
    setDraft(null)
    setNavOpen(false)
  }
  function startNew(type, extra) {
    setDraft(newItem(type, extra))
    setSelectedId(null)
    setNewMenu(false)
    if (TOOLS.includes(view) || view === 'trash') setView('all')
  }
  function save(item) {
    const it = { ...item, updatedAt: now() }
    update((v) => ({ ...v, items: v.items.some((i) => i.id === it.id) ? v.items.map((i) => (i.id === it.id ? it : i)) : [it, ...v.items] }))
    setDraft(null)
    setSelectedId(it.id)
    toast('Enregistré')
  }
  const toggleFav = (id) => mapItem(id, (i) => ({ ...i, favorite: !i.favorite, updatedAt: now() }))
  function trashItem(id) {
    mapItem(id, (i) => ({ ...i, deletedAt: now(), updatedAt: now() }))
    setSelectedId(null)
    toast('Déplacé dans la corbeille')
  }
  function restore(id) {
    mapItem(id, (i) => ({ ...i, deletedAt: null, updatedAt: now() }))
    toast('Restauré')
  }
  function purge(id) {
    if (!confirm('Supprimer définitivement cet élément ?')) return
    mapItem(id, (i) => ({ id: i.id, purged: true, updatedAt: now() }))
    setSelectedId(null)
  }
  function emptyTrash() {
    if (!trash.length || !confirm(`Supprimer définitivement ${trash.length} élément(s) ?`)) return
    update((v) => ({ ...v, items: v.items.map((i) => (i.deletedAt && !i.purged ? { id: i.id, purged: true, updatedAt: now() } : i)) }))
    setSelectedId(null)
  }
  function duplicate(item) {
    const copy = { ...newItem(item.type), ...item, id: crypto.randomUUID(), title: `${item.title} (copie)`, createdAt: now(), updatedAt: now(), history: [] }
    update((v) => ({ ...v, items: [copy, ...v.items] }))
    setSelectedId(copy.id)
    toast('Dupliqué')
  }
  const markUsed = (id) => update((v) => ({ ...v, items: v.items.map((i) => (i.id === id ? { ...i, uses: (i.uses || 0) + 1, lastUsedAt: now() } : i)) }))
  const importItems = (newItems) => update((v) => mergeVaults(v, { items: newItems }))
  const updateSettings = (patch) => update((v) => ({ ...v, settings: { ...v.settings, ...patch }, settingsUpdatedAt: now() }))

  // ---------- Rendu ----------
  const title = view === 'all' ? 'Tout le coffre' : view === 'fav' ? 'Favoris' : view === 'trash' ? 'Corbeille' : TYPES[view]?.plural || (view.startsWith('tag:') ? `#${view.slice(4)}` : view.startsWith('cat:') ? CATEGORY[view.slice(4)]?.label : '')

  const NavBtn = ({ id, icon: Icon, label, count }) => (
    <button className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => go(id)}>
      <Icon size={17} />
      <span>{label}</span>
      {count > 0 && <em>{count}</em>}
    </button>
  )

  return (
    <div className={`app ${isTool ? 'tool-mode' : ''} ${selected || draft ? 'has-detail' : ''} ${navOpen ? 'nav-open' : ''}`}>
      <div className="nav-scrim" onClick={() => setNavOpen(false)} />
      <aside className="sidebar">
        <div className="brand">
          <Logo size={28} />
          <strong>Coffre</strong>
          <button className="icon-btn only-mobile" onClick={() => setNavOpen(false)} aria-label="Fermer le menu"><X size={18} /></button>
        </div>

        <nav>
          <NavBtn id="all" icon={Layers} label="Tout" count={counts.all} />
          <NavBtn id="fav" icon={Star} label="Favoris" count={counts.fav} />
          <div className="nav-sep">Types</div>
          {Object.entries(TYPES).map(([k, t]) => (
            <NavBtn key={k} id={k} icon={TYPE_ICONS[k]} label={t.plural} count={counts[k]} />
          ))}
          <div className="nav-sep">Catégories</div>
          {CATEGORIES.filter((c) => counts[`cat:${c.id}`]).map((c) => (
            <button key={c.id} className={`nav-item ${view === `cat:${c.id}` ? 'active' : ''}`} onClick={() => go(`cat:${c.id}`)}>
              <i className="cat-dot" style={{ background: c.color }} />
              <span>{c.label}</span>
              <em>{counts[`cat:${c.id}`]}</em>
            </button>
          ))}
          {tags.length > 0 && <div className="nav-sep">Tags</div>}
          <div className="tag-cloud">
            {tags.map(([t, n]) => (
              <button key={t} className={`tag ${view === `tag:${t}` ? 'on' : ''}`} onClick={() => go(`tag:${t}`)}>
                #{t} <small>{n}</small>
              </button>
            ))}
          </div>
          <div className="nav-sep">Outils</div>
          <NavBtn id="generator" icon={Sparkles} label="Générateur" />
          <NavBtn id="health" icon={HeartPulse} label="Santé des mots de passe" />
          <NavBtn id="trash" icon={Trash2} label="Corbeille" count={counts.trash} />
          <NavBtn id="settings" icon={SettingsIcon} label="Réglages" />
        </nav>

        <div className="sidebar-foot">
          <SyncBadge ctx={ctx} />
          <button className="btn ghost block" onClick={lock} title="Verrouiller (Ctrl+L)">
            <Lock size={16} /> Verrouiller
          </button>
        </div>
      </aside>

      {isTool ? (
        <main className="tool-pane">
          <div className="mobile-bar only-mobile">
            <button className="icon-btn" onClick={() => setNavOpen(true)} aria-label="Menu"><Menu size={20} /></button>
          </div>
          {view === 'generator' && <GeneratorView onUse={(pw) => startNew('login', { password: pw })} />}
          {view === 'health' && (
            <HealthView
              items={live}
              onOpen={(id) => {
                setView('all')
                setSelectedId(id)
              }}
            />
          )}
          {view === 'settings' && <SettingsView vault={vault} ctx={ctx} updateSettings={updateSettings} importItems={importItems} />}
        </main>
      ) : (
        <>
          <section className="list-pane">
            <header className="list-head">
              <button className="icon-btn only-mobile" onClick={() => setNavOpen(true)} aria-label="Menu"><Menu size={20} /></button>
              <h2>{query ? 'Résultats' : title}</h2>
              {view === 'trash' ? (
                <button className="btn ghost sm" onClick={emptyTrash} disabled={!trash.length}>Vider</button>
              ) : (
                <div className="new-wrap">
                  <button className="btn primary sm" onClick={() => (TYPES[view] ? startNew(view) : setNewMenu((m) => !m))}>
                    <Plus size={16} /> Nouveau
                  </button>
                  {newMenu && (
                    <div className="menu" onMouseLeave={() => setNewMenu(false)}>
                      {Object.entries(TYPES).map(([k, t]) => {
                        const Icon = TYPE_ICONS[k]
                        return (
                          <button key={k} onClick={() => startNew(k)}>
                            <Icon size={16} /> {t.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </header>
            <div className="search">
              <Search size={16} />
              <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…  (Ctrl+K)" />
              {query && <button className="icon-btn" onClick={() => setQuery('')} aria-label="Effacer"><X size={14} /></button>}
            </div>
            {view !== 'trash' && (
              <div className="list-tools">
                <label title="Trier">
                  <ArrowUpDown size={14} />
                  <select value={sortKey} onChange={(e) => updateSettings({ listSort: e.target.value })} aria-label="Trier">
                    {Object.entries(SORTS).map(([k, o]) => <option key={k} value={k}>{o.label}</option>)}
                  </select>
                </label>
                <label title="Regrouper">
                  <Rows3 size={14} />
                  <select value={groupKey} onChange={(e) => updateSettings({ listGroup: e.target.value })} aria-label="Regrouper">
                    {Object.entries(GROUPS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </label>
                <span className="list-count">{list.length}</span>
              </div>
            )}
            <div className="item-list">
              {groups.map(([label, rows]) => (
                <ul key={label || 'all'} className="item-group">
                  {label && <li className="group-head"><span>{label}</span><em>{rows.length}</em></li>}
                  {rows.map((i) => (
                  <li key={i.id}>
                    <button
                      className={`item-row ${selectedId === i.id && !draft ? 'active' : ''}`}
                      onClick={() => {
                        setDraft(null)
                        setSelectedId(i.id)
                      }}
                    >
                      <Avatar item={i} />
                      <span className="item-text">
                        <strong>{i.title || 'Sans titre'}</strong>
                        <small>{subtitle(i)}</small>
                      </span>
                      <span className="item-meta">
                        {i.favorite && <Star size={13} className="star" />}
                        {reusedIds.has(i.id) && <span className="dot warn" title="Mot de passe réutilisé" />}
                        <small>{timeAgo(i.deletedAt || i.updatedAt)}</small>
                      </span>
                    </button>
                  </li>
                  ))}
                </ul>
              ))}
            </div>
            {!list.length && (
              <Empty icon={query ? Search : view === 'trash' ? Trash2 : Tag} title={query ? 'Aucun résultat' : view === 'trash' ? 'Corbeille vide' : 'Rien ici pour l\'instant'}>
                {!query && view !== 'trash' && 'Clique sur « Nouveau » pour ajouter un élément.'}
              </Empty>
            )}
          </section>

          <section className="detail-pane">
            {draft ? (
              <ItemEditor key={draft.id} item={draft} allTags={tags.map((t) => t[0])} onSave={save} onCancel={() => setDraft(null)} />
            ) : selected ? (
              <ItemDetail
                key={selected.id}
                item={selected}
                reused={reusedIds.has(selected.id)}
                onBack={() => setSelectedId(null)}
                onEdit={() => setDraft(selected)}
                onFav={() => toggleFav(selected.id)}
                onTrash={() => trashItem(selected.id)}
                onRestore={() => restore(selected.id)}
                onPurge={() => purge(selected.id)}
                onDuplicate={() => duplicate(selected)}
                onTag={(t) => go(`tag:${t}`)}
                onChange={(patch) => mapItem(selected.id, (i) => ({ ...i, ...patch, updatedAt: now() }))}
                onUsed={() => markUsed(selected.id)}
                onCategory={(c) => go(`cat:${c}`)}
              />
            ) : (
              <div className="detail-empty">
                <Logo size={52} />
                <p>Sélectionne un élément ou crée-en un nouveau.</p>
                <div className="kbd-hints">
                  <span><kbd>Ctrl</kbd> <kbd>K</kbd> rechercher</span>
                  <span><kbd>Ctrl</kbd> <kbd>L</kbd> verrouiller</span>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function SyncBadge({ ctx }) {
  const { cloud, sync, syncNow } = ctx
  if (!cloud)
    return (
      <div className="sync local" title="Aucun serveur configuré : les données restent sur cet appareil">
        <HardDrive size={14} /> Local uniquement
      </div>
    )
  const map = {
    idle: ['Synchronisation…', RefreshCw],
    syncing: ['Synchronisation…', RefreshCw],
    synced: [`Synchronisé ${sync.last ? timeAgo(sync.last) : ''}`, Cloud],
    offline: ['Hors ligne · enregistré localement', CloudOff],
    error: ['Erreur de synchro · réessayer', CloudOff],
  }
  const [label, Icon] = map[sync.state] || map.idle
  return (
    <button className={`sync ${sync.state}`} onClick={syncNow} title="Synchroniser maintenant">
      <Icon size={14} className={sync.state === 'syncing' ? 'spin' : ''} /> {label}
    </button>
  )
}
