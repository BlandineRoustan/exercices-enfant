import { DATA, slug } from './store.js';

// Image d'un mot : images/<mot sans accent>.webp (ou .jpg, .png).
// Sans image, on utilise l'emoji du mot (champ "emoji" du JSON) ; sans emoji non plus, le mot n'est pas utilisé dans les exercices.
const cache = new Map();
const EXT = ['webp', 'jpg', 'png'];

const charge = url => new Promise(ok => {
  const i = new Image();
  i.onload = () => ok(true);
  i.onerror = () => ok(false);
  i.src = url;
});

export async function resoudre() {
  await Promise.all(DATA.mots.filter(m => !cache.has(m.mot)).map(async m => {
    for (const e of EXT) {
      const u = `images/${slug(m.mot)}.${e}`;
      if (await charge(u)) { cache.set(m.mot, { src: u }); return; }
    }
    cache.set(m.mot, m.emoji ? { emoji: m.emoji } : null);
  }));
}

export const visuel = m => cache.get(m.mot) || null;
export const nbImages = () => [...cache.values()].filter(v => v && v.src).length;

export function photo(m) {
  const v = visuel(m);
  const d = document.createElement('div');
  d.className = 'photo';
  if (v && v.src) {
    const i = document.createElement('img');
    i.src = v.src; i.alt = ''; i.draggable = false;
    d.append(i);
  } else {
    const s = document.createElement('span');
    s.className = 'emoji';
    s.textContent = v ? v.emoji : '';
    d.append(s);
  }
  return d;
}
