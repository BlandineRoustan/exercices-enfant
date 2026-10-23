import fs from 'fs';
const st = setTimeout;
globalThis.setTimeout = (f, ms) => st(f, 0);

class El {
  constructor(tag) { this.tag = tag; this.children = []; this._cls = new Set(); this.dataset = {}; this.style = {}; this.attrs = {}; this.parent = null; this.textContent = ''; this.onclick = null; this._html = ''; }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._cls].join(' '); }
  get classList() { const s = this._cls; return { add: (...c) => c.forEach(x => s.add(x)), remove: (...c) => c.forEach(x => s.delete(x)), toggle: (c, f) => { const on = f === undefined ? !s.has(c) : f; if (on) s.add(c); else s.delete(c); return on; }, contains: c => s.has(c) }; }
  set innerHTML(v) { this._html = v; this.children = []; }
  get innerHTML() { return this._html; }
  append(...n) { for (const x of n) { const e = typeof x === 'string' ? Object.assign(new El('#text'), { textContent: x }) : x; e.parent = this; this.children.push(e); } }
  replaceChildren(...n) { this.children = []; this.append(...n); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener() {}
}
const body = new El('body');
const root = new El('div');
globalThis.document = { body, createElement: t => new El(t), getElementById: () => root };
globalThis.Image = class { set src(v) { st(() => this.onerror && this.onerror(), 0); } };
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } };
globalThis.screen = { orientation: { lock: async () => { lockCalls.push('lock'); }, unlock: () => { lockCalls.push('unlock'); } } };
globalThis.fetch = async () => ({ json: async () => JSON.parse(fs.readFileSync(new URL('../data/mots.json', import.meta.url), 'utf8')) });
const lockCalls = [];

const walk = (e, f) => { f(e); e.children.forEach(c => walk(c, f)); };
const find = (e, cls) => { const r = []; walk(e, x => { if (x._cls.has(cls)) r.push(x); }); return r; };
const pause = () => new Promise(r => st(r, 3));

const store = await import('../js/store.js');
await store.chargerDonnees();
const { resoudre, nbImages } = await import('../js/images.js');
await resoudre();
const ex = await import('../js/exercices.js');
const ma = await import('../js/maths.js');
const rg = await import('../js/reglages.js');

store.set({ maitrises: store.DATA.sons.map(s => s.id), patrons: ['CV', 'VC', 'CVC'] });

async function jouer(nom, lancer, cliquer) {
  body.children = [];
  let retours = 0;
  lancer(root, () => { retours++; });
  let items = 0, err = null;
  for (let i = 0; i < 60; i++) {
    await pause();
    if (find(root, 'fin-titre').length) break;
    try { const fait = await cliquer(); if (fait) items++; } catch (e) { err = e; break; }
    await pause(); await pause();
  }
  const fini = find(root, 'fin-titre').length > 0;
  const score = fini ? find(root, 'fin-score')[0].textContent : '-';
  const points = find(root, 'pt');
  console.log(nom.padEnd(34), 'items:', String(items).padStart(2), '| fin:', fini, '|', score, '| points faits:', points.filter(p => p._cls.has('fait')).length, '/', points.length, err ? '| ERREUR ' + err.stack : '');
}
const cliqueCarte = async () => { const c = find(root, 'carte'); if (!c.length) return false; await c[Math.floor(Math.random() * c.length)].onclick(); return true; };
const cliqueRond = async () => { const r = find(root, 'rond').filter(x => !x._cls.has('valider')); if (!r.length) return false; await r[Math.floor(Math.random() * 2)].onclick(); return true; };
const cliqueMulti = async () => {
  const c = find(root, 'carte'); if (!c.length) return false;
  c[0].onclick();
  const v = find(root, 'valider'); await v[0].onclick(); return true;
};

store.set({ modeSons: 'ouinon' });  await jouer('Sons (oui/non)', ex.exoSons, cliqueRond);
store.set({ modeSons: 'choix3' });  await jouer('Sons (choix 3)', ex.exoSons, cliqueMulti);
store.set({ modeSyllabes: 'lecture' }); await jouer('Syllabes (lecture)', ex.exoSyllabes, cliqueRond);
store.set({ modeSyllabes: 'image' });   await jouer('Syllabes (image)', ex.exoSyllabes, cliqueRond);
await jouer('Mots', ex.exoMots, cliqueCarte);
console.log('orientation lock/unlock appels :', lockCalls.join(','));
for (const max of [3, 5, 10]) {
  store.set({ maxNombre: max });
  await jouer(`Compter (max ${max})`, ma.exoCompter, cliqueCarte);
  await jouer(`Quantités (max ${max})`, ma.exoQuantites, cliqueCarte);
  await jouer(`Ajouter (max ${max})`, ma.exoAjouter, cliqueCarte);
  await jouer(`Enlever (max ${max})`, ma.exoEnlever, cliqueCarte);
  await jouer(`Compléter (max ${max})`, ma.exoCompleter, cliqueCarte);
  await jouer(`Comparer (max ${max})`, ma.exoComparer, cliqueCarte);
  await jouer(`Suites (max ${max})`, ma.exoSuite, cliqueCarte);
}
// réglages : rendu sans erreur
rg.reglages(root, () => {});
console.log('réglages : boutons', find(root, 'opt').length, '| puces', find(root, 'puce').length);

// vérifications des modèles de quantités : doigts/dé/chiffre cohérents
store.set({ maxNombre: 10 });
let anomalies = 0;
for (let k = 0; k < 300; k++) {
  body.children = [];
  ma.exoQuantites(root, () => {});
  await pause();
  const modele = find(root, 'modele')[0];
  const cartes = find(root, 'carte');
  if (cartes.length !== 3) anomalies++;
}
console.log('quantités : anomalies (≠ 3 cartes) :', anomalies);
