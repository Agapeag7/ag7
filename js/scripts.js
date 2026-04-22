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
        body: formData
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
            loginSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            
            // Charger les données réelles du profil depuis le serveur
            await loadCurrentProfile();
            
            authForm.reset();
            setAuthMode(true);
            selectedProfilePhoto = null; // Réinitialiser
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
          body: formData
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
          
          // Réinitialiser toutes les données du profil
          currentUserProfile = {
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
              { id: 2, image: "https://picsum.photos/id/20/400/300", likes: 78, comments: 12 },
              { id: 3, image: "https://picsum.photos/id/30/400/300", likes: 45, comments: 8 },
              { id: 4, image: "https://picsum.photos/id/40/400/300", likes: 22, comments: 3 },
              { id: 5, image: "https://picsum.photos/id/50/400/300", likes: 91, comments: 17 },
              { id: 6, image: "https://picsum.photos/id/60/400/300", likes: 56, comments: 9 }
            ]
          };
          
          setTimeout(() => {
            appSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            setAuthMode(true);
          }, 1000);
        })
        .catch(err => {
          console.error('Erreur logout:', err);
          showNotification('error', 'Erreur', 'Une erreur s\'est produite lors de la déconnexion');
          
          // Réinitialiser les données du profil même en cas d'erreur
          currentUserProfile = {
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
              { id: 2, image: "https://picsum.photos/id/20/400/300", likes: 78, comments: 12 },
              { id: 3, image: "https://picsum.photos/id/30/400/300", likes: 45, comments: 8 },
              { id: 4, image: "https://picsum.photos/id/40/400/300", likes: 22, comments: 3 },
              { id: 5, image: "https://picsum.photos/id/50/400/300", likes: 91, comments: 17 },
              { id: 6, image: "https://picsum.photos/id/60/400/300", likes: 56, comments: 9 }
            ]
          };
          
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
        renderDiscoverGrid();
      }
      
      // Charger le profil réel quand on accède à la section profil
      if (viewId === 'profile') {
        loadCurrentProfile();
      }
      
      // Charger le feed Actus quand on accède à la section feed
      if (viewId === 'feed') {
        // Attendre que loadActusFeed soit disponible
        if (typeof loadActusFeed === 'function') {
          loadActusFeed();
        } else {
          console.warn('loadActusFeed non disponible');
        }
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

    // ---------- QUELQUES INTERACTIONS SUPPLÉMENTAIRES (simulation) ----------
    // Rendre fonctionnel l'envoi de message (simulation)
    const sendBtn = document.querySelector('.conversation-form-submit');
    const messageInput = document.querySelector('.conversation-form-input');
    const messagesContainer = document.querySelector('.messages-container');

    // Auto-resize du textarea
    if (messageInput) {
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
    }

    if (sendBtn && messageInput && messagesContainer) {
      function addMessage(text, isMe = true) {
        if (!text.trim()) return;
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isMe ? 'me' : ''}`;
        bubble.innerHTML = `${text}<div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>`;
        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        messageInput.value = '';
        messageInput.style.height = 'auto';
      }

      sendBtn.addEventListener('click', () => addMessage(messageInput.value, true));
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          addMessage(messageInput.value, true);
        }
      });
    }

    // ========== GESTION DES ACTIONS DE MESSAGE ==========
    function initMessageActions() {
      const messageActionBtns = document.querySelectorAll('.message-action-btn');
      
      messageActionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          const messageBubble = btn.closest('.message-bubble');
          const messageText = messageBubble.textContent.split('\n')[0].trim();
          
          if (action === 'reply') {
            // Répondre : ajouter la réponse au input
            const messageInput = document.querySelector('.conversation-form-input');
            if (messageInput) {
              messageInput.value = `> ${messageText}\n\n`;
              messageInput.focus();
            }
          } else if (action === 'share') {
            // Partager
            alert(`Partager le message : "${messageText}"`);
            // À implémenter : modale de partage ou copier le lien
          } else if (action === 'transfer') {
            // Transférer dans une autre conversation
            const transferTo = prompt('Transférer vers quelle conversation ?');
            if (transferTo) {
              alert(`Message transféré à : ${transferTo}`);
              // À implémenter : logique de transfert
            }
          }
        });
      });
    }

    // Initialiser les actions au chargement
    initMessageActions();

    // Réinit après chaque ajout de message
    const originalAddMessage = window.addMessage;
    if (window.addMessage) {
      window.addMessage = function(text, isMe) {
        originalAddMessage(text, isMe);
        initMessageActions();
      };
    }

    // Clic sur conversations (simulation)
    const chatSidebarList = document.querySelector('.chat-sidebar-list');
    const chatConversationArea = document.querySelector('.chat-conversation-area');
    const backBtn = document.getElementById('backToList');

    function showConversation() {
      if (window.innerWidth <= 768) {
        chatSidebarList.classList.add('hidden');
        chatConversationArea.classList.add('active-chat');
      }
    }

    function backToList() {
      if (window.innerWidth <= 768) {
        chatSidebarList.classList.remove('hidden');
        chatConversationArea.classList.remove('active-chat');
      }
    }

    document.querySelectorAll('.conversation-item-chat').forEach(item => {
      item.addEventListener('click', function() {
        document.querySelectorAll('.conversation-item-chat').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        showConversation();
      });
    });

    // Bouton retour
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        backToList();
      });
    }

    // Notification de bienvenue (optionnelle)
  })();


  // ========== GESTION DES STORIES ==========
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

// Données simulées des stories
let userStories = [];

let otherStories = [
  { id: 'marie-1', type: 'text-image', text: 'Bonjour à tous ! ☀️', image: 'https://randomuser.me/api/portraits/women/68.jpg', userName: 'Marie', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), viewers: 124 },
  { id: 'thomas-1', type: 'text-image', text: 'Nouveau projet excitant !', image: 'https://randomuser.me/api/portraits/men/32.jpg', userName: 'Thomas', timestamp: new Date(Date.now() - 30 * 60 * 1000), viewers: 87 },
  { id: 'sophie-1', type: 'text-image', text: 'En pleine réflexion...', image: 'https://randomuser.me/api/portraits/women/45.jpg', userName: 'Sophie', timestamp: new Date(Date.now() - 15 * 60 * 1000), viewers: 156 },
];

let selectedStoryImage = null;

// Upload image pour story
uploadStoryImageBtn.addEventListener('click', () => storyImageInput.click());

storyImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
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
  storyImagePreview.style.display = 'none';
  storyImageInput.value = '';
  uploadStoryImageBtn.disabled = false;
  uploadStoryImageBtn.style.opacity = '1';
  uploadStoryImageBtn.style.cursor = 'pointer';
});

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
storyClose.addEventListener('click', () => storyModal.classList.add('hidden'));

createStoryModal.addEventListener('click', (e) => {
  if (e.target === createStoryModal) createStoryModal.classList.add('hidden');
});

storyModal.addEventListener('click', (e) => {
  if (e.target === storyModal) storyModal.classList.add('hidden');
});

// Publier une story
publishStoryBtn.addEventListener('click', () => {
  const text = storyTextInput.value.trim();
  const image = selectedStoryImage || 'https://picsum.photos/id/50/600/800';
  
  const newStory = {
    id: 'user-story-' + Date.now(),
    type: 'text-image',
    text: text || 'Nouvelle story !',
    image: image,
    userName: 'Vous',
    timestamp: new Date()
  };
  
  userStories.push(newStory);
  renderStories();
  createStoryModal.classList.add('hidden');
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
      <div class="story-avatar" style="background-image: url('${story.image}');"></div>
      <span class="story-name">${story.userName}</span>
    `;
    storyEl.addEventListener('click', () => openStory(story.image, story.text, story.viewers || 0, true));
    storiesContainer.appendChild(storyEl);
  });
  
  // Stories des autres - pas de compteur de vues
  otherStories.forEach(story => {
    const storyEl = document.createElement('div');
    storyEl.className = 'story-item';
    storyEl.innerHTML = `
      <div class="story-avatar" style="background-image: url('${story.image}');"></div>
      <span class="story-name">${story.userName}</span>
    `;
    storyEl.addEventListener('click', () => openStory(story.image, story.text, 0, false));
    storiesContainer.appendChild(storyEl);
  });
}

function openStory(imageUrl, caption, viewers = 0, isUserStory = false) {
  storyImage.src = imageUrl;
  storyCaption.textContent = caption || '';
  const viewersCountEl = document.getElementById('storyViewersCount');
  // Afficher le compteur SEULEMENT pour les stories de l'utilisateur
  if (isUserStory && viewers > 0) {
    viewersCountEl.innerHTML = `<i class="fas fa-eye"></i> ${viewers}`;
    viewersCountEl.style.display = 'flex';
  } else {
    viewersCountEl.style.display = 'none';
  }
  storyModal.classList.remove('hidden');
}

// Initialisation
renderStories();

// ========== GESTION DÉCOUVRIR (UTILISATEURS) ==========
let followingUsers = new Set();
let suggestedUsers = [
  { id: 1, name: 'Marie Lambert', username: '@marie_lambert', bio: 'UX Designer, Coffee addict' },
  { id: 2, name: 'Thomas Dubois', username: '@thomas.dubois', bio: 'Frontend Dev | React | Node.js' },
  { id: 3, name: 'Sophie Caron', username: '@sophie_caron', bio: 'Product Manager | Innovation enthusiast' },
  { id: 4, name: 'Antoine Lefevre', username: '@antoine.lf', bio: 'Digital Strategist | Growth Hacker' },
  { id: 5, name: 'Claire Moreau', username: '@claire_moreau', bio: 'Graphic Designer | Brand identity' },
  { id: 6, name: 'Julien Martin', username: '@julien.martin', bio: 'DevOps Engineer | Cloud Architecture' },
  { id: 7, name: 'Lucie Bernard', username: '@lucie_bernard', bio: 'Marketing Lead | Data enthusiast' },
  { id: 8, name: 'Marc Renault', username: '@marc_renault', bio: 'Business Analyst | Process Optimization' }
];

function renderDiscoverGrid() {
  const discoverGrid = document.getElementById('discoverGrid');
  if (!discoverGrid) return;
  
  discoverGrid.innerHTML = '';
  suggestedUsers.forEach(user => {
    const isFollowing = followingUsers.has(user.id);
    const userCard = document.createElement('div');
    userCard.className = 'discover-card';
    userCard.innerHTML = `
      <div class="discover-avatar">${user.name.split(' ').map(n => n[0]).join('')}</div>
      <h3>${escapeHtml(user.name)}</h3>
      <div class="discover-username">${escapeHtml(user.username)}</div>
      <div class="discover-bio">${escapeHtml(user.bio)}</div>
      <button class="discover-follow-btn ${isFollowing ? 'following' : ''}">
        ${isFollowing ? '<i class="fas fa-check"></i> Suivi' : '<i class="fas fa-user-plus"></i> Suivre'}
      </button>
    `;
    
    const followBtn = userCard.querySelector('.discover-follow-btn');
    followBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isFollowing) {
        followingUsers.delete(user.id);
      } else {
        followingUsers.add(user.id);
      }
      renderDiscoverGrid();
    });
    
    discoverGrid.appendChild(userCard);
  });
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

const feedContainer = document.getElementById('feedContainer');
const publishBtn = document.getElementById('publishPostBtn');
const postContentInput = document.getElementById('postContent');

// Variables pour les images de post - DISABLED, utiliser actus-complete.js
const addImageBtn = document.getElementById('addImageBtn');
const postImageInput = document.getElementById('postImageInput');
const postImagesPreview = document.getElementById('postImagesPreview');
const clearImagesBtn = document.getElementById('clearImagesBtn');
let postImages = [];

// Variables pour le carousel - KEEP THESE (utilisées par openImageViewer d'actus-complete.js)
const imageCarouselModal = document.getElementById('imageCarouselModal');
const carouselImage = document.getElementById('carouselImage');
const imageCounter = document.getElementById('imageCounter');
const carouselDots = document.getElementById('carouselDots');
const carouselClose = document.querySelector('.carousel-close');
const carouselPrev = document.querySelector('.carousel-prev');
const carouselNext = document.querySelector('.carousel-next');
let currentCarouselImages = [];
let currentImageIndex = 0;

// Track carousel state per post
let postImageIndices = {};
let lastSlideDirection = 'next';  // 'next' or 'prev' to track slide direction



function renderPostImagesPreview() {
  const previewGrid = postImagesPreview.querySelector('.preview-grid');
  previewGrid.innerHTML = '';
  
  if (postImages.length === 0) {
    postImagesPreview.style.display = 'none';
  } else {
    postImagesPreview.style.display = 'block';
    postImages.forEach((img, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-image';
      previewItem.innerHTML = `
        <img src="${img.src}" alt="preview" loading="lazy">
        <button type="button" class="remove-image-btn" data-index="${index}">×</button>
      `;
      previewItem.querySelector('.remove-image-btn').addEventListener('click', () => {
        postImages.splice(index, 1);
        renderPostImagesPreview();
      });
      previewGrid.appendChild(previewItem);
    });
  }
}

// Publier un nouveau post
// ===== DÉSACTIVÉ: Le handler pour le bouton Publier est maintenant dans actus-complete.js =====
// Le handler dans actus-complete.js utilise ActusAPI pour la création de publication
// Ce code ancien est conservé comme référence mais ne doit pas s'exécuter
/*
if (publishBtn) {
  publishBtn.addEventListener('click', () => {
    // OLD CODE - DISABLED - USE actus-complete.js INSTEAD
  });
}
*/

// ========== GESTION DU CAROUSEL D'IMAGES ==========

function openImageCarousel(images, startIndex = 0) {
  currentCarouselImages = images;
  currentImageIndex = startIndex;
  imageCarouselModal.classList.remove('hidden');
  renderCarouselImage();
  renderCarouselDots();
}

function closeImageCarousel() {
  imageCarouselModal.classList.add('hidden');
}

function renderCarouselImage() {
  const image = currentCarouselImages[currentImageIndex];
  carouselImage.src = image;
  imageCounter.textContent = `${currentImageIndex + 1} / ${currentCarouselImages.length}`;
  
  // Mettre à jour les dots
  document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
    if (index === currentImageIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function renderCarouselDots() {
  carouselDots.innerHTML = '';
  currentCarouselImages.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = `carousel-dot ${index === currentImageIndex ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      currentImageIndex = index;
      renderCarouselImage();
    });
    carouselDots.appendChild(dot);
  });
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % currentCarouselImages.length;
  renderCarouselImage();
}

function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + currentCarouselImages.length) % currentCarouselImages.length;
  renderCarouselImage();
}

// Event listeners pour le carousel
if (carouselClose) {
  carouselClose.addEventListener('click', closeImageCarousel);
}

if (carouselNext) {
  carouselNext.addEventListener('click', nextImage);
}

if (carouselPrev) {
  carouselPrev.addEventListener('click', prevImage);
}

// Fermer le modal en cliquant en dehors (backdrop)
imageCarouselModal.addEventListener('click', (e) => {
  if (e.target === imageCarouselModal) {
    closeImageCarousel();
  }
});

// Clavier - ESC pour fermer, flèches pour naviguer
document.addEventListener('keydown', (e) => {
  if (imageCarouselModal.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeImageCarousel();
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft') prevImage();
});

// Initialisation du feed - USAMOS ACTUS-COMPLETE.JS AGORA
// renderFeed();

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
      body: formData
    });
    
    if (!response.ok) {
      console.error('Erreur HTTP:', response.status);
      return false;
    }
    
    const result = await response.json();
    if (!result.success) {
      console.error('Erreur serveur:', result.message);
      return false;
    }
    
    const profile = result.profile;
    
    // Réinitialiser les données
    currentUserProfile.profilePhoto = null;
    currentUserProfile.coverPhoto = null;
    currentUserProfile.posts = [];
    
    // Remplir le profil
    currentUserProfile.name = profile.user_name || "User";
    currentUserProfile.username = '@' + (profile.user_username || "user");
    currentUserProfile.bio = profile.user_bio || "Pas de bio";
    currentUserProfile.location = profile.user_location || "Localisation inconnue";
    currentUserProfile.memberSince = profile.member_since || "Janvier 2024";
    currentUserProfile.userid = profile.user_id;
    currentUserProfile.avatarInitials = profile.user_name
      ? profile.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'U';
    
    // Définir la photo de profil
    if (profile.user_photo_url) {
      currentUserProfile.profilePhoto = getPhotoURL(profile.user_photo_url);
    }
    
    // Définir la photo de couverture
    if (profile.user_cover_photo_url) {
      currentUserProfile.coverPhoto = getPhotoURL(profile.user_cover_photo_url);
    }
    
    // Mettre à jour les stats RÉELLES de la base de données
    currentUserProfile.postsCount = profile.posts_count || 0;
    currentUserProfile.followers_count = profile.followers_count || 0;
    currentUserProfile.following_count = profile.following_count || 0;
    
    // Charger les publications de l'utilisateur
    await loadUserPosts(profile.user_id);
    
    return true;
  } catch (e) {
    console.error('Erreur au chargement du profil:', e);
    return false;
  }
}

async function loadUserPosts(userId) {
  try {
    // Construire l'URL absolue pour éviter les problèmes de chemin
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'getUserPosts');
    url.searchParams.set('user_id', userId);
    url.searchParams.set('limit', 50);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();

    if (!result.success) {
      console.error('Erreur getUserPosts:', result.message);
      currentUserProfile.posts = [];
      return;
    }

    // Mapper les données reçues
    currentUserProfile.posts = (result.posts || []).map(post => ({
      id: post.id,
      author: post.author,
      username: post.username,
      avatar: post.avatar,
      content: post.content,
      image: post.images && post.images.length > 0 ? post.images[0] : null,
      images: post.images || [],
      likes: post.likes || 0,
      comments: post.comments || 0,
      userHasLiked: post.userHasLiked || false,
      timestamp: post.timestamp,
      user_id: post.user_id,
      visibility: post.visibility
    }));

    // Debug : afficher dans la console le nombre de posts chargés
    console.log(`${currentUserProfile.posts.length} posts chargés pour l'utilisateur ${userId}`);
  } catch (e) {
    console.error('Erreur loadUserPosts:', e);
    currentUserProfile.posts = [];
  }
}

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

  // Grille des posts - Remplir avec les vraies publications
  const grid = document.getElementById("profilePostsGrid");
  if (grid) {
    if (!currentUserProfile.posts || currentUserProfile.posts.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px 20px; font-size: 16px;">Aucune publication pour le moment</div>';
    } else {
      grid.innerHTML = ''; // Vider la grille
      
      currentUserProfile.posts.forEach(post => {
        const postImageUrl = post.image || post.images?.[0] || null;
        
        // Créer la structure attendue par le CSS
        const postCard = document.createElement('div');
        postCard.className = 'grid-post-card';
        
        if (postImageUrl) {
          // Image
          const img = document.createElement('img');
          img.className = 'grid-post-image';
          img.src = postImageUrl;
          img.alt = 'post';
          img.loading = 'lazy';
          postCard.appendChild(img);
        } else {
          // Placeholder pour post sans image
          const placeholder = document.createElement('div');
          placeholder.className = 'grid-post-image';
          placeholder.style.background = 'var(--hover-bg)';
          placeholder.style.display = 'flex';
          placeholder.style.alignItems = 'center';
          placeholder.style.justifyContent = 'center';
          placeholder.innerHTML = '<i class="fas fa-image" style="font-size: 40px; color: var(--text-secondary);"></i>';
          postCard.appendChild(placeholder);
        }
        
        // Info section
        const info = document.createElement('div');
        info.className = 'grid-post-info';
        info.innerHTML = `
          <div class="grid-post-stats">
            <span><i class="far fa-heart"></i> ${post.likes}</span>
            <span><i class="far fa-comment"></i> ${post.comments}</span>
          </div>
        `;
        postCard.appendChild(info);
        
        // Click handler
        postCard.style.cursor = 'pointer';
        postCard.addEventListener('click', () => {
          console.log('Publication cliquée:', post.id);
          // TODO: Ouvrir la publication en modal
        });
        
        grid.appendChild(postCard);
      });
    }
  }
}

// Modale followers/following
const followModal = document.getElementById("followModal");
const followModalTitle = document.getElementById("followModalTitle");
const followList = document.getElementById("followList");
let currentModalType = "";

function openFollowModal(type) {
  currentModalType = type;
  const list = type === "followers" ? currentUserProfile.followers : currentUserProfile.following;
  followModalTitle.innerText = type === "followers" ? "Abonnés" : "Abonnements";
  followList.innerHTML = list.map(user => `
    <div class="follow-list-item">
      <div class="follow-avatar">${user.avatar}</div>
      <div class="follow-info">
        <div class="follow-name">${user.name}</div>
        <div class="follow-username">${user.username}</div>
      </div>
      <button class="btn-follow-sm" data-username="${user.username}">Suivre</button>
    </div>
  `).join('');
  followModal.classList.remove("hidden");
  
  // Add event listeners for follow buttons
  document.querySelectorAll('.btn-follow-sm').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.classList.toggle('following');
      btn.textContent = btn.classList.contains('following') ? 'Abonné' : 'Suivre';
    });
  });
}

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
const profilePhotoInput = document.getElementById('profilePhotoInput');
const coverPhotoInput = document.getElementById('coverPhotoInput');
const profilePhotoUpload = document.getElementById('profilePhotoUpload');
const coverPhotoUpload = document.getElementById('coverPhotoUpload');
const editBio = document.getElementById('editBio');
const bioCharCount = document.getElementById('bioCharCount');

let selectedProfilePhoto = null;
let selectedCoverPhoto = null;

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
    coverPhotoPreview.src = 'https://picsum.photos/id/104/1200/400';
  }
  
  // Réinitialiser les fichiers sélectionnés
  selectedProfilePhoto = null;
  selectedCoverPhoto = null;
  
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
profilePhotoUpload.querySelector('.btn-secondary').addEventListener('click', (e) => {
  e.preventDefault();
  profilePhotoInput.click();
});

profilePhotoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedProfilePhoto = file;
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
coverPhotoUpload.querySelector('.btn-secondary').addEventListener('click', (e) => {
  e.preventDefault();
  coverPhotoInput.click();
});

coverPhotoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedCoverPhoto = file;
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
    
    if (selectedProfilePhoto) {
      formData.append('user_photo', selectedProfilePhoto);
    }
    if (selectedCoverPhoto) {
      formData.append('user_cover_photo', selectedCoverPhoto);
    }
    
    const response = await fetch(window.location.href, {
      method: 'POST',
      body: formData
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
        await loadCurrentProfile(); // recharge tout et met à jour l'UI
        editProfileModal.classList.add('hidden');

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

// Initialisation - Charger le profil réel d'abord
if (typeof loadCurrentProfile === 'function') {
  loadCurrentProfile().then(() => {
    updateProfileUI();
  }).catch(err => {
    console.error('Impossible de charger le profil:', err);
    // Mettre à jour quand même avec les données par défaut
    updateProfileUI();
  });
} else {
  updateProfileUI();
}