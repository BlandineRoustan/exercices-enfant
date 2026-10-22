# Lecture : appli d'apprentissage de la lecture (usage personnel)

Appli web installable (PWA) : sons, syllabes, mots, avec code couleur. Aucun son, aucun compte, aucun frais. Fonctionne hors-ligne après la première ouverture.

## Publier gratuitement (GitHub Pages)

1. Crée un dépôt GitHub (public) et envoie-y tout le contenu de ce dossier (`index.html` à la racine).
2. Dépôt > Settings > Pages > Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Après une minute, l'appli est à `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.
4. Sur le téléphone, ouvre ce lien, puis « Ajouter à l'écran d'accueil » (Partager sur iPhone, menu ⋮ sur Android).

Mise à jour : modifie les fichiers du dépôt ; les changements apparaissent au 2e lancement de l'appli (ou augmente le numéro `V` dans `sw.js` pour forcer la mise à jour).

## Utilisation

- **Accueil** : trois grosses tuiles (Sons, Syllabes, Mots).
- **Réglages (parent)** : appui long d'une seconde sur la petite roue en bas à gauche. Coche les sons maîtrisés : tout en dépend.
  - Sons : « j'entends / je n'entends pas » (coche verte / croix rouge) ou choix parmi 3 images.
  - Syllabes : lecture validée par le parent, ou syllabe à retrouver dans un mot illustré. Formes CV, VC, CVC.
  - Mots : mot à associer à l'une des 3 images, filtres par nombre de syllabes ou graphie.
- Un mot n'est proposé que si tous ses sons non muets sont maîtrisés et s'il a une image (ou un emoji).

## Code couleur

- Sons et syllabes : voyelles rouges, consonnes bleues, digrammes et trigrammes verts.
- Mots : lettres muettes grises, digrammes et trigrammes verts, le reste noir.
- Deux digrammes consécutifs alternent entre deux nuances de vert.
- Les couleurs se changent dans `data/mots.json`, section `affichage`.

## Images

Dépose les images dans `images/`, nommées d'après le mot sans accent (`chat.webp`, `velo.webp`…). La liste complète est dans `images/LISTE.txt`. Format conseillé : WebP, environ 300 px. Sans image, l'emoji du mot (champ `emoji`) est utilisé.

Les pictogrammes ARASAAC sont sous licence CC BY-NC-SA (usage non commercial, attribution obligatoire). La mention figure en bas de l'accueil ; texte modifiable dans `data/mots.json` (champ `attribution`) si tu utilises une autre source.

## Ajouter des mots ou des sons

Tout est dans `data/mots.json` (format détaillé dans `_notes`). Chaque graphème d'un mot est `[texte, type, son, numéro de syllabe]` ; le couple texte + son doit exister dans la liste `sons`.

## Police

La police arrondie est celle du téléphone si elle existe. Pour une police identique partout, dépose un fichier `fonts/arrondie.woff2` (par exemple Nunito ou Quicksand, licence libre) : il sera pris automatiquement.

## Fichiers

```
index.html  manifest.json  sw.js
css/style.css
js/  app.js  store.js  images.js  render.js  ui.js  exercices.js  reglages.js
data/mots.json
icons/  images/  fonts/
```
