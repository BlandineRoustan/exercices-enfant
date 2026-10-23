import { DATA, jeu, noterScore } from './store.js';

export const el = (tag, classe, texte) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texte != null) e.textContent = texte;
  return e;
};

export const pick = a => a[Math.floor(Math.random() * a.length)];

export const shuffle = a => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export const attendre = ms => new Promise(r => setTimeout(r, ms));

// Nombre d'items d'une session (réglé dans data/mots.json > parametres.session.items)
export const nbItems = () =>
  (DATA && DATA.parametres && DATA.parametres.session && DATA.parametres.session.items) || 10;

// Tente de verrouiller l'orientation (ne marche que si le navigateur l'autorise, par ex. appli installée).
export function orienter(mode) {
  try {
    const o = screen.orientation;
    if (!o) return;
    if (mode) o.lock(mode).catch(() => {}); else o.unlock();
  } catch (e) { /* non supporté */ }
}

const OK = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#2E9E4F"/><path d="M26 52 L43 69 L75 32" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const KO = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#D32F2F"/><path d="M33 33 L67 67 M67 33 L33 67" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/></svg>';
export const MAISON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>';
export const ROUE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>';

// Gros bouton rond : coche verte (oui) ou croix rouge (non)
export function rond(ok) {
  const b = el('button', 'rond ' + (ok ? 'oui' : 'non'));
  b.innerHTML = ok ? OK : KO;
  b.setAttribute('aria-label', ok ? 'oui' : 'non');
  return b;
}

// Confirmation visuelle plein écran, sans son
export async function retourVisuel(bon) {
  const o = el('div', 'fb');
  o.innerHTML = bon ? OK : KO;
  document.body.append(o);
  await attendre(bon ? 800 : 900);
  o.remove();
}

// Écran avec bouton retour (maison). "vivant()" devient faux dès qu'on quitte l'écran,
// ce qui évite qu'une attente en cours ne réaffiche un exercice par-dessus le menu.
// "points(n)" affiche la progression de la session (n items faits).
export function cadre(root, retour) {
  orienter(null);
  const id = String(Math.random());
  root.dataset.session = id;
  root.replaceChildren();
  const barre = el('div', 'barre');
  const b = el('button', 'retour');
  b.innerHTML = MAISON;
  b.setAttribute('aria-label', 'Retour');
  b.onclick = () => retour();
  barre.append(b);
  const zone = el('div', 'zone');
  root.append(barre, zone);
  let pts = null;
  const points = n => {
    if (!pts) {
      pts = el('div', 'points');
      for (let i = 0; i < nbItems(); i++) pts.append(el('span', 'pt'));
      barre.append(pts);
    }
    [...pts.children].forEach((d, i) => d.classList.toggle('fait', i < n));
  };
  return { zone, vivant: () => root.dataset.session === id, points };
}

export function message(S, texte) {
  S.zone.replaceChildren(el('p', 'info', texte));
}

// Session de nbItems() questions : renvoie la fonction à appeler après chaque réponse.
export function suite(S, retour, relancer, suivant) {
  let n = 0;
  let bons = 0;
  S.points(0);
  return bon => {
    n++;
    if (bon) bons++;
    S.points(n);
    if (n >= nbItems()) return fin(S, retour, bons, relancer);
    suivant();
  };
}

// Fin de session : pas de récompense, juste un récapitulatif pour l'adulte
export function fin(S, retour, bons, relancer) {
  if (jeu()) noterScore(jeu(), bons, nbItems());
  S.zone.replaceChildren();
  const duo = el('div', 'duo');
  const a = el('button', 'gros', 'Rejouer');
  const m = el('button', 'gros', 'Menu');
  a.onclick = relancer;
  m.onclick = retour;
  duo.append(a, m);
  S.zone.append(
    el('p', 'fin-titre', 'Session terminée'),
    el('p', 'fin-score', `${bons} réussi${bons > 1 ? 's' : ''} sur ${nbItems()}`),
    duo
  );
}

// Après une erreur : la bonne réponse est entourée et c'est l'enfant qui la touche pour passer à la suite.
// "boutons" = tous les boutons de la question ; seul "bonBtn" reste actif.
export function montrerBonne(boutons, bonBtn, suite) {
  boutons.forEach(b => { b.onclick = null; });
  bonBtn.classList.add('bonne');
  bonBtn.onclick = () => { bonBtn.onclick = null; suite(); };
}

// Un modèle (nœud DOM) et plusieurs cartes à toucher ; "bon" = indice de la bonne carte.
// Erreur : avec 3 cartes ou plus, la carte fausse est grisée et l'enfant choisit à nouveau ;
// avec 2 cartes, la bonne est entourée et l'enfant la touche. Le score garde la première réponse.
// "empile" : cartes l'une sous l'autre, pleine largeur (pour une rangée de symboles qui doit rester sur une ligne).
export function cartes(S, modele, faces, bon, fini, { empile = false } = {}) {
  S.zone.replaceChildren();
  const m = el('div', 'modele');
  m.append(modele);
  const rang = el('div', 'choix' + (empile ? ' empile' : ''));
  let ferme = false;
  let premier = null; // résultat de la première réponse
  const btns = faces.map((f, i) => {
    const b = el('button', 'carte');
    const p = el('div', 'photo face');
    p.append(f);
    b.append(p);
    b.onclick = async () => {
      if (ferme || b.classList.contains('ecartee')) return;
      ferme = true;
      const ok = i === bon;
      if (premier === null) premier = ok;
      await retourVisuel(ok);
      if (!S.vivant()) return;
      if (ok) return fini(premier);
      if (faces.length >= 3) {
        b.classList.add('ecartee');
        ferme = false;
      } else {
        montrerBonne(btns, btns[bon], () => fini(premier));
      }
    };
    rang.append(b);
    return b;
  });
  S.zone.append(m, rang);
}
