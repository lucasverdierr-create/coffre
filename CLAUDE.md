# Coffre — consignes pour Claude Code

Gestionnaire de mots de passe / notes perso. React 18 + Vite, synchro Supabase, déployé sur Netlify. Interface et commentaires en français.

## Règles de sécurité (non négociables)
- Aucune donnée du coffre ne doit jamais être envoyée ou stockée en clair : tout passe par `seal()` / `openEnvelope()` de `src/lib/crypto.js`.
- Ne jamais stocker le mot de passe maître ni la clé dérivée (ni localStorage, ni sessionStorage, ni logs).
- Pas de nouvelle dépendance réseau sans mettre à jour la CSP de `netlify.toml` ; pas de CDN, pas d'analytics.
- Ne pas baisser `ITERATIONS` (PBKDF2) ; un changement de format d'enveloppe doit rester capable de lire l'ancien (`v: 1`).
- Le markdown affiché passe toujours par `renderMarkdown()` (DOMPurify).

## Architecture
- `App.jsx` : état du coffre déchiffré en mémoire, `persist()` chiffre puis sauve en local (`dirty: true`) et pousse vers Supabase (debounce). Conflits gérés par `revision` + `mergeVaults()` (le plus récent `updatedAt` par élément gagne, suppressions = pierres tombales `{ id, purged: true }`).
- Ajouter un type d'élément : `TYPES` + `newItem()` dans `lib/vault.js`, icône dans `TYPE_ICONS` (`Vault.jsx`), champs dans `ItemEditor.jsx` et `ItemDetail.jsx`.

## Commandes
- `npm run dev` : serveur local (mode local si pas de `.env.local`)
- `npm run build` : à lancer avant de considérer une modif comme terminée
