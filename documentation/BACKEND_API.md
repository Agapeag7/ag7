# AG7 Backend API Documentation

## Endpoints Implémentés

### 1. **Gestion des Publications**

#### `POST` - Créer une publication
```
action=createPost
Parameters:
  - post_content: string (texte du post)
  - post_visibility: string ('public' ou 'private') [optional]
  - post_images: files (images multiples) [optional]

Response: { success, message, post_id }
```

#### `GET` - Récupérer le feed
```
action=getFeed
Parameters:
  - limit: int (défaut: 50)
  - offset: int (défaut: 0)

Response: { success, posts: [...] }
Posts contiennent: id, author, username, avatar, content, images[], likes, comments, commentsList[], userHasLiked, timestamp, visibility, user_id
```

#### `DELETE` - Supprimer une publication
```
action=deletePost
Method: POST
Parameters:
  - post_id: int

Suppression en cascade:
  ✓ Images associées (fichiers physiques)
  ✓ Likes sur la publication
  ✓ Commentaires et leurs likes
  ✓ Réponses aux commentaires

Response: { success, message }
```

#### `GET` - Récupérer stats d'une publication
```
action=getPostStats
Parameters:
  - post_id: int

Response: { success, stats: { post_id, likes, comments, views, created_at, author, author_id } }
```

---

### 2. **Gestion des Likes**

#### `POST` - Toggle like sur publication
```
action=toggleLike
Parameters:
  - post_id: int

Logique:
  - Si pas de like: ajoute le like ET incrémente le compteur
  - Si already liked: retire le like ET décrémente le compteur

Response: { success, message, likes_count, isLiked }
```

#### `POST` - Toggle like sur commentaire
```
action=toggleCommentLike
Parameters:
  - comment_id: int

Logique:
  - Si pas de like: ajoute le like ET incrémente le compteur
  - Si already liked: retire le like ET décrémente le compteur

Response: { success, message, likes_count, isLiked }
```

---

### 3. **Gestion des Commentaires**

#### `POST` - Ajouter commentaire (ou répondre à un commentaire)
```
action=addComment
Parameters:
  - post_id: int
  - comment_text: string (1-500 caractères)
  - comment_parent_id: int [optional] (pour les réponses)
  - comment_anonym: bool [optional] (commentaire anonyme)

Logique:
  - Si comment_parent_id vide: création d'un commentaire principal
    → Incrémente post.post_comments
  - Si comment_parent_id présent: création d'une réponse
    → Ne change pas le compteur (les réponses ne comptent pas dans les stats principales)

Response: { success, message, comment: { id, text, author, isAnonymous, likes, parent_id } }
```

#### `GET` - Récupérer tous les commentaires d'une publication
```
action=getComments
Parameters:
  - post_id: int

Structure organisée:
{
  success: true,
  comments: [
    {
      id,
      text,
      author,
      username,
      avatar,
      isAnonymous,
      likes,
      timestamp,
      user_id,
      parent_id,
      replies: [
        { id, text, author, ... }
      ]
    }
  ],
  total: int
}

Notes:
  ✓ Retourne TOUS les commentaires (pas de limite)
  ✓ Organise automatiquement en commentaires principaux + réponses
  ✓ Chaque commentaire a un array "replies" avec les réponses
```

#### `DELETE` - Supprimer un commentaire
```
action=deleteComment
Method: POST
Parameters:
  - comment_id: int

Suppression en cascade:
  ✓ Likes sur le commentaire
  ✓ Réponses à ce commentaire (si c'est un commentaire principal)
  ✓ Likes sur les réponses
  ✓ Décrémente le compteur de comments du post

Response: { success, message }
```

---

## Améliorations Apportées

### Publication
- **Suppression complète (cascade)**
  - Images du système de fichiers
  - Tous les commentaires et réponses
  - Tous les likes (publications et commentaires)
  
### Commentaires
- **Support des réponses**
  - Champ `comment_parent_id` pour lier une réponse à un commentaire
  - Les réponses ne comptent pas dans les stats principales
  - Format organisé avec hiérarchie commentaire/réponse
  
- **Support commentaires anonymes**
  - Champ `comment_anonym` boolean
  - L'auteur vrai n'est pas révélé au frontend

- **Likes sur commentaires**
  - Nouveau endpoint `actionToggleCommentLike`
  - Compteur `comment_likes` automatiquement incrémenté/décrémenté
  
### Validation
- Limites de caractères (post_content: illimité, comment_text: 500)
- Vérification d'authentification sur toutes les actions
- Vérification de propriété (delete uniquement par l'auteur)

---

## Flux Recommandé (Frontend)

### Pour afficher les commentaires complets:
```javascript
// 1. Récupérer tous les commentaires structurés
fetch('?action=getComments&post_id=123')
  .then(r => r.json())
  .then(data => {
    // data.comments contient structure avec replies
    renderComments(data.comments);
  });

// 2. Pour ajouter une réponse:
fetch('?action=addComment', {
  method: 'POST',
  body: new FormData({
    'post_id': 123,
    'comment_text': 'Ma réponse...',
    'comment_parent_id': 456  // ID du commentaire principal
  })
});

// 3. Pour aimer un commentaire:
fetch('?action=toggleCommentLike', {
  method: 'POST',
  body: new FormData({
    'comment_id': 456
  })
});
```

---

## Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Non authentifié" (401) | Session non active | Username/password avant API calls |
| "Post ID manquant" (400) | Paramètre oublié | Vérifier les query params |
| "Vous ne pouvez pas supprimer" (403) | Pas propriétaire | Vérifier user_id == post_user_id |
| "Publication non trouvée" (404) | Post n'existe pas | Vérifier post_id valide |

---

## Base de Données - Schéma Relations

```
Publications (post_id)
  ├── Images (image_url, image_post_id)
  ├── Likes (likes_publications.like_post_id)
  └── Commentaires (comment_post_id)
      ├── Likes (likes_commentaires.like_comment_id)
      └── Réponses (comment_parent_id → comment_id)
```
