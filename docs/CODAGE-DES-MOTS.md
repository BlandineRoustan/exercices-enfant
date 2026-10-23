# Codage des mots et des graphies

À lire avant d'ajouter ou de corriger un mot. Contexte général : `docs/CONTEXTE.md`.

## 1. Où se fait le codage

- **Source de vérité : `tools/generer_mots.py`.** Il contient la table des graphies (`SONS`), la liste des mots (`W`) et les groupes d'images ambiguës (`GROUPES`). Il écrit `data/mots.json` (lu par l'appli) et `images/LISTE.txt`.
- Ne modifie pas `data/mots.json` à la main : il serait écrasé au prochain lancement du script.
- Procédure : modifier le script, puis `python3 tools/generer_mots.py`, `python3 tools/verifier_mots.py`, `node tools/test-simulation.mjs`, et augmenter la version `V` dans `sw.js`.

## 2. Notation d'un mot dans `W`

Une ligne par mot : `mot|syllabe|syllabe|...|emoji`

- Syllabes séparées par `|`, graphèmes d'une syllabe séparés par un espace.
- `x!` = lettre **muette** (son nul, affichée en gris).
- `x=id` = graphie à plusieurs sons : `x` est le texte, `id` l'identifiant de la graphie (voir §4).
- Dernier champ = emoji de secours, **vide** s'il n'y en a pas de bon (le mot n'est alors proposé qu'une fois son image ajoutée).
- Le script vérifie que les graphèmes bout à bout redonnent exactement le mot (accents compris).

Exemples :

```
chat|ch a t!|🐱                          # CH digramme, A, T muet
lune|l u|n e!|🌙                         # e final écrit "e!" : le script le rend lisible (après consonne)
fée|f é e!|🧚                            # ... ou muet (après voyelle) ; le script décide tout seul
maison|m ai|s=s-z on|🏠                  # s lu /z/ : graphie s-z
chaussette|ch au|ss ette|🧦               # ss (double), ette (quadrigramme)
grenouille|g r e|n ou ille=ille-j|🐸      # ille après voyelle : valeur /j/
```

## 3. Format produit (`data/mots.json`)

Un mot : `{ "mot", "emoji", "niveau", "nbSyllabes", "regulier": true, "groupe"?, "graphemes": [[texte, type, son, n° de syllabe], ...] }`

- `type` : `voyelle`, `consonne`, `digramme`, `trigramme`, `quadrigramme` ou `muette` (son `null`).
- Le couple (texte, son) d'un graphème non muet **doit exister** dans la liste `sons` ; c'est ainsi que l'appli sait si le mot est déchiffrable avec les graphies cochées.

## 4. Table des graphies (`SONS`)

Chaque entrée : `(id, texte, type, son, classe, niveau)`.

- `id` : identifiant unique, mémorisé dans les réglages (`maitrises`). Ne pas renommer un id déjà utilisé sans prévenir : les réglages enregistrés sur les téléphones le référencent.
- `son` : phonème en API (ɛ, ʃ, ɑ̃…) ; **deux graphies de même son sont normales** (ai / è / ê = ɛ) et l'exercice des sons les traite comme le même son.
- `classe` : `c` consonne et `v` voyelle servent à fabriquer des syllabes ; `x` = jamais utilisée en syllabes (consonnes doubles, quadrigrammes, `il`, `et`, `e` /ɛ/).
- `niveau` 1 à 4 : ordre de progression **proposé**, à ajuster avec l'utilisatrice. L'ordre des lignes sert à l'affichage des réglages.
- Graphies à plusieurs sons (le texte est le même, l'id change) :

| Lettres | par défaut | autre valeur (à écrire `x=id`) |
|---|---|---|
| s | `s` /s/ | `s-z` /z/ entre voyelles : maison, rose |
| c | `c` /k/ | `c-s` /s/ devant e, i : cerise, citron |
| g | `g` /g/ | `g-j` /ʒ/ devant e, i : girafe, orange |
| eu | `eu` /ø/ : feu, bleu | `eu-oe` /œ/ : fleur, heure |
| e | `e` /ə/ : cheval, lune | `e-ɛ` /ɛ/ devant *ille* ou *il* : abeille, soleil |
| ille | `ille` /ij/ après consonne : fille | `ille-j` /j/ après voyelle : paille, grenouille |

## 5. Règles de codage décidées

1. **Lettre muette** (gris) : `!`. Exemples : t de chat, s de souris, d de canard, x de voix, h de hibou, e après une voyelle (fée, bougie, tortue).
2. **E final** : *lisible* (voyelle noire, id `e`, /ə/) après une consonne : lu-ne, ta-ble, po-mme. *Muet* (gris) après une autre voyelle. Toujours le noter `e!` : le script choisit. Dans l'exercice des sons, ce e final n'est pas compté comme « entendu ».
3. **Consonnes doubles** (mm nn ss tt ll rr pp ff) : **un seul graphème noir** de type `consonne` (pomme = p o mm e). `ss` = /s/ (tasse), à ne pas confondre avec `s` entre voyelles = /z/.
4. **e + consonne doublée + e** : quadrigramme vert `elle` `ette` `esse` `erre` `enne` (belle, chaussette, princesse, terre, antenne). Le e final fait partie de l'unité (pas de `e!` en plus).
5. **ille** : quadrigramme `ille` /ij/ après consonne (fille, famille, coquille) ou `ille-j` /j/ après voyelle (paille, feuille, grenouille, médaille). Devant ille, un « e » vaut /ɛ/ : écrire `e=e-ɛ` (abeille, oreille, bouteille).
6. **il final** après voyelle : digramme `il` /j/ (ail, soleil, écureuil). **et final** : digramme `et` /ɛ/ (poulet, bouquet, gilet).
7. **Digrammes et trigrammes** : ou on an in ai oi au am om im en eu ch gn ph qu gu ; eau ain oin. `qu` = /k/, `gu` = /g/ devant e, i (guitare, bague).
8. **Accents** : é è ê â sont des voyelles (ɛ pour è et ê ; â lu /a/).
9. **Longest match** : toujours prendre l'unité la plus longue (ch avant c+h, eau avant e+a+u, ain avant ai+n…).
10. **Mots irréguliers exclus** (pour l'instant) : ville, mille, tranquille (ill = /il/), jouet, chouette (ou = /w/), femme, monsieur, oignon, fils, dix, six, sept, août, second, poêle, avion, lion, dessin, tennis… En cas de doute, ne pas ajouter le mot. Pas d'ill sans e final non plus (papillon, billet, caillou) : graphie non définie.

## 6. Syllabes (champ `nbSyllabes`, numéro de syllabe de chaque graphème)

Syllabes comptées comme à l'oral scolaire :

- consonne + e final lisible forme une syllabe : lu|ne, ta|ble, po|mme ;
- e muet après voyelle reste dans la syllabe : fée = 1, tortue = tor|tue ;
- un quadrigramme final contient son e : belle = 1, chaussette = chau|ssette, fille = 1 ;
- une consonne double se range avec la syllabe suivante : po|mme, ba|llon ;
- les numéros partent de 1 et croissent de 1 en 1 (contrôlé par le vérificateur).

## 7. Niveau d'un mot (calculé, ne pas le saisir)

`niveau = max(niveau des graphies utilisées)`, au moins 2 s'il y a une lettre muette, au moins 3 s'il a 3 syllabes ou plus.

## 8. Images, emoji et groupes

- Image d'un mot : `images/<mot sans accent>.webp` (ou .jpg, .png). Sans image, l'emoji est utilisé ; sans emoji, le mot est ignoré par les exercices.
- **Emoji sans ambiguïté seulement** : l'enfant doit nommer l'image comme le mot. Exemple écarté : l'emoji du rat ressemble à une souris.
- `GROUPES` : images à ne jamais proposer ensemble parce qu'un enfant pourrait nommer l'une avec le mot de l'autre (hibou / oiseau / poule ; fleur / rose / tulipe ; main / poing / pouce ; photo / vidéo…). Quand on ajoute un mot dont l'image pourrait se confondre avec une autre, l'ajouter au groupe voulu.
- Un mot sert aux exercices de sons et de syllabes même s'il n'est pas déchiffrable : seule l'image compte à l'oreille. Pour les images à nom ambigu, c'est donc le parent qui prononce le bon mot.

## 9. Ajouter un mot : pas à pas

1. Vérifier qu'il est **régulier** avec les règles du §5 (sinon, ne pas l'ajouter).
2. Le découper en graphèmes (longest match), repérer les muettes (`!`), les graphies à plusieurs sons (`x=id`), le e final (`e!`).
3. Marquer les syllabes avec `|` (§6).
4. Choisir un emoji non ambigu, sinon laisser vide.
5. Ajouter la ligne dans `W` (regrouper par thème), l'ajouter à un groupe de `GROUPES` si l'image peut se confondre.
6. Lancer `generer_mots.py`, `verifier_mots.py`, `test-simulation.mjs`.
7. Déposer l'image dans `images/` et augmenter `V` dans `sw.js`.

## 10. Ajouter une graphie

Ajouter un tuple dans `SONS` (id unique, type, classe, niveau), puis **au moins un mot** qui l'utilise (le vérificateur signale les graphies sans mot). Si la règle est nouvelle, la documenter ici. Penser aux garde-fous de génération des syllabes (`mal()` et `SANS_FINALE` dans `js/exercices.js`) si la graphie a une lecture qui dépend de la lettre suivante.

## 11. Contrôles automatiques (`tools/verifier_mots.py`)

Mots sans doublon ; graphèmes = mot ; chaque graphie existe avec le bon type ; syllabes continues ; `nbSyllabes` ; niveau calculé ; e final lisible après consonne et muet après voyelle ; `regulier: true` ; table des graphies sans doublon (texte + son).
