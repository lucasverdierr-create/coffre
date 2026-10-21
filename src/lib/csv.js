import { newItem } from './vault'

export function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  text = text.replace(/^﻿/, '')
  const first = text.split(/\r?\n/, 1)[0]
  const delim = first.includes(';') && !first.includes(',') ? ';' : ','
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === delim) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((x) => x.trim()))
}

export function toCSV(rows) {
  return rows.map((r) => r.map((v) => {
    const s = String(v ?? '')
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
}

// Compatible avec les exports CSV de Chrome, Edge, Firefox, Bitwarden, 1Password, Dashlane (colonnes usuelles).
export function csvToItems(text) {
  const [header, ...rows] = parseCSV(text)
  if (!header) return []
  const H = header.map((x) => x.trim().toLowerCase())
  const idx = (...names) => H.findIndex((x) => names.includes(x))
  const col = {
    name: idx('name', 'title', 'nom', 'titre'),
    url: idx('url', 'login_uri', 'website', 'uri', 'site'),
    user: idx('username', 'login_username', 'login', 'email', 'user', 'identifiant'),
    pass: idx('password', 'login_password', 'mot de passe', 'motdepasse'),
    note: idx('note', 'notes', 'extra', 'comment', 'comments'),
    totp: idx('totp', 'login_totp', 'otpauth', 'otp'),
    folder: idx('folder', 'grouping', 'group', 'category', 'dossier'),
    type: idx('type'),
  }
  const get = (r, i) => (i >= 0 ? (r[i] || '').trim() : '')
  return rows
    .map((r) => {
      const folder = get(r, col.folder).toLowerCase()
      const tags = folder ? [folder] : []
      if (get(r, col.type).toLowerCase() === 'note') {
        return newItem('note', { title: get(r, col.name) || 'Note importée', content: get(r, col.note), tags })
      }
      return newItem('login', {
        title: get(r, col.name) || get(r, col.url) || 'Identifiant importé',
        url: get(r, col.url),
        username: get(r, col.user),
        password: get(r, col.pass),
        notes: get(r, col.note),
        totp: get(r, col.totp),
        tags,
      })
    })
    .filter((it) => it.password || it.content || it.username)
}

export function itemsToCSV(items) {
  const rows = [['type', 'name', 'url', 'username', 'password', 'totp', 'notes', 'tags']]
  for (const i of items) {
    rows.push([i.type, i.title, i.url || '', i.username || '', i.password || i.value || '', i.totp || '', i.type === 'login' || i.type === 'secret' ? i.notes || '' : i.content || '', (i.tags || []).join(' ')])
  }
  return toCSV(rows)
}
