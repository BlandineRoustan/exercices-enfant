import { get } from './store.js';
import { el, pick, shuffle, cadre, suite, cartes } from './ui.js';

/* ---------- Dessins : chiffre, dé, doigts ---------- */

const chiffre = n => el('span', 'nombre', String(n));

// Dé : points de 1 à 6
const PIPS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 24], [28, 50], [28, 76], [72, 24], [72, 50], [72, 76]]
};
function de(n) {
  const d = el('span', 'dessin');
  d.innerHTML =
    '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="6" y="6" width="88" height="88" rx="18" fill="#FBFAF6" stroke="#3A404A" stroke-width="4"/>' +
    PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.5" fill="#22262B"/>`).join('') + '</svg>';
  return d;
}

// Une main droite, paume vers soi, avec k doigts levés (0 à 5), comptés à la française :
// pouce, index, majeur, annulaire, auriculaire.
// Silhouette d'un seul tenant : on dessine toutes les formes en contour épais, puis par-dessus en couleur de peau.
const PEAU = '#F4C9A0';
const TRAIT = '#9A6440';
const PLI = '#D9A57A';
// doigts (index → auriculaire) : centre x, largeur, longueur, inclinaison
const DOIGTS = [[38, 15, 50, -9], [53, 16, 56, -2], [68, 15, 52, 5], [81, 13, 40, 12]];
function main(k, miroir) {
  const leves = DOIGTS.map((_, i) => i + 1 < k);
  const formes = [];
  DOIGTS.forEach(([x, w, h, a], i) => {
    if (leves[i]) formes.push(`<rect x="${x - w / 2}" y="${66 - h}" width="${w}" height="${h + 14}" rx="${w / 2}" transform="rotate(${a} ${x} 70)"/>`);
  });
  formes.push('<rect x="28" y="56" width="62" height="58" rx="22"/>'); // paume
  formes.push('<rect x="38" y="104" width="42" height="16" rx="4"/>'); // poignet
  if (k >= 1) formes.push('<rect x="18" y="44" width="16" height="54" rx="8" transform="rotate(-38 26 96)"/>'); // pouce levé
  // la main occupe 108 de large : décalée de 8 pour laisser la place au pouce
  let s = `<g transform="${miroir ? 'translate(108 0) scale(-1 1) ' : ''}translate(8 0)">`;
  s += `<g fill="${TRAIT}" stroke="${TRAIT}" stroke-width="7" stroke-linejoin="round">${formes.join('')}</g>`;
  s += `<g fill="${PEAU}">${formes.join('')}</g>`;
  // doigts pliés : on voit les phalanges repliées en haut de la paume
  DOIGTS.forEach(([x, w], i) => {
    if (!leves[i]) s += `<rect x="${x - w / 2}" y="52" width="${w}" height="24" rx="${w / 2}" fill="${PEAU}" stroke="${TRAIT}" stroke-width="3"/>`;
  });
  // pouce plié : couché en travers de la paume
  if (k < 1) s += `<rect x="30" y="80" width="40" height="15" rx="7.5" fill="${PEAU}" stroke="${TRAIT}" stroke-width="3"/>`;
  // ongles discrets au bout des doigts levés
  DOIGTS.forEach(([x, w, h, a], i) => {
    if (leves[i]) s += `<rect x="${x - w / 2 + 3.5}" y="${66 - h + 3}" width="${w - 7}" height="9" rx="4" fill="${PLI}" transform="rotate(${a} ${x} 70)"/>`;
  });
  if (k >= 1) s += `<rect x="21.5" y="47" width="9" height="9" rx="4" fill="${PLI}" transform="rotate(-38 26 96)"/>`;
  return s + '</g>';
}
function doigts(n) {
  const d = el('span', 'dessin');
  if (n <= 5) {
    d.innerHTML = `<svg viewBox="0 0 108 124" aria-hidden="true">${main(n, false)}</svg>`;
  } else {
    d.classList.add('double');
    d.innerHTML =
      `<svg viewBox="0 0 228 124" aria-hidden="true"><g>${main(5, true)}</g><g transform="translate(120 0)">${main(n - 5, false)}</g></svg>`;
  }
  return d;
}

/* ---------- Objets et scènes ---------- */

// Objets variés : jamais le même dans les 4 derniers tirages
const OBJETS = ['🦆', '🐱', '🍴', '🍎', '⭐', '🐟', '🚗', '🌸', '🍪', '🎈', '🐝', '🍓', '🐢', '🍌',
  '🐶', '🐸', '🦋', '🍐', '🍇', '🍋', '🥕', '🎁', '⚽', '🏠', '🌳', '🔑', '🧦', '🪁', '🍩', '🐞', '🍄', '🐘'];

function tireurObjets() {
  const recents = [];
  return () => {
    let o;
    do { o = pick(OBJETS); } while (recents.includes(o));
    recents.push(o);
    if (recents.length > 4) recents.shift();
    return o;
  };
}

const alea = n => Math.floor(Math.random() * n); // 0 à n-1

// n objets en rangées de 5 ; "barres" = nombre d'objets barrés (les derniers)
function scene(objet, n, { barres = 0, petit = false } = {}) {
  const s = el('div', 'scene' + (petit ? ' petit' : ''));
  for (let i = 0; i < n; i++) s.append(el('span', 'objet' + (i >= n - barres ? ' barre' : ''), objet));
  return s;
}

// Deux nombres proches de n (plus difficile que des nombres au hasard) dans [min, max].
// "exclure" : valeurs à éviter si possible (par ex. déjà visibles).
function distracteurs(n, min, max, exclure) {
  const candidats = ex => {
    const pool = [];
    for (let v = min; v <= max; v++) if (v !== n && !(ex && ex.has(v))) pool.push(v);
    return pool;
  };
  let pool = candidats(exclure);
  if (pool.length < 2) pool = candidats(null);
  pool.sort((a, b) => Math.abs(a - n) - Math.abs(b - n));
  return shuffle(pool.slice(0, 4)).slice(0, 2);
}

// Nombre au hasard dans [min, max], différent du précédent quand c'est possible
function tireur(min, max) {
  let der = -1;
  return () => {
    let n;
    let essais = 0;
    do { n = min + alea(max - min + 1); } while (n === der && max > min && essais++ < 20);
    der = n;
    return n;
  };
}

// Lance une session : "fabrique" renvoie { modele, faces, bon } pour chaque question
function jeu(root, retour, relancer, fabrique) {
  const S = cadre(root, retour);
  const max = get().maxNombre;
  const apres = suite(S, retour, relancer, () => suivant());
  const q = fabrique(max);
  const suivant = () => {
    const { modele, faces, bon } = q();
    cartes(S, modele, faces, bon, apres);
  };
  suivant();
}

/* ---------- COMPTER : une image avec N objets identiques, choisir le bon chiffre ---------- */

export function exoCompter(root, retour) {
  jeu(root, retour, () => exoCompter(root, retour), max => {
    const n_ = tireur(1, max);
    const obj = tireurObjets();
    return () => {
      const n = n_();
      const nombres = shuffle([n, ...distracteurs(n, 1, max)]);
      return { modele: scene(obj(), n), faces: nombres.map(chiffre), bon: nombres.indexOf(n) };
    };
  });
}

/* ---------- QUANTITÉS : même nombre en doigts, en chiffre ou en dé ---------- */
// Un modèle (doigts, chiffre ou dé) ; on retrouve, parmi 3 cartes d'une autre forme, la même quantité.
// Le dé s'arrête à 6, doigts et chiffres vont jusqu'au maximum réglé.

const FORMES = { doigts, chiffre, de };

export function exoQuantites(root, retour) {
  jeu(root, retour, () => exoQuantites(root, retour), max => {
    const n_ = tireur(1, max);
    return () => {
      const n = n_();
      const formes = ['doigts', 'chiffre'].concat(n <= 6 ? ['de'] : []);
      const modele = pick(formes);
      const reponse = pick(formes.filter(f => f !== modele));
      const limite = reponse === 'de' ? Math.min(6, max) : max;
      const nombres = shuffle([n, ...distracteurs(n, 1, limite)]);
      return { modele: FORMES[modele](n), faces: nombres.map(v => FORMES[reponse](v)), bon: nombres.indexOf(n) };
    };
  });
}

/* ---------- CALCULER : une opération écrite en chiffres, choisir le résultat ---------- */
// Opérations proposées : réglage "operations" (+ et −). Résultat entre 0 et le maximum réglé, jamais négatif.
// Pour ajouter × ou ÷ plus tard : une entrée dans OPERATIONS et une case dans les réglages.

const OPERATIONS = {
  '+': max => { const a = alea(max) + 1; const b = 1 + alea(max - a + 1); return a + b <= max ? [a, b, a + b] : null; },
  '-': max => { const a = 1 + alea(max); const b = 1 + alea(a); return [a, b, a - b]; }
};
const SIGNE = { '+': '+', '-': '−' };

function operation(a, op, b) {
  const c = el('div', 'operation');
  c.append(el('span', null, `${a} ${SIGNE[op]} ${b} =`), el('span', 'num trou', '?'));
  return c;
}

export function exoCalculer(root, retour) {
  jeu(root, retour, () => exoCalculer(root, retour), max => {
    const ops = (get().operations || []).filter(o => OPERATIONS[o]);
    const choix = ops.length ? ops : ['+'];
    let der = '';
    return () => {
      let op, r, cle, essais = 0;
      do {
        op = pick(choix);
        r = OPERATIONS[op](max);
        cle = r && r[0] + op + r[1];
      } while ((!r || (cle === der && essais < 30)) && essais++ < 60);
      der = cle;
      const [a, b, res] = r;
      const nombres = shuffle([res, ...distracteurs(res, 0, max, new Set([a, b]))]);
      return { modele: operation(a, op, b), faces: nombres.map(chiffre), bon: nombres.indexOf(res) };
    };
  });
}

/* ---------- COMPLÉTER : combien manque-t-il pour remplir le cadre (jusqu'à 3, 5 ou 10) ? ---------- */

function cadreDix(objet, a, total) {
  const d = el('div', 'dix');
  for (let i = 0; i < total; i++) d.append(el('span', 'case', i < a ? objet : ''));
  return d;
}

export function exoCompleter(root, retour) {
  jeu(root, retour, () => exoCompleter(root, retour), max => {
    const a_ = tireur(1, max - 1);
    const obj = tireurObjets();
    return () => {
      const a = a_();
      const manque = max - a;
      const nombres = shuffle([manque, ...distracteurs(manque, 0, max)]);
      return { modele: cadreDix(obj(), a, max), faces: nombres.map(chiffre), bon: nombres.indexOf(manque) };
    };
  });
}

/* ---------- COMPARER : le plus, le moins, ou autant ---------- */
// Réglages : "comparer" = 'objets' | 'nombres' | 'mixte' ; "autant" = propose aussi « autant ».
// LE PLUS / LE MOINS : deux cartes (objets ou chiffres).
// AUTANT : un modèle d'objets et trois cartes d'un autre objet ; trouver celle qui en a autant (il faut compter).

export function exoComparer(root, retour) {
  jeu(root, retour, () => exoComparer(root, retour), max => {
    const obj = tireurObjets();
    const st = get();
    return () => {
      const nombres = st.comparer === 'nombres' || (st.comparer === 'mixte' && Math.random() < 0.5);
      if (st.autant && !nombres && max >= 3 && Math.random() < 0.34) {
        const n = 1 + alea(max);
        const o = obj();
        const cartesObj = obj();
        const vals = shuffle([n, ...distracteurs(n, 1, max)]);
        const modele = el('div', 'comparaison');
        modele.append(el('span', 'consigne', '= AUTANT'), scene(o, n, { petit: true }));
        return { modele, faces: vals.map(v => scene(cartesObj, v, { petit: true })), bon: vals.indexOf(n) };
      }
      const x = 1 + alea(max);
      let y;
      do { y = 1 + alea(max); } while (y === x);
      const plus = Math.random() < 0.5;
      const consigne = el('span', 'consigne', plus ? '▲ LE PLUS' : '▼ LE MOINS');
      const o = obj();
      const gauche = Math.random() < 0.5 ? [x, y] : [y, x];
      const bon = plus ? (gauche[0] > gauche[1] ? 0 : 1) : (gauche[0] < gauche[1] ? 0 : 1);
      const face = nombres ? chiffre : n => scene(o, n, { petit: true });
      return { modele: consigne, faces: gauche.map(face), bon };
    };
  });
}

/* ---------- SUITES : quel nombre manque dans la suite ? ---------- */

export function exoSuite(root, retour) {
  jeu(root, retour, () => exoSuite(root, retour), max => {
    const L = max >= 10 ? 5 : max >= 5 ? 4 : 3;
    return () => {
      const debut = 1 + alea(max - L + 1);
      const seq = Array.from({ length: L }, (_, i) => debut + i);
      if (max >= 5 && Math.random() < 0.3) seq.reverse();
      const trou = alea(L);
      const manquant = seq[trou];
      const modele = el('div', 'suite');
      seq.forEach((v, i) => modele.append(el('span', 'num' + (i === trou ? ' trou' : ''), i === trou ? '?' : String(v))));
      const nombres = shuffle([manquant, ...distracteurs(manquant, 1, max, new Set(seq))]);
      return { modele, faces: nombres.map(chiffre), bon: nombres.indexOf(manquant) };
    };
  });
}
