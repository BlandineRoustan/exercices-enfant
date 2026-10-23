import { get } from './store.js';
import { el, pick, shuffle, cadre, suite, cartes } from './ui.js';

/* ---------- Dessins : formes de couleur (ni lettres ni chiffres) ---------- */
// Chaque symbole diffère par la forme ET la couleur, pour rester lisible par un enfant daltonien.

const SYMBOLES = [
  ['#E53935', '<circle cx="50" cy="50" r="40"/>'],                                              // rond rouge
  ['#1E88E5', '<rect x="12" y="12" width="76" height="76" rx="10"/>'],                          // carré bleu
  ['#FBC02D', '<path d="M50 8 L93 88 H7 Z" stroke-linejoin="round" stroke-width="8"/>'],       // triangle jaune
  ['#43A047', '<path d="M50 5 L61 37 H95 L68 57 L78 91 L50 71 L22 91 L32 57 L5 37 H39 Z"/>'],  // étoile verte
  ['#8E24AA', '<path d="M50 88 C10 60 4 34 22 20 C36 10 48 18 50 30 C52 18 64 10 78 20 C96 34 90 60 50 88 Z"/>'], // cœur violet
  ['#FB8C00', '<path d="M50 4 L94 50 L50 96 L6 50 Z"/>']                                        // losange orange
];

function symbole(i) {
  const [c, forme] = SYMBOLES[i];
  const s = el('span', 'symbole');
  s.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="${c}" stroke="${c}">${forme}</g></svg>`;
  return s;
}

function rangee(suiteSymboles, classe, trou) {
  const r = el('div', classe);
  suiteSymboles.forEach(i => r.append(symbole(i)));
  if (trou) r.append(el('span', 'symbole trou', '?'));
  return r;
}

/* ---------- Motifs ---------- */

const alea = n => Math.floor(Math.random() * n);

// Un motif ne doit pas être lui-même une répétition (ABAB = AB répété)
const primitif = m => {
  for (let p = 1; p < m.length; p++) {
    if (m.length % p === 0 && m.every((x, i) => x === m[i % p])) return false;
  }
  return true;
};
const egal = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// "b" décrit-il la même répétition que "a" ? (même motif décalé, ou motif répété)
const equivalent = (a, b) => {
  if (b.length % a.length) return false;
  for (let d = 0; d < a.length; d++) if (b.every((x, i) => x === a[(i + d) % a.length])) return true;
  return false;
};

// Motif de longueur 2 à motifMax, avec 2 à 4 symboles différents, en indices 0..k-1
function nouveauMotif() {
  const max = Math.max(2, Math.min(6, get().motifMax || 3));
  for (;;) {
    const L = 2 + alea(max - 1);
    const k = 2 + alea(Math.min(L, 4) - 1);
    const m = [0];
    for (let i = 1; i < L; i++) m.push(alea(k));
    if (new Set(m).size === k && primitif(m)) return m;
  }
}

// Les symboles réels du motif : k formes différentes tirées au hasard
const habiller = m => {
  const formes = shuffle(SYMBOLES.map((_, i) => i));
  return { motif: m.map(x => formes[x]), libres: formes.slice(new Set(m).size) };
};

// Assez de répétitions pour voir le motif revenir (au moins 2, environ 8 symboles)
const repetitions = L => Math.max(2, Math.ceil(8 / L));

function jeu(root, retour, relancer, fabrique) {
  const S = cadre(root, retour);
  const apres = suite(S, retour, relancer, () => suivant());
  let der = '';
  const suivant = () => {
    let q;
    let n = 0;
    do { q = fabrique(); } while (q.cle === der && n++ < 20);
    der = q.cle;
    cartes(S, q.modele, q.faces, q.bon, apres);
  };
  suivant();
}

/* ---------- MOTIFS : quel est le motif qui se répète ? ---------- */

export function exoMotif(root, retour) {
  jeu(root, retour, () => exoMotif(root, retour), () => {
    const { motif, libres } = habiller(nouveauMotif());
    const L = motif.length;
    const sequence = Array.from({ length: L * repetitions(L) }, (_, i) => motif[i % L]);
    // Faux motifs : trop court, trop long, ou un symbole changé (jamais une autre écriture du bon motif)
    const candidats = [sequence.slice(0, L + 1)];
    if (L >= 3) candidats.push(sequence.slice(0, L - 1));
    const utilises = [...new Set(motif)].concat(libres.slice(0, 1));
    for (let t = 0; t < 12; t++) {
      const f = [...motif];
      const i = alea(L);
      f[i] = pick(utilises.filter(x => x !== f[i]));
      candidats.push(f);
    }
    const faux = [];
    for (const c of shuffle(candidats)) {
      if (faux.length === 2) break;
      if (new Set(c).size < 2 || equivalent(motif, c) || equivalent(c, motif) || faux.some(f => egal(f, c))) continue;
      faux.push(c);
    }
    const choix = shuffle([motif, ...faux]);
    return {
      cle: motif.join(),
      modele: rangee(sequence, 'sequence'),
      faces: choix.map(c => rangee(c, 'motif n' + c.length)),
      bon: choix.indexOf(motif)
    };
  });
}

/* ---------- CONTINUER : quelle forme vient ensuite ? ---------- */

export function exoContinuer(root, retour) {
  jeu(root, retour, () => exoContinuer(root, retour), () => {
    const { motif, libres } = habiller(nouveauMotif());
    const L = motif.length;
    const n = L * repetitions(L) - 1 - alea(L); // on s'arrête n'importe où dans le motif, après au moins un tour et demi
    const sequence = Array.from({ length: n }, (_, i) => motif[i % L]);
    const reponse = motif[n % L];
    const autres = [...new Set(motif)].filter(x => x !== reponse).concat(libres);
    const choix = shuffle([reponse, ...autres.slice(0, 2)]); // en priorité des formes du motif (plus difficile)
    return {
      cle: motif.join() + '/' + n,
      modele: rangee(sequence, 'sequence', true),
      faces: choix.map(symbole),
      bon: choix.indexOf(reponse)
    };
  });
}
