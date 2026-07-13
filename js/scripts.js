// ===== SYSTÈME DE NOTIFICATIONS TOAST (GLOBAL) =====
function showNotification(type = 'info', title = '', message = '', duration = 4000) {
  const container = document.getElementById('notificationContainer');
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i class="toast-icon ${icons[type]}"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  const closeToast = () => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener('click', closeToast);
  
  if (duration > 0) {
    setTimeout(closeToast, duration);
  }

  return toast;
}

// ===== SYSTÈME DE CONFIRMATION MODAL (GLOBAL) =====
let confirmationCallback = null;

function showConfirmation(title, message, onConfirm, onCancel = null) {
  const modal = document.getElementById('confirmationModal');
  const titleEl = document.getElementById('confirmationTitle');
  const messageEl = document.getElementById('confirmationMessage');
  const confirmBtn = document.getElementById('confirmationConfirm');
  const cancelBtn = document.getElementById('confirmationCancel');

  titleEl.textContent = title;
  messageEl.textContent = message;

  // Stocker le callback
  confirmationCallback = onConfirm;

  // Afficher le modal
  modal.classList.remove('hidden');

  // Gestionnaire du bouton Confirmer
  const handleConfirm = () => {
    modal.classList.add('hidden');
    if (confirmationCallback) {
      confirmationCallback();
      confirmationCallback = null;
    }
  };

  // Gestionnaire du bouton Annuler
  const handleCancel = () => {
    modal.classList.add('hidden');
    confirmationCallback = null;
    if (onCancel) onCancel();
  };

  confirmBtn.onclick = handleConfirm;
  cancelBtn.onclick = handleCancel;
}

let profilePostsState = {
  offset: 0,
  limit: 4,
  hasMore: true,
  isLoading: false,
  userId: null
};

// ===== PROFIL GLOBAL =====
// Initialize BEFORE the IIFE that needs it
let currentUserProfile = {
  name: "Utilisateur",
  username: "@user",
  bio: "Pas de bio",
  location: "Localisation inconnue",
  memberSince: "Janvier 2024",
  avatarInitials: "U",
  profilePhoto: null,
  coverPhoto: null,
  postsCount: 0,
  followers_count: 0,
  following_count: 0,
  followers: [],
  following: [],
  posts: [
    { id: 1, image: "https://picsum.photos/id/10/400/300", likes: 34, comments: 5 },
    { id: 2, image: "https://picsum.photos/id/20/400/300", likes: 112, comments: 8 }
  ]
};

(function(){
    "use strict";

    // ===== GESTION LOGIN/SIGNUP =====
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    const authForm = document.getElementById('auth-form');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const toggleAuthLink = document.getElementById('toggle-auth-mode');
    const loginTitle = document.getElementById('login-title');
    const loginSubtitle = document.getElementById('login-subtitle');
    const toggleMessage = document.getElementById('toggle-message');
    const nameField = document.getElementById('name-field');
    const profilePicField = document.getElementById('profile-pic-field');
    const profilePhotoInput = document.getElementById('profile-photo-input');
    const photoUploadArea = document.getElementById('photo-upload-area');
    const photoPreview = document.getElementById('photo-preview');
    const photoUploadText = document.getElementById('photo-upload-text');
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');
    const nameInput = document.getElementById('signup-name');

    let isLoginMode = true;
    let selectedProfilePhoto = null; // Stocke le fichier File

    // Gestion du click du file input
    photoUploadArea.addEventListener('click', () => {
      profilePhotoInput.click();
    });

    // Quand l'utilisateur sélectionne un fichier
    profilePhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedProfilePhoto = file; // Stocker le fichier File
        const reader = new FileReader();
        reader.onload = (event) => {
          photoPreview.src = event.target.result;
          photoPreview.style.display = 'block';
          photoUploadText.textContent = '✓ Photo sélectionnée';
          photoUploadText.style.color = 'var(--emerald-500)';
        };
        reader.readAsDataURL(file);
      }
    });

    // Drag & drop
    photoUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoUploadArea.style.background = 'var(--emerald-100)';
    });

    photoUploadArea.addEventListener('dragleave', () => {
      photoUploadArea.style.background = 'var(--hover-bg)';
    });

    photoUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      photoUploadArea.style.background = 'var(--hover-bg)';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        profilePhotoInput.files = files;
        const event = new Event('change', { bubbles: true });
        profilePhotoInput.dispatchEvent(event);
      }
    });

    // Bascule connexion / inscription
    function setAuthMode(mode) {
      isLoginMode = mode;
      selectedProfilePhoto = null;
      profilePhotoInput.value = '';
      photoPreview.style.display = 'none';
      photoUploadText.textContent = 'Cliquez pour uploader une photo';
      photoUploadText.style.color = 'var(--text-secondary)';
      if (mode) {
        loginTitle.textContent = 'Se connecter';
        loginSubtitle.textContent = 'Accédez à votre espace de discussion';
        authSubmitBtn.textContent = 'Se connecter';
        toggleMessage.textContent = 'Pas encore de compte ?';
        toggleAuthLink.textContent = 'Créer un compte';
        nameField.style.display = 'none';
        profilePicField.style.display = 'none';
        if (nameInput) nameInput.required = false;
      } else {
        loginTitle.textContent = 'Créer un compte';
        loginSubtitle.textContent = 'Rejoignez la communauté Ag7';
        authSubmitBtn.textContent = 'S\'inscrire';
        toggleMessage.textContent = 'Déjà un compte ?';
        toggleAuthLink.textContent = 'Se connecter';
        nameField.style.display = 'block';
        profilePicField.style.display = 'block';
        if (nameInput) nameInput.required = true;
      }
    }

    toggleAuthLink.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode(!isLoginMode);
    });

    // Gestion connexion - Backend
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      
      if (!username || !password) {
        showNotification('warning', 'Champs manquants', 'Veuillez remplir tous les champs');
        return;
      }
      
      authSubmitBtn.disabled = true;
      authSubmitBtn.textContent = isLoginMode ? 'Connexion...' : 'Inscription...';
      
      // Préparer les données
      const formData = new FormData();
      formData.append('action', isLoginMode ? 'login' : 'register');
      formData.append('user_username', username);
      formData.append('user_password', password);
      
      if (!isLoginMode) {
        const name = nameInput.value.trim();
        if (!name) {
          showNotification('warning', 'Nom requis', 'Veuillez entrer votre nom');
          authSubmitBtn.disabled = false;
          authSubmitBtn.textContent = isLoginMode ? 'Se connecter' : "S'inscrire";
          return;
        }
        formData.append('user_name', name);
        
        // Ajouter la photo de profil si elle existe (en tant que fichier)
        if (selectedProfilePhoto) {
          formData.append('user_photo', selectedProfilePhoto);
        }
      }
      
      // Envoyer au backend
      fetch(window.location.href, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      .then(response => {
        // Gérer les différents codes HTTP
        if (!response.ok) {
          // Essayer de parser le JSON d'erreur
          return response.text().then(text => {
            try {
              const data = JSON.parse(text);
              return Promise.reject(new Error(data.message || `Erreur ${response.status}`));
            } catch (e) {
              // Si ce n'est pas du JSON, c'est du HTML d'erreur
              if (response.status === 401) {
                return Promise.reject(new Error('Identifiants incorrects'));
              } else if (response.status === 409) {
                return Promise.reject(new Error('Pseudo déjà utilisé'));
              } else if (response.status === 400) {
                return Promise.reject(new Error('Données manquantes'));
              } else if (response.status >= 500) {
                return Promise.reject(new Error('Erreur serveur'));
              } else {
                return Promise.reject(new Error(`Erreur HTTP ${response.status}`));
              }
            }
          });
        }
        return response.json().then(data => ({ status: response.status, data }));
      })
      .then(result => {
        const data = result.data;
        if (data.success) {
          // Message de succès
          const action = isLoginMode ? 'Connecté' : 'Compte créé';
          showNotification('success', action, isLoginMode ? 'Bienvenue !' : 'Votre compte a été créé avec succès');
          
          // Mise à jour du profil si inscription
          if (!isLoginMode && data.user) {
            currentUserProfile.name = data.user.user_name;
            currentUserProfile.username = '@' + data.user.user_username;
            currentUserProfile.avatarInitials = data.user.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            if (data.user.user_photo_url) {
              currentUserProfile.profilePhoto = getPhotoURL(data.user.user_photo_url);
            }
          }
          
          // Connexion réussie
          setTimeout(async () => {
            // Mettre à jour l'ID utilisateur global depuis PHP
            if (data.user && data.user.user_id) {
              window.currentUserId = data.user.user_id;
            }
            if (data.user && data.user.user_username) {
              window.currentUsername = data.user.user_username;
            }
            
            loginSection.classList.add('hidden');
            appSection.classList.remove('hidden');

            // Charger le profil utilisateur complet
            await loadCurrentProfile();
            // Initialiser l'ID utilisateur pour les modules (actus, etc.)
            if (typeof fetchCurrentUser === 'function') {
              await fetchCurrentUser();
            }
            updateProfileUI();
            await loadStories();

            // ===== AJOUTER ICI =====
            if (typeof MessagingManager !== 'undefined') {
              MessagingManager.init();
            }

            authForm.reset();
            setAuthMode(true);
            selectedProfilePhoto = null;
          }, 1500);
        } else {
          // Gestion des erreurs dans la réponse JSON
          if (data.message === 'Identifiants incorrects') {
            showNotification('error', 'Connexion échouée', 'Le pseudo ou mot de passe est incorrect');
          } else if (data.message === 'Pseudo déjà utilisé') {
            showNotification('error', 'Inscription impossible', 'Ce pseudo est déjà utilisé');
          } else if (data.message === 'Données manquantes') {
            showNotification('warning', 'Données incomplètes', 'Veuillez remplir tous les champs');
          } else {
            showNotification('error', 'Erreur', data.message || 'Une erreur est survenue');
          }
        }
        
        // Succès du login: utiliser les données du profil retournées pour éviter un appel supplémentaire
        if (data.success && isLoginMode && data.profile) {
          setTimeout(async () => {
            // Charger le profil directement depuis la réponse du login
            const profile = data.profile;
            
            // Mettre à jour l'ID utilisateur global depuis PHP
            window.currentUserId = profile.user_id;
            window.currentUsername = profile.user_username;
            
            currentUserProfile = {
              name: profile.user_name || "User",
              username: '@' + (profile.user_username || "user"),
              bio: profile.user_bio || "Pas de bio",
              location: profile.user_location || "Localisation inconnue",
              memberSince: profile.member_since || "Janvier 2024",
              userid: profile.user_id,
              avatarInitials: profile.user_name
                ? profile.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                : 'U',
              profilePhoto: profile.user_photo_url ? getPhotoURL(profile.user_photo_url) : null,
              coverPhoto: profile.user_cover_photo_url ? getPhotoURL(profile.user_cover_photo_url) : null,
              postsCount: profile.posts_count || 0,
              followers_count: profile.followers_count || 0,
              following_count: profile.following_count || 0,
              posts: []
            };
            
            loginSection.classList.add('hidden');
            appSection.classList.remove('hidden');

            updateProfileUI();
            await loadStories();

            authForm.reset();
            setAuthMode(true);
            selectedProfilePhoto = null;
          }, 1500);
        }
      })
      .catch(err => {
        // Les erreurs sont déjà affichées en notification, pas besoin de log console
        
        // Gérer les erreurs levées dans le .then(response => ...)
        if (err.message === 'Identifiants incorrects') {
          showNotification('error', 'Connexion échouée', 'Le pseudo ou mot de passe est incorrect');
        } else if (err.message === 'Pseudo déjà utilisé') {
          showNotification('error', 'Inscription impossible', 'Ce pseudo est déjà utilisé');
        } else if (err.message === 'Données manquantes') {
          showNotification('warning', 'Données incomplètes', 'Veuillez remplir tous les champs');
        } else if (err.message === 'Erreur serveur') {
          showNotification('error', 'Erreur serveur', 'Une erreur s\'est produite sur le serveur');
        } else if (err.message.includes('Failed to fetch')) {
          showNotification('error', 'Erreur réseau', 'Vérifiez votre connexion internet');
        } else {
          showNotification('error', 'Erreur', err.message || 'Impossible de communiquer avec le serveur');
        }
      })
      .finally(() => {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? 'Se connecter' : "S'inscrire";
      });
    });

    // Déconnexion - Backend
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('action', 'logout');
        
        fetch(window.location.href, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Erreur de déconnexion');
          }
          return response.json();
        })
        .then(data => {
          // Déconnexion réussie
          showNotification('success', 'Déconnecté', 'À bientôt !');
          
          // Réinitialiser les variables globales d'utilisateur
          window.currentUserId = null;
          window.currentUsername = null;
          
          // Arrêter les intervalles de refresh de la messagerie
          if (MessagingManager && MessagingManager.stopAutoRefresh) {
            MessagingManager.stopAutoRefresh();
          }
          // Réinitialiser les propriétés du MessagingManager
          if (MessagingManager) {
            MessagingManager.currentUserId = null;
            MessagingManager.currentConvId = null;
            MessagingManager.currentIsChannel = false;
          }
          
          // Réinitialiser toutes les données du profil
          
          setTimeout(() => {
            appSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            setAuthMode(true);
          }, 1000);
        })
        .catch(err => {
          console.error('Erreur logout:', err);
          showNotification('error', 'Erreur', 'Une erreur s\'est produite lors de la déconnexion');
          
          // Réinitialiser les variables globales d'utilisateur même en cas d'erreur
          window.currentUserId = null;
          window.currentUsername = null;
          
          // Arrêter les intervalles même en cas d'erreur
          if (MessagingManager && MessagingManager.stopAutoRefresh) {
            MessagingManager.stopAutoRefresh();
          }
          if (MessagingManager) {
            MessagingManager.currentUserId = null;
            MessagingManager.currentConvId = null;
            MessagingManager.currentIsChannel = false;
          }
          
          // Quand même rediriger vers le login
          setTimeout(() => {
            appSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            setAuthMode(true);
          }, 1500);
        });
      });
    }

    // ===== FIN GESTION LOGIN/SIGNUP =====

    // ---------- GESTION SPA (navigation sans rechargement) ----------
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    const views = {
      chat: document.getElementById('view-chat'),
      contacts: document.getElementById('view-contacts'),
      notifications: document.getElementById('view-notifications'),
      profile: document.getElementById('view-profile'),
      settings: document.getElementById('view-settings'),
      feed: document.getElementById('view-feed')
    };

    function switchView(viewId) {
      // Retirer active de toutes les vues
      Object.values(views).forEach(v => v.classList.remove('active'));
      // Ajouter active à la vue cible
      if (views[viewId]) views[viewId].classList.add('active');
      
      // Mettre à jour la classe active de la sidebar
      navItems.forEach(item => {
        const itemView = item.getAttribute('data-view');
        if (itemView === viewId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Rendu spécifique par vue
      if (viewId === 'contacts') {
        loadDiscoverUsers();
      }
      
      // Charger le profil réel quand on accède à la section profil
      if (viewId === 'profile') {
        if (typeof loadProfilePosts === 'function') {
          loadProfilePosts();  // reset = true par défaut
        }
      }
      
      // Charger le feed Actus quand on accède à la section feed
      if (viewId === 'feed') {
        if (typeof loadActusFeed === 'function') loadActusFeed();
        if (typeof loadStories === 'function') loadStories();
      }
    }

    // Écouteurs sur les liens de navigation
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = item.getAttribute('data-view');
        if (viewId) switchView(viewId);
      });
    });

    // ========== GESTION NOTIFICATIONS ==========
    let notifications = [
      {
        id: 1,
        type: 'message',
        icon: 'fas fa-comment',
        color: 'var(--emerald-600)',
        bgColor: 'var(--emerald-100)',
        title: 'Nouveau message',
        text: 'Marie Lambert vous a envoyé un message.',
        time: '2 min',
        read: false
      },
      {
        id: 2,
        type: 'follow',
        icon: 'fas fa-user-check',
        color: '#2668f1',
        bgColor: '#0c4a6e',
        title: 'Nouveau suivi',
        text: 'Thomas Dubois suit votre profil.',
        time: '1 h',
        read: false
      },
      {
        id: 3,
        type: 'post',
        icon: 'fas fa-heart',
        color: '#dc2626',
        bgColor: '#7f1d1d',
        title: 'Aime votre publication',
        text: 'Sophie Caron a aimé votre post sur l\'UX design.',
        time: '3 h',
        read: true
      },
      {
        id: 4,
        type: 'update',
        icon: 'fas fa-sync-alt',
        color: '#d97706',
        bgColor: '#78350f',
        title: 'Mise à jour disponible',
        text: 'Nouvelle version (v2.1.0) avec améliorations.',
        time: 'Hier',
        read: true
      },
      {
        id: 5,
        type: 'mention',
        icon: 'fas fa-at',
        color: '#9333ea',
        bgColor: '#4c1d95',
        title: 'Vous avez été mentionné',
        text: '@antoine.lf vous a mentionné dans un commentaire.',
        time: 'Hier',
        read: true
      }
    ];

    function renderNotifications() {
      const container = document.getElementById('notificationsContainer');
      if (!container) return;
      
      container.innerHTML = '';
      
      notifications.forEach(notif => {
        const notifDiv = document.createElement('div');
        notifDiv.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
        notifDiv.innerHTML = `
          <div style="margin-right: 18px; background: ${notif.bgColor}; width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: ${notif.color}; flex-shrink: 0;"><i class="${notif.icon}"></i></div>
          <div style="flex:1"><strong>${notif.title}</strong><br><span style="color:var(--text-secondary);">${notif.text}</span></div>
          <div style="color:var(--text-secondary); font-size: 13px; flex-shrink: 0; white-space: nowrap;">${notif.time}</div>
        `;
        container.appendChild(notifDiv);
      });
    }

    function addNotification(type, title, text) {
      const newNotif = {
        id: Math.max(...notifications.map(n => n.id), 0) + 1,
        type: type,
        title: title,
        text: text,
        time: 'À l\'instant',
        read: false
      };
      
      // Assigner icône et couleur selon le type
      const typeConfig = {
        message: { icon: 'fas fa-comment', color: 'var(--emerald-600)', bgColor: 'var(--emerald-100)' },
        follow: { icon: 'fas fa-user-check', color: '#2563eb', bgColor: '#0c4a6e' },
        post: { icon: 'fas fa-heart', color: '#dc2626', bgColor: '#7f1d1d' },
        mention: { icon: 'fas fa-at', color: '#9333ea', bgColor: '#4c1d95' },
        update: { icon: 'fas fa-sync-alt', color: '#d97706', bgColor: '#78350f' }
      };
      
      Object.assign(newNotif, typeConfig[type] || typeConfig.message);
      notifications.unshift(newNotif);
      renderNotifications();
    }

    // Bouton "Tout marquer lu"
    const markReadBtn = document.querySelector('#view-notifications .btn-primary');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        notifications.forEach(notif => notif.read = true);
        renderNotifications();
        markReadBtn.style.opacity = '0.5';
        markReadBtn.style.pointerEvents = 'none';
      });
    }

    // Rendu initial
    renderNotifications();

    // Simulation : ajouter une notification chaque 10s
    setTimeout(() => {
      addNotification('message', 'Nouveau message', 'Antoine a envoyé un message.');
    }, 10000);

    // ---------- MODE SOMBRE (toggle + localStorage) ----------
    const darkToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const root = document.documentElement;

    // ========== PERSONNALISATION DU THEME ==========
    // Fonction pour calculer les couleurs actives dynamiquement selon le thème
    function updateActiveColors(theme) {
      const savedColorHue = localStorage.getItem('ag7-primary-hue') || '160';
      const hue = parseInt(savedColorHue);
      
      if (!theme) {
        theme = localStorage.getItem('ag7-bg-theme') || 'light';
      }
      
      if (theme === 'light') {
        // Light theme: teinte claire de la couleur primaire
        root.style.setProperty('--active-bg', `hsl(${hue}, 50%, 88%)`);
        root.style.setProperty('--active-text-color', `hsl(${hue}, 50%, 25%)`);
      } else if (theme === 'dim') {
        // Dim theme: très sombre avec saturation élevée pour rester visible
        root.style.setProperty('--active-bg', `hsl(${hue}, 50%, 22%)`);
        root.style.setProperty('--active-text-color', '#ffffff');
      } else if (theme === 'dark') {
        // Dark theme: ultra sombre sur fond noir AMOLED
        root.style.setProperty('--active-bg', `hsl(${hue}, 55%, 12%)`);
        root.style.setProperty('--active-text-color', '#ffffff');
      }
    }

    // Fonction pour appliquer les changements d'arrière-plan
    function applyBackgroundTheme(theme) {
        const isDarkMode = body.classList.contains('dark');
        
        if (!isDarkMode) {
            // MODE CLAIR (inchangé, car il concerne le thème "Light")
            if (theme === 'light') {
            root.style.setProperty('--emerald-500', '#047857');
            root.style.setProperty('--emerald-600', '#059669');
            root.style.setProperty('--emerald-700', '#047857');
            root.style.setProperty('--bg-page', '#f1f5f9');
            root.style.setProperty('--bg-container', '#ffffff');
            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--sidebar-bg', '#ffffff');
            root.style.setProperty('--hover-bg', '#f8fafc');
            root.style.setProperty('--emerald-50', '#d1fae5');
            root.style.setProperty('--emerald-100', '#a7f3d0');
            root.style.setProperty('--slate-50', '#f8fafc');
            root.style.setProperty('--slate-100', '#f1f5f9');
            root.style.setProperty('--slate-200', '#e2e8f0');
            root.style.setProperty('--slate-800', '#334155');
            root.style.setProperty('--text-primary', '#334155');
            root.style.setProperty('--text-secondary', '#64748b');
            root.style.setProperty('--border-light', '#e2e8f0');
            } else if (theme === 'dim') {
            // DIM : gris foncé avec cyan discret
            root.style.setProperty('--emerald-500', '#2aa198');   // cyan-vert sobre
            root.style.setProperty('--emerald-600', '#268e86');
            root.style.setProperty('--emerald-700', '#1e6f6b');
            root.style.setProperty('--bg-page', '#1e293b');
            root.style.setProperty('--bg-container', '#0f172a');
            root.style.setProperty('--card-bg', '#1e293b');
            root.style.setProperty('--sidebar-bg', '#0f172a');
            root.style.setProperty('--hover-bg', '#334155');
            root.style.setProperty('--emerald-50', '#1a3a3a');
            root.style.setProperty('--emerald-100', '#1a3a3a');
            root.style.setProperty('--slate-50', '#1e293b');
            root.style.setProperty('--slate-100', '#1e293b');
            root.style.setProperty('--slate-200', '#334155');
            root.style.setProperty('--slate-800', '#0f172a');
            root.style.setProperty('--text-primary', '#f1f5f9');
            root.style.setProperty('--text-secondary', '#94a3b8');
            root.style.setProperty('--border-light', '#334155');
            } else if (theme === 'dark') {
            // DARK : ultra sombre avec cyan brillant (mais pas vert agressif)
            root.style.setProperty('--emerald-500', '#06d6a0');   // cyan vif
            root.style.setProperty('--emerald-600', '#05b58a');
            root.style.setProperty('--emerald-700', '#048a6e');
            root.style.setProperty('--bg-page', '#000000');
            root.style.setProperty('--bg-container', '#0a0f1f');
            root.style.setProperty('--card-bg', '#0f172a');
            root.style.setProperty('--sidebar-bg', '#000000');
            root.style.setProperty('--hover-bg', '#1e293b');
            root.style.setProperty('--emerald-50', '#1a2e2e');
            root.style.setProperty('--emerald-100', '#1a2e2e');
            root.style.setProperty('--slate-50', '#0f172a');
            root.style.setProperty('--slate-100', '#0f172a');
            root.style.setProperty('--slate-200', '#1e293b');
            root.style.setProperty('--slate-800', '#000000');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#a1aec7');
            root.style.setProperty('--border-light', '#1e293b');
            }
        } else {
            // SI LE TOGGLE "MODE SOMBRE" EST ACTIVÉ (body.dark)
            if (theme === 'light') {
            root.style.setProperty('--emerald-500', '#2aa198');
            root.style.setProperty('--emerald-600', '#268e86');
            root.style.setProperty('--emerald-700', '#1e6f6b');
            root.style.setProperty('--bg-page', '#1e293b');
            root.style.setProperty('--bg-container', '#0f172a');
            root.style.setProperty('--card-bg', '#1e293b');
            root.style.setProperty('--sidebar-bg', '#0f172a');
            root.style.setProperty('--hover-bg', '#334155');
            root.style.setProperty('--emerald-50', '#1a3a3a');
            root.style.setProperty('--emerald-100', '#1a3a3a');
            root.style.setProperty('--slate-50', '#1e293b');
            root.style.setProperty('--slate-100', '#1e293b');
            root.style.setProperty('--slate-200', '#334155');
            root.style.setProperty('--slate-800', '#0f172a');
            root.style.setProperty('--text-primary', '#f1f5f9');
            root.style.setProperty('--text-secondary', '#94a3b8');
            root.style.setProperty('--border-light', '#334155');
            } else if (theme === 'dim') {
            root.style.setProperty('--emerald-500', '#06d6a0');
            root.style.setProperty('--emerald-600', '#05b58a');
            root.style.setProperty('--emerald-700', '#048a6e');
            root.style.setProperty('--bg-page', '#000000');
            root.style.setProperty('--bg-container', '#0a0f1f');
            root.style.setProperty('--card-bg', '#0f172a');
            root.style.setProperty('--sidebar-bg', '#000000');
            root.style.setProperty('--hover-bg', '#1e293b');
            root.style.setProperty('--emerald-50', '#1a2e2e');
            root.style.setProperty('--emerald-100', '#1a2e2e');
            root.style.setProperty('--slate-50', '#0f172a');
            root.style.setProperty('--slate-100', '#0f172a');
            root.style.setProperty('--slate-200', '#1e293b');
            root.style.setProperty('--slate-800', '#000000');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#a1aec7');
            root.style.setProperty('--border-light', '#1e293b');
            } else if (theme === 'dark') {
            // Ultra sombre AMOLED
            root.style.setProperty('--emerald-500', '#06d6a0');
            root.style.setProperty('--emerald-600', '#05b58a');
            root.style.setProperty('--emerald-700', '#048a6e');
            root.style.setProperty('--bg-page', '#000000');
            root.style.setProperty('--bg-container', '#000000');
            root.style.setProperty('--card-bg', '#0a0a0a');
            root.style.setProperty('--sidebar-bg', '#000000');
            root.style.setProperty('--hover-bg', '#1a1a1a');
            root.style.setProperty('--emerald-50', '#1a2e2e');
            root.style.setProperty('--emerald-100', '#1a2e2e');
            root.style.setProperty('--slate-50', '#0a0a0a');
            root.style.setProperty('--slate-100', '#0a0a0a');
            root.style.setProperty('--slate-200', '#1a1a1a');
            root.style.setProperty('--slate-800', '#000000');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#a1aec7');
            root.style.setProperty('--border-light', '#1e293b');
            }
        }
        
        // Calculer et appliquer les couleurs actives dynamiquement
        updateActiveColors(theme);
    }

    // Fonction pour restaurer la couleur primaire personnalisée
    function restorePrimaryColor() {
      const savedColorHue = localStorage.getItem('ag7-primary-hue');
      if (savedColorHue) {
        const hue = parseInt(savedColorHue);
        root.style.setProperty('--emerald-500', `hsl(${hue}, 84%, 60%)`);
        root.style.setProperty('--emerald-100', `hsl(${hue}, 84%, 97%)`);
        root.style.setProperty('--emerald-600', `hsl(${hue}, 84%, 50%)`);
        root.style.setProperty('--emerald-700', `hsl(${hue}, 84%, 40%)`);
        // Recalculer les couleurs actives avec la nouvelle teinte
        const currentTheme = localStorage.getItem('ag7-bg-theme') || 'light';
        updateActiveColors(currentTheme);
      }
    }

    // Appliquer le thème sauvegardé
    const savedTheme = localStorage.getItem('ag7-theme');
    if (savedTheme === 'dark') {
      body.classList.add('dark');
      if (darkToggle) darkToggle.checked = true;
    } else {
      body.classList.remove('dark');
      if (darkToggle) darkToggle.checked = false;
    }

    // Appliquer le thème d'arrière-plan sauvegardé au chargement
    const savedBgThemeOnLoad = localStorage.getItem('ag7-bg-theme') || 'light';
    applyBackgroundTheme(savedBgThemeOnLoad);
    restorePrimaryColor();

    // Écouter le toggle
    if (darkToggle) {
      darkToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          body.classList.add('dark');
          localStorage.setItem('ag7-theme', 'dark');
        } else {
          body.classList.remove('dark');
          localStorage.setItem('ag7-theme', 'light');
        }
        // Réappliquer le thème d'arrière-plan choisi après le changement de mode dark
        const savedBgTheme = localStorage.getItem('ag7-bg-theme') || 'light';
        applyBackgroundTheme(savedBgTheme);
        restorePrimaryColor();
      });
    }

    // ========== PERSONNALISATION DU THEME ==========
    const themeModal = document.getElementById('themeModal');
    const customizeThemeBtn = document.getElementById('customizeThemeBtn');
    const customizeThemeClose = document.querySelector('.customize-theme-close');

    // Sélecteurs de taille de police
    const fontSizes = document.querySelectorAll('.font-sizes-selector span');
    
    // Sélecteurs de couleur
    const colorPalette = document.querySelectorAll('.colors-selector span');
    
    // Sélecteurs d'arrière-plan
    const bgOptions = {
      bg1: document.querySelector('.backgrounds-selector .bg-1'),
      bg2: document.querySelector('.backgrounds-selector .bg-2'),
      bg3: document.querySelector('.backgrounds-selector .bg-3')
    };

    // Ouvrir le modal
    customizeThemeBtn?.addEventListener('click', () => {
      themeModal.classList.add('active');
    });

    // Fermer le modal
    customizeThemeClose?.addEventListener('click', () => {
      themeModal.classList.remove('active');
    });

    themeModal?.addEventListener('click', (e) => {
      if (e.target === themeModal) {
        themeModal.classList.remove('active');
      }
    });

    // ====== GESTION TAILLE DE POLICE ======
    fontSizes.forEach(size => {
      size.addEventListener('click', () => {
        fontSizes.forEach(s => s.classList.remove('active'));
        size.classList.add('active');
        
        let fontSize;
        if (size.classList.contains('font-size-1')) {
          fontSize = '12px';
        } else if (size.classList.contains('font-size-2')) {
          fontSize = '14px';
        } else if (size.classList.contains('font-size-3')) {
          fontSize = '16px';
        } else if (size.classList.contains('font-size-4')) {
          fontSize = '18px';
        } else if (size.classList.contains('font-size-5')) {
          fontSize = '20px';
        }
        
        document.documentElement.style.fontSize = fontSize;
        localStorage.setItem('ag7-font-size', fontSize);
      });
    });

    // Appliquer la taille sauvegardée
    const savedFontSize = localStorage.getItem('ag7-font-size');
    if (savedFontSize) {
      document.documentElement.style.fontSize = savedFontSize;
      const fontIndex = ['12px', '14px', '16px', '18px', '20px'].indexOf(savedFontSize);
      if (fontIndex >= 0) {
        fontSizes.forEach(s => s.classList.remove('active'));
        fontSizes[fontIndex].classList.add('active');
      }
    }

    // ====== GESTION COULEUR PRIMAIRE ======
    const primaryColors = {
      'color-1': { hue: 160, name: 'emerald' },
      'color-2': { hue: 217, name: 'blue' },
      'color-3': { hue: 330, name: 'pink' },
      'color-4': { hue: 38, name: 'amber' },
      'color-5': { hue: 280, name: 'purple' }
    };

    colorPalette.forEach(color => {
      color.addEventListener('click', () => {
        colorPalette.forEach(c => c.classList.remove('active'));
        color.classList.add('active');
        
        const colorClass = color.className.split(' ').find(c => c.startsWith('color-'));
        if (primaryColors[colorClass]) {
          const { hue, name } = primaryColors[colorClass];
          
          // Appliquer les nouvelles couleurs
          root.style.setProperty('--emerald-500', `hsl(${hue}, 84%, 60%)`);
          root.style.setProperty('--emerald-100', `hsl(${hue}, 84%, 97%)`);
          root.style.setProperty('--emerald-600', `hsl(${hue}, 84%, 50%)`);
          root.style.setProperty('--emerald-700', `hsl(${hue}, 84%, 40%)`);
          
          localStorage.setItem('ag7-primary-color', name);
          localStorage.setItem('ag7-primary-hue', hue);
        }
      });
    });

    // Appliquer la couleur sauvegardée (ou initialiser à emerald par défaut)
    const savedColorHue = localStorage.getItem('ag7-primary-hue');
    const hueToApply = savedColorHue ? parseInt(savedColorHue) : 160; // 160 = émeraude par défaut
    const colorNameToApply = localStorage.getItem('ag7-primary-color') || 'emerald';
    
    // Appliquer la teinte
    root.style.setProperty('--emerald-500', `hsl(${hueToApply}, 84%, 60%)`);
    root.style.setProperty('--emerald-100', `hsl(${hueToApply}, 84%, 97%)`);
    root.style.setProperty('--emerald-600', `hsl(${hueToApply}, 84%, 50%)`);
    root.style.setProperty('--emerald-700', `hsl(${hueToApply}, 84%, 40%)`);
    
    // Sauvegarder si ce n'était pas déjà fait
    if (!savedColorHue) {
      localStorage.setItem('ag7-primary-hue', hueToApply);
      localStorage.setItem('ag7-primary-color', colorNameToApply);
    }
    
    // Mettre en évidence la couleur active
    const colorIndex = Object.values(primaryColors).findIndex(c => c.name === colorNameToApply);
    if (colorIndex >= 0) {
      colorPalette.forEach(c => c.classList.remove('active'));
      colorPalette[colorIndex].classList.add('active');
    }

    // ====== GESTION ARRIERE-PLAN ======
    bgOptions.bg1?.addEventListener('click', () => {
      bgOptions.bg1.classList.add('active');
      bgOptions.bg2.classList.remove('active');
      bgOptions.bg3.classList.remove('active');
      
      applyBackgroundTheme('light');
      restorePrimaryColor();
      localStorage.setItem('ag7-bg-theme', 'light');
    });

    bgOptions.bg2?.addEventListener('click', () => {
      bgOptions.bg1.classList.remove('active');
      bgOptions.bg2.classList.add('active');
      bgOptions.bg3.classList.remove('active');
      
      applyBackgroundTheme('dim');
      restorePrimaryColor();
      localStorage.setItem('ag7-bg-theme', 'dim');
    });

    bgOptions.bg3?.addEventListener('click', () => {
      bgOptions.bg1.classList.remove('active');
      bgOptions.bg2.classList.remove('active');
      bgOptions.bg3.classList.add('active');
      
      applyBackgroundTheme('dark');
      restorePrimaryColor();
      localStorage.setItem('ag7-bg-theme', 'dark');
    });

    // Appliquer le thème d'arrière-plan sauvegardé au chargement
    const savedBgTheme = localStorage.getItem('ag7-bg-theme') || 'light';
    const bgIndex = { light: 0, dim: 1, dark: 2 };
    if (bgIndex[savedBgTheme] >= 0) {
      [bgOptions.bg1, bgOptions.bg2, bgOptions.bg3].forEach((bg, i) => {
        bg.classList.toggle('active', i === bgIndex[savedBgTheme]);
      });
      applyBackgroundTheme(savedBgTheme);
      restorePrimaryColor();
    }


    // Réinit après chaque ajout de message
    const originalAddMessage = window.addMessage;
    if (window.addMessage) {
      window.addMessage = function(text, isMe) {
        originalAddMessage(text, isMe);
        initMessageActions();
      };
    }

    // Notification de bienvenue (optionnelle)
  })();


async function loadUserPosts(userId, limit = 4, offset = 0) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'getUserPosts');
    url.searchParams.set('user_id', userId);
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);
    const response = await fetch(url.toString());
    const result = await response.json();
    if (result.success) {
      return result.posts.map(post => ({ ...post })); // adapter le format
    }
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

let profileObserver = null;

function setupProfileInfiniteScroll() {
  if (profileObserver) profileObserver.disconnect();
  const sentinel = document.getElementById('profile-sentinel');
  if (sentinel) sentinel.remove();
  const grid = document.getElementById('profilePostsGrid');
  if (!grid) return;

  const sentinelDiv = document.createElement('div');
  sentinelDiv.id = 'profile-sentinel';
  sentinelDiv.style.height = '20px';
  grid.parentNode.appendChild(sentinelDiv);

  profileObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && profilePostsState.hasMore && !profilePostsState.isLoading) {
      loadProfilePosts(false);
    }
  }, { threshold: 0.1 });
  profileObserver.observe(sentinelDiv);
}

async function loadProfilePosts(reset = true) {
  if (!currentUserProfile.userid) return;
  if (profilePostsState.isLoading) return;

  if (reset) {
    profilePostsState.offset = 0;
    profilePostsState.hasMore = true;
    profilePostsState.userId = currentUserProfile.userid;
    const grid = document.getElementById('profilePostsGrid');
    if (grid) grid.innerHTML = '';
    profilePostsState.isLoading = false;
  }

  if (!profilePostsState.hasMore) return;

  profilePostsState.isLoading = true;
  const newPosts = await loadUserPosts(
    profilePostsState.userId,
    profilePostsState.limit,
    profilePostsState.offset
  );
  profilePostsState.isLoading = false;

  if (newPosts.length === 0) {
    profilePostsState.hasMore = false;
    return;
  }

  if (reset) {
    currentUserProfile.posts = newPosts;
  } else {
    currentUserProfile.posts = [...currentUserProfile.posts, ...newPosts];
  }

  updateProfileUI();

  profilePostsState.offset += profilePostsState.limit;
  if (newPosts.length < profilePostsState.limit) {
    profilePostsState.hasMore = false;
  }

  if (profilePostsState.hasMore) {
    setupProfileInfiniteScroll();
  }
}

  // ========== GESTION DES STORIES ==========
function closeStoryModal() {
  document.querySelector('.story-time-left')?.remove();
  storyModal.classList.add('hidden');
}

function getStoryImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('story/')) return url;
  return 'story/' + url;
}

const storyModal = document.getElementById('storyModal');
const storyImage = document.getElementById('storyImage');
const storyCaption = document.querySelector('.story-caption');
const storyClose = document.querySelector('.story-close');

const createStoryModal = document.getElementById('createStoryModal');
const addStoryBtn = document.getElementById('addStoryBtn');
const createStoryClose = document.querySelector('.create-story-close');
const storyTextInput = document.getElementById('storyText');
const uploadStoryImageBtn = document.getElementById('uploadStoryImageBtn');
const storyImageInput = document.getElementById('storyImageInput');
const storyImagePreview = document.getElementById('storyImagePreview');
const publishStoryBtn = document.getElementById('publishStoryBtn');
const cancelStoryBtn = document.getElementById('cancelStoryBtn');
const storiesContainer = document.getElementById('storiesContainer');

storyTextInput.addEventListener('input', updateCreateStoryButtons);
// Données des stories

let userStories = [];

let otherStories = [];

async function loadStories() {
  const result = await StoriesAPI.getActiveStories();
  if (result.success && result.stories) {
    const user_id = currentUserProfile.userid;
    window.currentUserId = currentUserProfile.userid;
    userStories = [];
    otherStories = [];
    result.stories.forEach(s => {
      const storyObj = {
        id: s.story_id,
        type: s.story_type,
        text: s.story_text || '',
        image: s.story_image_url ? s.story_image_url : null,
        userName: s.user_name,
        timestamp: s.story_created_at,
        viewers: s.viewers_count,
        userId: s.story_user_id,
        isOwner: s.is_owner,
        viewed: s.viewed,
        expiresAt: s.story_expires_at   // ← ajouté
      };
      if (s.is_owner) userStories.push(storyObj);
      else otherStories.push(storyObj);
    });
  }
  renderStories();
}

function updateCreateStoryButtons() {
  const actionsDiv = document.querySelector('.create-story-actions');
  if (!actionsDiv) return;

  const text = storyTextInput.value.trim();
  const hasImage = (selectedStoryFile !== null); // fichier sélectionné

  if (text.length > 0 || hasImage) {
    actionsDiv.style.display = 'flex'; // ou 'block'
  } else {
    actionsDiv.style.display = 'none';
  }
}


let selectedStoryImage = null;
let selectedStoryFile = null;

// Upload image pour story
uploadStoryImageBtn.addEventListener('click', () => storyImageInput.click());

storyImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedStoryFile = file;
    updateCreateStoryButtons();
    const reader = new FileReader();
    reader.onload = (event) => {
      selectedStoryImage = event.target.result;
      storyImagePreview.src = selectedStoryImage;
      storyImagePreview.style.display = 'block';
      uploadStoryImageBtn.disabled = true;
      uploadStoryImageBtn.style.opacity = '0.5';
      uploadStoryImageBtn.style.cursor = 'not-allowed';
    };
    reader.readAsDataURL(file);
  }
});

// Ouvrir modale création story
addStoryBtn.addEventListener('click', () => {
  createStoryModal.classList.remove('hidden');
  storyTextInput.value = '';
  selectedStoryImage = null;
  selectedStoryFile = null;
  storyImagePreview.style.display = 'none';
  storyImageInput.value = '';
  uploadStoryImageBtn.disabled = false;
  uploadStoryImageBtn.style.opacity = '1';
  uploadStoryImageBtn.style.cursor = 'pointer';
});

// Masquer les boutons d'action tant qu'il n'y a pas de contenu
const actionsDiv = document.querySelector('.create-story-actions');
if (actionsDiv) actionsDiv.style.display = 'none';

// Fermer modales
createStoryClose.addEventListener('click', () => {
  createStoryModal.classList.add('hidden');
  storyImageInput.value = '';
  uploadStoryImageBtn.disabled = false;
  uploadStoryImageBtn.style.opacity = '1';
  uploadStoryImageBtn.style.cursor = 'pointer';
});
cancelStoryBtn.addEventListener('click', () => {
  createStoryModal.classList.add('hidden');
  storyImageInput.value = '';
  uploadStoryImageBtn.disabled = false;
  uploadStoryImageBtn.style.opacity = '1';
  uploadStoryImageBtn.style.cursor = 'pointer';
});
storyClose.addEventListener('click', closeStoryModal);
storyModal.addEventListener('click', (e) => {
  if (e.target === storyModal) closeStoryModal();
});

createStoryModal.addEventListener('click', (e) => {
  if (e.target === createStoryModal) createStoryModal.classList.add('hidden');
});

storyModal.addEventListener('click', (e) => {
  if (e.target === storyModal) storyModal.classList.add('hidden');
});

// Publier une story
publishStoryBtn.addEventListener('click', async () => {
  const text = storyTextInput.value.trim();
  const imageFile = selectedStoryFile; // le fichier réel, pas le base64

  if (!text && !imageFile) {
    showNotification('warning', 'Vide', 'Ajoutez un texte ou une image');
    return;
  }

  publishStoryBtn.disabled = true;
  publishStoryBtn.textContent = 'Publication...';

  const result = await StoriesAPI.createStory(text, imageFile);

  publishStoryBtn.disabled = false;
  publishStoryBtn.textContent = 'Publier la story';

  if (result.success) {
    showNotification('success', 'Story', 'Story publiée !');
    createStoryModal.classList.add('hidden');
    // Recharger les stories depuis le serveur (dynamique)
    await loadStories();
  } else {
    showNotification('error', 'Erreur', result.message || 'Échec de la publication');
  }
});

// Afficher les stories
function renderStories() {
  storiesContainer.innerHTML = '';
  
  // Bouton ajouter story
  const addBtn = document.createElement('div');
  addBtn.className = 'story-item';
  addBtn.id = 'addStoryBtn';
  addBtn.innerHTML = `
    <div class="story-avatar add-story">
      <i class="fas fa-plus"></i>
    </div>
    <span class="story-name">Votre story</span>
  `;
  addBtn.addEventListener('click', () => createStoryModal.classList.remove('hidden'));
  storiesContainer.appendChild(addBtn);
  
  // Stories de l'utilisateur - avec compteur de vues
  userStories.forEach(story => {
    const storyEl = document.createElement('div');
    storyEl.className = 'story-item';
    storyEl.innerHTML = `
      <div class="story-avatar" style="background-image: url('${getStoryImageUrl(story.image)}');"></div>
      <span class="story-name">${story.userName}</span>
    `;
    storyEl.addEventListener('click', () => openStory(story));
    storiesContainer.appendChild(storyEl);
  });
  
  // Stories des autres - pas de compteur de vues
  otherStories.forEach(story => {
    const storyEl = document.createElement('div');
    storyEl.className = 'story-item';
    storyEl.innerHTML = `
      <div class="story-avatar" style="background-image: url('${getStoryImageUrl(story.image)}');"></div>
      <span class="story-name">${story.userName}</span>
    `;
    storyEl.addEventListener('click', () => openStory(story));
    storiesContainer.appendChild(storyEl);
  });
}

function openStory(story) {
  // Préparer l'image
  let imageUrl = story.image;
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
    imageUrl = 'story/' + imageUrl;
  }
  storyImage.src = getStoryImageUrl(story.image);
  storyCaption.textContent = story.text || '';

  // 1. Bouton de suppression (propriétaire uniquement)
  const deleteBtn = document.getElementById('storyDeleteBtn');
  if (deleteBtn) {
    if (story.isOwner) {
      deleteBtn.style.display = 'block';
      deleteBtn.onclick = async () => {
        showConfirmation(
          'Supprimer cette story',
          'Êtes-vous sûr de vouloir supprimer cette story ? Cette action est irréversible.',
          async () => {
            const result = await StoriesAPI.deleteStory(story.id);
            if (result.success) {
              closeStoryModal();
              await loadStories();
              showNotification('success', 'Story supprimée', '');
            } else {
              showNotification('error', 'Erreur', result.message);
            }
          }
        );
      };
    } else {
      deleteBtn.style.display = 'none';
    }
  }

  // 2. Compteur de vues (visible uniquement par le propriétaire)
  const viewersCountEl = document.getElementById('storyViewersCount');
  if (story.isOwner && story.viewers > 0) {
    viewersCountEl.innerHTML = `<i class="fas fa-eye"></i> ${story.viewers}`;
    viewersCountEl.style.display = 'flex';
  } else {
    viewersCountEl.style.display = 'none';
  }

  // 3. Temps restant avant expiration
  const oldTimeLeft = document.querySelector('.story-time-left');
  if (oldTimeLeft) oldTimeLeft.remove();

  if (story.expiresAt) {
    const now = new Date();
    const expires = new Date(story.expiresAt);
    const diffMs = expires - now;
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      const timeEl = document.createElement('div');
      timeEl.className = 'story-time-left';
      timeEl.style.cssText = 'position:absolute; top:20px; left:50%; transform:translateX(-50%); color:white; background:rgba(0,0,0,0.5); padding:6px 12px; border-radius:20px; font-size:13px;';
      
      timeEl.style.display = 'flex';
      timeEl.style.alignItems = 'center';
      timeEl.style.gap = '5px';
      timeEl.innerHTML = `<i class="fas fa-hourglass-half"></i> ${timeText} restantes`;

      document.querySelector('.story-modal-content').appendChild(timeEl);
    }
  }

  // 4. Enregistrer une vue si l'utilisateur n'est pas le propriétaire et n'a pas déjà vu
  if (!story.isOwner && !story.viewed) {
    StoriesAPI.viewStory(story.id);
    story.viewed = true; // éviter les appels multiples
  }

  storyModal.classList.remove('hidden');
}

// Initialisation
renderStories();

// ========== GESTION DÉCOUVRIR (UTILISATEURS) ==========
let followingUsers = new Set();
let discoverUsers = []; // Stocke les utilisateurs récupérés de la BDD

/**
 * Charge les utilisateurs depuis la BDD pour la section "Découvrir"
 */
async function loadDiscoverUsers() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'getDiscoverUsers');
    url.searchParams.set('limit', 20);
    
    const response = await fetch(url.toString(), { 
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
      discoverUsers = data.users;
      
      // Mettre à jour le Set des utilisateurs suivis
      followingUsers.clear();
      discoverUsers.forEach(user => {
        if (user.isFollowing) {
          followingUsers.add(user.id);
        }
      });
      
      renderDiscoverGrid();
    } else {
      console.error('Erreur chargement utilisateurs:', data.message);
      showNotification('error', 'Erreur', 'Impossible de charger les utilisateurs');
    }
  } catch (error) {
    console.error('Erreur loadDiscoverUsers:', error);
    showNotification('error', 'Erreur', 'Impossible de charger les utilisateurs');
  }
}

function renderDiscoverGrid() {
  const discoverGrid = document.getElementById('discoverGrid');
  if (!discoverGrid) return;
  
  discoverGrid.innerHTML = '';
  
  discoverUsers.forEach(user => {
    const isFollowing = followingUsers.has(user.id);
    const userCard = document.createElement('div');
    userCard.className = 'discover-card';
    userCard.style.cursor = 'pointer';

    userCard.addEventListener('click', (e) => {
      if (!e.target.closest('.discover-follow-btn')) {
        openUserProfile(user.id);
      }
    });
    
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    let avatarHTML;
    if (user.photo) {
      avatarHTML = `<img src="${user.photo}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" loading="lazy">`;
    } else {
      avatarHTML = `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; margin: 0 auto 12px;">${initials}</div>`;
    }
    
    userCard.innerHTML = `
      <div class="discover-avatar" style="margin: 0 auto 12px;">
        ${avatarHTML}
      </div>
      <h3>${escapeHtml(user.name)}</h3>
      <div class="discover-username">${escapeHtml(user.username)}</div>
      <div class="discover-bio">${escapeHtml(user.bio || 'Pas de bio')}</div>
      <button class="discover-follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${user.id}">
        ${isFollowing ? '<i class="fas fa-check"></i> Suivi(e)' : '<i class="fas fa-user-plus"></i> Suivre'}
      </button>
    `;

    
    // Gestion du bouton follow (avec stopPropagation pour ne pas ouvrir le profil)
    const followBtn = userCard.querySelector('.discover-follow-btn');
    followBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      const userId = user.id;
      const wasFollowing = isFollowing;
      
      try {
        const formData = new FormData();
        formData.append('action', wasFollowing ? 'unfollowUser' : 'followUser');
        formData.append('followed_id', userId);
        
        const response = await fetch(window.location.href, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          if (wasFollowing) {
            followingUsers.delete(userId);
            showNotification('success', 'Désabonné', `Vous avez arrêté de suivre ${user.name}`);
          } else {
            followingUsers.add(userId);
            showNotification('success', 'Suivi(e)', `Vous suivez maintenant ${user.name}`);
          }
          renderDiscoverGrid(); // Rafraîchir la grille
          // Rafraîchir le profil courant si nécessaire
          if (typeof loadCurrentProfile === 'function') {
            await loadCurrentProfile();
            updateProfileUI();
          }
        } else {
          showNotification('error', 'Erreur', data.message || 'Erreur lors du suivi(e)');
        }
      } catch (error) {
        console.error('Erreur follow:', error);
        showNotification('error', 'Erreur', 'Impossible de suivre cet utilisateur');
      }
    });
    
    discoverGrid.appendChild(userCard);
  });
}

async function openUserProfile(userId) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getUserProfile');
      url.searchParams.set('user_id', userId);
      const response = await fetch(url.toString());
      const data = await response.json();
        
        if (!data.success || !data.profile) {
          showNotification('error', 'Erreur', 'Profil introuvable');
          return;
        }
        
        const profile = data.profile;
        const modal = document.getElementById('userProfileModal');
        const followBtn = document.getElementById('userProfileFollowBtn');
        const messageBtn = document.getElementById('userProfileMessageBtn');
        const isOwnProfile = (currentUserProfile.userid == userId);
        
        // Remplir les infos
        document.getElementById('userProfileName').innerText = profile.user_name;
        document.getElementById('userProfileUsername').innerText = '@' + profile.user_username;
        document.getElementById('userProfileBio').innerText = profile.user_bio || 'Pas de bio';
        document.getElementById('userProfileLocation').textContent = profile.user_location || 'Non renseigné';
        document.getElementById('userProfileMemberSince').textContent = `Membre depuis ${profile.member_since || 'inconnue'}`;
        document.getElementById('userProfileFollowersCount').innerText = profile.followers_count || 0;
        document.getElementById('userProfileFollowingCount').innerText = profile.following_count || 0;
        
        // Avatar
        const avatarDiv = document.getElementById('userProfileAvatar');
        if (profile.user_photo_url) {
            avatarDiv.style.backgroundImage = `url('imgApp/${profile.user_photo_url}')`;
            avatarDiv.style.backgroundSize = 'cover';
            avatarDiv.innerText = '';
        } else {
            const initials = profile.user_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
            avatarDiv.style.backgroundImage = 'none';
            avatarDiv.innerText = initials;
        }
        
        // Cover
        const coverDiv = document.getElementById('userProfileCover');
        if (profile.user_cover_photo_url) {
            coverDiv.style.backgroundImage = `url('imgApp/${profile.user_cover_photo_url}')`;
        } else {
            coverDiv.style.backgroundImage = `url('https://picsum.photos/id/104/1200/400')`;
        }
        
        // Gestion boutons (suivre / message)
        if (!isOwnProfile) {
            followBtn.style.display = 'block';
            const isFollowing = !!profile.is_following;
            messageBtn.style.display = isFollowing ? 'block' : 'none';
            followBtn.innerText = isFollowing ? '✓ Suivi(e)' : 'Suivre';
            followBtn.classList.toggle('following', isFollowing);
            
            // Événement follow
            followBtn.onclick = async () => {
                const action = isFollowing ? 'unfollowUser' : 'followUser';
                const formData = new FormData();
                formData.append('action', action);
                formData.append('followed_id', userId);
                const res = await fetch(window.location.href, { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    showNotification('success', isFollowing ? 'Désabonné' : 'Abonné', '');
                    openUserProfile(userId); // refresh
                    loadCurrentProfile(); // update global counts
                    updateProfileUI();
                } else {
                    showNotification('error', 'Erreur', result.message);
                }
            };
            
            // Événement message
            messageBtn.onclick = async () => {
                // Créer ou récupérer conversation
                const formData = new FormData();
                formData.append('action', 'getOrCreateConversation');
                formData.append('user_id', userId);
                const res = await fetch(window.location.href, { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success && result.conv_id) {
                    if (typeof MessagingManager !== 'undefined') {
                        await MessagingManager.openConversationInChat(result.conv_id, profile.user_name, userId);
                    }
                    modal.classList.add('hidden');
                } else {
                    showNotification('error', 'Erreur', result.message || 'Impossible de créer la conversation');
                }
            };
        } else {
            followBtn.style.display = 'none';
            messageBtn.style.display = 'none';
        }
        
        modal.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erreur', 'Impossible de charger le profil');
    }
}

// Gestion de la recherche d'utilisateurs
const searchUsersInput = document.getElementById('searchUsersInput');
if (searchUsersInput) {
  searchUsersInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const discoverGrid = document.getElementById('discoverGrid');
    const cards = discoverGrid.querySelectorAll('.discover-card');
    
    cards.forEach(card => {
      const name = card.querySelector('h3').textContent.toLowerCase();
      const username = card.querySelector('.discover-username').textContent.toLowerCase();
      const bio = card.querySelector('.discover-bio').textContent.toLowerCase();
      
      const matches = name.includes(query) || username.includes(query) || bio.includes(query);
      card.style.display = matches ? '' : 'none';
    });
  });
}

// ========== GESTION DU FEED (PUBLICATIONS) ==========
// ENTIÈREMENT GÉRÉE PAR actus-complete.js - NE RIEN MODIFIER ICI

const feedContainer = document.getElementById('feedContainer');
const publishBtn = document.getElementById('publishPostBtn');
const postContentInput = document.getElementById('postContent');

// Variables pour les images de post - DISABLED, utiliser actus-complete.js
const addImageBtn = document.getElementById('addImageBtn');
const postImageInput = document.getElementById('postImageInput');
const postImagesPreview = document.getElementById('postImagesPreview');
const clearImagesBtn = document.getElementById('clearImagesBtn');

// Track carousel state per post
let postImageIndices = {};

// Initialisation du feed - USAMOS ACTUS-COMPLETE.JS

// Initialisation de la grille découvrir
renderDiscoverGrid();

// ========== PROFIL AVEC FOLLOWERS (DECLARADO NO TOPO DO ARQUIVO) ==========

// Fonction helper pour construire l'URL complète d'une photo
function getPhotoURL(filename) {
  if (!filename) return null;
  // Si c'est déjà une URL complète, la retourner
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('data:')) {
    return filename;
  }
  // Si c'est déjà préfixé par imgApp/, ne pas dupliquer
  if (filename.startsWith('imgApp/')) {
    return filename;
  }
  // Sinon, préfixer avec le chemin du dossier
  return 'imgApp/' + filename;
}

// Charger le profil réel de l'utilisateur connecté depuis le serveur
async function loadCurrentProfile() {
  try {
    const formData = new FormData();
    formData.append('action', 'getCurrentProfile');
    
    const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Erreur HTTP:', response.status);
      if (response.status === 401) {
        console.warn('Session non valide ou expirée. Retour au login.');
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter');
        // Déconnecter l'utilisateur et afficher l'écran de login
        const appSection = document.getElementById('app-section');
        const loginSection = document.getElementById('login-section');
        if (appSection && loginSection) {
          appSection.classList.add('hidden');
          loginSection.classList.remove('hidden');
        }
        return false;
      }
      console.error('Erreur serveur:', response.statusText);
      return false;
    }
    
    const result = await response.json();
    if (!result.success) {
        console.error('Erreur serveur:', result.message);
        return false;
    }
    
    const profile = result.profile;
    if (!profile) {
        console.error('Profil vide reçu du serveur');
        return false;
    }
    
    // IMPORTANT : Réinitialiser TOUS les champs pour éviter les données fantômes lors d'un changement de compte
    currentUserProfile = {
      name: profile.user_name || "User",
      username: '@' + (profile.user_username || "user"),
      bio: profile.user_bio || "Pas de bio",
      location: profile.user_location || "Localisation inconnue",
      memberSince: profile.member_since || "Janvier 2024",
      userid: profile.user_id,
      avatarInitials: profile.user_name
        ? profile.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : 'U',
      profilePhoto: profile.user_photo_url ? getPhotoURL(profile.user_photo_url) : null,
      coverPhoto: profile.user_cover_photo_url ? getPhotoURL(profile.user_cover_photo_url) : null,
      postsCount: profile.posts_count || 0,
      followers_count: profile.followers_count || 0,
      following_count: profile.following_count || 0,
      posts: [] // Toujours initialiser comme array
    };
    
    return true;
  } catch (e) {
    console.error('Erreur au chargement du profil:', e);
    // S'assurer que currentUserProfile reste valide même en cas d'erreur
    if (!currentUserProfile) {
      currentUserProfile = {
        name: "User",
        username: "@user",
        bio: "Pas de bio",
        location: "Localisation inconnue",
        memberSince: "Janvier 2024",
        userid: null,
        avatarInitials: "U",
        profilePhoto: null,
        coverPhoto: null,
        postsCount: 0,
        followers_count: 0,
        following_count: 0,
        posts: []
      };
    }
    return false;
  }
}

function openPostDetailModal(post) {
  const modal = document.getElementById('postDetailModal');
  if (!modal) return;

  // Remplir les infos de base
  document.getElementById('postDetailAuthor').textContent = post.author || 'Utilisateur';
  document.getElementById('postDetailTime').textContent = formatTime(post.timestamp);
  document.getElementById('postDetailText').textContent = post.content || '';
  document.getElementById('postDetailLikes').textContent = post.likes || 0;
  document.getElementById('postDetailComments').textContent = post.comments || 0;

  // Avatar
  const avatar = document.getElementById('postDetailAvatar');
  if (post.avatar) {
    avatar.style.backgroundImage = `url('${post.avatar}')`;
    avatar.style.backgroundSize = 'cover';
    avatar.style.backgroundPosition = 'center';
    avatar.textContent = '';
  } else {
    avatar.style.backgroundImage = 'none';
    avatar.textContent = (post.author || 'U').substring(0, 2).toUpperCase();
  }

  // Image (première image seulement)
  const imgEl = document.getElementById('postDetailImage');
  if (post.images && post.images.length > 0) {
    imgEl.src = post.images[0];
    imgEl.style.display = 'block';
  } else {
    imgEl.style.display = 'none';
  }

  // Supprimer les anciennes sections audio ou sondage pour éviter les doublons
  const existingAudioDiv = document.querySelector('#postDetailAudioSection');
  if (existingAudioDiv) existingAudioDiv.remove();
  const existingPollDiv = document.querySelector('#postDetailPollSection');
  if (existingPollDiv) existingPollDiv.remove();

  // ===== SECTION AUDIO =====
  if (post.post_audio_url) {
    const audioPath = 'audio/posts/' + post.post_audio_url;
    const audioListens = post.post_audio_listens || 0;
    const audioDuration = formatDuration(post.post_audio_duration);

    const audioSection = document.createElement('div');
    audioSection.id = 'postDetailAudioSection';
    audioSection.className = 'post-audio-card';
    audioSection.setAttribute('data-post-id', post.id);
    audioSection.innerHTML = `
      <div class="audio-player-wrapper">
        <button class="audio-play-pause" data-post-id="${post.id}">
          <i class="fas fa-play"></i>
        </button>
        <div class="audio-progress-container">
          <div class="audio-progress-bar">
            <div class="audio-progress-fill" style="width: 0%;"></div>
          </div>
          <div class="audio-time-info">
            <span class="audio-current-time">00:00</span>
            <span class="audio-duration">${audioDuration}</span>
          </div>
        </div>
        <div class="audio-stats">
          <span class="audio-listens-count"><i class="fas fa-headphones"></i> ${audioListens}</span>
        </div>
      </div>
      <audio class="hidden-audio" data-post-id="${post.id}" preload="metadata" style="display: none;">
        <source src="${audioPath}">
      </audio>
    `;

    // Insérer la section audio après le texte (ou avant les stats)
    const contentDiv = modal.querySelector('.post-detail-content');
    const statsDiv = contentDiv.querySelector('.post-detail-stats');
    contentDiv.insertBefore(audioSection, statsDiv);

    // Initialiser le lecteur audio (même logique que dans le feed)
    setTimeout(() => {
      initDetailAudioPlayer(post.id);
    }, 50);
  }

  // ===== SECTION SONDAGE =====
  if (post.has_poll) {
    // Charger les données du sondage depuis l'API
    fetch(`?action=getPollByPost&post_id=${post.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.poll) {
          const pollSection = document.createElement('div');
          pollSection.id = 'postDetailPollSection';
          pollSection.className = 'post-poll-detail';
          pollSection.innerHTML = renderPollHTML(data.poll);

          const contentDiv = modal.querySelector('.post-detail-content');
          const statsDiv = contentDiv.querySelector('.post-detail-stats');
          contentDiv.insertBefore(pollSection, statsDiv);

          // Attacher les événements de vote (identique au feed)
          attachPollEventsToDetail(pollSection, post.id);
        }
      })
      .catch(err => console.error('Erreur chargement sondage:', err));
  }

  // Bouton suppression (déjà présent)
  const deleteBtn = document.getElementById('postDetailDeleteBtn');
  if (deleteBtn) {
    if (currentUserId && parseInt(currentUserId) === parseInt(post.user_id)) {
      deleteBtn.style.display = 'block';
      deleteBtn.onclick = () => {
        showConfirmation(
          'Supprimer cette publication',
          'Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.',
          () => {
            ActusAPI.deletePost(post.id).then(res => {
              if (res.success) {
                modal.classList.add('hidden');
                loadCurrentProfile().then(() => updateProfileUI());
                showNotification('success', 'Supprimé', 'Publication supprimée');
              } else {
                showNotification('error', 'Erreur', res.message);
              }
            });
          }
        );
      };
    } else {
      deleteBtn.style.display = 'none';
    }
  }

  modal.classList.remove('hidden');
}

// Fonction auxiliaire pour initialiser le lecteur audio dans le modal
function initDetailAudioPlayer(postId) {
  const container = document.querySelector('#postDetailAudioSection');
  if (!container) return;
  const audio = container.querySelector('.hidden-audio');
  const playBtn = container.querySelector('.audio-play-pause');
  const progressBar = container.querySelector('.audio-progress-bar');
  const progressFill = container.querySelector('.audio-progress-fill');
  const currentTimeSpan = container.querySelector('.audio-current-time');
  const listensSpan = container.querySelector('.audio-listens-count');
  let hasListened = false;

  audio.addEventListener('loadedmetadata', () => {
    const durationSpan = container.querySelector('.audio-duration');
    if (durationSpan) durationSpan.textContent = formatDuration(Math.floor(audio.duration));
  });

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      if (!hasListened && !audio.dataset.listened) {
        audio.dataset.listened = 'true';
        hasListened = true;
        ActusAPI.incrementAudioListens(postId).then(() => {
          const currentListens = parseInt(listensSpan.innerText.match(/\d+/) || 0);
          listensSpan.innerHTML = `<i class="fas fa-headphones"></i> ${currentListens + 1}`;
        });
      }
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  });

  audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = percent + '%';
    currentTimeSpan.textContent = formatDuration(Math.floor(audio.currentTime));
  });

  audio.addEventListener('ended', () => {
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    progressFill.style.width = '0%';
    currentTimeSpan.textContent = '00:00';
  });

  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
    }
  });
}

// Fonction auxiliaire pour attacher les événements de vote dans le modal
function attachPollEventsToDetail(pollContainer, postId) {
  const pollDiv = pollContainer.querySelector('.post-poll');
  if (!pollDiv) return;
  const pollId = pollDiv.dataset.pollId;
  const options = pollContainer.querySelectorAll('.poll-option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      const optionId = parseInt(option.dataset.optionId);
      handlePollVoteDetail(pollContainer, optionId, pollId, postId);
    });
  });
}

async function handlePollVoteDetail(pollContainer, optionId, pollId, postId) {
  if (!currentUserId) {
    showNotification('error', 'Erreur', 'Veuillez vous connecter pour voter');
    return;
  }
  try {
    const response = await fetch(`?action=votePoll`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ poll_id: pollId, option_id: optionId }),
        credentials: 'include'
    });
    const data = await response.json();
    if (data.success && data.poll) {
      const newPollHTML = renderPollHTML(data.poll);
      pollContainer.innerHTML = newPollHTML;
      attachPollEventsToDetail(pollContainer, postId);
      showNotification('success', 'Succès', 'Votre vote a été enregistré');
    } else {
      showNotification('error', 'Erreur', data.message || 'Erreur au vote');
    }
  } catch (err) {
    console.error(err);
    showNotification('error', 'Erreur', 'Une erreur s\'est produite');
  }
}

// Fermeture du modal
document.querySelector('.post-detail-close')?.addEventListener('click', () => {
  document.getElementById('postDetailModal').classList.add('hidden');
});

// currentUserProfile est déjà déclaré et initialisé plus haut dans le fichier

function updateProfileUI() {
  // Mettre à jour la photo de couverture
  const coverImg = document.querySelector('.cover-img');
  if (coverImg && currentUserProfile.coverPhoto) {
    coverImg.src = currentUserProfile.coverPhoto;
  }
  
  document.getElementById("profileName").innerText = currentUserProfile.name;
  document.querySelector(".profile-username").innerText = currentUserProfile.username;
  document.querySelector(".profile-bio-text").innerText = currentUserProfile.bio;
  document.querySelector(".profile-location-date span:first-child").innerHTML = `<i class="fas fa-map-pin"></i> ${currentUserProfile.location}`;
  document.querySelector(".profile-location-date span:last-child").innerHTML = `<i class="fas fa-calendar-alt"></i> Membre depuis ${currentUserProfile.memberSince}`;
  
  // Afficher la photo ou les initiales
  const profileAvatarEl = document.getElementById("profileAvatar");
  if (currentUserProfile.profilePhoto) {
    profileAvatarEl.style.backgroundImage = `url('${currentUserProfile.profilePhoto}')`;
    profileAvatarEl.style.backgroundSize = 'cover';
    profileAvatarEl.style.backgroundPosition = 'center';
    profileAvatarEl.innerText = '';
  } else {
    profileAvatarEl.style.backgroundImage = 'none';
    profileAvatarEl.innerText = currentUserProfile.avatarInitials;
  }
  
  // AFFICHER LES VRAIES STATS DE LA BASE DE DONNÉES (pas fallback)
  document.getElementById("postsCount").innerText = currentUserProfile.postsCount || 0;
  document.getElementById("followersCount").innerText = currentUserProfile.followers_count || 0;
  document.getElementById("followingCount").innerText = currentUserProfile.following_count || 0;

  // Mettre à jour le placeholder du textarea de création de post
  const postContent = document.getElementById("postContent");
  if (postContent) {
    postContent.placeholder = `Quoi de neuf, ${currentUserProfile.name.split(' ')[0]} ?`;
  }

  // Mettre à jour le mini-avatar du formulaire de création de post
  const createPostAvatar = document.querySelector(".mini-avatar");
  if (createPostAvatar) {
    if (currentUserProfile.profilePhoto) {
      createPostAvatar.style.backgroundImage = `url('${currentUserProfile.profilePhoto}')`;
      createPostAvatar.style.backgroundSize = 'cover';
      createPostAvatar.style.backgroundPosition = 'center';
      createPostAvatar.innerText = '';
    } else {
      createPostAvatar.style.backgroundImage = 'none';
      createPostAvatar.innerText = currentUserProfile.avatarInitials;
    }
  }

  // Grille des posts - affichage selon le type
  const grid = document.getElementById("profilePostsGrid");
  if (grid) {
    if (!currentUserProfile.posts || currentUserProfile.posts.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px 20px;">Aucune publication pour le moment</div>';
    } else {
      grid.innerHTML = '';
      currentUserProfile.posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'grid-post-card';
        postCard.style.cursor = 'pointer';
        
        // Déterminer le type de contenu
        let contentHtml = '';
        let badgeHtml = '';
        
        if (post.post_audio_url) {
          // Publication audio
          contentHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; background: var(--hover-bg);">
              <i class="fas fa-microphone-alt" style="font-size: 48px; color: var(--emerald-500); margin-bottom: 12px;"></i>
              <span style="font-size: 12px; color: var(--text-secondary);">${post.post_audio_listens || 0} écoute(s)</span>
            </div>
          `;
          badgeHtml = `<span class="post-type-badge audio"><i class="fas fa-headphones"></i> Papot</span>`;
        } 
        else if (post.has_poll) {
          // Sondage
          contentHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; background: var(--hover-bg);">
              <i class="fas fa-chart-simple" style="font-size: 48px; color: var(--emerald-500); margin-bottom: 12px;"></i>
              <span style="font-size: 12px; color: var(--text-secondary);">Face-Off</span>
            </div>
          `;
          badgeHtml = `<span class="post-type-badge poll"><i class="fas fa-poll"></i> Face-Off</span>`;
        }
        else if (post.images && Array.isArray(post.images) && post.images.length > 0) {
          // Image(s)
          contentHtml = `<img src="${post.images[0]}" class="grid-post-image" alt="post" loading="lazy">`;
          badgeHtml = `<span class="post-type-badge image"><i class="fas fa-image"></i> Photo</span>`;
        }
        else {
          // Texte seul
          const contentText = post.content || "Publication";
          const previewText = contentText.length > 80 ? contentText.substring(0, 80) + '...' : contentText;
          contentHtml = `
            <div style="padding: 16px; height: 200px; display: flex; align-items: center; justify-content: center; background: var(--hover-bg);">
              <p style="margin: 0; font-size: 13px; color: var(--text-primary); text-align: center; line-height: 1.4;">${escapeHtml(previewText)}</p>
            </div>
          `;
          badgeHtml = `<span class="post-type-badge text"><i class="fas fa-file-alt"></i> Texte</span>`;
        }
        
        postCard.innerHTML = `
          <div style="position: relative;">
            ${contentHtml}
            <div style="position: absolute; top: 8px; left: 8px;">${badgeHtml}</div>
          </div>
          <div class="grid-post-info">
            <div class="grid-post-stats">
              <span><i class="far fa-heart"></i> ${post.likes}</span>
              <span><i class="far fa-comment"></i> ${post.comments}</span>
            </div>
          </div>
        `;
        
        postCard.addEventListener('click', () => openPostDetailModal(post));
        grid.appendChild(postCard);
      });
    }
  }
}

// Modale followers/following
const followModal = document.getElementById('followModal');
const followModalTitle = document.getElementById('followModalTitle');
const followList = document.getElementById('followList');
let currentFollowType = '';
let currentFollowUserId = null;

/**
 * Charge et affiche les followers ou following depuis l'API
 */
async function openFollowModal(type, userId = null) {
    if (!userId && currentUserProfile && currentUserProfile.userid) {
        userId = currentUserProfile.userid;
    }
    if (!userId) {
        showNotification('error', 'Erreur', 'Utilisateur non identifié');
        return;
    }

    currentFollowType = type;
    currentFollowUserId = userId;

    followModalTitle.innerText = type === 'followers' ? 'Abonnés' : 'Abonnements';
    followList.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
    followModal.classList.remove('hidden');

    try {
        const action = type === 'followers' ? 'getFollowers' : 'getFollowing';
        const url = new URL(window.location.href);
        url.searchParams.set('action', action);
        url.searchParams.set('user_id', userId);
        url.searchParams.set('limit', 50);
        url.searchParams.set('offset', 0);

        const response = await fetch(url.toString(), { 
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Erreur lors du chargement');
        }

        const users = type === 'followers' ? data.followers : data.following;

        if (!users || users.length === 0) {
            followList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Aucun utilisateur à afficher</div>';
            return;
        }

        followList.innerHTML = users.map(user => {
            const initials = user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

            let avatarHTML;
            if (user.photo) {
                avatarHTML = `<img src="${user.photo}" alt="${user.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`;
            } else {
                avatarHTML = `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${initials}</div>`;
            }

            // Utiliser le flag is_following retourné par le backend
            const isFollowing = user.is_following === true;

            return `
                <div class="follow-list-item">
                    <div class="follow-avatar">${avatarHTML}</div>
                    <div class="follow-info">
                        <div class="follow-name">${escapeHtml(user.name)}</div>
                        <div class="follow-username">${escapeHtml(user.username)}</div>
                    </div>
                    <button class="btn-follow-sm ${isFollowing ? 'following' : ''}" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}">
                        ${isFollowing ? '<i class="fas fa-check"></i> Suivi(e)' : '<i class="fas fa-user-plus"></i> Suivre'}
                    </button>
                </div>
            `;
        }).join('');

        // Attacher les événements aux boutons "Suivre"
        document.querySelectorAll('.btn-follow-sm').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const targetUserId = btn.getAttribute('data-user-id');
                const isCurrentlyFollowing = btn.classList.contains('following');

                try {
                    const formData = new FormData();
                    formData.append('action', isCurrentlyFollowing ? 'unfollowUser' : 'followUser');
                    formData.append('followed_id', targetUserId);

                    const response = await fetch(window.location.href, {
                        method: 'POST',
                        body: formData,
                        credentials: 'include'
                    });
                    const result = await response.json();

                    if (result.success) {
                        if (isCurrentlyFollowing) {
                            btn.classList.remove('following');
                            btn.innerHTML = '<i class="fas fa-user-plus"></i> Suivre';
                        } else {
                            btn.classList.add('following');
                            btn.innerHTML = '<i class="fas fa-check"></i> Suivi(e)';
                        }

                        // Rafraîchir les compteurs du profil si nécessaire
                        if (currentFollowUserId === currentUserProfile?.userid) {
                            await loadCurrentProfile();
                            updateProfileUI();
                        }

                        showNotification('success', isCurrentlyFollowing ? 'Désabonné' : 'Abonné', isCurrentlyFollowing ? 'Vous ne suivez plus cet utilisateur' : 'Vous suivez maintenant cet utilisateur');
                    } else {
                        showNotification('error', 'Erreur', result.message || 'Action impossible');
                    }
                } catch (err) {
                    console.error(err);
                    showNotification('error', 'Erreur', 'Une erreur est survenue');
                }
            });
        });

    } catch (error) {
        console.error('Erreur openFollowModal:', error);
        followList.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Erreur lors du chargement</div>';
    }
}

// Fermeture de la modale
document.querySelector('.follow-modal-close')?.addEventListener('click', () => {
    followModal.classList.add('hidden');
});
followModal?.addEventListener('click', (e) => {
    if (e.target === followModal) followModal.classList.add('hidden');
});


// Boutons d'icône pour changer les photos sur la page profil (délégation d'événements)
document.addEventListener('click', (e) => {
  const changeProfileBtn = e.target.closest('.change-profile-btn');
  const changeCoverBtn = e.target.closest('.change-cover-btn');
  const editProfileBtn = document.querySelector('.edit-profile-btn');
  
  if (changeProfileBtn && editProfileBtn) {
    e.preventDefault();
    editProfileBtn.click();
  }
  
  if (changeCoverBtn && editProfileBtn) {
    e.preventDefault();
    editProfileBtn.click();
  }
});

document.querySelectorAll(".stat-item").forEach(stat => {
    stat.addEventListener("click", (e) => {
        const type = stat.getAttribute("data-type");
        if (type === "followers") openFollowModal("followers");
        if (type === "following") openFollowModal("following");
    });
});

// Fermeture modale
document.querySelector(".follow-modal-close")?.addEventListener("click", () => {
  followModal.classList.add("hidden");
});
followModal?.addEventListener("click", (e) => {
  if (e.target === followModal) followModal.classList.add("hidden");
});

// Bouton modifier profil (simulation)
// ========== MODALE MODIFICATION PROFIL ==========
const editProfileModal = document.getElementById('editProfileModal');
const editProfileForm = document.getElementById('editProfileForm');
const editProfileClose = document.querySelector('.edit-profile-close');
const editProfileCancel = document.querySelector('.edit-profile-cancel');
const editProfilePhotoInput = document.getElementById('profilePhotoInput');
const editCoverPhotoInput = document.getElementById('coverPhotoInput');
const editProfilePhotoUpload = document.getElementById('profilePhotoUpload');
const editCoverPhotoUpload = document.getElementById('coverPhotoUpload');
const editBio = document.getElementById('editBio');
const bioCharCount = document.getElementById('bioCharCount');

let editSelectedProfilePhoto = null;
let editSelectedCoverPhoto = null;

// Ouvrir la modale d'édition
document.querySelector(".edit-profile-btn")?.addEventListener("click", () => {
  // Remplir les champs avec les données actuelles
  document.getElementById('editName').value = currentUserProfile.name;
  document.getElementById('editUsername').value = currentUserProfile.username.substring(1); // Enlever le @
  document.getElementById('editBio').value = currentUserProfile.bio || '';
  bioCharCount.textContent = (currentUserProfile.bio || '').length + '/500';
  
  // Afficher la photo de profil dans le preview
  const profilePhotoPreview = document.getElementById('profilePhotoPreview');
  const profilePhotoInitials = document.getElementById('profilePhotoInitials');
  if (currentUserProfile.profilePhoto) {
    profilePhotoPreview.src = currentUserProfile.profilePhoto;
    profilePhotoPreview.style.display = 'block';
    profilePhotoInitials.style.display = 'none';
  } else {
    profilePhotoPreview.style.display = 'none';
    profilePhotoInitials.textContent = currentUserProfile.avatarInitials;
    profilePhotoInitials.style.display = 'block';
  }
  
  // Afficher la photo de couverture dans le preview
  const coverPhotoPreview = document.getElementById('coverPhotoPreview');
  if (currentUserProfile.coverPhoto) {
    coverPhotoPreview.src = currentUserProfile.coverPhoto;
  } else {
    coverPhotoPreview.src = 'ico/AG7.png'; // Image de couverture par défaut
  }
  
  // Réinitialiser les fichiers sélectionnés
  editSelectedProfilePhoto = null;
  editSelectedCoverPhoto = null;
  
  // Afficher la modale
  editProfileModal.classList.remove('hidden');
});

// Fermer la modale
editProfileClose.addEventListener('click', () => editProfileModal.classList.add('hidden'));
editProfileCancel.addEventListener('click', () => editProfileModal.classList.add('hidden'));

// Fermer en cliquant en dehors
editProfileModal.addEventListener('click', (e) => {
  if (e.target === editProfileModal) {
    editProfileModal.classList.add('hidden');
  }
});

// Compteur de caractères pour la bio
editBio.addEventListener('input', () => {
  bioCharCount.textContent = editBio.value.length + '/500';
});

// Gestion upload photo de profil
editProfilePhotoUpload.querySelector('.btn-secondary').addEventListener('click', (e) => {
  e.preventDefault();
  editProfilePhotoInput.click();
});

editProfilePhotoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    editSelectedProfilePhoto = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('profilePhotoPreview');
      const initials = document.getElementById('profilePhotoInitials');
      preview.src = e.target.result;
      preview.style.display = 'block';
      initials.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
});

// Gestion upload photo de couverture
editCoverPhotoUpload.querySelector('.btn-secondary').addEventListener('click', (e) => {
  e.preventDefault();
  editCoverPhotoInput.click();
});

editCoverPhotoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    editSelectedCoverPhoto = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('coverPhotoPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Soumettre le formulaire d'édition
editProfileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = editProfileForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enregistrement...';
  
  try {
    const formData = new FormData();
    formData.append('action', 'updateProfile');
    formData.append('user_name', document.getElementById('editName').value.trim());
    formData.append('user_username', document.getElementById('editUsername').value.trim());
    formData.append('user_bio', document.getElementById('editBio').value.trim());
    
    if (editSelectedProfilePhoto) {
      formData.append('user_photo', editSelectedProfilePhoto);
    }
    if (editSelectedCoverPhoto) {
      formData.append('user_cover_photo', editSelectedCoverPhoto);
    }
    
    const response = await fetch(window.location.href, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success && result.profile) {
    // Mettre à jour le profil local AVEC la photo de couverture
    currentUserProfile.name = result.profile.user_name;
    currentUserProfile.username = '@' + result.profile.user_username;
    currentUserProfile.bio = result.profile.user_bio || 'Pas de bio';
    if (result.profile.user_photo_url) {
      currentUserProfile.profilePhoto = getPhotoURL(result.profile.user_photo_url);
    }
    if (result.profile.user_cover_photo_url) {
      currentUserProfile.coverPhoto = getPhotoURL(result.profile.user_cover_photo_url);
    }
    currentUserProfile.avatarInitials = result.profile.user_name
      ? result.profile.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'U';
      
      // Fermer la modale et mettre à jour l'UI
      editProfileModal.classList.add('hidden');
      updateProfileUI();
      showNotification('success', 'Succès', 'Profil mis à jour avec succès');
    } else {
      showNotification('error', 'Erreur', result.message || 'Impossible de mettre à jour le profil');
    }
  } catch (err) {
    console.error('Erreur:', err);
    showNotification('error', 'Erreur', 'Une erreur s\'est produite lors de la mise à jour');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// NOTE: loadCurrentProfile() est appelé APRÈS connexion réussie dans le formulaire d'auth (ligne 304)
// Ne pas appeler au démarrage pour éviter erreurs 401 inutiles
// Initialiser l'UI avec les données par défaut
updateProfileUI();

// ===== GESTION DES SONDAGES =====
const createPollModal = document.getElementById('createPollModal');
const createPollBtn = document.getElementById('createPollBtn');
const cancelPollBtn = document.getElementById('cancelPollBtn');
const createPollClose = createPollModal.querySelector('.create-poll-close');
const publishPollBtn = document.getElementById('publishPollBtn');
const pollQuestion = document.getElementById('pollQuestion');
const pollOptionsContainer = document.getElementById('pollOptionsContainer');
const addPollOptionBtn = document.getElementById('addPollOptionBtn');

// Fonction pour activer/désactiver le bouton "Ajouter option"
function updateAddPollOptionButtonState() {
  const optionInputs = document.querySelectorAll('#pollOptionsContainer .poll-option-input');
  const addBtn = document.getElementById('addPollOptionBtn');
  if (!addBtn) return;

  const optionCount = optionInputs.length;
  const allFilled = optionCount >= 2 && Array.from(optionInputs).every(inp => inp.value.trim() !== '');

  if (optionCount >= 5) {
    addBtn.style.display = 'none';
  } else {
    addBtn.style.display = 'block';
    addBtn.disabled = !allFilled;
  }
}

pollOptionsContainer.addEventListener('input', updateAddPollOptionButtonState);

function previewOptionImage(input, index) {
  const file = input.files[0];
  const preview = document.getElementById(`optionPreview${index}`);
  if (file && preview) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else if (preview) {
    preview.style.display = 'none';
    preview.src = '';
  }
}

// Ouvrir la modale de sondage
createPollBtn.addEventListener('click', () => {
  createPollModal.classList.remove('hidden');
  updateAddPollOptionButtonState();
});

// Fermer la modale
createPollClose.addEventListener('click', () => createPollModal.classList.add('hidden'));
cancelPollBtn.addEventListener('click', () => createPollModal.classList.add('hidden'));

createPollModal.addEventListener('click', (e) => {
  if (e.target === createPollModal) {
    createPollModal.classList.add('hidden');
  }
});

// Ajouter une option au sondage
addPollOptionBtn.addEventListener('click', () => {
  const optionCount = pollOptionsContainer.querySelectorAll('.poll-option-group').length;
  if (optionCount < 5) {
    const newId = `pollOptionImg${optionCount + 1}`;
    const group = document.createElement('div');
    group.className = 'poll-option-group';
    group.innerHTML = `
      <input type="text" class="poll-option-input" placeholder="Option ${optionCount + 1}" maxlength="255">
      <input type="file" class="poll-option-image" id="${newId}" accept="image/*" onchange="previewOptionImage(this, ${optionCount + 1})">
      <label for="${newId}"><i class="fas fa-image"></i> Ajouter une image</label>
      <img id="optionPreview${optionCount + 1}" style="display:none; max-width:80px; margin-top:4px;">
    `;
    pollOptionsContainer.appendChild(group);
    updateAddPollOptionButtonState();
    if (optionCount + 1 === 5) addPollOptionBtn.style.display = 'none';
  }
});

// Publier le sondage
publishPollBtn.addEventListener('click', async () => {
  const question = pollQuestion.value.trim();
  const optionInputs = document.querySelectorAll('.poll-option-input');
  const imageInputs = document.querySelectorAll('.poll-option-image');

  // Récupérer les textes et les fichiers
  const optionsText = Array.from(optionInputs).map(inp => inp.value.trim()).filter(t => t.length > 0);
  const files = Array.from(imageInputs).map(inp => inp.files[0]);

  // Validation
  if (!question) {
    showNotification('error', 'Erreur', 'Veuillez entrer une question');
    return;
  }
  if (optionsText.length < 2 || optionsText.length > 5) {
    showNotification('error', 'Erreur', 'Le sondage doit avoir entre 2 et 5 options');
    return;
  }

  // Désactiver le bouton pendant la création
  publishPollBtn.disabled = true;
  publishPollBtn.textContent = 'Création...';

  try {
    // 1. Créer la publication parent
    const postFormData = new FormData();
    postFormData.append('action', 'createPost');
    postFormData.append('post_content', `Sondage: ${question}`);
    postFormData.append('post_visibility', 'public');

    const postResponse = await fetch(window.location.href, { method: 'POST', body: postFormData });
    const postData = await postResponse.json();

    if (!postData.success || !postData.post_id) {
      throw new Error(postData.message || 'Erreur création publication');
    }

    // 2. Préparer l’envoi du sondage avec images
    const pollFormData = new FormData();
    pollFormData.append('action', 'createPoll');
    pollFormData.append('post_id', postData.post_id);
    pollFormData.append('question', question);
    optionsText.forEach(t => pollFormData.append('options[]', t));
    files.forEach(f => pollFormData.append('option_images[]', f)); // même si null, le serveur les ignore

    const url = new URL(window.location.href);
    url.searchParams.set('action', 'createPoll');
    const pollResponse = await fetch(url.toString(), { method: 'POST', body: pollFormData, credentials: 'include' });
    const pollData = await pollResponse.json();

    if (!pollData.success) {
      throw new Error(pollData.message || 'Erreur création sondage');
    }

    // Succès
    showNotification('success', 'Succès', 'Sondage créé avec succès');

    // Réinitialiser le formulaire
    pollQuestion.value = '';
    pollOptionsContainer.innerHTML = `
      <div class="poll-option-group">
        <input type="text" class="poll-option-input" placeholder="Option 1" maxlength="255">
        <input type="file" class="poll-option-image" accept="image/*" onchange="previewOptionImage(this, 1)">
        <img id="optionPreview1" style="display:none; max-width:80px; margin-top:4px;">
      </div>
      <div class="poll-option-group">
        <input type="text" class="poll-option-input" placeholder="Option 2" maxlength="255">
        <input type="file" class="poll-option-image" accept="image/*" onchange="previewOptionImage(this, 2)">
        <img id="optionPreview2" style="display:none; max-width:80px; margin-top:4px;">
      </div>
    `;
    // Réinitialiser aussi les inputs file
    document.querySelectorAll('.poll-option-image').forEach(inp => inp.value = '');
    addPollOptionBtn.style.display = 'block';

    updateAddPollOptionButtonState();

    createPollModal.classList.add('hidden');

    // Rafraîchir le flux
    if (typeof loadActusFeed === 'function') {
      await loadActusFeed();
    } else if (typeof loadFeed === 'function') {
      await loadFeed();
    }

  } catch (err) {
    console.error('Erreur:', err);
    showNotification('error', 'Erreur', err.message || 'Une erreur est survenue');
  } finally {
    publishPollBtn.disabled = false;
    publishPollBtn.textContent = 'Créer le sondage';
  }
});

function previewOptionImage(input, index) {
  const file = input.files[0];
  const preview = document.getElementById(`optionPreview${index}`);
  if (file && preview) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else if (preview) {
    preview.style.display = 'none';
    preview.src = '';
  }
}

// ========== CHANGEMENT DIRECT DE LA PHOTO DE COUVERTURE ==========
const changeCoverBtn = document.querySelector('.change-cover-btn');
if (changeCoverBtn) {
    // Créer un input file caché
    const coverFileInput = document.createElement('input');
    coverFileInput.type = 'file';
    coverFileInput.accept = 'image/*';
    coverFileInput.style.display = 'none';

    changeCoverBtn.addEventListener('click', (e) => {
        e.preventDefault();
        coverFileInput.click();
    });

    coverFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Afficher un indicateur de chargement
        const originalText = changeCoverBtn.innerHTML;
        changeCoverBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        changeCoverBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('action', 'updateProfile');
            formData.append('user_cover_photo', file);

            const response = await fetch(window.location.href, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.profile) {
                // Mettre à jour la photo de couverture dans currentUserProfile
                if (result.profile.user_cover_photo_url) {
                    currentUserProfile.coverPhoto = getPhotoURL(result.profile.user_cover_photo_url);
                } else {
                    currentUserProfile.coverPhoto = null;
                }

                // Mettre à jour l'interface
                const coverImg = document.querySelector('.cover-img');
                if (coverImg && currentUserProfile.coverPhoto) {
                    coverImg.src = currentUserProfile.coverPhoto;
                }

                showNotification('success', 'Succès', 'Photo de couverture mise à jour');
            } else {
                showNotification('error', 'Erreur', result.message || 'Impossible de changer la photo');
            }
        } catch (err) {
            console.error(err);
            showNotification('error', 'Erreur', 'Une erreur est survenue');
        } finally {
            changeCoverBtn.innerHTML = originalText;
            changeCoverBtn.disabled = false;
            coverFileInput.value = ''; // Permet de sélectionner à nouveau le même fichier
        }
    });

    document.body.appendChild(coverFileInput);
}