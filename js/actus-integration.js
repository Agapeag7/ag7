/**
 * INTÉGRATION ACTUS - Frontend
 * ========================================
 * Fonctions pour lier l'API Actus au frontend
 */

// Variables de gestion du feed
let actusState = {
  posts: [],
  currentPostId: null,
  isLoading: false,
  offset: 0,
  limit: 50
};

/**
 * Charger le feed depuis l'API
 */
async function loadActusFeed() {
  if (actusState.isLoading) return;
  
  actusState.isLoading = true;
  const result = await ActusAPI.getFeed(actusState.limit, actusState.offset);
  actusState.isLoading = false;

  if (!result.success) {
    showNotification('error', 'Erreur', result.message);
    return false;
  }

  // Transformer et stocker les posts
  actusState.posts = result.posts.map(post => ({
    id: post.id,
    author: post.author,
    username: post.username,
    avatar: post.avatar,
    content: post.content,
    images: post.images || [],
    timestamp: post.timestamp,
    likes: post.likes,
    comments: post.comments || [],
    userHasLiked: post.userHasLiked,
    visibility: post.visibility,
    user_id: post.user_id
  }));

  renderActusFeed();
  return true;
}

/**
 * Rendre le feed
 */
function renderActusFeed() {
  const feedContainer = document.getElementById('feedContainer');
  if (!feedContainer) return;

  feedContainer.innerHTML = '';

  actusState.posts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'post-card';
    postEl.dataset.id = post.id;
    postEl.innerHTML = `
      <div class="post-header">
        <div class="post-author">
          <img src="${post.avatar || 'https://via.placeholder.com/40'}" alt="${post.author}" class="author-avatar" loading="lazy">
          <div>
            <strong>${post.author}</strong>
            <span class="post-time">${formatTime(post.timestamp)}</span>
          </div>
        </div>
        ${post.user_id === getUserId() ? `
          <button class="post-delete-btn" data-post-id="${post.id}">
            <i class="fas fa-trash"></i>
          </button>
        ` : ''}
      </div>

      <div class="post-content">${post.content}</div>

      ${post.images.length > 0 ? `
        <div class="post-images">
          ${post.images.map(img => `
            <img src="${img}" alt="post" class="post-image" loading="lazy">
          `).join('')}
        </div>
      ` : ''}

      <div class="post-stats">
        <span>${post.likes} J'aime</span>
        <span>${post.comments.length} Commentaires</span>
      </div>

      <div class="post-actions">
        <button class="post-like-btn" data-post-id="${post.id}" ${post.userHasLiked ? 'class="post-like-btn liked"' : ''}>
          <i class="fas fa-heart"></i> J'aime
        </button>
        <button class="post-comment-btn" data-post-id="${post.id}">
          <i class="fas fa-comment"></i> Commentaire
        </button>
      </div>

      <div class="post-comments-section" style="display: none;">
        <div class="comments-list"></div>
        <div class="comment-input-area">
          <input type="text" class="new-comment-input" placeholder="Ajouter un commentaire..." maxlength="500">
          <label class="anonymous-label">
            <input type="checkbox" class="anonymous-checkbox">
            Anonyme
          </label>
          <button class="submit-comment-btn" data-post-id="${post.id}">Envoyer</button>
        </div>
      </div>
    `;

    feedContainer.appendChild(postEl);
  });

  // Attacher les événements
  attachActusEvents();
}

/**
 * Attacher les événements aux posts
 */
function attachActusEvents() {
  // Like sur publication
  document.querySelectorAll('.post-like-btn').forEach(btn => {
    btn.addEventListener('click', handleActusLike);
  });

  // Ouvrir les commentaires
  document.querySelectorAll('.post-comment-btn').forEach(btn => {
    btn.addEventListener('click', handleToggleComments);
  });

  // Soumettre commentaire
  document.querySelectorAll('.submit-comment-btn').forEach(btn => {
    btn.addEventListener('click', handleSubmitComment);
  });

  // Supprimer post
  document.querySelectorAll('.post-delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeletePost);
  });
}

/**
 * Gérer le like sur une publication
 */
async function handleActusLike(e) {
  const btn = e.currentTarget;
  const postId = parseInt(btn.dataset.postId);
  const post = actusState.posts.find(p => p.id === postId);

  if (!post) return;

  btn.disabled = true;
  const result = await ActusAPI.toggleLike(postId);
  btn.disabled = false;

  if (!result.success) {
    showNotification('error', 'Erreur', result.message);
    return;
  }

  // Mettre à jour l'état local
  post.userHasLiked = result.isLiked;
  post.likes = result.likes_count;

  // Mettre à jour le UI
  btn.classList.toggle('liked', result.isLiked);
  btn.innerHTML = `<i class="fas fa-heart"></i> ${result.isLiked ? 'Aimé' : 'J\'aime'}`;
  
  // Mettre à jour le compteur
  const statsDiv = btn.closest('.post-card').querySelector('.post-stats');
  if (statsDiv) {
    statsDiv.innerHTML = `
      <span>${post.likes} J'aime</span>
      <span>${post.comments.length} Commentaires</span>
    `;
  }
}

/**
 * Ouvrir/Fermer la section des commentaires
 */
function handleToggleComments(e) {
  const btn = e.currentTarget;
  const postCard = btn.closest('.post-card');
  const commentSection = postCard.querySelector('.post-comments-section');

  if (commentSection.style.display === 'none') {
    commentSection.style.display = 'block';
    loadActusComments(parseInt(postCard.dataset.id));
  } else {
    commentSection.style.display = 'none';
  }
}

/**
 * Charger les commentaires d'une publication
 */
async function loadActusComments(postId) {
  const result = await ActusAPI.getComments(postId);

  if (!result.success) {
    showNotification('error', 'Erreur', result.message);
    return;
  }

  const postCard = document.querySelector(`[data-id="${postId}"]`);
  const commentsList = postCard.querySelector('.comments-list');
  commentsList.innerHTML = '';

  result.comments.forEach(comment => {
    const commentEl = document.createElement('div');
    commentEl.className = 'comment-item';
    commentEl.innerHTML = `
      <div class="comment-header">
        <strong>${comment.isAnonymous ? 'Anonyme' : comment.author}</strong>
        <span class="comment-time">maintenant</span>
      </div>
      <div class="comment-text">${comment.text}</div>
      <div class="comment-actions">
        <button class="comment-like-btn" data-comment-id="${comment.id}">
          👍 ${comment.likes}
        </button>
        <button class="comment-reply-btn" data-comment-id="${comment.id}" data-post-id="${postId}">
          💬 Répondre
        </button>
        ${comment.user_id === getUserId() ? `
          <button class="comment-delete-btn" data-comment-id="${comment.id}">
            🗑️
          </button>
        ` : ''}
      </div>
      ${comment.replies && comment.replies.length > 0 ? `
        <div class="replies-section">
          ${comment.replies.map(reply => `
            <div class="reply-item">
              <strong>${reply.isAnonymous ? 'Anonyme' : reply.author}</strong>: ${reply.text}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    commentsList.appendChild(commentEl);
  });

  // Attacher les événements des commentaires
  postCard.querySelectorAll('.comment-like-btn').forEach(btn => {
    btn.addEventListener('click', handleCommentLike);
  });

  postCard.querySelectorAll('.comment-delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteComment);
  });
}

/**
 * Soumettre un nouveau commentaire
 */
async function handleSubmitComment(e) {
  const btn = e.currentTarget;
  const postId = parseInt(btn.dataset.postId);
  const postCard = document.querySelector(`[data-id="${postId}"]`);
  const input = postCard.querySelector('.new-comment-input');
  const anonCheckbox = postCard.querySelector('.anonymous-checkbox');

  const text = input.value.trim();
  if (!text) {
    showNotification('warning', 'Champ vide', 'Écrivez un commentaire');
    return;
  }

  btn.disabled = true;
  const result = await ActusAPI.addComment(postId, text, null, anonCheckbox.checked);
  btn.disabled = false;

  if (!result.success) {
    showNotification('error', 'Erreur', result.message);
    return;
  }

  showNotification('success', 'Succès', 'Commentaire ajouté');
  input.value = '';
  anonCheckbox.checked = false;

  // Recharger les commentaires
  loadActusComments(postId);
}

/**
 * Like sur un commentaire
 */
async function handleCommentLike(e) {
  const btn = e.currentTarget;
  const commentId = parseInt(btn.dataset.commentId);

  btn.disabled = true;
  const result = await ActusAPI.toggleCommentLike(commentId);
  btn.disabled = false;

  if (result.success) {
    btn.innerHTML = `👍 ${result.likes_count}`;
  } else {
    showNotification('error', 'Erreur', result.message);
  }
}

/**
 * Supprimer une publication
 */
async function handleDeletePost(e) {
  const btn = e.currentTarget;
  const postId = parseInt(btn.dataset.postId);

  if (!confirm('Supprimer cette publication ?')) return;

  btn.disabled = true;
  const result = await ActusAPI.deletePost(postId);
  btn.disabled = false;

  if (result.success) {
    showNotification('success', 'Supprimé', result.message);
    actusState.posts = actusState.posts.filter(p => p.id !== postId);
    renderActusFeed();
  } else {
    showNotification('error', 'Erreur', result.message);
  }
}

/**
 * Supprimer un commentaire
 */
async function handleDeleteComment(e) {
  const btn = e.currentTarget;
  const commentId = parseInt(btn.dataset.commentId);

  if (!confirm('Supprimer ce commentaire ?')) return;

  btn.disabled = true;
  const result = await ActusAPI.deleteComment(commentId);
  btn.disabled = false;

  if (result.success) {
    showNotification('success', 'Supprimé', result.message);
    // Recharger les commentaires de la publication
    const postCard = btn.closest('.post-card');
    if (postCard) {
      loadActusComments(parseInt(postCard.dataset.id));
    }
  } else {
    showNotification('error', 'Erreur', result.message);
  }
}

/**
 * Créer une nouvelle publication
 */
async function createActusPost(content, images = []) {
  if (!content && images.length === 0) {
    showNotification('warning', 'Vide', 'Écrivez du texte ou ajoutez une image');
    return false;
  }

  const result = await ActusAPI.createPost(content, 'public', images);

  if (result.success) {
    showNotification('success', 'Publié', result.message);
    // Recharger le feed
    await loadActusFeed();
    return true;
  } else {
    showNotification('error', 'Erreur', result.message);
    return false;
  }
}

/**
 * Utilitaires
 */

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'à l\'instant';
  if (diff < hour) return `il y a ${Math.floor(diff / minute)}m`;
  if (diff < day) return `il y a ${Math.floor(diff / hour)}h`;
  
  return date.toLocaleDateString('fr-FR');
}

function getUserId() {
  // À implémenter selon votre système d'authentification
  return sessionStorage.getItem('user_id') || 0;
}

// ===== Initialisation au chargement =====
document.addEventListener('DOMContentLoaded', () => {
  // Au clique sur le tab "Actus"
  const feedView = document.getElementById('view-feed');
  if (feedView) {
    loadActusFeed();
  }
});
