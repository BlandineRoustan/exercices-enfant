import { DATA, get, set, reinitialiser } from './store.js';
import { nbImages } from './images.js';
import { sonsEl } from './render.js';
import { el, cadre } from './ui.js';

// Boutons à choix unique
function groupe(z, options, valeur, cb) {
  const l = el('div', 'ligne');
  for (const [v, txt] of options) {
    const b = el('button', 'opt' + (v === valeur ? ' on' : ''), txt);
    b.onclick = () => {
      cb(v);
      [...l.children].forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    };
    l.append(b);
  }
  z.append(l);
}

export function reglages(root, accueil) {
  const S = cadre(root, accueil);
  const z = S.zone;
  z.classList.add('defile');
  const st = get();

  /* Sons maîtrisés */
  z.append(el('h2', null, 'Sons maîtrisés'));
  z.append(el('p', 'petit', "Touche pour cocher. Les exercices n'utilisent que ces sons."));
  const M = new Set(st.maitrises);
  const sauver = () => set({ maitrises: [...M] });
  const puces = [];
  const groupes = [
    ['Voyelles', s => s.type === 'voyelle'],
    ['Consonnes', s => s.type === 'consonne'],
    ['Digrammes et trigrammes', s => s.type === 'digramme' || s.type === 'trigramme']
  ];
  for (const [nom, f] of groupes) {
    z.append(el('h3', null, nom));
    const ligne = el('div', 'ligne');
    for (const s of DATA.sons.filter(f)) {
      const b = el('button', 'puce' + (M.has(s.id) ? ' on' : ''));
      b.append(sonsEl([s]), el('small', null, '/' + s.son + '/'));
      b.onclick = () => {
        if (M.has(s.id)) M.delete(s.id); else M.add(s.id);
        b.classList.toggle('on', M.has(s.id));
        sauver();
      };
      puces.push([s, b]);
      ligne.append(b);
    }
    z.append(ligne);
  }
  const lot = el('div', 'ligne');
  const tout = el('button', 'opt', 'Tout cocher');
  const rien = el('button', 'opt', 'Tout décocher');
  tout.onclick = () => { DATA.sons.forEach(s => M.add(s.id)); puces.forEach(([s, b]) => b.classList.add('on')); sauver(); };
  rien.onclick = () => { M.clear(); puces.forEach(([s, b]) => b.classList.remove('on')); sauver(); };
  lot.append(tout, rien);
  z.append(lot);

  /* Sons */
  z.append(el('h2', null, 'Exercice des sons'));
  groupe(z, [['ouinon', "J'entends / je n'entends pas"], ['choix3', 'Choisir parmi 3 images']],
    st.modeSons, v => set({ modeSons: v }));

  /* Syllabes */
  z.append(el('h2', null, 'Exercice des syllabes'));
  groupe(z, [['lecture', "Lecture (le parent valide)"], ['image', 'Syllabe dans un mot illustré']],
    st.modeSyllabes, v => set({ modeSyllabes: v }));
  z.append(el('p', 'petit', 'Formes de syllabes (au moins une) :'));
  const lp = el('div', 'ligne');
  const pats = new Set(st.patrons);
  for (const p of ['CV', 'VC', 'CVC']) {
    const b = el('button', 'opt' + (pats.has(p) ? ' on' : ''), p);
    b.onclick = () => {
      if (pats.has(p)) { if (pats.size === 1) return; pats.delete(p); } else pats.add(p);
      b.classList.toggle('on', pats.has(p));
      set({ patrons: [...pats] });
    };
    lp.append(b);
  }
  z.append(lp);

  /* Mots */
  z.append(el('h2', null, 'Exercice des mots'));
  z.append(el('p', 'petit', 'Retour visuel (coche / croix) :'));
  groupe(z, [[true, 'Oui'], [false, 'Non']], st.confirmMots, v => set({ confirmMots: v }));
  z.append(el('p', 'petit', 'Nombre de syllabes :'));
  groupe(z, [[0, 'Tous'], [1, '1'], [2, '2'], [3, '3']], st.filtreSyl, v => set({ filtreSyl: v }));
  z.append(el('p', 'petit', 'Mots contenant la graphie :'));
  const grs = [['', 'Toutes']].concat(
    DATA.sons.filter(s => s.type === 'digramme' || s.type === 'trigramme').map(s => [s.id, s.texte]));
  groupe(z, grs, st.filtreGraphie, v => set({ filtreGraphie: v }));

  /* Infos */
  z.append(el('h2', null, 'Images'));
  z.append(el('p', 'petit',
    `${nbImages()} image(s) trouvée(s) sur ${DATA.mots.length} mots. Un mot sans image utilise son emoji, ou n'est pas proposé s'il n'en a pas.`));

  const reset = el('button', 'opt danger', 'Tout réinitialiser');
  reset.onclick = () => {
    if (confirm('Effacer les réglages et les sons maîtrisés ?')) { reinitialiser(); reglages(root, accueil); }
  };
  const ligneReset = el('div', 'ligne');
  ligneReset.append(reset);
  z.append(ligneReset);
}
