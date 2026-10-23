// Tout est stocké sur l'appareil (localStorage), rien ne part sur internet.
// Un profil par enfant : son prénom, ses réglages et l'historique de ses sessions.
const CLE = 'lecture.profils';
const ANCIENNE = 'lecture.v1'; // réglages d'avant les profils : repris dans le premier profil
const MAX_SCORES = 1000;       // sessions gardées par profil (les plus anciennes sont oubliées)

const defauts = {
  maitrises: [],          // ids des graphies maîtrisées (voir data/mots.json > sons)
  modeSons: 'ouinon',     // 'ouinon' | 'choix3'
  modeSyllabes: 'lecture',// 'lecture' | 'image'
  patrons: ['CV'],        // 'CV' | 'VC' | 'CVC'
  confirmMots: true,      // retour visuel sur l'exercice des mots
  filtreSyl: 0,           // 0 = tous, sinon nombre de syllabes
  filtreGraphie: '',      // '' = toutes, sinon id d'une graphie obligatoire dans le mot
  forcerPaysage: true,    // exercice des mots : tente de passer l'écran en paysage
  maxNombre: 10,          // maths : nombres jusqu'à 3, 5 ou 10
  operations: ['+', '-'], // maths, calculer : opérations proposées
  comparer: 'objets',     // maths, comparer : 'objets' | 'nombres' | 'mixte'
  autant: true,           // maths, comparer : propose aussi « autant »
  motifMax: 3             // logique : longueur maximale d'un motif (2 à 6)
};
const copie = o => JSON.parse(JSON.stringify(o));

let base = { actif: null, profils: [] }; // profil : { id, nom, reglages, scores: [{ t, jeu, bons, total }] }
try { base = JSON.parse(localStorage.getItem(CLE)) || base; } catch (e) { /* stockage indisponible */ }
if (!base.profils.length) {
  let anciens = {};
  try { anciens = JSON.parse(localStorage.getItem(ANCIENNE) || '{}'); } catch (e) { /* ignoré */ }
  base.profils.push({ id: 'p1', nom: 'ENFANT 1', reglages: anciens, scores: [] });
}
if (!base.profils.some(p => p.id === base.actif)) base.actif = base.profils[0].id;

const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(base)); } catch (e) { /* ignoré */ } };

let etat = null; // réglages du profil actif, complétés par les valeurs par défaut
const charger = () => {
  etat = Object.assign(copie(defauts), profil().reglages);
};

export const profils = () => base.profils;
export const profil = () => base.profils.find(p => p.id === base.actif);

export function choisirProfil(id) {
  base.actif = id;
  sauver();
  charger();
}

export function ajouterProfil(nom) {
  let n = base.profils.length + 1;
  while (base.profils.some(p => p.id === 'p' + n)) n++;
  const p = { id: 'p' + n, nom, reglages: {}, scores: [] };
  base.profils.push(p);
  choisirProfil(p.id);
  return p;
}

export function renommerProfil(nom) {
  profil().nom = nom;
  sauver();
}

export function supprimerProfil() {
  if (base.profils.length < 2) return;
  base.profils = base.profils.filter(p => p.id !== base.actif);
  choisirProfil(base.profils[0].id);
}

export const get = () => etat;

export function set(patch) {
  Object.assign(etat, patch);
  Object.assign(profil().reglages, patch);
  sauver();
}

export function reinitialiser() {
  profil().reglages = {};
  sauver();
  charger();
}

// Historique : une ligne par session terminée
export function noterScore(jeu, bons, total) {
  const s = profil().scores;
  s.push({ t: Date.now(), jeu, bons, total });
  if (s.length > MAX_SCORES) s.splice(0, s.length - MAX_SCORES);
  sauver();
}

export function effacerScores() {
  profil().scores = [];
  sauver();
}

// Jeu en cours (pour l'historique), fixé par le menu
let jeuEnCours = '';
export const jeu = () => jeuEnCours;
export const choisirJeu = nom => { jeuEnCours = nom; };

charger();

export let DATA = null;
const parCle = new Map();
const parId = new Map();

export async function chargerDonnees() {
  const r = await fetch('data/mots.json');
  DATA = await r.json();
  for (const s of DATA.sons) {
    parCle.set(s.texte + '|' + s.son, s.id);
    parId.set(s.id, s);
  }
}

export const idDe = (texte, son) => parCle.get(texte + '|' + son);
export const sonDe = id => parId.get(id);
export const maitrises = () => new Set(etat.maitrises);
export const slug = mot => mot.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
