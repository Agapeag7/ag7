/**
 * ACTUS FRONTEND - SYSTÈME COMPLET
 * ========================================
 * Gestion dynamique des publications, likes, commentaires
 */

// ===== ÉTAT GLOBAL =====
let actusState = {
  posts: [],
  isLoading: false,
  offset: 0,
  limit: 50
};

// postImages et currentUserId sont déclarés globalement
let currentUserId = null;

// ===== INITIALISATION AU CHARGEMENT =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initialisation Actus...');
  
  // Récupérer l'ID utilisateur
  fetchCurrentUser();
  
  // Attendre que la navigation soit disponible
  setTimeout(() => {
    setupActusNavigation();
    setupActusUI();
  }, 500);
});

// ===== CONFIGURATION NAVIGATION ACTUS =====
function setupActusNavigation() {
  // Observer les changements de vue
  const feedView = document.getElementById('view-feed');
  if (!feedView) {
    console.warn('⚠️ Vue feed introuvable');
    return;
  }
  
  // Charger le feed quand la vue devient visible
  const observer = new MutationObserver(() => {
    if (feedView.classList.contains('active') && !actusState.posts.length && !actusState.isLoading) {
      console.log('📡 Vue Actus active, chargement du feed...');
      loadActusFeed();
    }
  });
  
  observer.observe(feedView, { attributes: true });
}

// ===== CONFIGURATION UI ACTUS =====
function setupActusUI() {
  // Bouton publication
  const publishBtn = document.getElementById('publishPostBtn');
  if (publishBtn) {
    publishBtn.addEventListener('click', handlePublishPost);
  }
  
  // Bouton ajout image
  const addImageBtn = document.getElementById('addImageBtn');
  if (addImageBtn) {
    addImageBtn.addEventListener('click', () => {
      document.getElementById('postImageInput').click();
    });
  }
  
  // Input images
  const imageInput = document.getElementById('postImageInput');
  if (imageInput) {
    imageInput.addEventListener('change', handleImageSelect);
  }
  
  // Bouton effacer images
  const clearImagesBtn = document.getElementById('clearImagesBtn');
  if (clearImagesBtn) {
    clearImagesBtn.addEventListener('click', () => {
      postImages = [];
      renderImagePreview();
    });
  }
  
  console.log('✅ UI Actus configurée');
}

// ===== RÉCUPÉRER L'UTILISATEUR COURANT =====
async function fetchCurrentUser() {
  try {
    const response = await fetch(`${window.location.href}?action=getCurrentProfile`, {
      method: 'GET'
    });
    const data = await response.json();
    
    if (data.success && data.profile) {
      currentUserId = data.profile.user_id;
      console.log('✅ Utilisateur courant:', currentUserId);
      
      // Mettre à jour l'avatar de création de post
      const avatar = document.getElementById('createPostAvatar');
      if (avatar && data.profile.user_photo_url) {
        avatar.style.backgroundImage = `url('imgApp/${data.profile.user_photo_url}')`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'utilisateur:', error);
  }
}

// ===== AFFICHER LE FEED =====
async function loadActusFeed() {
  if (actusState.isLoading) return;
  
  actusState.isLoading = true;
  console.log('📥 Chargement du feed...');
  
  try {
    const result = await ActusAPI.getFeed(actusState.limit, actusState.offset);
    
    if (!result.success) {
      showNotification('error', 'Erreur', result.message);
      actusState.isLoading = false;
      return;
    }
    
    actusState.posts = result.posts || [];
    console.log(`✅ ${actusState.posts.length} posts chargés`);
    renderActusFeed();
    
  } catch (error) {
    console.error('Erreur loadActusFeed:', error);
    showNotification('error', 'Erreur', 'Impossible de charger le feed');
  }
  
  actusState.isLoading = false;
}

// ===== RENDRE LE FEED =====
function renderActusFeed() {
  const feedContainer = document.getElementById('feedContainer');
  if (!feedContainer) return;
  
  console.log(`🎨 Rendu de ${actusState.posts.length} posts`);
  feedContainer.innerHTML = '';
  
  if (actusState.posts.length === 0) {
    feedContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Aucune publication pour le moment</p>';
    return;
  }
  
  actusState.posts.forEach(post => {
    feedContainer.appendChild(createPostElement(post));
  });
  
  attachPostEvents();
}

// ===== CRÉER UN ÉLÉMENT POST =====
function createPostElement(post) {
  const postDiv = document.createElement('div');
  postDiv.className = 'post-card';
  postDiv.dataset.id = post.id;
  
  const canDelete = currentUserId && post.user_id === currentUserId;
  const isLiked = post.userHasLiked;
  
  // Header
  let headerHTML = `
    <div class="post-header">
      <div class="post-avatar" style="background-image: url('${post.avatar || 'https://via.placeholder.com/40'}'); background-size: cover; background-position: center;">
        ${!post.avatar ? post.author?.substring(0, 2).toUpperCase() || 'AG' : ''}
      </div>
      <div>
        <div class="post-author">${post.author}</div>
        <div class="post-time">${formatTime(post.timestamp)}</div>
      </div>
      ${canDelete ? `<button class="post-delete-btn" data-post-id="${post.id}" style="margin-left: auto; background: none; border: none; color: var(--text-secondary); cursor: pointer;"><i class="fas fa-trash"></i></button>` : ''}
    </div>`;
  
  // Content
  let contentHTML = `<div class="post-content"><p>${escapeHtml(post.content)}</p>`;
  
  // Images
  if (post.images && post.images.length > 0) {
    contentHTML += `
      <div class="post-image-container">
        <button class="feed-image-prev" data-id="${post.id}" ${post.images.length === 1 ? 'style="opacity: 0.3; cursor: default;"' : ''}>
          <i class="fas fa-chevron-left"></i>
        </button>
        <img src="${post.images[0]}" class="post-image" data-post-id="${post.id}" data-index="0" alt="image post" loading="lazy">
        ${post.images.length > 1 ? `<button class="feed-image-next" data-id="${post.id}"><i class="fas fa-chevron-right"></i></button>` : ''}
        ${post.images.length > 1 ? `<div class="feed-image-counter">1 / ${post.images.length}</div>` : ''}
      </div>`;
  }
  
  contentHTML += `</div>`;
  
  // Stats
  let statsHTML = `
    <div class="post-stats">
      <span>${post.likes} J'aime</span>
      <span>${post.comments ? post.comments.length : 0} Commentaires</span>
    </div>`;
  
  // Actions
  let actionsHTML = `
    <div class="post-actions">
      <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}" style="color: ${isLiked ? '#ef4444' : 'var(--text-secondary)'};">
        <i class="fas fa-heart"></i> ${isLiked ? 'Aimé' : 'J\'aime'}
      </button>
      <button class="post-action-btn comment-btn" data-post-id="${post.id}">
        <i class="fas fa-comment"></i> Commenter
      </button>
    </div>`;
  
  // Comments section
  let commentsHTML = `
    <div class="comments-section">
      <div class="comments-list"></div>
      <div class="comment-input">
        <input type="text" placeholder="Ajouter un commentaire..." class="new-comment-input" maxlength="500">
        <label class="anonymous-toggle">
          <input type="checkbox" class="anonymous-checkbox">
          <i class="fas fa-mask"></i>
        </label>
        <button class="submit-comment" data-post-id="${post.id}">Envoyer</button>
      </div>
    </div>`;
  
  postDiv.innerHTML = headerHTML + contentHTML + statsHTML + actionsHTML + commentsHTML;
  
  // Gestion carousel images
  if (post.images && post.images.length > 1) {
    let currentImageIndex = 0;
    
    const updateCarousel = () => {
      const img = postDiv.querySelector('.post-image');
      const counter = postDiv.querySelector('.feed-image-counter');
      const prevBtn = postDiv.querySelector('.feed-image-prev');
      const nextBtn = postDiv.querySelector('.feed-image-next');
      
      img.src = post.images[currentImageIndex];
      counter.textContent = `${currentImageIndex + 1} / ${post.images.length}`;
      
      prevBtn.style.opacity = currentImageIndex === 0 ? '0.3' : '1';
      prevBtn.style.cursor = currentImageIndex === 0 ? 'default' : 'pointer';
      nextBtn.style.opacity = currentImageIndex === post.images.length - 1 ? '0.3' : '1';
      nextBtn.style.cursor = currentImageIndex === post.images.length - 1 ? 'default' : 'pointer';
    };
    
    const prevBtn = postDiv.querySelector('.feed-image-prev');
    const nextBtn = postDiv.querySelector('.feed-image-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentImageIndex > 0) {
          currentImageIndex--;
          updateCarousel();
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentImageIndex < post.images.length - 1) {
          currentImageIndex++;
          updateCarousel();
        }
      });
    }
  }
  
  return postDiv;
}

// ===== ATTACHER LES ÉVÉNEMENTS AUX POSTS =====
function attachPostEvents() {
  // Likes
  document.querySelectorAll('.post-action-btn.like-btn').forEach(btn => {
    btn.addEventListener('click', handleLike);
  });
  
  // Afficher/cacher commentaires
  document.querySelectorAll('.post-action-btn.comment-btn').forEach(btn => {
    btn.addEventListener('click', handleToggleComments);
  });
  
  // Soumettre commentaire
  document.querySelectorAll('.submit-comment').forEach(btn => {
    btn.addEventListener('click', handleSubmitComment);
  });
  
  // Supprimer post
  document.querySelectorAll('.post-delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeletePost);
  });
  
  // Afficher images en modal
  document.querySelectorAll('.post-image').forEach(img => {
    img.addEventListener('click', function() {
      const postId = this.dataset.postId;
      const post = actusState.posts.find(p => p.id == postId);
      if (post && post.images.length > 0) {
        openImageViewer(post.images, parseInt(this.dataset.index));
      }
    });
  });
}

// ===== LIKE =====
async function handleLike(e) {
  const btn = e.currentTarget;
  const postId = parseInt(btn.dataset.postId);
  const post = actusState.posts.find(p => p.id === postId);
  
  if (!post) return;
  
  btn.disabled = true;
  const result = await ActusAPI.toggleLike(postId);
  btn.disabled = false;
  
  if (result.success) {
    post.userHasLiked = result.isLiked;
    post.likes = result.likes_count;
    
    // Mettre à jour le bouton
    btn.style.color = result.isLiked ? '#ef4444' : 'var(--text-secondary)';
    btn.innerHTML = `<i class="fas fa-heart" style="color: inherit;"></i> ${result.isLiked ? 'Aimé' : 'J\'aime'}`;
    
    // Mettre à jour le compteur de stats
    const postCard = btn.closest('.post-card');
    const statsDiv = postCard.querySelector('.post-stats');
    const likeCount = postCard.querySelector('.post-stats span:first-child');
    if (likeCount) {
      likeCount.textContent = `${post.likes} J'aime`;
    }
    
    showNotification('success', '', result.isLiked ? 'Post aimé !' : 'Like retiré');
  } else {
    showNotification('error', 'Erreur', result.message);
  }
}

// ===== AFFICHER/CACHER COMMENTAIRES =====
function handleToggleComments(e) {
  const btn = e.currentTarget;
  const postCard = btn.closest('.post-card');
  const commentSection = postCard.querySelector('.comments-section');
  
  if (commentSection.style.display === 'none') {
    commentSection.style.display = 'block';
    loadPostComments(parseInt(postCard.dataset.id));
  } else {
    commentSection.style.display = 'none';
  }
}

// ===== CHARGER LES COMMENTAIRES =====
async function loadPostComments(postId) {
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
    commentEl.innerHTML = `<strong style="margin-right: 8px;">${comment.isAnonymous ? 'Anonyme' : comment.author}</strong> ${escapeHtml(comment.text)}`;
    commentsList.appendChild(commentEl);
  });
  
  // Attacher événements likes commentaires
  postCard.querySelectorAll('.comment-like-btn').forEach(btn => {
    btn.addEventListener('click', handleCommentLike);
  });
}

// ===== SOUMETTRE COMMENTAIRE =====
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
  
  if (result.success) {
    showNotification('success', 'Succès', 'Commentaire ajouté');
    input.value = '';
    anonCheckbox.checked = false;
    
    // Recharger les commentaires
    loadPostComments(postId);
  } else {
    showNotification('error', 'Erreur', result.message);
  }
}

// ===== LIKE COMMENTAIRE =====
async function handleCommentLike(e) {
  const btn = e.currentTarget;
  const commentId = parseInt(btn.dataset.commentId);
  
  btn.disabled = true;
  const result = await ActusAPI.toggleCommentLike(commentId);
  btn.disabled = false;
  
  if (result.success) {
    btn.textContent = `👍 ${result.likes_count}`;
  } else {
    showNotification('error', 'Erreur', result.message);
  }
}

// ===== SUPPRIMER POST =====
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

// ===== PUBLIER UN POST =====
async function handlePublishPost(e) {
  const content = document.getElementById('postContent').value.trim();
  
  if (!content && postImages.length === 0) {
    showNotification('warning', 'Champs vides', 'Écrivez du texte ou ajoutez une image');
    return;
  }
  
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.textContent = 'Publication en cours...';
  
  // Collecteur les fichiers images
  const imageFiles = postImages
    .filter(img => img.file)
    .map(img => img.file);
  
  const result = await ActusAPI.createPost(content, 'public', imageFiles);
  
  btn.disabled = false;
  btn.textContent = 'Publier';
  
  if (result.success) {
    showNotification('success', 'Publié', result.message);
    document.getElementById('postContent').value = '';
    postImages = [];
    renderImagePreview();
    
    // Recharger le feed
    setTimeout(() => {
      loadActusFeed();
    }, 500);
  } else {
    showNotification('error', 'Erreur', result.message);
  }
}

// ===== SÉLECTIONNER IMAGES =====
function handleImageSelect(e) {
  const files = Array.from(e.target.files);
  
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      postImages.push({
        src: event.target.result,
        file: file
      });
      renderImagePreview();
    };
    reader.readAsDataURL(file);
  });
  
  e.target.value = '';
}

// ===== AFFICHER APERÇU IMAGES =====
function renderImagePreview() {
  const preview = document.getElementById('postImagesPreview');
  const grid = preview.querySelector('.preview-grid');
  
  if (postImages.length === 0) {
    preview.style.display = 'none';
    return;
  }
  
  preview.style.display = 'block';
  grid.innerHTML = '';
  
  postImages.forEach((img, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden;';
    div.innerHTML = `
      <img src="${img.src}" style="width: 100%; height: 150px; object-fit: cover;">
      <button data-index="${idx}" style="position: absolute; top: 4px; right: 4px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.7); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
        ✕
      </button>
    `;
    
    const removeBtn = div.querySelector('button');
    removeBtn.addEventListener('click', () => {
      postImages.splice(idx, 1);
      renderImagePreview();
    });
    
    grid.appendChild(div);
  });
}

// ===== VIEWER IMAGES =====
function openImageViewer(images, startIndex = 0) {
  const modal = document.getElementById('imageCarouselModal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  let currentIndex = startIndex;
  
  function updateImage() {
    const img = modal.querySelector('#carouselImage');
    const counter = modal.querySelector('#imageCounter');
    img.src = images[currentIndex];
    counter.textContent = `${currentIndex + 1} / ${images.length}`;
  }
  
  updateImage();
  
  const closeBtn = modal.querySelector('.carousel-close');
  const prevBtn = modal.querySelector('.carousel-prev');
  const nextBtn = modal.querySelector('.carousel-next');
  
  closeBtn.onclick = () => modal.classList.add('hidden');
  prevBtn.onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateImage();
    }
  };
  nextBtn.onclick = () => {
    if (currentIndex < images.length - 1) {
      currentIndex++;
      updateImage();
    }
  };
}

// ===== UTILITAIRES =====

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

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getUserId() {
  return currentUserId || 0;
}
