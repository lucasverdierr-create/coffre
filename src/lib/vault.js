// Modèle de données du coffre (tout ceci est chiffré avant d'être stocké).

export const TYPES = {
  login: { label: 'Identifiant', plural: 'Identifiants' },
  note: { label: 'Note', plural: 'Notes' },
  snippet: { label: 'Snippet / prompt', plural: 'Snippets & prompts' },
  secret: { label: 'Clé / secret', plural: 'Clés & secrets' },
}

export const uid = () => crypto.randomUUID()

export function newItem(type, extra = {}) {
  const now = Date.now()
  const base = { id: uid(), type, title: '', tags: [], favorite: false, createdAt: now, updatedAt: now }
  if (type === 'login') return { ...base, username: '', password: '', url: '', totp: '', notes: '', history: [], passwordChangedAt: now, ...extra }
  if (type === 'note') return { ...base, content: '', ...extra }
  if (type === 'snippet') return { ...base, content: '', language: '', notes: '', ...extra }
  return { ...base, value: '', notes: '', ...extra }
}

export function searchText(i) {
  return [i.title, i.username, i.url, i.notes, i.content, i.language, ...(i.tags || [])].filter(Boolean).join(' ').toLowerCase()
}

export function subtitle(i) {
  if (i.type === 'login') return i.username || hostname(i.url) || '—'
  if (i.type === 'note' || i.type === 'snippet') {
    const lines = (i.content || '').split('\n').map((l) => l.replace(/[#>*`_[\]]|^\s*-\s/g, '').trim()).filter((l) => l && l !== i.title)
    return lines[0]?.slice(0, 80) || 'Vide'
  }
  return i.notes?.split('\n')[0]?.slice(0, 80) || '••••••••'
}

export function hostname(url) {
  if (!url) return ''
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function safeUrl(url) {
  if (!url) return null
  const u = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`
  return /^https?:\/\//i.test(u) ? u : null
}

// Fusion élément par élément : la version modifiée le plus récemment gagne.
// Les suppressions définitives laissent une "pierre tombale" { id, purged: true } pour se propager.
export function mergeVaults(a, b) {
  const map = new Map()
  for (const it of [...(a.items || []), ...(b.items || [])]) {
    const cur = map.get(it.id)
    if (!cur || (it.updatedAt || 0) > (cur.updatedAt || 0)) map.set(it.id, it)
  }
  const aNewer = (a.settingsUpdatedAt || 0) >= (b.settingsUpdatedAt || 0)
  return {
    ...a,
    settings: aNewer ? a.settings : b.settings,
    settingsUpdatedAt: Math.max(a.settingsUpdatedAt || 0, b.settingsUpdatedAt || 0),
    items: [...map.values()],
  }
}

export const DEFAULT_SETTINGS = { autoLockMin: 10, clipboardSec: 30, theme: 'system' }

export function initialVault() {
  const memo = [
    '# Mémo Claude Code',
    '',
    'Note de départ, à remplacer par tes propres règles. Tout ce qui est ici est chiffré.',
    '',
    '## Contexte à redonner sur chaque projet',
    '- Stack : React + Vite, déploiement Netlify',
    '- Messages de commit en français',
    '- Toujours lancer `npm run build` avant de dire que c\'est terminé',
    '',
    '## Prompts qui marchent bien',
    '- « Lis le code existant avant de proposer quoi que ce soit »',
    '- « Fais un plan, attends ma validation, puis code »',
    '',
    '## Commandes utiles',
    '```bash',
    'npm run dev',
    'git status',
    '```',
    '',
    '## À ne pas oublier',
    '- [ ] Mettre à jour le CLAUDE.md du projet',
    '- [ ] Vérifier les variables d\'environnement sur Netlify',
  ].join('\n')

  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    settingsUpdatedAt: Date.now(),
    items: [
      newItem('note', { title: 'Mémo Claude Code', content: memo, tags: ['claude-code'], favorite: true }),
      newItem('snippet', {
        title: 'Prompt : revue de code',
        language: 'prompt',
        tags: ['claude-code', 'prompt'],
        content:
          'Relis les fichiers modifiés depuis le dernier commit.\nListe les bugs probables, les failles de sécurité et le code mort, du plus grave au moins grave.\nNe modifie rien : propose seulement les corrections.',
      }),
    ],
  }
}
