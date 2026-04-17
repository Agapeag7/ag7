# 🚀 Quick Start - Implémentation Backend Actualités (AG7)

## 📌 Vue d'ensemble

Tout le backend est **prêt et fonctionnel**. Ce guide vous montre comment l'intégrer rapidement dans votre frontend.

---

## ⚡ 5 Minutes Setup

### 1️⃣ Endpoints Disponibles Immédiatement

| Action | Type | URL |
|--------|------|-----|
| Créer publication | POST | `?action=createPost` |
| Récupérer feed | GET | `?action=getFeed&limit=50&offset=0` |
| Liker publication | POST | `?action=toggleLike` |
| Ajouter commentaire | POST | `?action=addComment` |
| Récupérer commentaires | GET | `?action=getComments&post_id=123` |
| Liker commentaire | POST | `?action=toggleCommentLike` |
| Supprimer publication | POST | `?action=deletePost` |
| Stats publication | GET | `?action=getPostStats&post_id=123` |

---

## 🔧 Intégration Rapide (Copier-Coller)

### Charger le Feed

```javascript
async function loadNews() {
  const response = await fetch('?action=getFeed&limit=50&offset=0');
  const data = await response.json();
  
  if (data.success) {
    data.posts.forEach(post => {
      console.log(`${post.author}: ${post.content}`);
      console.log(`❤️ ${post.likes} | 💬 ${post.comments}`);
    });
  }
}

loadNews();
```

### Créer une Actualité

```javascript
async function publishNews(content, images = []) {
  const formData = new FormData();
  formData.append('action', 'createPost');
  formData.append('post_content', content);
  formData.append('post_visibility', 'public');
  
  // Ajouter les images
  images.forEach(img => {
    formData.append('post_images', img);
  });
  
  const response = await fetch('?action=createPost', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data.success ? data.post_id : null;
}

// Utilisation
const postId = await publishNews('Nouvelle actualité!', [file1, file2]);
```

### Aimer une Actualité

```javascript
async function likeNews(postId) {
  const formData = new FormData();
  formData.append('action', 'toggleLike');
  formData.append('post_id', postId);
  
  const response = await fetch('?action=toggleLike', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log(`Likes: ${data.likes_count}, Liked: ${data.isLiked}`);
}

likeNews(123);
```

### Ajouter Commentaire

```javascript
async function addComment(postId, text, parentCommentId = null) {
  const formData = new FormData();
  formData.append('action', 'addComment');
  formData.append('post_id', postId);
  formData.append('comment_text', text);
  
  if (parentCommentId) {
    formData.append('comment_parent_id', parentCommentId); // Réponse
  }
  
  const response = await fetch('?action=addComment', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// Commentaire principal
await addComment(123, 'Belle actualité!');

// Répondre à un commentaire
await addComment(123, 'Je suis d\'accord!', 456);
```

### Récupérer Commentaires avec Réponses

```javascript
async function getComments(postId) {
  const response = await fetch(`?action=getComments&post_id=${postId}`);
  const data = await response.json();
  
  if (data.success) {
    data.comments.forEach(comment => {
      console.log(`${comment.author}: ${comment.text}`);
      
      // Afficher les réponses
      comment.replies.forEach(reply => {
        console.log(`  └─ ${reply.author}: ${reply.text}`);
      });
    });
  }
}

getComments(123);
```

### Liker Commentaire

```javascript
async function likeComment(commentId) {
  const formData = new FormData();
  formData.append('action', 'toggleCommentLike');
  formData.append('comment_id', commentId);
  
  const response = await fetch('?action=toggleCommentLike', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log(`Likes: ${data.likes_count}`);
}

likeComment(456);
```

### Supprimer Actualité

```javascript
async function deleteNews(postId) {
  const formData = new FormData();
  formData.append('action', 'deletePost');
  formData.append('post_id', postId);
  
  const response = await fetch('?action=deletePost', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log(data.message); // "Publication et tous ses contenus supprimés"
}

deleteNews(123);
```

---

## 📊 Structure de Données

### Objet Publication (du Feed)
```javascript
{
  id: 1,
  author: "Marie Lambert",
  username: "@marie_lambert",
  avatar: "imgApp/photo.jpg",
  content: "Texte de l'actualité",
  images: ["pub/image1.jpg", "pub/image2.jpg"],
  likes: 42,
  comments: 5,
  commentsList: [
    { id: 1, text: "Super!", author: "Thomas", likes: 2 }
  ],
  userHasLiked: true,
  timestamp: "2026-04-17 10:30:00",
  visibility: "public",
  user_id: 42
}
```

### Objet Commentaire (de getComments)
```javascript
{
  id: 1,
  text: "Commentaire principal",
  author: "Marie",
  username: "@marie_lambert",
  avatar: "imgApp/marie.jpg",
  isAnonymous: false,
  likes: 5,
  timestamp: "2026-04-17 10:30:00",
  user_id: 42,
  parent_id: null,
  replies: [
    {
      id: 2,
      text: "Réponse",
      author: "Thomas",
      likes: 2,
      parent_id: 1
    }
  ]
}
```

---

## 🎯 Cas d'Usage Courants

### 1. Afficher le fil d'actualités

```javascript
async function renderNewsFeed() {
  const response = await fetch('?action=getFeed&limit=50');
  const data = await response.json();
  
  const feedElement = document.getElementById('news-feed');
  feedElement.innerHTML = '';
  
  data.posts.forEach(post => {
    const postHTML = `
      <article class="news-item">
        <h3>${post.author}</h3>
        <p>${post.content}</p>
        <div>${post.images.map(img => `<img src="${img}">`).join('')}</div>
        <button onclick="likeNews(${post.id})">❤️ ${post.likes}</button>
        <button onclick="openComments(${post.id})">💬 ${post.comments}</button>
      </article>
    `;
    feedElement.innerHTML += postHTML;
  });
}

renderNewsFeed();
```

### 2. Modal commentaires avec réponses

```javascript
async function showComments(postId) {
  const response = await fetch(`?action=getComments&post_id=${postId}`);
  const data = await response.json();
  
  const modal = document.getElementById('comments-modal');
  modal.innerHTML = '';
  
  data.comments.forEach(comment => {
    const comEl = document.createElement('div');
    comEl.className = 'comment';
    comEl.innerHTML = `
      <div class="comment-author">${comment.author}</div>
      <div class="comment-text">${comment.text}</div>
      <button onclick="likeComment(${comment.id})">❤️ ${comment.likes}</button>
      <button onclick="replyTo(${comment.id})">Répondre</button>
    `;
    
    // Afficher les réponses imbriquées
    if (comment.replies.length > 0) {
      const repliesEl = document.createElement('div');
      repliesEl.className = 'replies';
      comment.replies.forEach(reply => {
        repliesEl.innerHTML += `
          <div class="reply">
            <span class="reply-author">${reply.author}</span>
            <span class="reply-text">${reply.text}</span>
          </div>
        `;
      });
      comEl.appendChild(repliesEl);
    }
    
    modal.appendChild(comEl);
  });
}
```

### 3. Publier avec images

```javascript
document.getElementById('publish-btn').addEventListener('click', async () => {
  const content = document.getElementById('content-input').value;
  const imageInputs = document.getElementById('image-input').files;
  
  const formData = new FormData();
  formData.append('action', 'createPost');
  formData.append('post_content', content);
  
  Array.from(imageInputs).forEach(file => {
    formData.append('post_images', file);
  });
  
  const response = await fetch('?action=createPost', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    alert('Publication créée!');
    renderNewsFeed(); // Recharger
  }
});
```

---

## ✅ Checklist Implémentation

- [ ] Charger le feed au démarrage
- [ ] Afficher les actualités dans une liste
- [ ] Implémenter bouton like
- [ ] Implémenter bouton commentaires
- [ ] Modal commentaires avec replies
- [ ] Formulaire publication
- [ ] Gestion images (upload + carousel)
- [ ] Suppression publication
- [ ] Tests de cascade delete

---

## 🔐 Points de Sécurité

✅ Authentification requise (session)  
✅ Vérification propriété pour suppression  
✅ Validation longueur commentaires  
✅ Protection SQL injection (PDO)  
✅ Nettoyage fichiers images  

---

## 📚 Documentation Complète

| Fichier | Contenu |
|---------|---------|
| **BACKEND_API.md** | API détaillée + erreurs |
| **INTEGRATION_FRONTEND.md** | Code complet d'intégration |
| **IMPROVEMENTS_SUMMARY.md** | Avant/Après + cas d'usage |
| **VALIDATION_FINAL.md** | Checklist validation |
| **QUICK_START.md** | Ce guide (5 min setup) |

---

## 🚨 Erreurs Courantes

| Erreur | Solution |
|--------|----------|
| "Non authentifié" | Login avant d'appeler l'API |
| Images ne s'affichent pas | Vérifier chemin `imgApp/` ou `pub/` |
| Commentaires orphelins | Utiliser `?action=getComments` pour récupérer hiérarchie |
| Cascade delete ne marche pas | Vérifier user_id == post_user_id |

---

## 💡 Astuces Rapides

```javascript
// Debounce pour éviter les requêtes multiples
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

// Memoize les requêtes GET
const cache = {};
async function getCachedFeed(limit = 50) {
  const key = `feed_${limit}`;
  if (cache[key]) return cache[key];
  
  const response = await fetch(`?action=getFeed&limit=${limit}`);
  const data = await response.json();
  cache[key] = data;
  return data;
}

// Retry automatique sur erreur
async function fetchRetry(url, options, retries = 3) {
  try {
    return await fetch(url, options).then(r => r.json());
  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return fetchRetry(url, options, retries - 1);
    }
    throw e;
  }
}
```

---

## 🎉 Vous Êtes Prêt!

Le backend est **100% fonctionnel**. Copiez-collez les exemples ci-dessus et commencez à intégrer!

**Questions?** Consultez la documentation complète dans les fichiers `.md` du projet.
