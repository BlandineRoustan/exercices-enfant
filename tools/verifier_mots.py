#!/usr/bin/env python3
"""Vérifie la cohérence de data/mots.json.  Usage :  python3 tools/verifier_mots.py
Code de sortie 1 s'il y a des erreurs.  À lancer après toute modification (voir docs/CODAGE-DES-MOTS.md)."""
import json, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(ROOT, 'data', 'mots.json'), encoding='utf-8'))
err = []

TYPES = {'voyelle', 'consonne', 'digramme', 'trigramme', 'quadrigramme'}
sons = d['sons']
ids = [s['id'] for s in sons]
if len(ids) != len(set(ids)): err.append('identifiants de graphies en double')
cles = {}
for s in sons:
    if s['type'] not in TYPES: err.append('type inconnu : %s' % s['id'])
    if s['classe'] not in ('c', 'v', 'x'): err.append('classe inconnue : %s' % s['id'])
    if s['niveau'] not in (1, 2, 3, 4): err.append('niveau inconnu : %s' % s['id'])
    k = (s['texte'], s['son'])
    if k in cles: err.append('graphie en double (texte + son) : %s et %s' % (cles[k], s['id']))
    cles[k] = s['id']
niveau = {s['id']: s['niveau'] for s in sons}
type_de = {s['id']: s['type'] for s in sons}
classe = {s['id']: s['classe'] for s in sons}

vus = set()
for m in d['mots']:
    w = m['mot']
    if w in vus: err.append('mot en double : ' + w)
    vus.add(w)
    g = m['graphemes']
    if ''.join(x[0] for x in g) != w: err.append('%s : les graphèmes ne redonnent pas le mot' % w)
    syl = [x[3] for x in g]
    if syl[0] != 1 or any(b - a not in (0, 1) for a, b in zip(syl, syl[1:])):
        err.append('%s : numéros de syllabes non continus' % w)
    if max(syl) != m['nbSyllabes']: err.append('%s : nbSyllabes incohérent' % w)
    lv = 1
    for i, (t, ty, so, sy) in enumerate(g):
        if ty == 'muette':
            if so is not None: err.append('%s : lettre muette avec un son' % w)
            continue
        gid = cles.get((t, so))
        if gid is None: err.append('%s : graphie inconnue (%s, %s)' % (w, t, so)); continue
        if type_de[gid] != ty: err.append('%s : type de %s différent de la table des graphies' % (w, t))
        lv = max(lv, niveau[gid])
    # e final : lisible après une consonne, muet après une autre voyelle
    if len(g) >= 2 and g[-1][0] == 'e':
        avant = g[-2]
        cons_avant = avant[1] != 'muette' and (avant[1] == 'consonne' or classe.get(cles.get((avant[0], avant[2])), '') == 'c')
        if g[-1][1] == 'muette' and cons_avant: err.append('%s : e final muet après une consonne (il doit être lisible)' % w)
        if g[-1][1] != 'muette' and not cons_avant: err.append('%s : e final lisible après une voyelle (il doit être muet)' % w)
    if any(x[1] == 'muette' for x in g): lv = max(lv, 2)
    if m['nbSyllabes'] >= 3: lv = max(lv, 3)
    if lv != m['niveau']: err.append('%s : niveau %s, attendu %s' % (w, m['niveau'], lv))
    if m.get('regulier') is not True: err.append('%s : regulier doit être true' % w)
    if m.get('emoji') is not None and not isinstance(m['emoji'], str): err.append('%s : emoji invalide' % w)

utilises = {cles[(x[0], x[2])] for m in d['mots'] for x in m['graphemes'] if x[1] != 'muette' and (x[0], x[2]) in cles}
inutiles = [i for i in ids if i not in utilises]
print('%d mots, %d graphies ; mots sans emoji : %d' % (len(d['mots']), len(sons), sum(1 for m in d['mots'] if not m['emoji'])))
print('graphies sans aucun mot :', inutiles or 'aucune')
print('par niveau :', dict(sorted(collections.Counter(m['niveau'] for m in d['mots']).items())))
if err:
    print('\n%d ERREUR(S) :' % len(err)); [print(' -', e) for e in err]; sys.exit(1)
print('OK : aucune erreur')
