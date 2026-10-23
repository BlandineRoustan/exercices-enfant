# Contexte et architecture (à lire en premier pour reprendre le projet)

## But

Appli d'apprentissage de la lecture (et des premiers nombres) pour **un jeune enfant, à usage personnel**, utilisée sur téléphone **avec un adulte à proximité qui choisit le jeu**. Inspirée de la méthode Céline Alvarez (code couleur des graphèmes). Le projet est entièrement gratuit : pas de store, pas de compte développeur, pas de nom de domaine.

## Décisions prises avec l'utilisatrice (ne pas les remettre en cause sans lui demander)

- **Technique :** appli web installable (PWA), HTML/CSS/JS sans framework ni build, publiée sur GitHub Pages. Fonctionne hors-ligne (`sw.js`).
- **Aucun son** dans l'appli (le parent parle) et **aucune récompense** : seulement un retour visuel neutre (grande coche verte ou croix rouge) puis passage automatique à l'item suivant.
- **Sessions de 10 items** pour tous les jeux (`data/mots.json` > `parametres.session.items`), barre de points, écran de fin avec « x réussis sur 10 » pour l'adulte.
- **Affichage :** tout en capitales, police arrondie, **fond sombre** avec les mots / sons / images posés sur des **cartes claires pas tout à fait blanches** (`--papier`).
- **Code couleur** (`affichage` dans le JSON) :
  - sons et syllabes : voyelles rouges, consonnes bleues, digrammes / trigrammes / quadrigrammes verts ;
  - mots : lettres muettes grises, digrammes / trigrammes / quadrigrammes verts, le reste noir ;
  - deux graphèmes verts consécutifs alternent entre deux nuances de vert (calculé dans `js/render.js`).
- **Un seul réglage central : les graphies « maîtrisées »** (écran Réglages). Tout en dépend : sons proposés, syllabes générées, mots déchiffrables. L'adulte accède aux réglages par la roue de l'accueil (simple appui).
- **Mots réguliers uniquement** pour l'instant (pas de mots irréguliers ni de mots-outils). Voir `docs/CODAGE-DES-MOTS.md`.
- **Images :** pictogrammes ARASAAC (CC BY-NC-SA, attribution affichée en tout petit sur l'accueil), déposés dans `images/` sous le nom du mot sans accent ; emoji de secours en attendant.
- **Maths** : nombres jusqu'à 10 maximum (réglable 3 / 5 / 10), soustraction jamais négative.
- L'exercice des mots tente de passer en **paysage** (`screen.orientation.lock`, utile surtout en appli installée) et la mise en page s'adapte aux deux sens.

## Arborescence

```
index.html  manifest.json  sw.js  package.json
css/style.css                 thème sombre, cartes claires, mises en page portrait / paysage
js/app.js                     point d'entrée : THEMES (accueil, menus), enregistrement du service worker
js/store.js                   réglages (localStorage "lecture.v1"), chargement de data/mots.json, idDe(), maitrises()
js/images.js                  trouve images/<mot>.webp|jpg|png, sinon emoji ; photo(m)
js/render.js                  motEl(m), sonsEl(liste) : coloration des graphèmes
js/ui.js                      briques communes : cadre(), suite(), fin(), cartes(), rond(), retourVisuel(), orienter()
js/exercices.js               lecture : exoSons, exoSyllabes, exoMots
js/maths.js                   maths : exoCompter, exoQuantites, exoAjouter, exoEnlever, exoCompleter, exoComparer, exoSuite
js/reglages.js                écran adulte
data/mots.json                GÉNÉRÉ par tools/generer_mots.py (graphies + mots)
tools/generer_mots.py         source de vérité des mots et des graphies
tools/verifier_mots.py        contrôle de cohérence du JSON
tools/test-simulation.mjs     joue tous les exercices dans Node avec un faux DOM
docs/                         cette documentation
icons/  images/  fonts/       icônes, images des mots (LISTE.txt), police facultative
```

## Fonctionnement

- **Écrans :** `app.js` > `THEMES` = liste de thèmes, chacun avec ses jeux `[titre, fonction]`. Pour ajouter un jeu : une ligne ici + une fonction `exoXxx(root, retour)`.
- **Un jeu** commence par `cadre(root, retour)` qui crée la barre (bouton retour + points) et la zone ; il renvoie `S` avec `S.vivant()` (faux dès qu'on quitte l'écran : à tester après chaque attente pour ne pas réafficher un jeu par-dessus un menu) et `S.points(n)`. `suite(S, retour, relancer, suivant)` renvoie la fonction à appeler après chaque réponse : elle compte, met à jour les points et affiche la fin de session après 10 items.
- **Retour visuel :** `retourVisuel(bon)` (overlay), puis en cas d'erreur la bonne réponse est entourée (classe `bonne`) 1,4 s.
- **Sons** (`exoSons`) : une graphie maîtrisée est affichée ; modes « j'entends / je n'entends pas » (image + coche / croix) ou choix parmi 3 images (1 ou 2 bonnes). On compare les **sons** (`g[2]`), pas les lettres ; le **e final lisible n'est pas compté comme entendu**.
- **Syllabes** (`exoSyllabes`) : syllabes générées à partir des graphies maîtrisées, formes CV / VC / CVC (réglage). Seules les graphies de `classe` `c` (consonnes) et `v` (voyelles) servent ; `classe` `x` est exclue (doubles, quadrigrammes, il, et, e /ɛ/). Garde-fous : `mal()` liste les combinaisons écartées (c et g durs devant e, i, é, è, ê ; c-s et g-j doux devant toute autre voyelle ; ç devant e, i, é, è, ê ; gu devant toute autre voyelle), `SANS_FINALE` (graphies impossibles en fin de syllabe), pas de « e » en syllabe fermée. Deux modes : lecture validée par le parent (une syllabe ratée revient 3 questions plus tard) ou « syllabe dans un mot illustré ».
- **Mots** (`exoMots`) : un mot est proposé s'il est `regulier`, illustré, et si **tous ses graphèmes non muets sont maîtrisés** (`idDe(texte, son)`). Il faut choisir son image parmi 3. Les mauvaises images ne viennent jamais du même `groupe` (images ambiguës entre elles).
- **Maths** (`maths.js`) : chaque jeu fournit `{ modele, faces, bon }` à `jeu()` qui utilise `cartes()`. Dessins en SVG pour les dés et les mains (doigts). Les objets des scènes sont variés (`OBJETS`, jamais les 4 derniers).
- **Réglages mémorisés** (`store.js`, clé `lecture.v1`) : `maitrises`, `modeSons`, `modeSyllabes`, `patrons`, `confirmMots`, `filtreSyl`, `filtreGraphie`, `forcerPaysage`, `maxNombre`.
- **Cache hors-ligne :** `sw.js` met en cache tout ; **augmenter le numéro `V` à chaque livraison** pour que les téléphones prennent la nouvelle version (sinon elle n'apparaît qu'au 2e lancement).

## Vérifier avant de livrer

```
python3 tools/generer_mots.py     # si la liste des mots ou des graphies a changé
python3 tools/verifier_mots.py    # doit afficher "OK : aucune erreur"
node tools/test-simulation.mjs    # Node 18+ ; chaque jeu doit finir à 10 items, sans "ERREUR"
```

Le test n'affiche rien à l'écran : il vérifie seulement que la logique tourne. Les rendus (tailles, paysage, mains, objets barrés) se contrôlent sur un téléphone.

## Idées non réalisées

- v2 : réglage script / cursive (`options_v2` dans le JSON) ; police arrondie embarquée (`fonts/arrondie.woff2`).
- Mots-outils irréguliers (champ `regulier: false` prévu) ; graphies non traitées : *ill* sans e final (papillon, billet), x /ks/, y, ien, ui, tion, œ.
- Plus de mots pour les graphies qui n'en ont qu'un (voir la sortie de `verifier_mots.py`).
