# Integration Frontend - Backend AG7

## Points d'Intégration Nécessaires

### 1. **Commentaires Complets avec Réponses**

#### Actuellement dans scripts.js:
- `renderCommentsModal()` charge les commentaires
- L'endpoint `actionGetFeed` ne retourne que 3 derniers commentaires
- Pas de support complet des réponses

#### À Implémenter:
```javascript
// Dans renderCommentsModal():
async function loadFullComments(postId) {
  const response = await fetch(`?action=getComments&post_id=${postId}`);
  const data = await response.json();
  
  if (data.success) {
    // data.comments contient structure commentaire/réponses
    // Chaque commentaire a: id, text, author, replies[]
    renderCommentTree(data.comments);
  }
}

// Lors de la publication d'une réponse:
async function submitReply(postId, commentId, replyText) {
  const formData = new FormData();
  formData.append('action', 'addComment');
  formData.append('post_id', postId);
  formData.append('comment_text', replyText);
  formData.append('comment_parent_id', commentId); // ← NOUVEAU
  
  const response = await fetch('?action=addComment', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  if (data.success) {
    loadFullComments(postId); // Recharger
  }
}
```

---

### 2. **Likes sur Commentaires**

#### À Implémenter:
```javascript
// Dans renderCommentsModal():
function attachCommentLikeHandlers() {
  document.querySelectorAll('.comment-like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const commentId = parseInt(btn.dataset.commentId);
      
      const formData = new FormData();
      formData.append('action', 'toggleCommentLike');
      formData.append('comment_id', commentId);
      
      const response = await fetch('?action=toggleCommentLike', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        btn.classList.toggle('liked');
        const likeCount = btn.querySelector('.like-count');
        if (likeCount) {
          likeCount.textContent = data.likes_count;
        }
      }
    });
  });
}
```

---

### 3. **Suppression Publication Complète**

#### Actuellement:
```javascript
// Dans handleDeletePost():
fetch(window.location.href, {
  method: 'POST',
  body: formData // action=deletePost
})
```

#### Déjà implémenté ✓
- Suppression images
- Suppression commentaires en cascade
- Suppression likes
- **Pas de changement nécessaire au frontend**

---

### 4. **Stats de Publication**

#### À Implémenter (optionnel):
```javascript
// Pour afficher les stats détaillées d'une publication:
async function loadPostStats(postId) {
  const response = await fetch(`?action=getPostStats&post_id=${postId}`);
  const data = await response.json();
  
  if (data.success) {
    const stats = data.stats;
    // stats.likes, stats.comments, stats.views, stats.created_at
    updateStatsUI(stats);
  }
}
```

---

### 5. **Commentaires Anonymes**

#### À Implémenter:
```javascript
// Dans le formulaire de commentaire:
<input type="checkbox" id="anonymousCheckbox" name="anonymous">

// Lors de la soumission:
const formData = new FormData();
formData.append('comment_text', commentText);
formData.append('comment_anonym', 
  document.getElementById('anonymousCheckbox').checked ? 1 : 0
);
```

---

## Checklist d'Intégration

### Haute Priorité (Requise)
- [ ] Mettre à jour `renderCommentsModal()` pour appeler `?action=getComments`
- [ ] Implémenter `toggleCommentLike()` avec nouvel endpoint
- [ ] Tester suppression publication complète en cascade
- [ ] Valider que les réponses fonctionnent (comment_parent_id)

### Moyenne Priorité (Recommandée)
- [ ] Ajouter compteurs de likes sur commentaires dans l'UI
- [ ] Implémenter l'affichage des réponses en hiérarchie
- [ ] Ajouter support commentaires anonymes
- [ ] Afficher stats détaillées (via `?action=getPostStats`)

### Basse Priorité (Optionnel)
- [ ] Animation lors du toggle de like
- [ ] Notifications quand quelqu'un like un commentaire
- [ ] Compteur de réponses par commentaire

---

## Tests à Effectuer

### Publication
- ✓ Créer publication avec texte seul
- ✓ Créer publication avec images
- ✓ Supprimer publication (vérifier cascade)
- ✓ Vérifier compteur de posts utilisateur

### Commentaires
- ✓ Ajouter commentaire à publication
- ✓ Répondre à un commentaire
- ✓ Like/Unlike commentaire
- ✓ Supprimer commentaire

### Likes
- ✓ Like publication (compteur s'incrémente)
- ✓ Unlike publication (compteur se décrémente)
- ✓ Like commentaire (compteur s'incrémente)
- ✓ Unlike commentaire (compteur se décrémente)

### Stats
- ✓ Récupérer stats correctes d'une publication
- ✓ Stats utilisateur (followers, posts count, engagement total)

---

## Structure de Données Attendue

### Réponse actionGetComments:
```json
{
  "success": true,
  "comments": [
    {
      "id": 1,
      "text": "Commentaire principal",
      "author": "Marie",
      "username": "@marie_lambert",
      "avatar": "imgApp/marie.jpg",
      "isAnonymous": false,
      "likes": 5,
      "timestamp": "2026-04-17 10:30:00",
      "user_id": 42,
      "parent_id": null,
      "replies": [
        {
          "id": 2,
          "text": "Réponse au commentaire",
          "author": "Thomas",
          "username": "@thomas.dubois",
          "likes": 2,
          "parent_id": 1
        }
      ]
    }
  ],
  "total": 3
}
```

### Réponse actionToggleCommentLike:
```json
{
  "success": true,
  "message": "Commentaire aimé",
  "likes_count": 6,
  "isLiked": true
}
```

### Réponse actionDeletePost:
```json
{
  "success": true,
  "message": "Publication et tous ses contenus supprimés"
}
```
