import { chargerDonnees, DATA } from './store.js';
import { resoudre } from './images.js';
import { exoSons, exoSyllabes, exoMots } from './exercices.js';
import { exoCompter, exoQuantites, exoAjouter, exoEnlever, exoCompleter, exoComparer, exoSuite } from './maths.js';
import { reglages } from './reglages.js';
import { el, cadre, orienter, ROUE } from './ui.js';

const root = document.getElementById('app');

// Pour ajouter un thème ou un jeu : une ligne ici.
const THEMES = [
  { titre: 'LECTURE', jeux: [['SONS', exoSons], ['SYLLABES', exoSyllabes], ['MOTS', exoMots]] },
  { titre: 'MATHS', jeux: [['COMPTER', exoCompter], ['QUANTITÉS', exoQuantites], ['AJOUTER', exoAjouter],
    ['ENLEVER', exoEnlever], ['COMPLÉTER', exoCompleter], ['COMPARER', exoComparer], ['SUITES', exoSuite]] }
];

// Menu d'un thème : la page défile s'il y a beaucoup de jeux
function menuTheme(theme) {
  const S = cadre(root, accueil);
  S.zone.classList.add('menu');
  for (const [titre, f] of theme.jeux) {
    const b = el('button', 'tuile', titre);
    b.onclick = () => f(root, () => menuTheme(theme));
    S.zone.append(b);
  }
}

function accueil() {
  orienter(null);
  root.dataset.session = '0'; // invalide tout exercice en cours
  root.replaceChildren();
  const page = el('div', 'accueil');

  const tuiles = el('div', 'tuiles');
  for (const t of THEMES) {
    const b = el('button', 'tuile', t.titre);
    b.onclick = () => menuTheme(t);
    tuiles.append(b);
  }

  const roue = el('button', 'roue');
  roue.innerHTML = ROUE;
  roue.setAttribute('aria-label', 'Réglages');
  roue.onclick = () => reglages(root, accueil);

  const pied = el('div', 'pied');
  pied.append(roue, el('div', 'attrib', DATA.attribution || ''));
  page.append(tuiles, pied);
  root.append(page);
}

(async () => {
  try {
    await chargerDonnees();
    await resoudre();
  } catch (e) {
    console.error(e);
    root.replaceChildren(el('p', 'info', 'Impossible de charger les données (data/mots.json).'));
    return;
  }
  accueil();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
