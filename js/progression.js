import { profil, effacerScores } from './store.js';
import { el, cadre } from './ui.js';

const DERNIERES = 30; // sessions affichées par jeu

const jour = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

// Une barre par session (la plus récente à droite), hauteur = part de réussites
function barres(sessions) {
  const n = sessions.length;
  const W = 300;
  const H = 70;
  const pas = W / DERNIERES;
  let s = `<svg viewBox="0 0 ${W} ${H + 2}" class="graphe" role="img" aria-label="Réussites des dernières sessions">`;
  s += `<line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" class="mi"/>`;
  sessions.forEach((x, i) => {
    const h = Math.max(2, (x.bons / x.total) * H);
    const xx = W - (n - i) * pas;
    s += `<rect x="${xx + 1}" y="${H - h}" width="${pas - 2}" height="${h}" rx="2"><title>${jour(x.t)} : ${x.bons}/${x.total}</title></rect>`;
  });
  return s + '</svg>';
}

export function progression(root, retour) {
  const S = cadre(root, retour);
  const z = S.zone;
  z.classList.add('defile');
  const p = profil();
  z.append(el('h2', null, 'Progression : ' + p.nom));
  if (!p.scores.length) {
    z.append(el('p', 'petit', 'Aucune session terminée pour l\'instant. Chaque session jouée jusqu\'au bout est notée ici.'));
    return;
  }
  z.append(el('p', 'petit', `Une barre par session (la plus récente à droite), hauteur = réussites du premier coup. Trait : la moitié.`));

  const parJeu = new Map();
  for (const x of p.scores) {
    if (!parJeu.has(x.jeu)) parJeu.set(x.jeu, []);
    parJeu.get(x.jeu).push(x);
  }
  // jeux joués le plus récemment en premier
  const jeux = [...parJeu.entries()].sort((a, b) => b[1][b[1].length - 1].t - a[1][a[1].length - 1].t);
  for (const [nom, sessions] of jeux) {
    const recent = sessions.slice(-DERNIERES);
    const der = sessions[sessions.length - 1];
    const moy = recent.slice(-5).reduce((a, x) => a + x.bons / x.total, 0) / Math.min(5, recent.length);
    const bloc = el('div', 'stat');
    const tete = el('div', 'entete');
    tete.append(el('h3', null, nom), el('span', 'petit',
      `${sessions.length} session${sessions.length > 1 ? 's' : ''} · dernière le ${jour(der.t)} : ${der.bons}/${der.total} · moyenne des 5 dernières : ${Math.round(moy * 100)} %`));
    const g = el('div');
    g.innerHTML = barres(recent);
    bloc.append(tete, g);
    z.append(bloc);
  }

  const eff = el('button', 'opt danger', 'Effacer l\'historique de ce profil');
  eff.onclick = () => {
    if (confirm(`Effacer tout l'historique de ${p.nom} ?`)) { effacerScores(); progression(root, retour); }
  };
  const l = el('div', 'ligne');
  l.append(eff);
  z.append(l);
}
