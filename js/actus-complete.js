/**
 * ACTUS FRONTEND - SYSTÈME COMPLET
 * ========================================
 * Gestion dynamique des publications, likes, commentaires
 */

if (typeof postImages === 'undefined') {
  var postImages = [];
}

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
document.addEventListener('DOMContentLoaded', async () => {
  
  // Récupérer l'ID utilisateur et ATTENDRE
  await fetchCurrentUser();
  
  // Ensuite configurer l'UI
  setupActusNavigation();
  
  setupActusUI();
  
  // FORCE LOAD THE FEED
  await loadActusFeed();
  
  // Double-check modal initialization
  setTimeout(() => {
    setupDeleteModal();
  }, 100);
  
});

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
  postDiv.dataset.authorId = post.user_id;
  
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
  
  // Poll placeholder (will be filled if post has a poll)
  let pollHTML = `<div class="post-poll-container" data-post-id="${post.id}" style="display: none;"></div>`;
  
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
  
  postDiv.innerHTML = headerHTML + contentHTML + pollHTML + statsHTML + actionsHTML;
  
  // Afficher l'aperçu des commentaires pré-chargés
  if (post.commentsList && post.commentsList.length > 0) {
    const commentsPreview = document.createElement('div');
    commentsPreview.className = 'post-comments-preview';
    commentsPreview.style.marginTop = '8px';
    commentsPreview.style.marginLeft = '15px';
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
      commentLine.innerHTML = `${authorDisplay} <span style="margin-left: 6px;">${escapeHtml(comment.text || '')}</span>`;
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
  
  // Load poll if post has one
  (async () => {
    try {
      const pollData = await loadPollForPost(post.id);
      if (pollData) {
        const pollContainer = postDiv.querySelector('.post-poll-container');
        if (pollContainer) {
          pollContainer.innerHTML = renderPollHTML(pollData);
          pollContainer.style.display = 'block';
          attachPollEvents(postDiv);
          // Masquer le contenu du post si un sondage est affiché
          const contentDiv = postDiv.querySelector('.post-content');
          if (contentDiv) {
            contentDiv.style.display = 'none';
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement sondage:', err);
    }
  })();
  
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

    // Ajouter les event listeners pour ouvrir le profil utilisateur
    const postAvatars = document.querySelectorAll('.post-avatar');
    const postAuthors = document.querySelectorAll('.post-author');
    
    const openUserProfile = async (post) => {
      if (!post || !post.user_id) return;
      await displayUserProfile(post.user_id);
    };
    
    postAvatars.forEach(avatar => {
      avatar.style.cursor = 'pointer';
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const postCard = avatar.closest('.post-card');
        const postId = parseInt(postCard.dataset.id);
        const post = actusState.posts.find(p => p.id === postId);
        openUserProfile(post);
      });
    });
    
    postAuthors.forEach(author => {
      author.style.cursor = 'pointer';
      author.addEventListener('click', (e) => {
        e.stopPropagation();
        const postCard = author.closest('.post-card');
        const postId = parseInt(postCard.dataset.id);
        const post = actusState.posts.find(p => p.id === postId);
        openUserProfile(post);
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

// ===== ENREGISTREUR VOCAL POUR MODAL =====
function setupVocalRecorderInModal(postId, modal) {
  let mediaRecorder = null;
  let audioChunks = [];
  let recordingStartTime = null;
  let timerInterval = null;
  let maxDurationTimeout = null;
  let recordedDuration = 0;
  let isRecording = false;
  let recordedFile = null;
  const MAX_DURATION = 30; // 30 secondes

  const recordBtn = modal.querySelector('#modal-record-btn');
  const cancelBtn = modal.querySelector('#modal-cancel-btn');
  
  const submitBtn = modal.querySelector('#modal-submit-vocal-btn');
  submitBtn.disabled = true;
  submitBtn.style.background = '#ccc';

  const rerecordBtn = modal.querySelector('#modal-rerecord-btn');
  const recorderStatus = modal.querySelector('#recorder-status-modal');
  const recorderTimer = modal.querySelector('#recorder-timer-modal');
  const previewSection = modal.querySelector('#modal-preview-section');
  const audioPreview = modal.querySelector('#modal-audio-preview');
  const previewDuration = modal.querySelector('#modal-preview-duration');
  const anonCheck = modal.querySelector('.modal-vocal-anonym-checkbox');

  // Démarrer l'enregistrement
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      recordingStartTime = Date.now();
      recordedDuration = 0;
      isRecording = true;

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        recordedDuration = Math.round((Date.now() - recordingStartTime) / 1000);
      };

      mediaRecorder.start();

      // Update UI
      recordBtn.classList.add('recording');
      recordBtn.innerHTML = '<i class="fas fa-stop-circle"></i> <span id="record-btn-text">Arrêter</span>';
      recorderStatus.classList.add('active');
      previewSection.classList.remove('active');

      // Start timer
      timerInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - recordingStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        recorderTimer.textContent = 
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }, 100);

      // Arrêter automatiquement après 30 secondes
      maxDurationTimeout = setTimeout(() => {
        showNotification('info', 'Temps limite', 'Enregistrement limité à 30 secondes');
        stopRecording();
      }, MAX_DURATION * 1000);

    } catch (error) {
      console.error('Erreur microphone:', error);
      showNotification('error', 'Erreur', 'Accès au microphone refusé');
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return;

    mediaRecorder.stop();
    isRecording = false;
    clearInterval(timerInterval);
    if (maxDurationTimeout) clearTimeout(maxDurationTimeout);

    // Update UI
    recordBtn.classList.remove('recording');
    recordBtn.innerHTML = '<i class="fas fa-microphone"></i> <span id="record-btn-text">Recommencer</span>';
    recorderStatus.classList.remove('active');

    // Wait for onstop to complete
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioPreview.src = audioUrl;
      previewDuration.textContent = formatDuration(recordedDuration);
      previewSection.classList.add('active');

      recordedFile = new File(
        [audioBlob],
        `vocal_comment_${Date.now()}.wav`,
        { type: 'audio/wav' }
      );

      // Activer le bouton d'envoi
      submitBtn.disabled = false;
      submitBtn.style.background = '#28a745';

    };
  };

  // Annuler l'enregistrement
  const cancelRecording = () => {
    if (isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      clearInterval(timerInterval);
      if (maxDurationTimeout) clearTimeout(maxDurationTimeout);
    }
    resetUI();
  };

  const resetRecorder = () => {
    audioChunks = [];
    recordedFile = null;
    previewSection.classList.remove('active');
    recordBtn.innerHTML = '<i class="fas fa-microphone"></i><span id="record-btn-text">Commencer</span>';
    // Désactiver le bouton d'envoi
    submitBtn.disabled = true;
    submitBtn.style.background = '#ccc';
  };

  const resetUI = () => {
    resetRecorder();
    recorderStatus.classList.remove('active');
    recordBtn.classList.remove('recording');
  };

  // Soumettre le commentaire vocal
  const submitVocalComment = async () => {
    if (!recordedFile) {
      showNotification('warning', 'Aucun enregistrement', 'Veuillez enregistrer un commentaire');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    try {
      const result = await ActusAPI.addVocalComment(
        postId,
        recordedFile,
        recordedDuration,
        null,
        anonCheck.checked
      );

      if (result.success) {
        resetUI();
        resetRecorder();
        showNotification('success', 'Succès', 'Commentaire vocal posté');
        
        // Recharger les commentaires
        await openCommentsModal(postId);
        updatePostCommentCount(postId);
      } else {
        showNotification('error', 'Erreur', result.message);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      showNotification('error', 'Erreur', 'Erreur lors de l\'envoi du commentaire');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Poster';
    }
  };

  // Attacher les événements
  recordBtn.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  cancelBtn.addEventListener('click', cancelRecording);
  rerecordBtn.addEventListener('click', resetRecorder);
  submitBtn.addEventListener('click', submitVocalComment);
}

// Fonction utilitaire pour formater la durée
function formatDuration(seconds) {
  if (!seconds) return '0 sec';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} sec`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== MODAL COMMENTAIRES =====
async function openCommentsModal(postId) {
  const modal = document.getElementById('commentsModal');
  const listContainer = modal.querySelector('.all-comments-list') || modal.querySelector('.comments-list') || modal;
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
  
  // Créer le HTML du formulaire d'ajout avec onglets
  const formHTML = `
    <div style="border-bottom: 1px solid var(--border-light); margin-bottom: 12px; padding-bottom: 12px;">
      <div class="comment-tabs">
        <button class="comment-tab active" data-tab="text-comment" style="flex: 1;">
          <i class="fas fa-pen"></i> Texte
        </button>
        <button class="comment-tab" data-tab="vocal-comment" style="flex: 1;">
          <i class="fas fa-microphone"></i> Vocal
        </button>
      </div>

      <!-- TAB TEXTE -->
      <div id="text-comment" class="comment-content active">
        <input type="text" class="modal-comment-input" placeholder="Écrivez un commentaire..." style="display: block; width: 100%; padding: 10px; border: 1px solid var(--border-light); border-radius: 8px; font-size: 13px; margin-bottom: 8px; box-sizing: border-box;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="modal-submit-comment" style="padding: 10px 20px; background: var(--emerald-500); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; flex: 1;">
            <i class="fas fa-paper-plane"></i> Envoyer
          </button>
          <label style="display: flex; align-items: center; gap: 6px; padding: 10px; cursor: pointer;">
            <input type="checkbox" class="modal-anonymous-checkbox">
            <span style="font-size: 13px;">Anonyme</span>
          </label>
        </div>
      </div>

      <!-- TAB VOCAL -->
      <div id="vocal-comment" class="comment-content">
        <div class="vocal-recorder">
          <!-- Recording Status -->
          <div class="recorder-status" id="recorder-status-modal">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="status-indicator"></span>
                <span>Enregistrement en cours (max 30s)...</span>
              </div>
              <div class="recorder-timer" id="recorder-timer-modal">00:00</div>
            </div>
          </div>

          <!-- Recording Controls -->
          <div class="recorder-controls" style="display: flex; gap: 8px;">
            <button type="button" class="btn-record modal-record-btn" id="modal-record-btn" style="flex: 1;">
              <i class="fas fa-microphone"></i>
              <span id="record-btn-text">Commencer</span>
            </button>
            <button type="button" class="btn-secondary" id="modal-cancel-btn" style="padding: 10px 16px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
              <i class="fas fa-times"></i> Annuler
            </button>

          </div>

          <!-- Preview Section -->
          <div class="preview-section" id="modal-preview-section" style="display: none;">
            <p><strong>Aperçu :</strong></p>
            <audio id="modal-audio-preview" class="preview-audio" controls style="width: 100%; margin-bottom: 8px;"></audio>
            <div class="preview-info" style="margin-bottom: 12px;">
              <span>Durée : </span>
              <span class="audio-duration" id="modal-preview-duration">0 sec</span>
            </div>
            <div class="recorder-controls" style="display: flex; gap: 8px;">
              <button type="button" class="btn-secondary" id="modal-rerecord-btn" style="flex: 1;">
                <i class="fas fa-redo"></i> Réenregistrer
              </button>
            </div>
          </div>

          <div style="margin-top: 12px;">
            <button type="button" class="btn-record" id="modal-submit-vocal-btn" 
                    style="background: #ccc; flex: 1; width: 100%;" disabled>
              <i class="fas fa-check"></i> Poster
            </button>
          </div>
        </div>

        <label style="display: flex; align-items: center; gap: 6px; padding: 10px 0; cursor: pointer;">
          <input type="checkbox" class="modal-vocal-anonym-checkbox">
          <span>Commentaire anonyme</span>
        </label>
      </div>
    </div>
  `;

  // Afficher les commentaires avec le formulaire
  const existingForm = modal.querySelector('.comment-form-sticky');
  if (existingForm) existingForm.remove();

  // Créer le conteneur sticky pour le formulaire
  const formSticky = document.createElement('div');
  formSticky.className = 'comment-form-sticky';
  formSticky.style.cssText = 'position: sticky; top: 0; background: var(--card-bg); z-index: 10; padding-bottom: 12px; border-bottom: 1px solid var(--border-light); margin-bottom: 12px;';
  formSticky.innerHTML = formHTML;

  // Insérer le formulaire avant la liste des commentaires
  modal.querySelector('.comments-modal-content').insertBefore(formSticky, listContainer);

  // Vider la liste des commentaires et y injecter les commentaires
  listContainer.innerHTML = comments.length ? '' : '<div style="text-align:center; padding:20px; color: var(--text-secondary);">Aucun commentaire pour le moment.</div>';
  
  if (comments.length) {
    comments.forEach(comment => {
      const commentEl = createCommentElement(comment, postId);
      listContainer.appendChild(commentEl);
    });
  }

  // Initialiser l'interface d'enregistrement vocal
  setupVocalRecorderInModal(postId, modal);

  // Gérer l'envoi d'un commentaire texte
  const commentInput = modal.querySelector('.modal-comment-input');
  const anonCheckbox = modal.querySelector('.modal-anonymous-checkbox');
  const submitBtn = modal.querySelector('.modal-submit-comment');

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

  // Gérer les onglets - masquer/afficher le contenu
  const tabs = modal.querySelectorAll('.comment-tab');
  const contents = modal.querySelectorAll('.comment-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.currentTarget.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
      });
      e.currentTarget.classList.add('active');
      const activeContent = document.getElementById(tabName);
      activeContent.classList.add('active');
      activeContent.style.display = 'block';
    });
  });
}

// ===== CRÉER ÉLÉMENT COMMENTAIRE =====
function createCommentElement(comment, postId, isReply = false) {
  const wrapper = document.createElement('div');
  const isVocal = comment.audio_url && !comment.text;
  
  wrapper.className = `comment-item-full ${isVocal ? 'vocal' : ''} ${isReply ? 'reply-item' : ''}`;
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

  // Déterminer si l'utilisateur actuel peut supprimer le commentaire
  const isCommentAuthor = currentUserId && comment.user_id && currentUserId === comment.user_id;
  const postCard = document.querySelector(`.post-card[data-id="${postId}"]`);
  const postAuthorId = postCard ? parseInt(postCard.dataset.authorId) : null;
  const isPostAuthor = currentUserId && postAuthorId && currentUserId === postAuthorId;
  const canDeleteComment = isCommentAuthor || isPostAuthor;

  // Contenu du commentaire (texte ou audio)
  let contentHtml;
  if (isVocal) {
    // Formatage de la durée
    const durationStr = comment.duration ? `${Math.floor(comment.duration / 60)}:${(comment.duration % 60).toString().padStart(2, '0')}` : 'Durée inconnue';
    
    contentHtml = `
      <div class="comment-vocal-content">
        <audio controls class="comment-vocal-audio" preload="metadata">
          <source src="${escapeHtml(comment.audio_url)}" type="audio/wav">
          Votre navigateur ne supporte pas l'élément audio.
        </audio>
        <div class="comment-vocal-duration">${durationStr}</div>
      </div>
    `;
  } else {
    contentHtml = `
      <div style="margin: 0 0 4px 24px; padding: 8px; background: ${isReply ? 'var(--card-bg)' : 'var(--hover-bg)'}; border-radius: 12px;">
        ${escapeHtml(comment.text || 'Commentaire vide')}
      </div>
    `;
  }

  wrapper.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div>
        ${authorHtml}
        ${isVocal ? '<span class="comment-vocal-badge"><i class="fas fa-microphone"></i> Vocal</span>' : ''}
        <span style="font-size:12px; color:var(--text-secondary);">• ${timeStr}</span>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="comment-like-btn" data-comment-id="${comment.id}" style="background:none; border:none; cursor:pointer; color: var(--text-secondary); transition: 0.2s; padding: 4px 8px;">
          <i class="fas fa-heart"></i> <span class="like-count">${comment.likes}</span>
        </button>
        <button class="comment-delete-btn" data-comment-id="${comment.id}" style="background:none; border:none; cursor:pointer; color: var(--text-secondary); padding: 4px 8px; transition: 0.2s; ${canDeleteComment ? 'display:block;' : 'display:none;'}" title="Supprimer le commentaire">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
    ${contentHtml}
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

  const deleteBtn = wrapper.querySelector('.comment-delete-btn');
  if (deleteBtn && canDeleteComment) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      showConfirmation(
        'Supprimer ce commentaire',
        'Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.',
        async () => {
          const commentId = parseInt(deleteBtn.dataset.commentId);
          const result = await ActusAPI.deleteComment(commentId);
          if (result.success) {
            showNotification('success', 'Succès', 'Commentaire supprimé');
            // Recharger les commentaires
            await openCommentsModal(postId);
            updatePostCommentCount(postId);
          } else {
            showNotification('error', 'Erreur', result.message);
          }
        }
      );
    });

    // Afficher/masquer le bouton au survol
    wrapper.addEventListener('mouseenter', () => {
      deleteBtn.style.opacity = '1';
    });
    wrapper.addEventListener('mouseleave', () => {
      deleteBtn.style.opacity = '0.7';
    });
    deleteBtn.style.opacity = '0.7';
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

// ===== AFFICHER PROFIL UTILISATEUR =====
async function displayUserProfile(userId) {
  try {
    const modal = document.getElementById('userProfileModal');
    if (!modal) {
      console.warn('Profile modal NOT FOUND');
      return;
    }

    // Afficher le loading
    modal.classList.remove('hidden');

    // Récupérer les infos utilisateur
    const response = await fetch(`${window.location.href}?action=getUserProfile&user_id=${userId}`, {
      method: 'GET'
    });

    const data = await response.json();

    if (!data.success) {
      showNotification('error', 'Erreur', 'Impossible de charger le profil');
      modal.classList.add('hidden');
      return;
    }

    const profile = data.profile;

    // Remplir le modal avec les données
    document.getElementById('userProfileName').textContent = profile.user_name || 'Utilisateur';
    document.getElementById('userProfileUsername').textContent = '@' + (profile.user_username || 'user');
    document.getElementById('userProfileBio').textContent = profile.user_bio || '';
    document.getElementById('userProfileLocation').textContent = profile.user_location || 'Localisation inconnue';
    document.getElementById('userProfileMemberSince').textContent = 'Membre depuis ' + (profile.member_since || 'Janvier 2024');
    document.getElementById('userProfileFollowersCount').textContent = profile.followers_count || 0;
    document.getElementById('userProfileFollowingCount').textContent = profile.following_count || 0;

    // Définir les images
    const avatarEl = document.getElementById('userProfileAvatar');
    const coverEl = document.getElementById('userProfileCover');

    if (profile.user_photo_url) {
      avatarEl.style.backgroundImage = `url('imgApp/${profile.user_photo_url}')`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.textContent = '';
    } else {
      avatarEl.style.backgroundImage = '';
      avatarEl.textContent = profile.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    }

    if (profile.user_cover_photo_url) {
      coverEl.style.backgroundImage = `url('imgApp/${profile.user_cover_photo_url}')`;
    }

    // Gérer le bouton Suivre
    const followBtn = document.getElementById('userProfileFollowBtn');
    if (followBtn) {
      if (currentUserId && parseInt(currentUserId) === parseInt(userId)) {
        // C'est le profil de l'utilisateur courant - masquer le bouton
        followBtn.style.display = 'none';
      } else {
        // Montrer le bouton Suivre
        followBtn.style.display = 'block';
        followBtn.onclick = async (e) => {
          e.preventDefault();
          // TODO: Implémenter la logique de suivi
          showNotification('info', 'Info', 'La fonction de suivi sera bientôt disponible');
        };
      }
    }

    // Gérer la fermeture du modal
    const closeBtn = document.querySelector('.user-profile-close');
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add('hidden');
    }

    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    };

  } catch (error) {
    console.error('Erreur displayUserProfile:', error);
    showNotification('error', 'Erreur', 'Une erreur est survenue');
    document.getElementById('userProfileModal').classList.add('hidden');
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
    
    
    // SIMPLE: Recharger le feed complètement pour éviter les duplicatas
    await loadActusFeed();
    
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

// ===== POLLS MANAGEMENT =====

async function loadPollForPost(postId) {
  try {
    // Get poll by post_id
    const response = await fetch(`?action=getPollByPost&post_id=${postId}`, {
      method: 'GET'
    });
    const data = await response.json();
    return data.success && data.poll ? data.poll : null;
  } catch (err) {
    console.error('Erreur au chargement du sondage:', err);
    return null;
  }
}

function renderPollHTML(poll) {
  if (!poll) return '';

  const options = poll.options || [];
  const totalVotes = poll.poll_total_votes;
  const userVote = poll.user_vote;
  const hasVoted = userVote !== null;

  let optionsHTML = options.map(option => {
    const isVoted = userVote === option.option_id;
    const percentage = option.option_percentage || 0;
    const votes = option.option_votes || 0;
    const imageHTML = option.option_image_url
      ? `<img src="pub/${option.option_image_url}" class="poll-option-thumb" alt="">`
      : '';

    return `
      <div class="poll-option ${isVoted ? 'voted' : ''}" data-option-id="${option.option_id}">
        ${imageHTML}
        <div class="poll-option-info">
          <span class="poll-option-text">${escapeHtml(option.option_text)}</span>
          <div class="poll-option-result" style="display: ${hasVoted ? 'flex' : 'none'}">
            <div class="poll-result-bar">
              <div class="poll-result-fill" style="width: ${percentage}%"></div>
            </div>
            <span class="poll-option-percent">${percentage}%</span>
          </div>
          <span class="poll-option-votes" style="display: ${hasVoted ? 'block' : 'none'}">${votes} vote${votes > 1 ? 's' : ''}</span>
        </div>
        <div class="poll-option-voted-badge" style="display: ${isVoted ? 'flex' : 'none'}">✓</div>
      </div>
    `;
  }).join('');

  return `
    <div class="post-poll" data-poll-id="${poll.poll_id}">
      <div class="post-poll-question">${escapeHtml(poll.poll_question)}</div>
      ${optionsHTML}
      <div class="poll-total-votes">${totalVotes} vote${totalVotes !== 1 ? 's' : ''}</div>
    </div>
  `;
}

async function handlePollVote(postElement, optionId, pollId) {
  if (!currentUserId) {
    showNotification('error', 'Erreur', 'Veuillez vous connecter pour voter');
    return;
  }
  
  try {
    const response = await fetch(`?action=votePoll`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        poll_id: pollId,
        option_id: optionId
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.poll) {
      // Update poll display
      const pollElement = postElement.querySelector('.post-poll');
      if (pollElement) {
        const newPollHTML = renderPollHTML(data.poll);
        pollElement.outerHTML = newPollHTML;
        attachPollEvents(postElement);
      }
      showNotification('success', 'Succès', 'Votre vote a été enregistré');
    } else {
      showNotification('error', 'Erreur', data.message || 'Erreur au vote');
    }
  } catch (err) {
    console.error('Erreur au vote:', err);
    showNotification('error', 'Erreur', 'Une erreur s\'est produite');
  }
}

function attachPollEvents(postElement) {
  const pollOptions = postElement.querySelectorAll('.poll-option');
  const pollDiv = postElement.querySelector('.post-poll');
  
  if (!pollDiv) return;
  
  const pollId = pollDiv.dataset.pollId;
  const postId = postElement.dataset.id;
  
  pollOptions.forEach(option => {
    option.addEventListener('click', () => {
      const optionId = parseInt(option.dataset.optionId);
      handlePollVote(postElement, optionId, pollId);
    });
  });
}
