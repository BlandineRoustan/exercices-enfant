import { DATA, get, maitrises, idDe } from './store.js';
import { visuel, photo } from './images.js';
import { sonsEl, motEl } from './render.js';
import { el, pick, shuffle, attendre, cadre, message, retourVisuel, rond } from './ui.js';

const AIDE = "Coche des sons dans les réglages (appui long sur la roue de l'accueil).";

/* ---------- Écrans communs ---------- */

// Une image + gros boutons ✔ / ✘ ("j'entends" / "je n'entends pas")
function ouiNon(S, cible, mot, oui, fini) {
  S.zone.replaceChildren();
  const c = el('div', 'cible');
  c.append(cible);
  const bo = rond(true);
  const bn = rond(false);
  const duo = el('div', 'duo');
  duo.append(bo, bn);
  S.zone.append(c, photo(mot), duo);
  let ferme = false;
  const rep = async r => {
    if (ferme) return;
    ferme = true;
    const bon = r === oui;
    await retourVisuel(bon);
    if (!S.vivant()) return;
    if (!bon) {
      (oui ? bo : bn).classList.add('bonne'); // on montre la bonne réponse
      await attendre(1400);
    }
    if (S.vivant()) fini(bon);
  };
  bo.onclick = () => rep(true);
  bn.onclick = () => rep(false);
}

// Plusieurs images à toucher. multi = plusieurs bonnes réponses possibles (bouton de validation).
function selection(S, cible, cartes, estBon, fini, multi, confirmer = true) {
  S.zone.replaceChildren();
  const c = el('div', 'cible');
  c.append(cible);
  const rang = el('div', 'choix');
  const choisis = new Set();
  let ferme = false;

  const btns = cartes.map(m => {
    const b = el('button', 'carte');
    b.append(photo(m));
    b.onclick = () => {
      if (ferme) return;
      if (!multi) return repondre(new Set([m]));
      if (choisis.has(m)) choisis.delete(m); else choisis.add(m);
      b.classList.toggle('sel', choisis.has(m));
    };
    rang.append(b);
    return b;
  });
  S.zone.append(c, rang);
  if (multi) {
    const v = rond(true);
    v.classList.add('valider');
    v.onclick = () => { if (choisis.size) repondre(choisis); };
    S.zone.append(v);
  }

  async function repondre(ch) {
    if (ferme) return;
    ferme = true;
    const bon = cartes.every(m => ch.has(m) === estBon(m));
    if (confirmer) {
      await retourVisuel(bon);
      if (!S.vivant()) return;
      if (!bon) {
        btns.forEach((b, i) => { if (estBon(cartes[i])) b.classList.add('bonne'); });
        await attendre(1400);
      }
    }
    if (S.vivant()) fini(bon);
  }
}

// Alterne oui/non sans enchaîner plus de deux fois la même réponse
function tireurOui() {
  let serie = 0;
  let der = true;
  return () => {
    let oui = Math.random() < 0.5;
    if (serie >= 2) oui = !der;
    serie = oui === der ? serie + 1 : 1;
    der = oui;
    return oui;
  };
}

/* ---------- Exercice : SONS ---------- */

export function exoSons(root, accueil) {
  const S = cadre(root, accueil);
  const M = maitrises();
  const cibles = DATA.sons.filter(s => M.has(s.id));
  const mots = DATA.mots.filter(visuel);
  const entend = (m, s) => m.graphemes.some(g => g[2] === s.son); // on compare les SONS, pas les lettres
  const jouables = cibles.filter(s =>
    mots.some(m => entend(m, s)) && mots.filter(m => !entend(m, s)).length >= 2);
  if (!jouables.length) return message(S, AIDE);

  const tirer = tireurOui();
  let dernier = null;
  let dernierMot = null;

  const suivant = () => {
    let s;
    do { s = pick(jouables); } while (jouables.length > 1 && s === dernier);
    dernier = s;
    if (get().modeSons === 'choix3') return choix3(s);
    const oui = tirer();
    const pool = mots.filter(m => entend(m, s) === oui);
    let m;
    do { m = pick(pool); } while (pool.length > 1 && m === dernierMot);
    dernierMot = m;
    ouiNon(S, sonsEl([s]), m, oui, suivant);
  };

  const choix3 = s => {
    const bons = mots.filter(m => entend(m, s));
    const mauvais = mots.filter(m => !entend(m, s));
    const nb = Math.min(bons.length, Math.random() < 0.5 ? 1 : 2);
    const sel = shuffle([...shuffle(bons).slice(0, nb), ...shuffle(mauvais).slice(0, 3 - nb)]);
    selection(S, sonsEl([s]), sel, m => entend(m, s), suivant, true);
  };

  suivant();
}

/* ---------- Exercice : SYLLABES ---------- */

export function exoSyllabes(root, accueil) {
  const S = cadre(root, accueil);
  const st = get();
  const M = maitrises();
  const sons = DATA.sons.filter(s => M.has(s.id));
  const C = sons.filter(s => s.classe === 'c' && s.id !== 's-z');
  const V = sons.filter(s => s.classe === 'v');
  const finales = C.filter(c => c.id !== 'j');
  const patrons = st.patrons.length ? st.patrons : ['CV'];
  if (!C.length || !V.length) return message(S, "Il faut au moins une consonne et une voyelle maîtrisées. " + AIDE);

  // "c" suivi de e, i, é se lirait /s/ : on évite
  const mal = (c, v) => c.id === 'c' && ['e', 'i', 'é'].includes(v.id);
  const genere = () => {
    for (let t = 0; t < 40; t++) {
      const p = pick(patrons);
      const c = pick(C);
      const v = pick(V);
      if (p === 'VC') return [v, pick(finales)];
      if (mal(c, v)) continue;
      return p === 'CV' ? [c, v] : [c, v, pick(finales)];
    }
    return [pick(C), pick(V)];
  };
  const cle = syl => syl.map(x => x.texte + '|' + x.son).join(',');

  if (st.modeSyllabes === 'image') return syllabeDansMot();
  return lecture();

  // Mode 1 : l'enfant lit la syllabe, le parent valide
  function lecture() {
    const file = []; // syllabes à revoir, qui reviennent après quelques essais
    let compte = 0;
    let derniere = '';
    const suivant = () => {
      let syl;
      if (file.length && ++compte >= 3) {
        compte = 0;
        syl = file.shift();
      } else {
        let n = 0;
        do { syl = genere(); } while (cle(syl) === derniere && n++ < 10);
      }
      derniere = cle(syl);
      S.zone.replaceChildren();
      const c = el('div', 'cible');
      c.append(sonsEl(syl));
      const bo = rond(true);
      const bn = rond(false);
      const duo = el('div', 'duo');
      duo.append(bo, bn);
      S.zone.append(c, duo, el('p', 'astuce', "L'enfant lit, le parent valide"));
      let ferme = false;
      const rep = async bon => {
        if (ferme) return;
        ferme = true;
        await retourVisuel(bon);
        if (!S.vivant()) return;
        if (!bon) file.push(syl);
        suivant();
      };
      bo.onclick = () => rep(true);
      bn.onclick = () => rep(false);
    };
    suivant();
  }

  // Mode 2 : "entends-tu cette syllabe dans le mot ?" (image + ✔ / ✘)
  function syllabeDansMot() {
    const mots = DATA.mots.filter(visuel);
    const syllabesDe = m => {
      const g = {};
      m.graphemes.forEach(x => { (g[x[3]] = g[x[3]] || []).push(x); });
      return Object.values(g).map(a => a.map(x => x[0] + '|' + x[2]).join(','));
    };
    const memo = new Map(mots.map(m => [m, syllabesDe(m)]));
    const tirer = tireurOui();
    let derniere = '';
    const suivant = () => {
      for (let t = 0; t < 80; t++) {
        const syl = genere();
        const k = cle(syl);
        if (k === derniere) continue;
        const avec = mots.filter(m => memo.get(m).includes(k));
        const sans = mots.filter(m => !memo.get(m).includes(k));
        if (!avec.length || !sans.length) continue;
        derniere = k;
        const oui = tirer();
        return ouiNon(S, sonsEl(syl), pick(oui ? avec : sans), oui, suivant);
      }
      message(S, "Aucune syllabe ne correspond à un mot illustré avec ces sons. Coche d'autres sons ou ajoute des images.");
    };
    suivant();
  }
}

/* ---------- Exercice : MOTS ---------- */

export function exoMots(root, accueil) {
  const S = cadre(root, accueil);
  const st = get();
  const M = maitrises();
  // Un mot est proposé si tous ses graphèmes non muets sont maîtrisés
  const dechiffrable = m => m.graphemes.every(([t, type, son]) => type === 'muette' || M.has(idDe(t, son)));
  const avecImage = DATA.mots.filter(visuel);
  const dispo = avecImage.filter(m =>
    dechiffrable(m) &&
    (!st.filtreSyl || m.nbSyllabes === st.filtreSyl) &&
    (!st.filtreGraphie || m.graphemes.some(g => idDe(g[0], g[2]) === st.filtreGraphie)));
  if (!dispo.length || avecImage.length < 3) {
    return message(S, "Aucun mot disponible avec ces réglages (sons maîtrisés, filtres ou images). " + AIDE);
  }

  let dernier = null;
  const suivant = () => {
    let m;
    do { m = pick(dispo); } while (dispo.length > 1 && m === dernier);
    dernier = m;
    const autres = shuffle(avecImage.filter(x => x !== m)).slice(0, 2);
    selection(S, motEl(m), shuffle([m, ...autres]), x => x === m, suivant, false, st.confirmMots);
  };
  suivant();
}
