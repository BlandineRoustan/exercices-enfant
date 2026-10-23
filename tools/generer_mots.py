#!/usr/bin/env python3
"""Génère data/mots.json et images/LISTE.txt à partir de la table des graphies (SONS)
et de la liste de mots (W) ci-dessous.  Usage :  python3 tools/generer_mots.py

C'EST CE SCRIPT QUI FAIT FOI : pour ajouter ou corriger un mot ou une graphie, modifie-le ici
puis relance-le (une modification faite à la main dans data/mots.json serait écrasée).
Les règles de codage sont détaillées dans docs/CODAGE-DES-MOTS.md.

Notation d'un mot dans W, une ligne par mot :   mot|syllabe|syllabe|...|emoji
  - syllabes séparées par |, graphèmes d'une syllabe séparés par un espace ;
  - x!        = lettre muette (le e final se met toujours en "e!" : le script le rend lisible ou muet
                selon la lettre qui précède) ;
  - x=id      = graphie qui a plusieurs sons : texte x, graphie d'identifiant id (ex. s=s-z, c=c-s, g=g-j,
                eu=eu-oe, e=e-ɛ, ille=ille-j) ;
  - dernier champ : emoji de secours, ou vide s'il n'y en a pas de bon (le mot n'est alors proposé
                qu'une fois son image ajoutée dans images/).
Le script vérifie que les graphèmes mis bout à bout redonnent le mot et que chaque graphie existe.
"""
import json, os, unicodedata, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # racine du dépôt

# ---------- Graphies (ordre = progression proposée) ----------
# (id, texte, type, son, classe, niveau)   classe : c = consonne, v = voyelle
SONS = [
 ("a","a","voyelle","a","v",1), ("i","i","voyelle","i","v",1), ("o","o","voyelle","o","v",1),
 ("u","u","voyelle","y","v",1), ("é","é","voyelle","e","v",1),
 ("m","m","consonne","m","c",1), ("l","l","consonne","l","c",1), ("r","r","consonne","r","c",1),
 ("s","s","consonne","s","c",1), ("t","t","consonne","t","c",1), ("p","p","consonne","p","c",1),
 ("b","b","consonne","b","c",1), ("d","d","consonne","d","c",1), ("v","v","consonne","v","c",1),
 ("f","f","consonne","f","c",1), ("n","n","consonne","n","c",1),
 ("e","e","voyelle","ə","v",2), ("è","è","voyelle","ɛ","v",2), ("ê","ê","voyelle","ɛ","v",2), ("â","â","voyelle","a","v",2),
 ("c","c","consonne","k","c",2), ("j","j","consonne","ʒ","c",2), ("g","g","consonne","g","c",2),
 ("z","z","consonne","z","c",2), ("k","k","consonne","k","c",2),
 ("mm","mm","consonne","m","x",3), ("nn","nn","consonne","n","x",3), ("ss","ss","consonne","s","x",3), ("tt","tt","consonne","t","x",3),
 ("ll","ll","consonne","l","x",3), ("rr","rr","consonne","r","x",3), ("pp","pp","consonne","p","x",3), ("ff","ff","consonne","f","x",3),
 ("ou","ou","digramme","u","v",3), ("ch","ch","digramme","ʃ","c",3), ("on","on","digramme","ɔ̃","v",3),
 ("an","an","digramme","ɑ̃","v",3), ("in","in","digramme","ɛ̃","v",3), ("ai","ai","digramme","ɛ","v",3),
 ("oi","oi","digramme","wa","v",3), ("au","au","digramme","o","v",3),
 ("eau","eau","trigramme","o","v",3), ("ain","ain","trigramme","ɛ̃","v",3),
 ("am","am","digramme","ɑ̃","v",4), ("om","om","digramme","ɔ̃","v",4), ("im","im","digramme","ɛ̃","v",4),
 ("en","en","digramme","ɑ̃","v",4), ("eu","eu","digramme","ø","v",4), ("eu-oe","eu","digramme","œ","v",4),
 ("oin","oin","trigramme","wɛ̃","v",4), ("gn","gn","digramme","ɲ","c",4), ("ph","ph","digramme","f","c",4),
 ("qu","qu","digramme","k","c",4),
 ("s-z","s","consonne","z","c",4), ("c-s","c","consonne","s","c",4), ("g-j","g","consonne","ʒ","c",4),
 ("ç","ç","consonne","s","c",4),
 ("gu","gu","digramme","g","c",4), ("et","et","digramme","ɛ","x",4), ("il","il","digramme","j","x",4), ("e-ɛ","e","voyelle","ɛ","x",4),
 ("elle","elle","quadrigramme","ɛl","x",4), ("ette","ette","quadrigramme","ɛt","x",4), ("esse","esse","quadrigramme","ɛs","x",4),
 ("erre","erre","quadrigramme","ɛr","x",4), ("enne","enne","quadrigramme","ɛn","x",4),
 ("ille","ille","quadrigramme","ij","x",4), ("ille-j","ille","quadrigramme","j","x",4),
]
SID = {s[0]: s for s in SONS}

# ---------- Mots : (mot, segmentation, emoji ou None) ----------
# Segmentation : syllabes séparées par |, graphèmes par espace.
#   x!   = lettre muette            x=id = graphie à son particulier (ex. s=s-z)
W = """
papa|p a|p a|👨
maman|m a|m an|👩
lama|l a|m a|🦙
moto|m o|t o|🏍️
vélo|v é|l o|🚲
bébé|b é|b é|👶
lune|l u|n e!|🌙
robe|r o|b e!|👗
radis|r a|d i s!|
rat|r a t!|
sac|s a c|🎒
tomate|t o|m a|t e!|🍅
salade|s a|l a|d e!|🥗
table|t a|b l e!|
livre|l i|v r e!|📖
canard|c a|n a r d!|🦆
tortue|t o r|t u e!|🐢
mur|m u r|
judo|j u|d o|🥋
kilo|k i|l o|
koala|k o|a|l a|🐨
ski|s k i|⛷️
zéro|z é|r o|0️⃣
zèbre|z è|b r e!|🦓
lézard|l é|z a r d!|🦎
rose|r o|s=s-z e!|🌹
tulipe|t u|l i|p e!|🌷
lit|l i t!|🛏️
bol|b o l|🥣
loup|l ou p!|🐺
hibou|h! i|b ou|🦉
café|c a|f é|☕
dé|d é|🎲
âne|â|n e!|
fée|f é e!|🧚
idée|i|d é e!|💡
été|é|t é|
pirate|p i|r a|t e!|
tapis|t a|p i s!|
bras|b r a s!|💪
jus|j u s!|🧃
bus|b u s|🚌
cactus|c a c|t u s|🌵
ananas|a|n a|n a s|🍍
avocat|a|v o|c a t!|🥑
kaki|k a|k i|
jupe|j u|p e!|
volcan|v o l|c an|🌋
ruban|r u|b an|🎀
banane|b a|n a|n e!|🍌
lapin|l a|p in|🐰
jardin|j a r|d in|
matin|m a|t in|🌅
sapin|s a|p in|🎄
moulin|m ou|l in|
dauphin|d au|ph in|🐬
chemin|ch e|m in|
vin|v in|🍷
pain|p ain|🍞
main|m ain|✋
train|t r ain|🚆
melon|m e|l on|🍈
citron|c=c-s i|t r on|🍋
mouton|m ou|t on|🐑
savon|s a|v on|🧼
bonbon|b on|b on|🍬
pont|p on t!|🌉
poumon|p ou|m on|🫁
cochon|c o|ch on|🐷
dragon|d r a|g on|🐉
dindon|d in|d on|🦃
maison|m ai|s=s-z on|🏠
oiseau|oi|s=s-z eau|🐦
bateau|b a|t eau|⛵
chapeau|ch a|p eau|🎩
gâteau|g â|t eau|🍰
château|ch â|t eau|🏰
rideau|r i|d eau|
drapeau|d r a|p eau|🏁
bureau|b u|r eau|
manteau|m an|t eau|🧥
marteau|m a r|t eau|🔨
chameau|ch a|m eau|🐪
pinceau|p in|c=c-s eau|🖌️
cadeau|c a|d eau|🎁
eau|eau|💧
seau|s eau|🪣
poire|p oi|r e!|🍐
voiture|v oi|t u|r e!|🚗
étoile|é|t oi|l e!|⭐
armoire|a r|m oi|r e!|
miroir|m i|r oi r|
noir|n oi r|⚫
trois|t r oi s!|3️⃣
poing|p oin g!|👊
raisin|r ai|s=s-z in|🍇
chaise|ch ai|s=s-z e!|🪑
fraise|f r ai|s=s-z e!|🍓
lait|l ai t!|🥛
balai|b a|l ai|🧹
vache|v a|ch e!|🐄
cloche|c l o|ch e!|🔔
mouche|m ou|ch e!|🪰
bouche|b ou|ch e!|👄
douche|d ou|ch e!|🚿
pêche|p ê|ch e!|🍑
crêpe|c r ê|p e!|🥞
chocolat|ch o|c o|l a t!|🍫
chemise|ch e|m i|s=s-z e!|👔
gare|g a|r e!|🚉
tigre|t i|g r e!|🐯
gant|g an t!|🧤
jambe|j am|b e!|🦵
chambre|ch am|b r e!|
lampe|l am|p e!|
tambour|t am|b ou r|🥁
dent|d en t!|🦷
vent|v en t!|💨
enfant|en|f an t!|🧒
éléphant|é|l é|ph an t!|🐘
phoque|ph o|qu e!|🦭
photo|ph o|t o|📷
montagne|m on|t a|gn e!|⛰️
cerise|c=c-s e|r i|s=s-z e!|🍒
cinéma|c=c-s i|n é|m a|🎬
girafe|g=g-j i|r a|f e!|🦒
orange|o|r an|g=g-j e!|🍊
fromage|f r o|m a|g=g-j e!|🧀
plage|p l a|g=g-j e!|🏖️
rouge|r ou|g=g-j e!|🔴
bougie|b ou|g=g-j i e!|🕯️
singe|s in|g=g-j e!|🐒
glace|g l a|c=c-s e!|🍦
pouce|p ou|c=c-s e!|👍
garçon|g a r|ç on|👦
glaçon|g l a|ç on|🧊
jaune|j au|n e!|🟡
poule|p ou|l e!|🐔
fourmi|f ou r|m i|🐜
souris|s ou|r i s!|🐭
chou|ch ou|🥬
chat|ch a t!|🐱
cheval|ch e|v a l|🐴
champignon|ch am|p i|gn on|🍄
route|r ou|t e!|🛣️
soupe|s ou|p e!|🍲
foulard|f ou|l a r d!|🧣
trou|t r ou|🕳️
fleur|f l eu=eu-oe r|🌼
peur|p eu=eu-oe r|😨
heure|h! eu=eu-oe|r e!|🕐
couleur|c ou|l eu=eu-oe r|🎨
docteur|d o c|t eu=eu-oe r|🧑‍⚕️
feu|f eu|🔥
bleu|b l eu|🔵
jeu|j eu|🎮
blanc|b l an c!|⚪
pastèque|p a s|t è|qu e!|🍉
chèvre|ch è|v r e!|🐐
tête|t ê|t e!|
fête|f ê|t e!|🎉
fenêtre|f e|n ê|t r e!|🪟
forêt|f o|r ê t!|🌲
porte|p o r|t e!|🚪
arbre|a r|b r e!|🌳
clé|c l é|🔑
valise|v a|l i|s=s-z e!|🧳
fusée|f u|s=s-z é e!|🚀
robot|r o|b o t!|🤖
radio|r a|d i|o|📻
vidéo|v i|d é|o|📹
piano|p i|a|n o|🎹
école|é|c o|l e!|🏫
kangourou|k an|g ou|r ou|🦘
renard|r e|n a r d!|🦊
requin|r e|qu in|🦈
panda|p an|d a|🐼
masque|m a s|qu e!|🎭
disque|d i s|qu e!|💿
musique|m u|s=s-z i|qu e!|🎵
brique|b r i|qu e!|🧱
cirque|c=c-s i r|qu e!|🎪
boutique|b ou|t i|qu e!|🏪
timbre|t im|b r e!|
compote|c om|p o|t e!|
nombre|n om|b r e!|
haricot|h! a|r i|c o t!|
pomme|p o|mm e!|🍎
gomme|g o|mm e!|
carotte|c a|r o|tt e!|🥕
botte|b o|tt e!|🥾
ballon|b a|ll on|⚽
balle|b a|ll e!|🎾
bulle|b u|ll e!|🫧
tasse|t a|ss e!|
nappe|n a|pp e!|
poisson|p oi|ss on|🐟
marron|m a|rr on|🟤
carré|c a|rr é|
chiffre|ch i|ff r e!|🔢
coffre|c o|ff r e!|
griffe|g r i|ff e!|
boussole|b ou|ss o|l e!|🧭
casserole|c a|ss e|r o|l e!|🥘
caisse|c ai|ss e!|📦
poussin|p ou|ss in|🐥
coussin|c ou|ss in|
saucisse|s au|c=c-s i|ss e!|🌭
chaussure|ch au|ss u|r e!|👟
bonnet|b o|nn et|🧢
carnet|c a r|n et|📓
poulet|p ou|l et|🍗
bouquet|b ou|qu et|💐
ballet|b a|ll et|🩰
gilet|g=g-j i|l et|🦺
robinet|r o|b i|n et|🚰
navet|n a|v et|
poubelle|p ou|b elle|🗑️
échelle|é|ch elle|🪜
chapelle|ch a|p elle|⛪
ficelle|f i|c=c-s elle|
chaussette|ch au|ss ette|🧦
raquette|r a|qu ette|🏸
fourchette|f ou r|ch ette|🍴
trompette|t r om|p ette|🎺
cassette|c a|ss ette|📼
baguette|b a|gu ette|🥖
princesse|p r in|c=c-s esse|👸
terre|t erre|🌍
verre|v erre|🥃
tonnerre|t o|nn erre|🌩️
antenne|an|t enne|📡
fille|f ille|👧
famille|f a|m ille|👪
coquille|c o|qu ille|🐚
chenille|ch e|n ille|🐛
gorille|g o|r ille|🦍
paille|p a ille=ille-j|
feuille|f eu=eu-oe ille=ille-j|🍃
grenouille|g r e|n ou ille=ille-j|🐸
citrouille|c=c-s i|t r ou ille=ille-j|🎃
médaille|m é|d a ille=ille-j|🏅
abeille|a|b e=e-ɛ ille=ille-j|🐝
oreille|o|r e=e-ɛ ille=ille-j|👂
bouteille|b ou|t e=e-ɛ ille=ille-j|🍾
ail|a il|🧄
soleil|s o|l e=e-ɛ il|☀️
écureuil|é|c u|r eu=eu-oe il|🐿️
chevreuil|ch e|v r eu=eu-oe il|🦌
bague|b a|gu e!|💍
vague|v a|gu e!|🌊
guitare|gu i|t a|r e!|🎸
"""

# Images ambiguës entre elles : jamais proposées ensemble dans l'exercice des mots
GROUPES = {
 'fleurs': ['fleur','rose','tulipe'], 'arbres': ['arbre','sapin','forêt'],
 'oiseaux': ['oiseau','hibou','poule','dindon','canard','poussin','poulet'], 'souris': ['souris','rat'],
 'personnes': ['papa','maman','bébé','enfant','garçon','fille','famille','princesse','docteur','fée'],
 'main': ['main','poing','pouce','bras'],
 'images': ['photo','vidéo','cinéma'], 'musique': ['musique','disque','radio','piano','tambour','guitare','trompette','cassette'],
 'jeux': ['jeu','dé'], 'glace': ['glace','glaçon'], 'maisons': ['maison','château'],
 'balles': ['balle','ballon'], 'chaussures': ['chaussette','chaussure','botte'],
 'chapeaux': ['bonnet','chapeau'], 'livres': ['livre','carnet'], 'contenants': ['verre','bouteille'],
}
GROUPE = {}
for g, ms in GROUPES.items():
    for m in ms: GROUPE.setdefault(m, g)
# un mot ne peut avoir qu'un groupe : 'oiseau' est déjà dans 'oiseaux'

def slug(s): return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode()

mots = []
seen = set()
for ln in W.strip().split('\n'):
    parts = ln.split('|')
    mot = parts[0]
    # Le dernier champ est l'emoji (ou vide) s'il ne contient aucune lettre ; sinon c'est une syllabe.
    last = parts[-1]
    emoji = None
    segs = parts[1:]
    if last == '' or not any(ch.isalpha() for ch in last):
        emoji = last or None
        segs = parts[1:-1]
    spec = segs
    assert mot not in seen, mot
    seen.add(mot)
    graph = []; ids = []
    toks = [(si, tok) for si, syl in enumerate(spec, 1) for tok in syl.split()]
    for k, (si, tok) in enumerate(toks):
        if tok.endswith('!'):
            dernier = (k == len(toks) - 1)
            if tok == 'e!' and dernier and ids and ids[-1] and (SID[ids[-1]][2] == 'consonne' or SID[ids[-1]][4] == 'c'):
                graph.append(['e', 'voyelle', 'ə', si]); ids.append('e')   # e final lisible après consonne
            else:
                graph.append([tok[:-1], 'muette', None, si]); ids.append(None)
        else:
            if '=' in tok:
                tx, i = tok.split('=')
            else:
                tx, i = tok, tok
            s = SID[i]
            assert s[1] == tx, (mot, tok)
            graph.append([tx, s[2], s[3], si]); ids.append(i)
    assert ''.join(g[0] for g in graph) == mot, (mot, ''.join(g[0] for g in graph))
    nb = len(spec)
    lv = max([SID[i][5] for i in ids if i] or [1])
    if any(g[1] == 'muette' for g in graph): lv = max(lv, 2)
    if nb >= 3: lv = max(lv, 3)
    mots.append(dict(mot=mot, emoji=emoji, niveau=lv, nb=nb, groupe=GROUPE.get(mot), graphemes=graph))

# ---------- Écriture du JSON ----------
J = lambda x: json.dumps(x, ensure_ascii=False)
out = []
out.append('{')
out.append('  "_notes": [')
notes = [
 "Image d'un mot : images/<mot sans accent>.webp (ou .jpg, .png). Les 2 mauvaises images sont tirées parmi les autres mots illustrés, jamais du même 'groupe' (images ambiguës entre elles).",
 "Chaque graphème d'un mot = [texte, type, son, numéro de syllabe]. Types : voyelle, consonne, digramme, trigramme, muette. Son = null pour une lettre muette.",
 "Un mot est proposé si tous ses graphèmes NON muets sont maîtrisés (identifiés par texte + son, voir 'sons'). Seuls des mots réguliers (déchiffrables avec les graphies de la liste 'sons') sont inclus ; regulier=false permettrait plus tard d'ajouter des mots-outils.",
 "Champ emoji : image de secours tant que images/<mot>.webp n'existe pas ; null = le mot n'est pas utilisé dans les exercices tant qu'il n'a pas d'image.",
 "Champ classe d'une graphie : c = consonne, v = voyelle (sert à fabriquer les syllabes ; ch, gn, ph, qu et gu sont des consonnes). Champ niveau : 1 (le plus simple) à 4.",
 "Syllabes comptées comme à l'oral scolaire : une consonne + e muet final forme une syllabe (lu-ne, ta-ble, po-ule).",
 "Les graphies sont listées dans un ordre de progression PROPOSÉ : à relire et corriger selon ta méthode.",
 "E final : lisible (voyelle noire) après une consonne (lu-ne, ta-ble) ; muet (gris) après une autre voyelle (fée, idée, bougie). Dans les exercices de sons, le e final n'est pas compté comme entendu.",
 "Consonnes doubles (mm, nn, ss, tt, ll, rr, pp, ff) : un seul graphème noir. E + consonne doublée + e : quadrigrammes elle, ette, esse, erre, enne (belle, chaussette).",
 "ille = quadrigramme à deux valeurs : /ij/ après consonne (fille, famille), /j/ après voyelle (paille, grenouille). il final = digramme /j/ (ail, soleil) ; et final = digramme /ɛ/ (poulet). Abeille, oreille, bouteille utilisent e /ɛ/ + ille.",
 "classe x = graphie jamais utilisée pour fabriquer des syllabes (doubles, quadrigrammes, il, et, e /ɛ/). Champ groupe = images à ne jamais proposer ensemble."
]
out.append(',\n'.join('    ' + J(n) for n in notes))
out.append('  ],')
out.append('')
out.append('  "attribution": "Pictogrammes : Sergio Palao / ARASAAC (arasaac.org), Gouvernement d\'Aragon, licence CC BY-NC-SA",')
out.append('')
out.append('''  "affichage": {
    "casse": "capitales",
    "police": "arrondie",
    "options_v2": ["script", "cursive"],
    "mots": {
      "voyelle": "#000000",
      "consonne": "#000000",
      "muette": "#7C7C7C",
      "digramme": ["#1B7F3A", "#5F9100"],
      "trigramme": ["#1B7F3A", "#5F9100"],
      "quadrigramme": ["#1B7F3A", "#5F9100"]
    },
    "sons_et_syllabes": {
      "voyelle": "#D32F2F",
      "consonne": "#1976D2",
      "digramme": ["#1B7F3A", "#5F9100"],
      "trigramme": ["#1B7F3A", "#5F9100"],
      "quadrigramme": ["#1B7F3A", "#5F9100"]
    },
    "regle_verts": "Deux digrammes/trigrammes consécutifs alternent entre les deux nuances de vert (calculé par l'appli, pas stocké dans les mots)."
  },

  "parametres": {
    "session": { "items": 10 },
    "mot_disponible_si": "tous les graphèmes non muets sont maîtrisés",
    "exercice_sons": { "images_par_question": 3, "bonnes_reponses_possibles": [1, 2] },
    "exercice_syllabes": { "patrons": ["CV", "VC", "CVC"], "generation": "à partir des graphies maîtrisées, CV d'abord" },
    "exercice_mots": { "images_par_question": 3, "filtres_optionnels": ["nbSyllabes", "graphie"] }
  },
''')
out.append('  "sons": [')
sl = []
for (i, t, ty, so, cl, nv) in SONS:
    sl.append('    { "id": %s, "texte": %s, "type": %s, "son": %s, "classe": %s, "niveau": %d }' % (J(i), J(t), J(ty), J(so), J(cl), nv))
out.append(',\n'.join(sl))
out.append('  ],')
out.append('')
out.append('  "mots": [')
ml = []
for m in mots:
    g = json.dumps(m['graphemes'], ensure_ascii=False, separators=(',', ':'))
    extra = (', "groupe": %s' % J(m['groupe'])) if m['groupe'] else ''
    ml.append('    { "mot": %s, "emoji": %s, "niveau": %d, "nbSyllabes": %d, "regulier": true%s, "graphemes": %s }' %
              (J(m['mot']), J(m['emoji']) if m['emoji'] else 'null', m['niveau'], m['nb'], extra, g))
out.append(',\n'.join(ml))
out.append('  ]')
out.append('}')
txt = '\n'.join(out) + '\n'
open(os.path.join(ROOT, 'data', 'mots.json'), 'w', encoding='utf-8').write(txt)
d = json.loads(txt)

# ---------- Contrôles ----------
keys = {(s['texte'], s['son']): s['id'] for s in d['sons']}
bad = [(m['mot'], g[0], g[2]) for m in d['mots'] for g in m['graphemes'] if g[1] != 'muette' and (g[0], g[2]) not in keys]
print(len(d['mots']), 'mots,', len(d['sons']), 'graphies, erreurs de graphie :', bad)
print('sans emoji :', sum(1 for m in d['mots'] if not m['emoji']), '| avec emoji :', sum(1 for m in d['mots'] if m['emoji']))
cnt = collections.Counter(m['niveau'] for m in d['mots'])
print('par niveau :', dict(sorted(cnt.items())))
dups = [e for e, c in collections.Counter(m['emoji'] for m in d['mots'] if m['emoji']).items() if c > 1]
print('emojis en double :', dups)
used = {g[0] + '|' + str(g[2]) for m in d['mots'] for g in m['graphemes'] if g[1] != 'muette'}
print('graphies sans aucun mot :', [s['id'] for s in d['sons'] if s['texte'] + '|' + str(s['son']) not in used])
# liste d'images
with open(os.path.join(ROOT, 'images', 'LISTE.txt'), 'w', encoding='utf-8') as f:
    f.write("Images attendues : WebP (ou JPG/PNG), environ 300 px, nom = mot sans accent.\n")
    f.write("Un mot sans image utilise son emoji ; sans emoji, il n'est pas proposé.\n\n")
    f.write("=== À FOURNIR EN PRIORITÉ (pas d'emoji de secours) ===\n")
    for m in d['mots']:
        if not m['emoji']: f.write('%-18s <- %s\n' % (slug(m['mot']) + '.webp', m['mot'].upper()))
    f.write("\n=== Emoji de secours disponible (image facultative) ===\n")
    for m in d['mots']:
        if m['emoji']: f.write('%-18s <- %-12s %s\n' % (slug(m['mot']) + '.webp', m['mot'].upper(), m['emoji']))
