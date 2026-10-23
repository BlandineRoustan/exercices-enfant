# Lecture : appli d'apprentissage de la lecture et des premiers nombres (usage personnel)

Appli web installable (PWA) : lecture (sons, syllabes, mots) et maths (compter, quantités, ajouter, enlever, compléter, comparer, suites). Aucun son, aucun compte, aucun frais. Fonctionne hors-ligne après la première ouverture.

## Publier gratuitement (GitHub Pages)

1. Crée un dépôt GitHub (public) et envoie-y tout le contenu de ce dossier (`index.html` à la racine).
2. Dépôt > Settings > Pages > Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Après une minute, l'appli est à `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.
4. Sur le téléphone, ouvre ce lien, puis « Ajouter à l'écran d'accueil ».

Mise à jour : remplace les fichiers modifiés dans le dépôt ; les changements apparaissent au 2e lancement de l'appli (ou augmente le numéro `V` dans `sw.js`).

## Utilisation

- **Accueil** : deux tuiles, Lecture et Maths. Chacune ouvre ses jeux (le menu défile s'il y en a beaucoup). Pour ajouter un thème ou un jeu : une ligne dans `THEMES`, fichier `js/app.js`.
- **Sessions** de 10 questions (réglable : `parametres.session.items` dans `data/mots.json`). Une petite barre de points montre l'avancement ; en fin de session, un récapitulatif pour l'adulte, sans récompense.
- **Réglages (adulte)** : touche la petite roue en bas à gauche de l'accueil.
  - Sons maîtrisés : bouton « Tout (dé)sélectionner » (global et par groupe), préréglages par niveau. Tout dépend de cette liste.
  - Sons : « j'entends / je n'entends pas » ou choix parmi 3 images.
  - Syllabes : lecture validée par le parent, ou syllabe à retrouver dans un mot illustré. Formes CV, VC, CVC.
  - Mots : mot à associer à l'une des 3 images ; filtres par nombre de syllabes ou graphie ; passage en paysage.
  - Maths : nombres jusqu'à 3, 5 ou 10.
- **Maths** (nombres jusqu'à 3, 5 ou 10 selon le réglage) :
  - Compter : une image avec N objets identiques, on choisit le bon chiffre parmi 3.
  - Quantités : un modèle (doigts, chiffre ou dé), on retrouve la même quantité sous une autre forme. Le dé s'arrête à 6.
  - Ajouter : deux groupes d'objets, combien en tout ?
  - Enlever : des objets dont certains sont barrés, combien reste-t-il ? Le résultat n'est jamais négatif (il peut être 0).
  - Compléter : un cadre à remplir (3, 5 ou 10 cases), combien manque-t-il ?
  - Comparer : où y en a-t-il le plus (ou le moins) ?
  - Suites : quel nombre manque dans la suite ?
  - Les objets varient (une trentaine), jamais le même dans les 4 derniers tirages.
- Un mot n'est proposé que si tous ses sons non muets sont maîtrisés et s'il a une image (ou un emoji). Seuls des mots réguliers sont dans la liste.

## Affichage

- Fond sombre ; mots, syllabes, sons et images sont posés sur des cartes claires (pas tout à fait blanches).
- Sons et syllabes : voyelles rouges, consonnes bleues, digrammes, trigrammes et quadrigrammes verts.
- Mots : lettres muettes grises, digrammes, trigrammes et quadrigrammes verts, le reste noir. Le e final est lisible (noir) après une consonne (lune), muet (gris) après une autre voyelle (fée). Consonnes doubles (pomme, ballon) : noir.
- Deux digrammes consécutifs alternent entre deux nuances de vert.
- Les couleurs se changent dans `data/mots.json`, section `affichage`.
- Exercice des mots : l'appli tente de passer en paysage (possible surtout quand elle est installée sur l'écran d'accueil). Sinon, tourne le téléphone toi-même : la mise en page s'adapte aux deux sens.

## Graphies particulières

- Quadrigrammes verts : *elle, ette, esse, erre, enne* (belle, chaussette, princesse, terre, antenne) et *ille* (fille /ij/ après consonne ; paille, grenouille /j/ après voyelle).
- Digrammes verts : *il* final (ail, soleil) et *et* final (poulet).
- « e » /ɛ/ avant *ille* (abeille, oreille).
- Mots irréguliers exclus pour l'instant (ville, mille, femme…).

## Images

Dépose les images dans `images/`, nommées d'après le mot sans accent (`chat.webp`, `velo.webp`…). `images/LISTE.txt` donne la liste complète ; les mots sans emoji de secours y sont en tête. Format conseillé : WebP, environ 300 px. Sans image, l'emoji du mot (champ `emoji`) est utilisé.

Les images d'un même « groupe » (champ `groupe` : fleur / rose / tulipe, hibou / oiseau / poule…) ne sont jamais proposées ensemble, pour éviter les réponses ambiguës.

Les pictogrammes ARASAAC sont sous licence CC BY-NC-SA (usage non commercial, attribution obligatoire). La mention figure en bas de l'accueil ; texte modifiable dans `data/mots.json` (champ `attribution`) si tu utilises une autre source.

## Reprendre le projet / ajouter des mots

- `docs/CONTEXTE.md` : but, décisions de conception, architecture, comment vérifier avant de livrer.
- `docs/CODAGE-DES-MOTS.md` : règles de codage des mots et des graphies, notation, procédure d'ajout.
- Les mots et graphies se modifient dans `tools/generer_mots.py` (source de vérité), puis :
  `python3 tools/generer_mots.py`, `python3 tools/verifier_mots.py`, `node tools/test-simulation.mjs`.
  Ne modifie pas `data/mots.json` à la main : il est généré.

## Police

La police arrondie est celle du téléphone si elle existe. Pour une police identique partout, dépose un fichier `fonts/arrondie.woff2` (par exemple Nunito ou Quicksand, licence libre) : il sera pris automatiquement.

## Fichiers

```
index.html  manifest.json  sw.js  package.json
css/style.css
js/  app.js  store.js  images.js  render.js  ui.js  exercices.js  maths.js  reglages.js
data/mots.json  (généré)
tools/  generer_mots.py  verifier_mots.py  test-simulation.mjs
docs/  CONTEXTE.md  CODAGE-DES-MOTS.md
icons/  images/  fonts/
```
