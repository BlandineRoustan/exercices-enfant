import { chargerDonnees, DATA, profils, profil, choisirProfil, choisirJeu } from './store.js';
import { resoudre } from './images.js';
import { exoSons, exoSyllabes, exoMots } from './exercices.js';
import { exoCompter, exoQuantites, exoCalculer, exoCompleter, exoComparer, exoSuite } from './maths.js';
import { exoMotif, exoContinuer, exoChemin } from './logique.js';
import { reglages } from './reglages.js';
import { el, orienter, ROUE } from './ui.js';

const root = document.getElementById('app');

// Pour ajouter un thème ou un jeu : une ligne ici.
const THEMES = [
  { titre: 'LECTURE', jeux: [['SONS', exoSons], ['SYLLABES', exoSyllabes], ['MOTS', exoMots]] },
  { titre: 'MATHS', jeux: [['COMPTER', exoCompter], ['QUANTITÉS', exoQuantites], ['CALCULER', exoCalculer],
    ['COMPLÉTER', exoCompleter], ['COMPARER', exoComparer], ['SUITES', exoSuite]] },
  { titre: 'LOGIQUE', jeux: [['MOTIFS', exoMotif], ['CONTINUER', exoContinuer], ['CHEMIN', exoChemin]] }
];

// « Qui joue ? » : un gros bouton par profil (affiché au lancement s'il y a plusieurs enfants)
function quiJoue() {
  orienter(null);
  root.dataset.session = '0';
  root.replaceChildren();
  const page = el('div', 'accueil qui');
  page.append(el('h2', 'theme', 'QUI JOUE ?'));
  const liste = el('div', 'jeux');
  for (const p of profils()) {
    const b = el('button', 'jeu prenom', p.nom);
    b.onclick = () => { choisirProfil(p.id); accueil(); };
    liste.append(b);
  }
  page.append(liste);
  root.append(page);
}

// Une seule page : chaque thème est un titre suivi de ses jeux (retour à la ligne si besoin)
function accueil() {
  orienter(null);
  root.dataset.session = '0'; // invalide tout exercice en cours
  choisirJeu('');
  root.replaceChildren();
  const page = el('div', 'accueil');

  const themes = el('div', 'themes');
  if (profils().length > 1) {
    const qui = el('button', 'qui-joue', profil().nom);
    qui.setAttribute('aria-label', 'Changer de profil');
    qui.onclick = quiJoue;
    themes.append(qui);
  }
  for (const t of THEMES) {
    const jeux = el('div', 'jeux');
    for (const [titre, f] of t.jeux) {
      const b = el('button', 'jeu', titre);
      b.onclick = () => { choisirJeu(titre); f(root, accueil); };
      jeux.append(b);
    }
    themes.append(el('h2', 'theme', t.titre), jeux);
  }

  const roue = el('button', 'roue');
  roue.innerHTML = ROUE;
  roue.setAttribute('aria-label', 'Réglages');
  roue.onclick = () => reglages(root, accueil);

  const pied = el('div', 'pied');
  pied.append(roue, el('div', 'attrib', DATA.attribution || ''));
  page.append(themes, pied);
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
  if (profils().length > 1) quiJoue(); else accueil();
  if ('serviceWorker' in navigator) {
    // Nouvelle version installée : on recharge, sauf pendant un exercice (elle sera prise au retour à l'accueil)
    const avait = !!navigator.serviceWorker.controller;
    let attente = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!avait || attente) return;
      attente = true;
      const recharger = () => (root.dataset.session === '0' ? location.reload() : setTimeout(recharger, 2000));
      recharger();
    });
    navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {});
  }
})();
