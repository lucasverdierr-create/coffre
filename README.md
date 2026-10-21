# Coffre

Coffre-fort personnel chiffré : mots de passe, codes 2FA, notes, snippets / prompts (pour Claude Code par exemple) et clés API. Tout est chiffré **dans le navigateur** avant d'être enregistré ou synchronisé.

## Fonctionnalités

- **Classement automatique** : ~200 marques et services reconnus (banques, réseaux sociaux, outils marketing, administratif…) rangés en 13 catégories, avec logo ou pastille aux couleurs de la marque ; catégorie modifiable à la main
- **Tri et regroupement** : récents, A → Z, plus utilisés ; par catégorie ou par lettre
- **Déverrouillage par Face ID / Touch ID / Windows Hello** (passkey + extension PRF, iOS 18 / macOS 15 minimum), à activer sur chaque appareil dans les réglages
- **Identifiants** : site, identifiant, mot de passe, notes, historique des anciens mots de passe
- **Codes 2FA (TOTP)** générés dans l'app (clé base32 ou lien `otpauth://`)
- **Notes en Markdown** avec aperçu, cases à cocher, blocs de code
- **Snippets & prompts** : commandes, bouts de code, prompts réutilisables, copie en un clic
- **Clés & secrets** : clés API, Wi-Fi, codes PIN…
- **Recherche globale** (`Ctrl+K`), favoris, tags, corbeille avec restauration
- **Générateur** de mots de passe et de phrases de passe
- **Santé des mots de passe** : faibles, réutilisés, anciens, vérification des fuites via Have I Been Pwned (k-anonymat)
- **Sécurité** : verrouillage automatique, verrouillage manuel (`Ctrl+L`), presse-papiers effacé automatiquement
- **Synchro multi-appareils** via Supabase (fusion automatique en cas de modifications simultanées), fonctionne hors ligne
- **Import CSV** depuis Chrome, Firefox, Bitwarden, 1Password… ; **sauvegarde chiffrée** en .json ; export CSV en clair (avec avertissement)
- Thème clair / sombre, responsive mobile, **installable** comme une app (PWA)

## Sécurité

| Élément | Choix |
|---|---|
| Dérivation de clé | PBKDF2-SHA256, 600 000 itérations, sel aléatoire de 16 octets |
| Chiffrement | AES-256-GCM, IV aléatoire à chaque enregistrement |
| Serveur | Ne reçoit qu'un bloc chiffré ; Row Level Security : chaque compte ne voit que sa ligne |
| Navigateur | CSP stricte, aucune ressource externe, pas de tracking |

Il y a **deux mots de passe** :
1. le **mot de passe du compte** (Supabase) : sert seulement à retrouver ton coffre chiffré sur tes appareils ;
2. le **mot de passe maître** : chiffre le coffre. Il n'est jamais envoyé. **Oublié = données perdues.**

---

## Mise en ligne pas à pas

### 1. Supabase (base de données, gratuit)

1. Crée un compte sur [supabase.com](https://supabase.com) puis **New project** (région : Paris / `eu-west-3` si disponible).
2. **SQL Editor → New query**, colle le contenu de [`supabase/schema.sql`](supabase/schema.sql), clique **Run**.
3. **Project Settings → API** : note la *Project URL* et la clé *anon public*.
4. **Authentication → URL Configuration** : mets l'adresse Netlify de ton site dans *Site URL* (tu pourras la compléter après l'étape 3).
5. Option : **Authentication → Sign In / Providers → Email**, désactive *Allow new users to sign up* une fois ton compte créé, pour que personne d'autre ne puisse s'inscrire.

### 2. GitHub

```bash
cd coffre
git init
git add .
git commit -m "Première version de Coffre"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/coffre.git
git push -u origin main
```

Crée le dépôt en **privé** sur GitHub avant le `push` (le code ne contient aucun secret, mais autant rester discret).

### 3. Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project → GitHub** → choisis le dépôt `coffre`.
2. Les réglages de build sont lus dans `netlify.toml` (rien à changer).
3. **Site configuration → Environment variables** : ajoute
   - `VITE_SUPABASE_URL` = la Project URL
   - `VITE_SUPABASE_ANON_KEY` = la clé anon public
4. **Deploys → Trigger deploy**. Ensuite, chaque `git push` redéploie automatiquement.
5. Reporte l'adresse du site (`https://xxx.netlify.app`) dans Supabase (étape 1.4).

### En local

```bash
npm install
cp .env.example .env.local   # puis remplis les deux valeurs
npm run dev
```

Sans `.env.local`, l'app démarre en **mode local** : pas de compte, tout reste dans le navigateur.

---

## Bonnes pratiques

- Exporte une **sauvegarde chiffrée** de temps en temps (Réglages → Sauvegarde) et garde-la hors ligne.
- Active la double authentification sur ton compte GitHub, Netlify et Supabase.
- Après un import CSV, supprime le fichier CSV (il est en clair).

## Structure

```
src/
  App.jsx               déverrouillage, persistance, synchro, verrouillage auto
  lib/crypto.js         PBKDF2 + AES-GCM (Web Crypto)
  lib/storage.js        cache local + lecture/écriture Supabase (verrou optimiste par révision)
  lib/vault.js          modèle de données, fusion entre appareils
  lib/totp.js           codes 2FA (RFC 6238)
  lib/generator.js      mots de passe et phrases de passe
  components/           écrans et vues
supabase/schema.sql     table + règles d'accès
netlify.toml            build, redirections, en-têtes de sécurité
```
