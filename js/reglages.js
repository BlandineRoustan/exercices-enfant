import { DATA, get, set, reinitialiser, profil, profils, choisirProfil, ajouterProfil, renommerProfil, supprimerProfil } from './store.js';
import { nbImages } from './images.js';
import { sonsEl } from './render.js';
import { progression } from './progression.js';
import { el, cadre } from './ui.js';

export const demanderNom = defaut => {
  const nom = (prompt('Prénom de l\'enfant :', defaut) || '').trim().toUpperCase();
  return nom.slice(0, 20);
};

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

  /* ---------- Profil : chaque enfant a ses réglages et son historique ---------- */
  const p = profil();
  z.append(el('h2', null, 'Profil : ' + p.nom));
  z.append(el('p', 'petit', 'Les réglages ci-dessous ne concernent que ce profil. Tout reste sur ce téléphone.'));
  const lp0 = el('div', 'ligne');
  const prog = el('button', 'opt gras', 'Progression');
  prog.onclick = () => progression(root, () => reglages(root, accueil));
  const ren = el('button', 'opt', 'Renommer');
  ren.onclick = () => {
    const nom = demanderNom(p.nom);
    if (nom) { renommerProfil(nom); reglages(root, accueil); }
  };
  const nouv = el('button', 'opt', 'Nouveau profil');
  nouv.onclick = () => {
    const nom = demanderNom('');
    if (nom) { ajouterProfil(nom); reglages(root, accueil); }
  };
  lp0.append(prog, ren, nouv);
  if (profils().length > 1) {
    const sup = el('button', 'opt danger', 'Supprimer ce profil');
    sup.onclick = () => {
      if (confirm(`Supprimer le profil ${p.nom}, ses réglages et son historique ?`)) { supprimerProfil(); reglages(root, accueil); }
    };
    lp0.append(sup);
  }
  z.append(lp0);
  if (profils().length > 1) {
    z.append(el('p', 'petit', 'Changer de profil :'));
    groupe(z, profils().map(x => [x.id, x.nom]), p.id, id => { choisirProfil(id); reglages(root, accueil); });
  }

  /* ---------- Lecture : graphies maîtrisées ---------- */
  z.append(el('h2', null, 'Sons maîtrisés'));
  z.append(el('p', 'petit', "Touche pour cocher. Les exercices de lecture n'utilisent que ces graphies."));
  const M = new Set(st.maitrises);
  const sauver = () => set({ maitrises: [...M] });
  const puces = []; // [graphie, bouton]
  const maj = () => puces.forEach(([s, b]) => b.classList.toggle('on', M.has(s.id)));

  // Un seul bouton : tout sélectionner, ou tout désélectionner si tout l'est déjà
  const basculer = liste => {
    const tous = liste.every(s => M.has(s.id));
    liste.forEach(s => { if (tous) M.delete(s.id); else M.add(s.id); });
    maj();
    sauver();
  };

  const haut = el('div', 'ligne');
  const toutBtn = el('button', 'opt gras', 'Tout (dé)sélectionner');
  toutBtn.onclick = () => basculer(DATA.sons);
  haut.append(toutBtn);
  for (const n of [1, 2, 3, 4]) {
    const b = el('button', 'opt', n === 1 ? 'Niveau 1' : 'Jusqu\'au niveau ' + n);
    b.onclick = () => {
      M.clear();
      DATA.sons.filter(s => s.niveau <= n).forEach(s => M.add(s.id));
      maj();
      sauver();
    };
    haut.append(b);
  }
  z.append(haut);

  const groupes = [
    ['Voyelles', s => s.type === 'voyelle'],
    ['Consonnes', s => s.type === 'consonne'],
    ['Digrammes, trigrammes et quadrigrammes', s => ['digramme', 'trigramme', 'quadrigramme'].includes(s.type)]
  ];
  for (const [nom, f] of groupes) {
    const liste = DATA.sons.filter(f);
    const entete = el('div', 'entete');
    const tg = el('button', 'opt petit-bouton', 'Tout (dé)sélectionner');
    tg.onclick = () => basculer(liste);
    entete.append(el('h3', null, nom), tg);
    z.append(entete);
    const ligne = el('div', 'ligne');
    for (const s of liste) {
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

  /* ---------- Lecture : exercices ---------- */
  z.append(el('h2', null, 'Exercice des sons'));
  groupe(z, [['ouinon', "J'entends / je n'entends pas"], ['choix3', 'Choisir parmi 3 images']],
    st.modeSons, v => set({ modeSons: v }));

  z.append(el('h2', null, 'Exercice des syllabes'));
  groupe(z, [['lecture', 'Lecture (le parent valide)'], ['image', 'Syllabe dans un mot illustré']],
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

  z.append(el('h2', null, 'Exercice des mots'));
  z.append(el('p', 'petit', 'Retour visuel (coche / croix) :'));
  groupe(z, [[true, 'Oui'], [false, 'Non']], st.confirmMots, v => set({ confirmMots: v }));
  z.append(el('p', 'petit', "Passer l'écran en paysage (si le téléphone l'autorise) :"));
  groupe(z, [[true, 'Oui'], [false, 'Non']], st.forcerPaysage, v => set({ forcerPaysage: v }));
  z.append(el('p', 'petit', 'Nombre de syllabes :'));
  groupe(z, [[0, 'Tous'], [1, '1'], [2, '2'], [3, '3']], st.filtreSyl, v => set({ filtreSyl: v }));
  z.append(el('p', 'petit', 'Mots contenant la graphie :'));
  const grs = [['', 'Toutes']].concat(
    DATA.sons.filter(s => ['digramme', 'trigramme', 'quadrigramme'].includes(s.type)).map(s => [s.id, s.texte + (s.id.includes('-') ? ' /' + s.son + '/' : '')]));
  groupe(z, grs, st.filtreGraphie, v => set({ filtreGraphie: v }));

  /* ---------- Maths ---------- */
  z.append(el('h2', null, 'Maths'));
  z.append(el('p', 'petit', 'Nombres jusqu\'à (le dé reste limité à 6) :'));
  groupe(z, [[3, '3'], [5, '5'], [10, '10']], st.maxNombre, v => set({ maxNombre: v }));
  z.append(el('p', 'petit', 'Calculer : opérations proposées (au moins une) :'));
  const lo = el('div', 'ligne');
  const ops = new Set(st.operations);
  for (const [o, txt] of [['+', '+ addition'], ['-', '− soustraction']]) {
    const b = el('button', 'opt' + (ops.has(o) ? ' on' : ''), txt);
    b.onclick = () => {
      if (ops.has(o)) { if (ops.size === 1) return; ops.delete(o); } else ops.add(o);
      b.classList.toggle('on', ops.has(o));
      set({ operations: [...ops] });
    };
    lo.append(b);
  }
  z.append(lo);
  z.append(el('p', 'petit', 'Comparer :'));
  groupe(z, [['objets', 'Objets'], ['nombres', 'Nombres'], ['mixte', 'Les deux']], st.comparer, v => set({ comparer: v }));
  z.append(el('p', 'petit', 'Comparer : proposer aussi « autant » (avec des objets) :'));
  groupe(z, [[true, 'Oui'], [false, 'Non']], st.autant, v => set({ autant: v }));

  /* ---------- Logique ---------- */
  z.append(el('h2', null, 'Logique'));
  z.append(el('p', 'petit', 'Motifs jusqu\'à (nombre de formes dans le motif) :'));
  groupe(z, [[2, '2'], [3, '3'], [4, '4'], [6, '6']], st.motifMax, v => set({ motifMax: v }));

  /* ---------- Infos ---------- */
  z.append(el('h2', null, 'Images'));
  z.append(el('p', 'petit',
    `${nbImages()} image(s) trouvée(s) sur ${DATA.mots.length} mots. Un mot sans image utilise son emoji, ou n'est pas proposé s'il n'en a pas.`));

  const reset = el('button', 'opt danger', 'Réinitialiser les réglages de ce profil');
  reset.onclick = () => {
    if (confirm('Effacer les réglages et les sons maîtrisés de ce profil ?')) { reinitialiser(); reglages(root, accueil); }
  };
  const ligneReset = el('div', 'ligne');
  ligneReset.append(reset);
  z.append(ligneReset);
}
