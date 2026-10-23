const CLE = 'lecture.v1';

const defauts = {
  maitrises: [],          // ids des graphies maîtrisées (voir data/mots.json > sons)
  modeSons: 'ouinon',     // 'ouinon' | 'choix3'
  modeSyllabes: 'lecture',// 'lecture' | 'image'
  patrons: ['CV'],        // 'CV' | 'VC' | 'CVC'
  confirmMots: true,      // retour visuel sur l'exercice des mots
  filtreSyl: 0,           // 0 = tous, sinon nombre de syllabes
  filtreGraphie: '',      // '' = toutes, sinon id d'une graphie obligatoire dans le mot
  forcerPaysage: true,    // exercice des mots : tente de passer l'écran en paysage
  maxNombre: 10           // maths : nombres jusqu'à 3, 5 ou 10
};

const etat = JSON.parse(JSON.stringify(defauts));
try { Object.assign(etat, JSON.parse(localStorage.getItem(CLE) || '{}')); } catch (e) { /* stockage indisponible */ }

export const get = () => etat;

export function set(patch) {
  Object.assign(etat, patch);
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* ignoré */ }
}

export function reinitialiser() {
  Object.assign(etat, JSON.parse(JSON.stringify(defauts)));
  try { localStorage.removeItem(CLE); } catch (e) { /* ignoré */ }
}

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
