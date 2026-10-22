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

// Écran avec bouton accueil. "vivant()" devient faux dès qu'on quitte l'écran,
// ce qui évite qu'une attente en cours ne réaffiche un exercice par-dessus l'accueil.
export function cadre(root, accueil) {
  const id = String(Math.random());
  root.dataset.session = id;
  root.replaceChildren();
  const barre = el('div', 'barre');
  const b = el('button', 'retour');
  b.innerHTML = MAISON;
  b.setAttribute('aria-label', 'Accueil');
  b.onclick = () => accueil();
  barre.append(b);
  const zone = el('div', 'zone');
  root.append(barre, zone);
  return { zone, vivant: () => root.dataset.session === id };
}

export function message(S, texte) {
  S.zone.replaceChildren(el('p', 'info', texte));
}
