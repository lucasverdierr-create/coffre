// Classement automatique : on reconnaît la marque ou le service à partir du titre, de l'adresse du site
// et des tags. Tout se fait localement, aucune donnée n'est envoyée.
import {
  siGmail, siGoogle, siGoogleads, siGoogleanalytics, siGoogledrive, siGooglecloud, siGooglesearchconsole, siGooglemeet, siGoogleplay,
  siProtonmail, siProton, siIcloud, siApple, siNetflix, siSpotify, siDeezer, siYoutube, siTwitch, siCrunchyroll, siAppletv, siDuolingo, siStrava,
  siFacebook, siInstagram, siX, siTiktok, siSnapchat, siPinterest, siReddit, siDiscord, siWhatsapp, siTelegram, siSignal, siMessenger,
  siThreads, siBluesky, siMastodon, siGithub, siGitlab, siNetlify, siVercel, siSupabase, siCloudflare, siAnthropic, siClaude, siNpm, siDocker,
  siFigma, siNotion, siTrello, siAsana, siAirtable, siMake, siZapier, siHubspot, siMailchimp, siBrevo, siShopify, siWordpress, siWix,
  siWebflow, siSemrush, siZoom, siDropbox, siPaypal, siRevolut, siWise, siN26, siLydia, siStripe, siVisa, siMastercard, siBinance,
  siCoinbase, siEbay, siVinted, siAliexpress, siZalando, siFnac, siIkea, siUber, siUbereats, siDeliveroo, siAirbnb, siBookingdotcom,
  siSncf, siAirfrance, siRyanair, siEasyjet, siSteam, siEpicgames, siPlaystation, siRiotgames, siUbisoft, siBattledotnet, siEa, siOrange,
  siMalt, siIndeed, siPerplexity, siMistralai, siCursor, siJetbrains, siPostman, si1password, siBitwarden,
} from 'simple-icons'

export const CATEGORIES = [
  { id: 'email', label: 'E-mail & comptes', color: '#7aa7ff' },
  { id: 'banque', label: 'Banque & assurance', color: '#4fc58b' },
  { id: 'travail', label: 'Travail & marketing', color: '#e8b04b' },
  { id: 'dev', label: 'Dev & IA', color: '#c38bff' },
  { id: 'social', label: 'Réseaux sociaux', color: '#ff7ab6' },
  { id: 'abonnements', label: 'Streaming & abonnements', color: '#ef6b6b' },
  { id: 'achats', label: 'Achats', color: '#f0a04b' },
  { id: 'telecom', label: 'Internet & mobile', color: '#5cc8e0' },
  { id: 'admin', label: 'Administratif & logement', color: '#8ea0b8' },
  { id: 'sante', label: 'Santé', color: '#5fd0a8' },
  { id: 'voyages', label: 'Transports & voyages', color: '#6fb3ff' },
  { id: 'jeux', label: 'Jeux', color: '#a98bff' },
  { id: 'autre', label: 'Autre', color: '#9097a3' },
]
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// [nom affiché, mots-clés (séparés par |), catégorie, icône ou couleur]
const RAW = [
  // E-mail & comptes
  ['Gmail', 'gmail|mail google|google mail', 'email', siGmail],
  ['Google', 'google|compte google|accounts google', 'email', siGoogle],
  ['Outlook', 'outlook|hotmail|live com|msn', 'email', '#0078D4'],
  ['Yahoo', 'yahoo', 'email', '#6001D2'],
  ['iCloud', 'icloud', 'email', siIcloud],
  ['Apple', 'apple|apple id|appleid', 'email', siApple],
  ['Proton', 'proton|proton me', 'email', siProton],
  ['Proton Mail', 'protonmail|proton mail', 'email', siProtonmail],
  ['Microsoft', 'microsoft|office 365|microsoft 365|office com', 'email', '#0078D4'],
  ['1Password', '1password', 'email', si1password],
  ['Bitwarden', 'bitwarden', 'email', siBitwarden],
  // Banque & assurance
  ['Boursorama', 'boursorama|boursobank', 'banque', '#E5007D'],
  ['Crédit Agricole', 'credit agricole|ca paris|credit-agricole', 'banque', '#006A4E'],
  ['BNP Paribas', 'bnp|bnp paribas|mabanque bnpparibas', 'banque', '#00915A'],
  ['Société Générale', 'societe generale|particuliers sg', 'banque', '#E9041E'],
  ['LCL', 'lcl', 'banque', '#0C2F6E'],
  ['Caisse d’Épargne', 'caisse d epargne|caisse epargne|caisse-epargne', 'banque', '#E2001A'],
  ['Banque Populaire', 'banque populaire|banquepopulaire', 'banque', '#003D7D'],
  ['Crédit Mutuel', 'credit mutuel|creditmutuel', 'banque', '#E30613'],
  ['CIC', 'cic', 'banque', '#003E7E'],
  ['La Banque Postale', 'banque postale|labanquepostale', 'banque', '#003DA5'],
  ['Fortuneo', 'fortuneo', 'banque', '#6AB023'],
  ['Hello bank!', 'hello bank|hellobank', 'banque', '#00A0E1'],
  ['Revolut', 'revolut', 'banque', siRevolut],
  ['N26', 'n26', 'banque', siN26],
  ['Wise', 'wise|transferwise', 'banque', siWise],
  ['PayPal', 'paypal', 'banque', siPaypal],
  ['Lydia', 'lydia|sumeria', 'banque', siLydia],
  ['Qonto', 'qonto', 'banque', '#1D1D1B'],
  ['Shine', 'shine', 'banque', '#FF7A5C'],
  ['Stripe', 'stripe', 'banque', siStripe],
  ['Visa', 'visa', 'banque', siVisa],
  ['Mastercard', 'mastercard', 'banque', siMastercard],
  ['Binance', 'binance', 'banque', siBinance],
  ['Coinbase', 'coinbase', 'banque', siCoinbase],
  ['AXA', 'axa', 'banque', '#00008F'],
  ['MAIF', 'maif', 'banque', '#C8102E'],
  ['MACIF', 'macif', 'banque', '#00A0DF'],
  ['MMA', 'mma', 'banque', '#E2001A'],
  ['Groupama', 'groupama', 'banque', '#007C4F'],
  ['Allianz', 'allianz', 'banque', '#003781'],
  // Travail & marketing
  ['Google Ads', 'google ads|adwords|ads google', 'travail', siGoogleads],
  ['Google Analytics', 'google analytics|analytics google|ga4', 'travail', siGoogleanalytics],
  ['Search Console', 'search console|google search console', 'travail', siGooglesearchconsole],
  ['Google Drive', 'google drive|drive google', 'travail', siGoogledrive],
  ['Google Meet', 'google meet|meet google', 'travail', siGooglemeet],
  ['Make', 'make|make com|integromat', 'travail', siMake],
  ['Zapier', 'zapier', 'travail', siZapier],
  ['Airtable', 'airtable', 'travail', siAirtable],
  ['Notion', 'notion', 'travail', siNotion],
  ['Trello', 'trello', 'travail', siTrello],
  ['Asana', 'asana', 'travail', siAsana],
  ['Slack', 'slack', 'travail', '#4A154B'],
  ['Microsoft Teams', 'teams|microsoft teams', 'travail', '#6264A7'],
  ['Zoom', 'zoom', 'travail', siZoom],
  ['Canva', 'canva', 'travail', '#00C4CC'],
  ['Figma', 'figma', 'travail', siFigma],
  ['HubSpot', 'hubspot', 'travail', siHubspot],
  ['Mailchimp', 'mailchimp', 'travail', siMailchimp],
  ['Brevo', 'brevo|sendinblue', 'travail', siBrevo],
  ['Shopify', 'shopify', 'travail', siShopify],
  ['WordPress', 'wordpress|wp admin', 'travail', siWordpress],
  ['Wix', 'wix', 'travail', siWix],
  ['Webflow', 'webflow', 'travail', siWebflow],
  ['Semrush', 'semrush', 'travail', siSemrush],
  ['Ahrefs', 'ahrefs', 'travail', '#FF7000'],
  ['Meta Business', 'meta business|business facebook|facebook ads|meta ads', 'travail', siFacebook],
  ['Dropbox', 'dropbox', 'travail', siDropbox],
  ['Malt', 'malt', 'travail', siMalt],
  ['Indeed', 'indeed', 'travail', siIndeed],
  ['Welcome to the Jungle', 'welcome to the jungle|welcometothejungle|wttj', 'travail', '#FFCD00'],
  ['LinkedIn', 'linkedin', 'travail', '#0A66C2'],
  // Dev & IA
  ['GitHub', 'github', 'dev', siGithub],
  ['GitLab', 'gitlab', 'dev', siGitlab],
  ['Netlify', 'netlify', 'dev', siNetlify],
  ['Vercel', 'vercel', 'dev', siVercel],
  ['Supabase', 'supabase', 'dev', siSupabase],
  ['Cloudflare', 'cloudflare', 'dev', siCloudflare],
  ['Google Cloud', 'google cloud|gcp|cloud google', 'dev', siGooglecloud],
  ['AWS', 'aws|amazon web services', 'dev', '#FF9900'],
  ['Anthropic', 'anthropic|console anthropic', 'dev', siAnthropic],
  ['Claude', 'claude|claude ai|claude code', 'dev', siClaude],
  ['OpenAI', 'openai|chatgpt|chat openai', 'dev', '#10A37F'],
  ['Mistral AI', 'mistral|le chat mistral', 'dev', siMistralai],
  ['Perplexity', 'perplexity', 'dev', siPerplexity],
  ['Cursor', 'cursor', 'dev', siCursor],
  ['npm', 'npm|npmjs', 'dev', siNpm],
  ['Docker', 'docker', 'dev', siDocker],
  ['JetBrains', 'jetbrains', 'dev', siJetbrains],
  ['Postman', 'postman', 'dev', siPostman],
  // Réseaux sociaux
  ['Facebook', 'facebook|fb', 'social', siFacebook],
  ['Instagram', 'instagram|insta', 'social', siInstagram],
  ['X (Twitter)', 'twitter|x com', 'social', siX],
  ['TikTok', 'tiktok', 'social', siTiktok],
  ['Snapchat', 'snapchat|snap', 'social', siSnapchat],
  ['Pinterest', 'pinterest', 'social', siPinterest],
  ['Reddit', 'reddit', 'social', siReddit],
  ['Discord', 'discord', 'social', siDiscord],
  ['WhatsApp', 'whatsapp', 'social', siWhatsapp],
  ['Telegram', 'telegram', 'social', siTelegram],
  ['Signal', 'signal', 'social', siSignal],
  ['Messenger', 'messenger', 'social', siMessenger],
  ['Threads', 'threads', 'social', siThreads],
  ['Bluesky', 'bluesky|bsky', 'social', siBluesky],
  ['Mastodon', 'mastodon', 'social', siMastodon],
  // Streaming & abonnements
  ['Netflix', 'netflix', 'abonnements', siNetflix],
  ['Spotify', 'spotify', 'abonnements', siSpotify],
  ['Deezer', 'deezer', 'abonnements', siDeezer],
  ['YouTube', 'youtube|youtube premium', 'abonnements', siYoutube],
  ['Twitch', 'twitch', 'abonnements', siTwitch],
  ['Crunchyroll', 'crunchyroll', 'abonnements', siCrunchyroll],
  ['Apple TV', 'apple tv|appletv', 'abonnements', siAppletv],
  ['Disney+', 'disney|disneyplus|disney plus', 'abonnements', '#113CCF'],
  ['Prime Video', 'prime video|primevideo|amazon prime', 'abonnements', '#00A8E1'],
  ['Canal+', 'canal|canalplus|canal plus|mycanal', 'abonnements', '#111111'],
  ['Audible', 'audible', 'abonnements', '#F8991C'],
  ['Google Play', 'google play|play google', 'abonnements', siGoogleplay],
  ['Duolingo', 'duolingo', 'abonnements', siDuolingo],
  ['Strava', 'strava', 'abonnements', siStrava],
  ['Basic-Fit', 'basic fit|basicfit', 'abonnements', '#FF7900'],
  // Achats
  ['Amazon', 'amazon', 'achats', '#FF9900'],
  ['eBay', 'ebay', 'achats', siEbay],
  ['Vinted', 'vinted', 'achats', siVinted],
  ['Leboncoin', 'leboncoin|le bon coin', 'achats', '#EA5B0C'],
  ['AliExpress', 'aliexpress', 'achats', siAliexpress],
  ['Zalando', 'zalando', 'achats', siZalando],
  ['Fnac', 'fnac', 'achats', siFnac],
  ['IKEA', 'ikea', 'achats', siIkea],
  ['Decathlon', 'decathlon', 'achats', '#0082C3'],
  ['Cdiscount', 'cdiscount', 'achats', '#1B3A9F'],
  ['Back Market', 'back market|backmarket', 'achats', '#111111'],
  ['Shein', 'shein', 'achats', '#111111'],
  ['Temu', 'temu', 'achats', '#FB7701'],
  ['Carrefour', 'carrefour', 'achats', '#004E9F'],
  ['E.Leclerc', 'leclerc|e leclerc', 'achats', '#005CA9'],
  ['Auchan', 'auchan', 'achats', '#E2001A'],
  ['Lidl', 'lidl', 'achats', '#0050AA'],
  ['Uber Eats', 'uber eats|ubereats', 'achats', siUbereats],
  ['Deliveroo', 'deliveroo', 'achats', siDeliveroo],
  // Internet & mobile
  ['Free', 'free|freebox|free mobile|free fr', 'telecom', '#CD1E25'],
  ['Orange', 'orange|livebox', 'telecom', siOrange],
  ['SFR', 'sfr', 'telecom', '#E2001A'],
  ['Bouygues Telecom', 'bouygues|bouygues telecom|bbox|b you', 'telecom', '#009DCC'],
  ['Sosh', 'sosh', 'telecom', '#111111'],
  ['RED by SFR', 'red by sfr|redbysfr', 'telecom', '#E2001A'],
  // Administratif & logement
  ['Impôts', 'impots|impot|impots gouv|dgfip', 'admin', '#000091'],
  ['FranceConnect', 'franceconnect|france connect', 'admin', '#000091'],
  ['CAF', 'caf', 'admin', '#0069B4'],
  ['France Travail', 'france travail|pole emploi|francetravail', 'admin', '#000091'],
  ['ANTS', 'ants|ants gouv', 'admin', '#000091'],
  ['URSSAF', 'urssaf|autoentrepreneur', 'admin', '#1E3C8C'],
  ['La Poste', 'la poste|laposte', 'admin', '#FFC800'],
  ['EDF', 'edf', 'admin', '#FF5F00'],
  ['Engie', 'engie', 'admin', '#00AAFF'],
  ['TotalEnergies', 'totalenergies|total energies', 'admin', '#ED0000'],
  ['Veolia', 'veolia', 'admin', '#E2001A'],
  // Santé
  ['Ameli', 'ameli|cpam|assurance maladie', 'sante', '#0C419A'],
  ['Doctolib', 'doctolib', 'sante', '#107ACA'],
  ['Alan', 'alan', 'sante', '#282830'],
  // Transports & voyages
  ['SNCF Connect', 'sncf|sncf connect|ouigo|tgv', 'voyages', siSncf],
  ['Air France', 'air france|airfrance', 'voyages', siAirfrance],
  ['Ryanair', 'ryanair', 'voyages', siRyanair],
  ['easyJet', 'easyjet', 'voyages', siEasyjet],
  ['Airbnb', 'airbnb', 'voyages', siAirbnb],
  ['Booking.com', 'booking|booking com', 'voyages', siBookingdotcom],
  ['BlaBlaCar', 'blablacar', 'voyages', '#00AFF5'],
  ['Uber', 'uber', 'voyages', siUber],
  ['Trainline', 'trainline', 'voyages', '#00A88F'],
  ['Expedia', 'expedia', 'voyages', '#191E3B'],
  // Jeux
  ['Steam', 'steam', 'jeux', siSteam],
  ['Epic Games', 'epic games|epicgames|fortnite', 'jeux', siEpicgames],
  ['PlayStation', 'playstation|psn', 'jeux', siPlaystation],
  ['Xbox', 'xbox', 'jeux', '#107C10'],
  ['Nintendo', 'nintendo', 'jeux', '#E60012'],
  ['Riot Games', 'riot|riot games|league of legends|valorant', 'jeux', siRiotgames],
  ['Ubisoft', 'ubisoft', 'jeux', siUbisoft],
  ['Battle.net', 'battle net|battlenet|blizzard', 'jeux', siBattledotnet],
  ['EA', 'ea|electronic arts|ea app', 'jeux', siEa],
]

// Mots génériques : donnent une catégorie, sans marque associée
const GENERIC = {
  email: 'mail|email|e mail|messagerie|webmail',
  banque: 'banque|bank|compte courant|epargne|assurance|crypto|wallet|carte bancaire|cb|iban',
  travail: 'travail|boulot|pro|crm|client|marketing|seo|sea|ads|agence|entreprise|freelance|facturation',
  dev: 'api|api key|cle api|ssh|serveur|server|token|dev|prompt|git|hebergement|base de donnees|database|claude code|claude-code',
  social: 'reseau social|reseaux sociaux',
  abonnements: 'streaming|abonnement|musique|film|series|sport|salle de sport',
  achats: 'shopping|boutique|commande|courses|e commerce',
  telecom: 'box|wifi|wi fi|4g|5g|fibre|forfait|internet|routeur|mobile',
  admin: 'gouv|mairie|permis|passeport|carte d identite|logement|loyer|electricite|gaz|eau|syndic|proprietaire',
  sante: 'sante|mutuelle|medecin|pharmacie|hopital|dentiste',
  voyages: 'voyage|vol|avion|hotel|train|location voiture|parking',
  jeux: 'jeu|jeux|gaming|game',
}

const norm = (s) =>
  ` ${String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `

export const BRANDS = RAW.map(([name, keys, cat, icon]) => ({
  name,
  cat,
  keys: keys.split('|').map((k) => norm(k)),
  icon: typeof icon === 'object' ? icon : null,
  color: typeof icon === 'object' ? `#${icon.hex}` : icon,
}))

const GENERIC_KEYS = Object.entries(GENERIC).flatMap(([cat, keys]) => keys.split('|').map((k) => ({ cat, key: norm(k) })))

function hostWords(url) {
  if (!url) return ''
  try {
    const h = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`).hostname
    return h.replace(/^www\./, '').replace(/\./g, ' ')
  } catch {
    return url
  }
}

const cache = new Map()

// Renvoie { brand, category } détectés pour un élément.
export function detect(item) {
  const sig = `${item.title}|${item.url}|${(item.tags || []).join(',')}|${item.type}`
  const hit = cache.get(sig)
  if (hit) return hit

  const primary = norm(`${item.title} ${hostWords(item.url)}`)
  const all = norm(`${item.title} ${hostWords(item.url)} ${(item.tags || []).join(' ')} ${item.language || ''}`)

  // 1. Marque : on cherche d'abord dans le titre et l'adresse, la correspondance la plus longue gagne
  let brand = null
  let best = 0
  for (const b of BRANDS) {
    for (const k of b.keys) {
      if (k.length > best && primary.includes(k)) {
        brand = b
        best = k.length
      }
    }
  }

  // 2. Catégorie : celle de la marque, sinon un mot générique, sinon selon le type
  let category = brand?.cat
  if (!category) {
    let g = 0
    for (const { cat, key } of GENERIC_KEYS) {
      if (key.length > g && all.includes(key)) {
        category = cat
        g = key.length
      }
    }
  }
  if (!category) {
    for (const b of BRANDS) if (b.keys.some((k) => all.includes(k))) { category = b.cat; break }
  }
  if (!category) category = item.type === 'snippet' ? 'dev' : 'autre'

  const res = { brand, category }
  if (cache.size > 5000) cache.clear()
  cache.set(sig, res)
  return res
}

export const categoryOf = (item) => (item.category && CATEGORY[item.category] ? item.category : detect(item).category)
export const brandOf = (item) => detect(item).brand
