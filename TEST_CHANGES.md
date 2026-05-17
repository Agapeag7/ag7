# Test des Changements Ag7 - 17 Mai 2026

## Résumé des modifications

### 1. Section "Découvrir" - Contenu Dynamique ✅
**Fichiers modifiés:**
- `ag.class.php` - Ajout endpoint `actionGetDiscoverUsers()`
- `scripts.js` - Remplacement de `renderDiscoverGrid()` pour utiliser l'API

**Fonctionnalité:**
- Récupère les vrais utilisateurs depuis la base de données
- Exclut l'utilisateur actuel de la liste
- Affiche: Nom, Username, Bio, Nombre de posts, Statut de suivi
- Boutons Follow/Unfollow avec appels API en temps réel

**Comment tester:**
1. Se connecter à Ag7
2. Cliquer sur l'onglet "Contacts" 
3. Vérifier que les utilisateurs affichés correspondent à ceux de la BDD
4. Cliquer sur "Suivre" et vérifier que le bouton change
5. Vérifier que les autres utilisateurs ont leurs propres photos de profil

---

### 2. Feed d'Actualités - Filtrage par Abonnements ✅
**Fichiers modifiés:**
- `ag.class.php` - Modification de `PublicationModel::getFeed()`

**Ancien comportement:**
```sql
WHERE p.post_visibility = "public"
-- Affichait TOUS les posts publics de TOUT LE MONDE
```

**Nouveau comportement:**
```sql
WHERE (p.post_user_id = $user_id OR p.post_user_id IN (
  SELECT followed_id FROM abonnements WHERE follower_id = $user_id
))
-- Affiche UNIQUEMENT:
--  1. Les posts de l'utilisateur connecté
--  2. Les posts des utilisateurs qu'il suit
```

**Comment tester:**
1. Se connecter avec l'utilisateur A
2. Ne pas suivre les utilisateurs B et C
3. Accéder au "Feed" - vérifier que seuls les posts de A s'affichent
4. Suivre l'utilisateur B
5. Accéder au Feed à nouveau - vérifier que les posts de A et B s'affichent
6. Se déconnecter et se reconnecter avec l'utilisateur B
7. Vérifier que les posts de B et de ses abonnés s'affichent (pas les posts de A)

---

## Statut: ✅ COMPLÉTÉ

Tous les changements ont été implémentés et intégrés à la base de code existante.

### Points à vérifier en production:
- [ ] La BDD contient des utilisateurs de test
- [ ] Les photos de profil s'affichent correctement
- [ ] Les requêtes SQL filtrent bien par abonnements
- [ ] Les boutons Follow/Unfollow répondent correctement
