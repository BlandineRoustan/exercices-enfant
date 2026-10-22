import { chargerDonnees, DATA } from './store.js';
import { resoudre } from './images.js';
import { exoSons, exoSyllabes, exoMots } from './exercices.js';
import { reglages } from './reglages.js';
import { el, ROUE } from './ui.js';

const root = document.getElementById('app');

function accueil() {
  root.dataset.session = '0'; // invalide tout exercice en cours
  root.replaceChildren();
  const page = el('div', 'accueil');

  const tuiles = el('div', 'tuiles');
  for (const [titre, f] of [['SONS', exoSons], ['SYLLABES', exoSyllabes], ['MOTS', exoMots]]) {
    const b = el('button', 'tuile', titre);
    b.onclick = () => f(root, accueil);
    tuiles.append(b);
  }

  // Réglages réservés au parent : appui long (1 seconde) sur la roue
  const roue = el('button', 'roue');
  roue.innerHTML = ROUE;
  roue.setAttribute('aria-label', 'Réglages (appui long)');
  let t;
  const stop = () => { clearTimeout(t); roue.classList.remove('appui'); };
  roue.addEventListener('pointerdown', () => {
    roue.classList.add('appui');
    t = setTimeout(() => { stop(); reglages(root, accueil); }, 1000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => roue.addEventListener(e, stop));
  roue.addEventListener('contextmenu', e => e.preventDefault());

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
