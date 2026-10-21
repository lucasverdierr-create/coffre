// Générateur de mots de passe et de phrases de passe (aléatoire cryptographique, sans biais).

function randInt(max) {
  const a = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / max) * max
  let x
  do {
    crypto.getRandomValues(a)
    x = a[0]
  } while (x >= limit)
  return x % max
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%&*()-_=+[]{};:,.?/~',
}
const AMBIGUOUS = /[lIO01|]/g

export const DEFAULT_OPTIONS = { length: 20, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: true }

export function generatePassword(opts = DEFAULT_OPTIONS) {
  const o = { ...DEFAULT_OPTIONS, ...opts }
  let sets = ['lower', 'upper', 'digits', 'symbols'].filter((k) => o[k]).map((k) => (o.avoidAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]))
  if (!sets.length) sets = [SETS.lower]
  const all = sets.join('')
  const length = Math.max(o.length, sets.length)
  const chars = sets.map((s) => s[randInt(s.length)]) // au moins un caractère de chaque famille
  while (chars.length < length) chars.push(all[randInt(all.length)])
  return shuffle(chars).join('')
}

const WORDS = `abeille abricot acier agate aigle album algue amande ananas ancre anguille antenne arbre arche argile atlas atome aurore avion azur
badge baleine bambou banane barque bassin bateau bijou bison bleuet bocal bois bougie boussole branche brique brume bulle cactus cadre
calme canard canyon carte castor cerise chalet chameau chanson charbon chat chemin chene cheval cigale cirque citron clairon clef colibri comete
compas coquille corail cosmos coton crayon crique cristal cygne dauphin delta desert diamant domino dragon dune eclair ecorce ecume epice
etoile falaise faucon fenouil festin feuille figue flamme fleuve flocon foret fougere fourmi fraise frelon fusee galet gazelle geyser girafe
givre glacier gland globe gorille granit grenade griffon guitare hamac hamster harpe herisson hibou horizon igloo ile indigo iris jade jaguar
jardin jasmin jongleur kayak kiwi koala lagon lama lanterne laser laurier lavande levier lezard licorne lierre lilas limace lion loutre lune
lynx magma mammouth mangue marmotte marron melon menthe meteore miel mirage moulin mouette muguet myrtille nacre navire nectar neige nuage
oasis ocean olive ombre onyx orage orange orchidee origami otarie ours palmier panda papaye papillon paradis pastel pelican perle phare
piano pigeon pirate planete plume poivre pollen pomme poney prairie prisme puma pyramide quartz radar radis raisin rameau rempart renard
requin rivage robot rocher rubis ruche sable safran saphir satin saule sequoia sirene soleil sorbet source sphinx sureau tango tapir tempete
tigre tipi tomate tonnerre topaze torrent toucan tournesol trefle tribu tulipe tunnel turquoise vague vallee vanille velours verger vigne
violon volcan voyage wagon yack yoga zebre zenith zeste`.split(/\s+/).filter(Boolean)

export const WORD_COUNT = WORDS.length

export function generatePassphrase({ words = 5, separator = '-', capitalize = true, number = true } = {}) {
  const list = Array.from({ length: words }, () => {
    const w = WORDS[randInt(WORDS.length)]
    return capitalize ? w[0].toUpperCase() + w.slice(1) : w
  })
  if (number) list[randInt(list.length)] += randInt(10)
  return list.join(separator)
}

export function passphraseBits(words, number) {
  return Math.round(words * Math.log2(WORDS.length) + (number ? Math.log2(10 * words) : 0))
}
