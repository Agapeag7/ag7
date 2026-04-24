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

let postImages = [];

// ===== INITIALISATION AU CHARGEMENT =====
async function initActus() {
    // Toujours attacher les écouteurs, même si l'application est cachée
    await fetchCurrentUser();      // échoue gracieusement si pas connecté
    setupActusNavigation();
    setupActusUI();                // ← indispensable pour le bouton Publier

    // Ne charger le feed que si la section app est visible
    if (!document.getElementById('app-section').classList.contains('hidden')) {
        await loadActusFeed();
    }
    setTimeout(() => { setupDeleteModal(); }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initActus);
} else {
    initActus();
}

// ===== CONFIGURATION NAVIGATION ACTUS =====
function setupActusNavigation() {
  // Observer les changements de vue
  const feedView = document.getElementById('view-feed');
  if (!feedView) {
    console.warn('⚠️ Vue feed introuvable');
    return;
  }
  
  // NOTE: LoadActusFeed est appelé explicitement dans DOMContentLoaded
  // NO NEED pour observer - évite les double-chargements
  // L'observer ici est juste un fallback si la vue devient visible après
  let observerActive = false;
  
  const observer = new MutationObserver(() => {
    // Load seulement si pas encore chargé ET si pas déjà en cours
    if (feedView.classList.contains('active') && !actusState.posts.length && !actusState.isLoading && !observerActive) {
      observerActive = true;
      loadActusFeed().then(() => {
        observerActive = false;
      });
    }
  });
  
  observer.observe(feedView, { attributes: true });
}

// ===== CONFIGURATION UI ACTUS =====
function setupActusUI() {
  // Bouton publication
  document.addEventListener('click', (e) => {
    if (e.target.id === 'publishPostBtn' || e.target.closest('#publishPostBtn')) {
      e.preventDefault();
      handlePublishPost(e);
    }
  });
  
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
  
  // Setup modal suppression
  setupDeleteModal();
}

// ===== RÉCUPÉRER L'UTILISATEUR COURANT =====
async function fetchCurrentUser() {
  try {
    const response = await fetch(`${window.location.href}?action=getCurrentProfile`, {
      method: 'GET'
    });
    
    // Vérifier le statut de la réponse
    if (!response.ok) {
      console.warn('⚠️ getCurrentProfile non disponible (status:', response.status + ')');
      return;
    }
    
    // Vérifier que c'est du JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('⚠️ Réponse non-JSON (content-type:', contentType + ')');
      return;
    }
    
    const data = await response.json();
    
    if (data.success && data.profile) {
      currentUserId = data.profile.user_id;
      
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
    console.warn('⚠️ Erreur lors du chargement de l\'utilisateur (non-critique):', error.message);
  }
}

// ===== AFFICHER LE FEED =====
async function loadActusFeed() {
  if (actusState.isLoading) return;
  
  actusState.isLoading = true;
  
  try {
    const result = await ActusAPI.getFeed(actusState.limit, actusState.offset);
    
    if (!result.success) {
      showNotification('error', 'Erreur', result.message);
      actusState.isLoading = false;
      return;
    }
    
    // 🔑 IMPORTANT: Set currentUserId from the backend response!
    if (result.current_user_id) {
      currentUserId = result.current_user_id;
    }
    
    actusState.posts = result.posts || [];
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
  if (!feedContainer) {
    console.error('feedContainer NOT FOUND');
    return;
  }
  
  feedContainer.innerHTML = '';
  
  if (actusState.posts.length === 0) {
    feedContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Aucune publication pour le moment</p>';
    return;
  }
  
  actusState.posts.forEach((post, idx) => {
    feedContainer.appendChild(createPostElement(post));
  });
  
  attachPostEvents();
}

// ===== CRÉER UN ÉLÉMENT POST =====
function createPostElement(post) {
  const postDiv = document.createElement('div');
  postDiv.className = 'post-card';
  postDiv.dataset.id = post.id;
  
  const canDelete = currentUserId && parseInt(currentUserId) === parseInt(post.user_id);
  
  // DEBUG: Log pour chaque post
  
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
      <button class="post-delete-btn" data-post-id="${post.id}" onclick="handleDeletePost(event)" style="margin-left: auto; background: none; border: none; color: var(--text-secondary); cursor: pointer; ${!canDelete ? 'display: none;' : ''}"><i class="fas fa-trash"></i></button>
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
      <span>${post.likes || 0} J'aime</span>
      <span>${post.comments || 0} Commentaires</span>
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
  
  // Comments section (cachée par défaut)
  let commentsHTML = `
    <div class="comments-section" style="display: none;">
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
  
  postDiv.innerHTML = headerHTML + contentHTML + statsHTML + actionsHTML;
  
  // Afficher l'aperçu des commentaires pré-chargés
  if (post.commentsList && post.commentsList.length > 0) {
    const commentsPreview = document.createElement('div');
    commentsPreview.className = 'post-comments-preview';
    commentsPreview.style.marginTop = '8px';
    commentsPreview.style.marginLeft = '15px';
    commentsPreview.style.marginRight = '15px';
    commentsPreview.style.padding = '0 0 12px';
    commentsPreview.style.borderTop = '1px solid var(--border-light)';
    
    post.commentsList.slice(0, 3).forEach(comment => {
      const commentLine = document.createElement('div');
      commentLine.className = 'comment-preview-item';
      commentLine.style.fontSize = '13px';
      commentLine.style.marginTop = '8px';
      commentLine.style.color = 'var(--text-secondary)';
      const authorDisplay = comment.isAnonymous 
        ? '<i class="fas fa-mask" style="margin-right: 4px;"></i><strong>Anonyme</strong>'
        : `<strong>${escapeHtml(comment.author)}</strong>`;
      
      // Tronquer le commentaire à 50 caractères
      let commentText = comment.text;
      if (commentText.length > 50) {
        commentText = commentText.substring(0, 50) + '…';
      }
      
      commentLine.innerHTML = `${authorDisplay} <span style="margin-left: 6px;">${escapeHtml(commentText)}</span>`;
      commentsPreview.appendChild(commentLine);
    });
    
    if (post.comments > 3) {
      const moreBtn = document.createElement('div');
      moreBtn.className = 'see-more-comments';
      moreBtn.style.fontSize = '12px';
      moreBtn.style.marginTop = '8px';
      moreBtn.style.color = 'var(--emerald-500)';
      moreBtn.style.cursor = 'pointer';
      moreBtn.style.fontWeight = '500';
      moreBtn.innerHTML = `<i class="fas fa-comments"></i> Voir les ${post.comments} commentaires`;
      moreBtn.addEventListener('click', () => openCommentsModal(post.id));
      commentsPreview.appendChild(moreBtn);
    }
    
    postDiv.appendChild(commentsPreview);
  }
  
  // Gestion carousel images
  if (post.images && post.images.length > 1) {
    let currentImageIndex = 0;
    const imgEl = postDiv.querySelector('.post-image');
    const prevBtn = postDiv.querySelector('.feed-image-prev');
    const nextBtn = postDiv.querySelector('.feed-image-next');
    const counter = postDiv.querySelector('.feed-image-counter');

    const updateCarousel = () => {
      imgEl.src = post.images[currentImageIndex];
      counter.textContent = `${currentImageIndex + 1} / ${post.images.length}`;
      prevBtn.style.opacity = currentImageIndex === 0 ? '0.3' : '1';
      nextBtn.style.opacity = currentImageIndex === post.images.length - 1 ? '0.3' : '1';
    };

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentImageIndex > 0) {
        currentImageIndex--;
        updateCarousel();
      }
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentImageIndex < post.images.length - 1) {
        currentImageIndex++;
        updateCarousel();
      }
    });
  }
  
  return postDiv;
}

// ===== ATTACHER LES ÉVÉNEMENTS AUX POSTS =====
function attachPostEvents() {
  try {
    
    const likeBtns = document.querySelectorAll('.post-action-btn.like-btn');
    
    likeBtns.forEach(btn => {
      btn.addEventListener('click', handleLike);
    });
    
    const commentBtns = document.querySelectorAll('.post-action-btn.comment-btn');
    
    commentBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = parseInt(btn.dataset.postId);
        openCommentsModal(postId);
      });
    });
    
  } catch(e) {
    console.error('💥 ERROR in attachPostEvents():', e.message, e.stack);
  }
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

// ===== MODAL COMMENTAIRES =====
async function openCommentsModal(postId) {
  const modal = document.getElementById('commentsModal');
  const listContainer = modal.querySelector('.all-comments-list') || modal.querySelector('.comments-list') || modal;
  const commentInput = modal.querySelector('.modal-comment-input') || modal.querySelector('input[type="text"]');
  const anonCheckbox = modal.querySelector('.modal-anonymous-checkbox') || modal.querySelector('input[type="checkbox"]');
  const submitBtn = modal.querySelector('.modal-submit-comment') || modal.querySelector('button');
  const closeBtn = modal.querySelector('.comments-modal-close');

  // Afficher l'état de chargement
  listContainer.innerHTML = '<div style="text-align:center; padding:20px; color: var(--text-secondary);">Chargement des commentaires...</div>';
  modal.classList.remove('hidden');

  // Gérer la fermeture du modal
  const closeHandler = () => { modal.classList.add('hidden'); };
  if (closeBtn) closeBtn.onclick = closeHandler;
  
  // Fermer le modal en cliquant en dehors
  modal.onclick = (e) => {
    if (e.target === modal) closeHandler();
  };

  // Charger les commentaires
  const result = await ActusAPI.getComments(postId);
  if (!result.success) {
    listContainer.innerHTML = `<div style="color: var(--text-secondary);">Erreur : ${result.message}</div>`;
    return;
  }

  const comments = result.comments;
  listContainer.innerHTML = '';

  if (!comments.length) {
    listContainer.innerHTML = '<div style="text-align:center; padding:20px; color: var(--text-secondary);">Aucun commentaire pour le moment.</div>';
  } else {
    comments.forEach(comment => {
      const commentEl = createCommentElement(comment, postId);
      listContainer.appendChild(commentEl);
    });
  }

  // Gérer l'envoi d'un nouveau commentaire
  const sendComment = async () => {
    const text = commentInput.value.trim();
    if (!text) {
      showNotification('warning', 'Champ vide', 'Écrivez un commentaire');
      return;
    }
    submitBtn.disabled = true;
    const addResult = await ActusAPI.addComment(postId, text, null, anonCheckbox?.checked || false);
    submitBtn.disabled = false;
    if (addResult.success) {
      showNotification('success', 'Succès', 'Commentaire ajouté');
      commentInput.value = '';
      if (anonCheckbox) anonCheckbox.checked = false;
      await openCommentsModal(postId);
      updatePostCommentCount(postId);
    } else {
      showNotification('error', 'Erreur', addResult.message);
    }
  };

  submitBtn.onclick = sendComment;
  commentInput.onkeypress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendComment();
    }
  };
}

// ===== CRÉER ÉLÉMENT COMMENTAIRE =====
function createCommentElement(comment, postId, isReply = false) {
  const wrapper = document.createElement('div');
  wrapper.className = `comment-item-full ${isReply ? 'reply-item' : ''}`;
  wrapper.style.background = isReply ? 'var(--hover-bg)' : 'var(--card-bg)';
  wrapper.style.borderBottom = isReply ? 'none' : '1px solid var(--border-light)';
  wrapper.style.padding = '12px';
  wrapper.style.marginBottom = '8px';
  wrapper.style.borderRadius = '12px';
  
  const authorHtml = comment.isAnonymous
    ? `<i class="fas fa-mask" style="margin-right: 6px;"></i><strong>Anonyme</strong>`
    : `<strong>${escapeHtml(comment.author)}</strong>`;

  const date = new Date(comment.timestamp);
  const timeStr = date.toLocaleString('fr-FR', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' });

  wrapper.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div>${authorHtml} <span style="font-size:12px; color:var(--text-secondary);">• ${timeStr}</span></div>
      <button class="comment-like-btn" data-comment-id="${comment.id}" style="background:none; border:none; cursor:pointer; color: var(--text-secondary); transition: 0.2s; padding: 4px 8px;">
        <i class="fas fa-heart"></i> <span class="like-count">${comment.likes}</span>
      </button>
    </div>
    <div style="margin: 0 0 4px 24px; padding: 8px; background: ${isReply ? 'var(--card-bg)' : 'var(--hover-bg)'}; border-radius: 12px;">
      ${escapeHtml(comment.text)}
    </div>
  `;

  if (comment.replies && comment.replies.length) {
    const repliesDiv = document.createElement('div');
    repliesDiv.style.marginLeft = '32px';
    repliesDiv.style.marginTop = '8px';
    repliesDiv.style.borderLeft = '2px solid var(--border-light)';
    repliesDiv.style.paddingLeft = '12px';
    comment.replies.forEach(reply => {
      const replyEl = createCommentElement(reply, postId, true);
      repliesDiv.appendChild(replyEl);
    });
    wrapper.appendChild(repliesDiv);
  }

  const likeBtn = wrapper.querySelector('.comment-like-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const commentId = parseInt(likeBtn.dataset.commentId);
      const result = await ActusAPI.toggleCommentLike(commentId);
      if (result.success) {
        const likeSpan = likeBtn.querySelector('.like-count');
        if (likeSpan) likeSpan.textContent = result.likes_count;
        likeBtn.style.color = result.isLiked ? '#ef4444' : 'var(--text-secondary)';
      } else {
        showNotification('error', 'Erreur', result.message);
      }
    });
  }

  return wrapper;
}

// ===== METTRE À JOUR COMPTEUR COMMENTAIRES =====
async function updatePostCommentCount(postId) {
  const postCard = document.querySelector(`.post-card[data-id="${postId}"]`);
  if (!postCard) return;
  const statsSpan = postCard.querySelector('.post-stats span:nth-child(2)');
  if (!statsSpan) return;
  const result = await ActusAPI.getPostStats(postId);
  if (result.success) {
    statsSpan.textContent = `${result.stats.comments} Commentaires`;
    const post = actusState.posts.find(p => p.id === postId);
    if (post) post.comments = result.stats.comments;
  }
}

// ===== ANCIENNES FONCTIONS (DÉPRÉCIÉES - REMPLACÉES PAR LE SYSTÈME MODAL) =====
// Ces fonctions géraient les commentaires inline et sont remplacées par:
// - openCommentsModal() pour ouvrir la modale
// - createCommentElement() pour créer les éléments commentaires
// - updatePostCommentCount() pour mettre à jour le compteur
// 
// Les fonctions suivantes ne sont plus utilisées mais gardées pour référence:
// - handleToggleComments() - removed
// - loadPostComments() - removed
// - handleSubmitComment() - removed
// - handleCommentLike() - functionality integrated into createCommentElement()

// ===== SUPPRIMER POST =====
// ===== SUPPRIMER POST =====
let deletePostState = {
  postId: null,
  postBtn: null
};

async function handleDeletePost(e) {
  // Si appelée via onclick, e est l'event
  // Si appelée via addEventListener, e.currentTarget est le bouton
  let btn = e.currentTarget;
  
  // Si onclick inline, le target est le bouton ou son icône
  if (!btn) {
    btn = e.target.closest('.post-delete-btn');
  }
  
  if (!btn) {
    console.error('❌ Button not found');
    return;
  }
  
  const postId = parseInt(btn.dataset.postId);
  
  
  // Stocker les infos pour la confirmation
  deletePostState.postId = postId;
  deletePostState.postBtn = btn;
  
  // Afficher le modal
  const modal = document.getElementById('deletePostModal');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    console.error('Modal NOT found!');
  }
}

// Gestion du modal de suppression
function setupDeleteModal() {
  const modal = document.getElementById('deletePostModal');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const closeBtn = document.querySelector('.delete-post-close');
  
  if (!modal) {
    console.warn('Modal suppression NOT FOUND');
    return;
  }
  
  // Bouton Annuler
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal.classList.add('hidden');
      deletePostState.postId = null;
      deletePostState.postBtn = null;
    };
  }
  
  // Bouton X (fermer)
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      deletePostState.postId = null;
      deletePostState.postBtn = null;
    };
  }
  
  // Bouton Confirmer
  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      if (!deletePostState.postId) return;
      
      const postId = deletePostState.postId;
      const btn = deletePostState.postBtn;
      
      // Fermer le modal
      modal.classList.add('hidden');
      
      if (btn) btn.disabled = true;
      
      // Appeler l'API
      const result = await ActusAPI.deletePost(postId);
      
      if (btn) btn.disabled = false;
            
      if (result.success) {
        showNotification('success', 'Supprimé', result.message);
        actusState.posts = actusState.posts.filter(p => p.id !== postId);
        renderActusFeed();
      } else {
        showNotification('error', 'Erreur', result.message);
      }
      
      // Réinitialiser
      deletePostState.postId = null;
      deletePostState.postBtn = null;
    };
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
  btn.textContent = 'Publication...';

  const imageFiles = postImages.filter(img => img.file).map(img => img.file);
  console.log('Envoi de', imageFiles.length, 'image(s)');

  const result = await ActusAPI.createPost(content, 'public', imageFiles);

  btn.disabled = false;
  btn.textContent = 'Publier';

  if (result.success) {
    showNotification('success', 'Publié', result.message);
    document.getElementById('postContent').value = '';
    postImages = [];
    renderImagePreview();
    await loadActusFeed(); // recharge le feed
  } else {
    showNotification('error', 'Erreur', result.message);
  }
}

// ===== SÉLECTIONNER IMAGES =====
function handleImageSelect(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  files.forEach(file => {
    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      showNotification('warning', 'Format non supporté', 'Seules les images sont autorisées');
      return;
    }
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
  e.target.value = ''; // permit re-upload
}

// ===== AFFICHER APERÇU IMAGES =====
function renderImagePreview() {
  const preview = document.getElementById('postImagesPreview');
  const grid = preview?.querySelector('.preview-grid');
  if (!grid) return;

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
      <button data-index="${idx}" class="remove-img-btn" style="position: absolute; top: 4px; right: 4px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.7); color: white; border: none; cursor: pointer;">✕</button>
    `;
    div.querySelector('.remove-img-btn').addEventListener('click', (e) => {
      e.stopPropagation();
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
