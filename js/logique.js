import { get } from './store.js';
import { el, pick, shuffle, attendre, cadre, suite, cartes } from './ui.js';

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
    cartes(S, q.modele, q.faces, q.bon, apres, { empile: q.empile });
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
      bon: choix.indexOf(motif),
      empile: choix.some(c => c.length > 3) // au-delà de 3 formes, une carte par ligne pour rester sur une ligne
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

/* ---------- CHEMIN : guider un animal jusqu'à sa nourriture avec des flèches ---------- */
// Réglages : "cheminMode" = 'pas' (une flèche à la fois) | 'programme' (choisir la suite de flèches entière)
//            "cheminLong" = 'court' | 'moyen' | 'long' (taille de la carte et nombre de pas)

const DIRS = { haut: [0, -1], droite: [1, 0], bas: [0, 1], gauche: [-1, 0] };
const ORDRE = ['gauche', 'haut', 'bas', 'droite']; // ordre fixe des 4 flèches, pour se repérer
const ANGLE = { haut: 0, droite: 90, bas: 180, gauche: 270 };
const DUOS = [['🐰', '🥕'], ['🐭', '🧀'], ['🐶', '🦴'], ['🐝', '🌸'], ['🐒', '🍌'], ['🐿️', '🌰'], ['🐼', '🎋'], ['🐦', '🍒']];
const LONGUEURS = { court: [4, 2, 4], moyen: [5, 4, 7], long: [6, 7, 10] }; // taille, pas min, pas max

function fleche(d, petit) {
  const s = el('span', 'fleche' + (petit ? ' petite' : ''));
  s.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><path transform="rotate(${ANGLE[d]} 50 50)" d="M50 10 L84 48 H62 V90 H38 V48 H16 Z" fill="#2F6DB5" stroke="#1E4A80" stroke-width="4" stroke-linejoin="round"/></svg>`;
  s.setAttribute('aria-label', d);
  return s;
}

// Suite de flèches sur une ligne ; les flèches identiques qui se suivent sont groupées (espace plus large entre groupes)
function programme(dirs) {
  const r = el('div', 'programme');
  let g = null;
  dirs.forEach((d, i) => {
    if (i === 0 || d !== dirs[i - 1]) { g = el('span', 'groupe'); r.append(g); }
    g.append(fleche(d, true));
  });
  return r;
}

// Chemin sans croisement ni case collée à une autre partie du chemin (il reste lisible)
function nouveauChemin(n, L) {
  for (;;) {
    const cases = [[alea(n), alea(n)]];
    const dirs = [];
    const pris = new Set([cases[0].join()]);
    let bloque = false;
    while (dirs.length < L && !bloque) {
      const [x, y] = cases[cases.length - 1];
      const possibles = Object.keys(DIRS).filter(d => {
        const nx = x + DIRS[d][0];
        const ny = y + DIRS[d][1];
        if (nx < 0 || ny < 0 || nx >= n || ny >= n || pris.has(nx + ',' + ny)) return false;
        // aucune voisine déjà prise, sauf la case d'où l'on vient
        return Object.values(DIRS).every(([dx, dy]) => (nx + dx === x && ny + dy === y) || !pris.has((nx + dx) + ',' + (ny + dy)));
      });
      if (!possibles.length) { bloque = true; break; }
      const der = dirs[dirs.length - 1];
      const d = der && possibles.includes(der) && Math.random() < 0.5 ? der : pick(possibles); // des lignes droites de temps en temps
      cases.push([x + DIRS[d][0], y + DIRS[d][1]]);
      pris.add(cases[cases.length - 1].join());
      dirs.push(d);
    }
    if (!bloque) return { cases, dirs };
  }
}

function carte(n, chemin, pos, duo) {
  const g = el('div', 'grille');
  g.style.setProperty('--n', n);
  const surChemin = new Set(chemin.cases.map(c => c.join()));
  const fin = chemin.cases[chemin.cases.length - 1];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const c = el('span', 'cellule' + (surChemin.has(x + ',' + y) ? ' chemin' : ''));
      if (x === pos[0] && y === pos[1]) c.append(el('span', 'acteur', duo[0]));
      else if (x === fin[0] && y === fin[1]) c.append(el('span', 'acteur', duo[1]));
      g.append(c);
    }
  }
  return g;
}

// Le faux programme ne doit pas arriver au même endroit (sinon il serait juste aussi)
const arrivee = dirs => dirs.reduce(([x, y], d) => [x + DIRS[d][0], y + DIRS[d][1]], [0, 0]).join();
function fauxProgrammes(dirs) {
  const bonne = arrivee(dirs);
  const vus = new Set([dirs.join()]);
  const faux = [];
  for (let t = 0; t < 200 && faux.length < 2; t++) {
    const f = [...dirs];
    const i = alea(f.length);
    const r = Math.random();
    if (r < 0.5) f[i] = pick(Object.keys(DIRS).filter(d => d !== f[i])); // une flèche changée
    else if (r < 0.75 && f.length > 2) f.splice(i, 1);                    // une flèche oubliée
    else f.splice(i, 0, f[i]);                                            // une flèche en trop
    if (arrivee(f) === bonne || vus.has(f.join())) continue;
    vus.add(f.join());
    faux.push(f);
  }
  return faux;
}

export function exoChemin(root, retour) {
  const S = cadre(root, retour);
  const st = get();
  const [n, Lmin, Lmax] = LONGUEURS[st.cheminLong] || LONGUEURS.court;
  const apres = suite(S, retour, () => exoChemin(root, retour), () => suivant());
  let derDuo = null;

  // l'animal avance case par case jusqu'à la nourriture, puis question suivante
  // "plateau" : l'élément qui contient la carte
  const avancer = async (plateau, chemin, duo, depuis, ok) => {
    for (let i = depuis + 1; i < chemin.cases.length; i++) {
      await attendre(320);
      if (!S.vivant()) return;
      plateau.replaceChildren(carte(n, chemin, chemin.cases[i], duo));
    }
    await attendre(600);
    if (S.vivant()) apres(ok);
  };

  const suivant = () => {
    const chemin = nouveauChemin(n, Lmin + alea(Lmax - Lmin + 1));
    let duo;
    do { duo = pick(DUOS); } while (duo === derDuo);
    derDuo = duo;

    if (st.cheminMode === 'programme') {
      const choix = shuffle([chemin.dirs, ...fauxProgrammes(chemin.dirs)]);
      const bon = choix.indexOf(chemin.dirs);
      const plateau = el('div', 'plateau');
      plateau.append(carte(n, chemin, chemin.cases[0], duo));
      return cartes(S, plateau, choix.map(programme), bon, ok => avancer(plateau, chemin, duo, 0, ok), { empile: true });
    }

    // flèche par flèche : la session compte le chemin entier, réussi s'il n'y a eu aucune erreur
    let sansFaute = true;
    const pas = i => {
      const vue = el('div', 'etape');
      const plateau = el('div', 'plateau');
      plateau.append(carte(n, chemin, chemin.cases[i], duo));
      vue.append(plateau, programme(chemin.dirs.slice(0, i)));
      cartes(S, vue, ORDRE.map(d => fleche(d)), ORDRE.indexOf(chemin.dirs[i]), ok => {
        sansFaute = sansFaute && ok;
        if (i + 1 < chemin.dirs.length) return pas(i + 1);
        avancer(plateau, chemin, duo, i, sansFaute);
      });
    };
    pas(0);
  };
  suivant();
}
