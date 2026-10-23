import { DATA } from './store.js';

// list = [{ t: texte, type: 'voyelle'|'consonne'|'digramme'|'trigramme'|'muette' }]
// palette = DATA.affichage.mots ou DATA.affichage.sons_et_syllabes
// Deux digrammes/trigrammes/quadrigrammes consécutifs alternent entre les deux nuances de vert.
function colorier(list, palette, classe) {
  const conteneur = document.createElement('span');
  conteneur.className = 'mot' + (classe ? ' ' + classe : '');
  let rang = 0;
  let precedentVert = false;
  for (const g of list) {
    const vert = g.type === 'digramme' || g.type === 'trigramme' || g.type === 'quadrigramme';
    rang = vert ? (precedentVert ? rang + 1 : 0) : 0;
    precedentVert = vert;
    const c = palette[g.type];
    const s = document.createElement('span');
    s.textContent = g.t;
    s.style.color = Array.isArray(c) ? c[rang % c.length] : (c || '#000');
    conteneur.append(s);
  }
  return conteneur;
}

// Mot complet : muettes en gris, digrammes/trigrammes en vert, le reste en noir
export const motEl = m =>
  colorier(m.graphemes.map(([t, type]) => ({ t, type })), DATA.affichage.mots, 'mots');

// Son ou syllabe : voyelles en rouge, consonnes en bleu, digrammes/trigrammes en vert
// list = entrées de DATA.sons ({ texte, type, ... })
export const sonsEl = list =>
  colorier(list.map(s => ({ t: s.texte, type: s.type })), DATA.affichage.sons_et_syllabes);
