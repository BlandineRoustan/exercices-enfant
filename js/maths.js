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

// Une main avec k doigts levés (0 à 5) : index, majeur, annulaire, auriculaire, puis pouce
function main(k, miroir) {
  const PEAU = '#F1C69C';
  const TRAIT = '#A8744A';
  const doigts = [[22, 12], [40, 6], [58, 12], [76, 22]]; // x, y du haut quand le doigt est levé
  let s = `<g${miroir ? ' transform="translate(100 0) scale(-1 1)"' : ''} fill="${PEAU}" stroke="${TRAIT}" stroke-width="2.5" stroke-linejoin="round">`;
  doigts.forEach(([x, y], i) => {
    if (i < k && i < 4) s += `<rect x="${x - 7}" y="${y}" width="14" height="52" rx="7"/>`;
    else s += `<rect x="${x - 7}" y="44" width="14" height="14" rx="7"/>`;
  });
  s += '<rect x="14" y="48" width="72" height="46" rx="16"/>';
  // masque la ligne de jonction entre la paume et les doigts levés
  doigts.forEach(([x], i) => { if (i < k && i < 4) s += `<rect x="${x - 5.5}" y="46" width="11" height="6" fill="${PEAU}" stroke="none"/>`; });
  s += k >= 5
    ? '<rect x="2" y="46" width="14" height="38" rx="7" transform="rotate(-32 9 65)"/>'
    : '<ellipse cx="30" cy="68" rx="9" ry="7"/>';
  return s + '</g>';
}
function doigts(n) {
  const d = el('span', 'dessin');
  if (n <= 5) {
    d.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">${main(n, false)}</svg>`;
  } else {
    d.classList.add('double');
    d.innerHTML =
      `<svg viewBox="0 0 200 100" aria-hidden="true"><g>${main(5, true)}</g><g transform="translate(100 0)">${main(n - 5, false)}</g></svg>`;
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

/* ---------- AJOUTER : a objets + b objets, combien en tout ? ---------- */

function calcul(objet, a, b) {
  const c = el('div', 'calcul');
  c.append(scene(objet, a, { petit: true }), el('span', 'signe', '+'), scene(objet, b, { petit: true }));
  return c;
}

export function exoAjouter(root, retour) {
  jeu(root, retour, () => exoAjouter(root, retour), max => {
    const obj = tireurObjets();
    let der = '';
    return () => {
      let a, b;
      do { a = 1 + alea(max - 1); b = 1 + alea(max - 1); } while (a + b > max || (a + '+' + b === der && max > 3));
      der = a + '+' + b;
      const total = a + b;
      const nombres = shuffle([total, ...distracteurs(total, 1, max)]);
      return { modele: calcul(obj(), a, b), faces: nombres.map(chiffre), bon: nombres.indexOf(total) };
    };
  });
}

/* ---------- ENLEVER : a objets dont b barrés, combien reste-t-il ? (jamais négatif) ---------- */

export function exoEnlever(root, retour) {
  jeu(root, retour, () => exoEnlever(root, retour), max => {
    const obj = tireurObjets();
    let der = '';
    return () => {
      let a, b;
      do { a = 2 + alea(max - 1); b = 1 + alea(a); } while (a + '-' + b === der && max > 3);
      der = a + '-' + b;
      const reste = a - b; // 0 à a-1 : jamais négatif
      const nombres = shuffle([reste, ...distracteurs(reste, 0, max)]);
      return { modele: scene(obj(), a, { barres: b }), faces: nombres.map(chiffre), bon: nombres.indexOf(reste) };
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

/* ---------- COMPARER : où y en a-t-il le plus (ou le moins) ? ---------- */

export function exoComparer(root, retour) {
  jeu(root, retour, () => exoComparer(root, retour), max => {
    const obj = tireurObjets();
    return () => {
      const x = 1 + alea(max);
      let y;
      do { y = 1 + alea(max); } while (y === x);
      const plus = Math.random() < 0.5;
      const consigne = el('span', 'consigne', plus ? '▲ LE PLUS' : '▼ LE MOINS');
      const o = obj();
      const gauche = Math.random() < 0.5 ? [x, y] : [y, x];
      const bon = plus ? (gauche[0] > gauche[1] ? 0 : 1) : (gauche[0] < gauche[1] ? 0 : 1);
      return { modele: consigne, faces: gauche.map(n => scene(o, n, { petit: true })), bon };
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
