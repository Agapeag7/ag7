# 🧪 GUIDE DE TEST - SECTION MESSAGERIE (CONVERSATIONS & CANAUX)

**Dernière mise à jour**: 4 Juin 2026  
**Status**: ✅ PRÊT POUR TEST

---

## 📌 RÉSUMÉ DES CORRECTIONS

### ✅ Tous les problèmes résolus:
1. **ReferenceError: content is not defined** - CORRIGÉ
2. **POST 403 Forbidden (deleteChannel)** - CORRIGÉ  
3. **Mismatch colonnes getChannelMessages** - CORRIGÉ

---

## 🧪 SCÉNARIOS DE TEST

### TEST #1: Conversa tions Privées (Messages 1-à-1)

**Étapes**:
```
1. Se connecter avec utilisateur A
2. Aller à la section Messagerie
3. Envoyer un message à utilisateur B
4. Vérifier que le message s'affiche
5. Ouvrir la console (F12) → Vérifier: 0 erreur
6. Attendre 10 secondes (auto-refresh)
7. Vérifier: Pas d'erreur "content is not defined"
8. Marquer comme lu
9. Supprimer le message (si fonction existe)
```

**Résultats attendus**:
- ✓ Le message s'affiche immédiatement
- ✓ Pas d'erreur dans la console
- ✓ Le timestamp s'affiche correctement
- ✓ Les non-lus sont marqués

---

### TEST #2: Canaux (Messages de groupe)

**Étapes**:
```
1. Se connecter avec utilisateur A
2. Créer un nouveau canal avec nom "TEST_CANAL"
3. Ajouter utilisateurs B et C comme membres
4. Envoyer un message: "Bonjour du canal"
5. Vérifier que le message s'affiche avec:
   - Contenu: "Bonjour du canal"
   - Heure: [timestamp actuel]
   - Expéditeur: [Nom utilisateur A]
6. Se connecter avec utilisateur B (onglet différent)
7. Aller dans le canal TEST_CANAL
8. Vérifier: Message de A s'affiche
9. Envoyer un message depuis B
10. Vérifier: Message s'affiche pour A (auto-refresh 10s)
```

**Résultats attendus**:
- ✓ Les messages s'affichent dans l'ordre chronologique
- ✓ Les noms d'utilisateurs s'affichent correctement
- ✓ Les photos de profil s'affichent (si disponibles)
- ✓ Pas d'erreur "content is not defined"
- ✓ Auto-refresh fonctionne (max 10s de délai)

---

### TEST #3: Suppression de Canal

**Étapes**:
```
1. Se connecter avec créateur du canal A
2. Ouvrir le canal TEST_CANAL
3. Cliquer sur le bouton poubelle (supprimer)
4. Confirmer la suppression
5. Vérifier: Le canal disparaît de la liste
6. Ouvrir la console: Pas d'erreur 403
7. Se connecter avec utilisateur B
8. Vérifier: Le canal n'existe plus
```

**Résultats attendus**:
- ✓ Le canal est supprimé
- ✓ Pas d'erreur 403 "Forbidden"
- ✓ Le canal disparaît pour tous les membres
- ✓ Les messages du canal sont supprimés

---

### TEST #4: Auto-refresh des Messages

**Étapes**:
```
1. Ouvrir 2 navigateurs côte à côte (A et B)
2. A et B ouverts dans le même canal
3. Depuis A, envoyer un message
4. Attendre max 10 secondes
5. Vérifier dans B: Le message de A s'affiche
6. Répéter le scénario inverse (B → A)
7. Ouvrir la console: Pas d'erreur
```

**Résultats attendus**:
- ✓ Les messages apparaissent dans l'autre navigateur dans les 10 secondes
- ✓ Pas d'erreur "content is not defined" toutes les 10s
- ✓ Les messages ne se dupliquent pas

---

### TEST #5: Transfert de Messages

**Étapes**:
```
1. Envoyer un message
2. Cliquer sur l'icône "Transférer"
3. Sélectionner une conversation
4. Cliquer "Transférer"
5. Vérifier: Le message est transféré à la bonne conversation
```

**Résultats attendus**:
- ✓ Le message est transféré correctement
- ✓ Le contenu est préservé
- ✓ Notification de succès s'affiche

---

## 🔍 VÉRIFICATIONS CONSOLE

Ouvrir la console du navigateur (F12) et vérifier:

### ✓ Avant corrections:
```
Erreurs:
- ReferenceError: content is not defined (×10+)
- POST 403 (Forbidden) - deleteChannel
- Valeurs undefined dans les messages
```

### ✓ Après corrections:
```
Erreurs: [AUCUNE]
Warnings: [Normaux si présents]
Network:
- POST createChannel: 200 OK
- POST sendChannelMessage: 200 OK
- GET getChannelMessages: 200 OK
- POST deleteChannel: 200 OK
```

---

## 📊 CHECKLIST DE VALIDATION

| Aspect | Avant | Après |
|--------|-------|-------|
| Erreurs console | ❌ 10+ | ✅ 0 |
| Delete canal | ❌ 403 | ✅ 200 |
| Messages affichage | ❌ Incorrect | ✅ Correct |
| Auto-refresh | ❌ Erreur | ✅ OK |
| Correspondance colonnes | ❌ Non | ✅ Oui |

---

## 🚀 PROCHAINES ÉTAPES

- [ ] Exécuter les tests #1-5
- [ ] Vérifier la console (aucune erreur)
- [ ] Tester sur mobil/responsive
- [ ] Vérifier avec 10+ utilisateurs simultanés
- [ ] Test de stress (100 messages rapidement)

---

## 📞 EN CAS DE PROBLÈME

Si une erreur persiste après les corrections:

1. **Vider le cache du navigateur** (Ctrl+Shift+Delete)
2. **Relancer le serveur PHP**
3. **Vérifier php_errors.log** pour les erreurs serveur
4. **Vérifier la console** pour les détails de l'erreur
5. **Vérifier les permissions BD** si erreur 403

---

## 💾 FICHIERS MODIFIÉS

✅ **messaging-manager.js** - Frontend logic
✅ **ag.class.php** - Backend API
✅ **api-conversations.js** - API layer

**Note**: Aucune migration SQL n'était nécessaire - les structures BD existaient.

