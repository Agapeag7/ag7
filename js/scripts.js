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
    let selectedProfilePhoto = null; // Stocke la photo en Base64

    // Gestion du click du file input
    photoUploadArea.addEventListener('click', () => {
      profilePhotoInput.click();
    });

    // Quand l'utilisateur sélectionne un fichier
    profilePhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          selectedProfilePhoto = event.target.result;
          photoPreview.src = selectedProfilePhoto;
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

    // Gestion connexion simulée
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      if (!username || !password) {
        alert('Veuillez remplir tous les champs');
        return;
      }
      if (!isLoginMode) {
        const name = nameInput.value.trim();
        if (!name) { alert('Le nom est requis'); return; }
        // Mise à jour du profil lors de l'inscription
        currentUserProfile.name = name;
        currentUserProfile.username = '@' + username;
        // Stocker la photo si elle existe, sinon générer les initiales
        if (selectedProfilePhoto) {
          currentUserProfile.profilePhoto = selectedProfilePhoto;
        } else {
          // Générer les initiales à partir du nom
          const initials = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
          currentUserProfile.avatarInitials = initials;
        }
      }
      // Connexion réussie
      loginSection.classList.add('hidden');
      appSection.classList.remove('hidden');
      updateProfileUI();
      authForm.reset();
      setAuthMode(true);
    });

    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        appSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
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

// ========== GESTION DU FEED (PUBLICATIONS) ==========
let posts = [
  {
    id: 1,
    author: 'Design Team',
    avatar: 'DT',
    content: "Les nouvelles maquettes de l'application Ag7 sont disponibles !",
    images: ['https://picsum.photos/id/20/600/400'],
    time: 'Il y a 2 heures',
    likes: 24,
    liked: false,
    comments: [
      { id: 1, text: 'Super boulot !', isAnonymous: true, author: 'Anonyme', likes: 3, replies: [
        { text: 'Merci !', isAnonymous: false, author: 'Vous', likes: 1 }
      ]},
      { id: 2, text: "J'ai hâte de voir ça", isAnonymous: false, author: 'Vous', likes: 5, replies: [] }
    ]
  },
  {
    id: 2,
    author: 'Marie Lambert',
    avatar: 'ML',
    content: "Quelqu'un pour un café-débat sur l'UX ce midi ?",
    images: [],
    time: 'Hier',
    likes: 12,
    liked: false,
    comments: [
      { id: 3, text: 'Je suis partante !', isAnonymous: true, author: 'Anonyme', likes: 2, replies: [] },
      { id: 4, text: 'À la pause déjeuner', isAnonymous: false, author: 'Vous', likes: 4, replies: [
        { text: 'Top !', isAnonymous: false, author: 'Marie', likes: 0 },
        { text: 'Génial', isAnonymous: true, author: 'Anonyme', likes: 1 }
      ]}
    ]
  }
];

const feedContainer = document.getElementById('feedContainer');
const publishBtn = document.getElementById('publishPostBtn');
const postContentInput = document.getElementById('postContent');

// Variables pour les images de post
const addImageBtn = document.getElementById('addImageBtn');
const postImageInput = document.getElementById('postImageInput');
const postImagesPreview = document.getElementById('postImagesPreview');
const clearImagesBtn = document.getElementById('clearImagesBtn');
let postImages = [];

function renderFeed() {
  if (!feedContainer) return;
  feedContainer.innerHTML = '';
  posts.forEach(post => {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.dataset.id = post.id;
    
    // Get only last comment
    const lastComment = post.comments.length > 0 ? post.comments[post.comments.length - 1] : null;
    
    // Gérer les images - support des deux formats (image et images)
    const images = post.images || (post.image ? [post.image] : []);
    let imagesHtml = '';
    
    if (images.length === 1) {
      imagesHtml = `<img src="${images[0]}" class="post-image" alt="image post">`;
    } else if (images.length > 1) {
      const gridClass = images.length === 2 ? 'post-images-grid-2' : 
                       images.length === 3 ? 'post-images-grid-3' : 
                       'post-images-grid-more';
      imagesHtml = `
        <div class="post-images-grid ${gridClass}">
          ${images.map((img, idx) => `<img src="${img}" class="grid-image" alt="post image ${idx+1}" />`).join('')}
        </div>
      `;
    }
    
    postDiv.innerHTML = `
      <div class="post-header">
        <div class="post-avatar">${post.avatar}</div>
        <div>
          <div class="post-author">${post.author}</div>
          <div class="post-time">${post.time}</div>
        </div>
      </div>
      <div class="post-content">
        <p>${escapeHtml(post.content)}</p>
        ${imagesHtml}
      </div>
      <div class="post-stats">
        <span>${post.likes} likes</span>
        <span>${post.comments.length} commentaires</span>
      </div>
      <div class="post-actions">
        <button class="post-action-btn like-btn ${post.liked ? 'liked' : ''}"><i class="far fa-heart"></i> Like</button>
        <button class="post-action-btn comment-btn"><i class="far fa-comment"></i> Commenter</button>
      </div>
      <div class="comments-section">
        <div class="comments-list">
          ${lastComment ? `<div class="comment-item">${lastComment.isAnonymous ? '<i class="fas fa-mask" style="margin-right: 8px; color: var(--text-secondary);"></i>' : '<strong style="margin-right: 8px;">' + lastComment.author + '</strong>'} ${escapeHtml(lastComment.text)}</div>` : ''}
        </div>
        <div class="comment-input">
          <input type="text" placeholder="Ajouter un commentaire..." class="new-comment-input">
          <label class="anonymous-toggle">
            <input type="checkbox" class="anonymous-checkbox">
            <i class="fas fa-mask"></i>
          </label>
          <button class="submit-comment">Envoyer</button>
        </div>
      </div>
    `;
    feedContainer.appendChild(postDiv);
  });
  attachPostEvents();
}

function attachPostEvents() {
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.removeEventListener('click', handleLike);
    btn.addEventListener('click', handleLike);
  });
  document.querySelectorAll('.comment-btn').forEach(btn => {
    btn.removeEventListener('click', handleOpenComments);
    btn.addEventListener('click', handleOpenComments);
  });
  document.querySelectorAll('.submit-comment').forEach(btn => {
    btn.removeEventListener('click', handleComment);
    btn.addEventListener('click', handleComment);
  });
}

function handleLike(e) {
  const btn = e.currentTarget;
  const postCard = btn.closest('.post-card');
  const postId = parseInt(postCard.dataset.id);
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    renderFeed();
  }
}

function handleComment(e) {
  const btn = e.currentTarget;
  const postCard = btn.closest('.post-card');
  const input = postCard.querySelector('.new-comment-input');
  const commentText = input.value.trim();
  const anonymousCheckbox = postCard.querySelector('.anonymous-checkbox');
  if (!commentText) return;
  const postId = parseInt(postCard.dataset.id);
  const post = posts.find(p => p.id === postId);
  if (post) {
    const newCommentId = Math.max(...post.comments.map(c => c.id || 0), 0) + 1;
    post.comments.push({
      id: newCommentId,
      text: commentText,
      isAnonymous: anonymousCheckbox.checked,
      author: 'Vous',
      likes: 0,
      replies: []
    });
    input.value = '';
    renderFeed();
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Modale commentaires - variables
const commentsModal = document.getElementById('commentsModal');
const commentsModalClose = document.querySelector('.comments-modal-close');
const allCommentsList = document.querySelector('.all-comments-list');
const modalCommentInput = document.querySelector('.modal-comment-input');
const modalAnonymousCheckbox = document.querySelector('.modal-anonymous-checkbox');
const modalSubmitComment = document.querySelector('.modal-submit-comment');

let currentPostId = null;

function handleOpenComments(e) {
  const btn = e.currentTarget;
  const postCard = btn.closest('.post-card');
  currentPostId = parseInt(postCard.dataset.id);
  renderCommentsModal();
  commentsModal.classList.remove('hidden');
}

// Variables pour gérer les réponses expansées
let expandedReplies = {};

function renderCommentsModal() {
  const post = posts.find(p => p.id === currentPostId);
  if (!post) return;
  
  allCommentsList.innerHTML = '';
  
  if (post.comments.length === 0) {
    allCommentsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Pas de commentaires pour le moment</p>';
  } else {
    post.comments.forEach((comment) => {
      const commentEl = document.createElement('div');
      commentEl.className = 'comment-item-full';
      commentEl.dataset.commentId = comment.id;
      
      const repliesCount = (comment.replies && comment.replies.length) || 0;
      const repliesHtml = repliesCount > 0 ? `
        <div class="see-replies-btn" data-comment-id="${comment.id}">
          <i class="fas fa-comment"></i> Voir ${repliesCount} réponse${repliesCount > 1 ? 's' : ''}
        </div>
      ` : '';
      
      commentEl.innerHTML = `
        <div>
          <div>
            ${comment.isAnonymous ? '<i class="fas fa-mask"></i>' : '<strong>' + comment.author + '</strong>'} 
            ${comment.text}
            <span class="comment-likes-count" style="margin-left: 8px; color: var(--text-secondary); font-size: 12px;">${comment.likes} ${comment.likes > 1 ? 'likes' : 'like'}</span>
          </div>
          <div class="comment-actions">
            <button class="comment-like-btn" data-comment-id="${comment.id}">
              <i class="fas fa-thumbs-up"></i> Like
            </button>
            <button class="comment-reply-btn" data-comment-id="${comment.id}">
              <i class="fas fa-reply"></i> Répondre
            </button>
          </div>
          ${repliesHtml}
          <div class="replies-container" id="replies-${comment.id}" style="display: none; margin-left: 20px; margin-top: 12px; padding-top: 12px; border-left: 2px solid var(--border-light);"></div>
        </div>
      `;
      allCommentsList.appendChild(commentEl);
    });
  }
  
  // Attach events for like/reply buttons
  document.querySelectorAll('.comment-like-btn').forEach(btn => {
    btn.removeEventListener('click', handleCommentLike);
    btn.addEventListener('click', handleCommentLike);
  });
  
  document.querySelectorAll('.comment-reply-btn').forEach(btn => {
    btn.removeEventListener('click', handleCommentReply);
    btn.addEventListener('click', handleCommentReply);
  });
  
  document.querySelectorAll('.see-replies-btn').forEach(btn => {
    btn.removeEventListener('click', handleShowReplies);
    btn.addEventListener('click', handleShowReplies);
  });
}

function handleShowReplies(e) {
  e.preventDefault();
  const commentId = e.currentTarget.dataset.commentId;
  const repliesContainer = document.getElementById(`replies-${commentId}`);
  const post = posts.find(p => p.id === currentPostId);
  const comment = post.comments.find(c => c.id === commentId);
  
  if (expandedReplies[commentId]) {
    repliesContainer.style.display = 'none';
    expandedReplies[commentId] = false;
  } else {
    repliesContainer.innerHTML = '';
    comment.replies.forEach(reply => {
      const replyEl = document.createElement('div');
      replyEl.className = 'reply-item';
      replyEl.innerHTML = `
        <div>
          <div>
            ${reply.isAnonymous ? '<i class="fas fa-mask"></i>' : '<strong>' + reply.author + '</strong>'} 
            ${reply.text}
            <span class="reply-likes-count" style="margin-left: 8px; color: var(--text-secondary); font-size: 12px;">${reply.likes} ${reply.likes > 1 ? 'likes' : 'like'}</span>
          </div>
          <div class="reply-actions">
            <button class="reply-like-btn">
              <i class="fas fa-thumbs-up"></i> Like
            </button>
            <button class="reply-reply-btn">
              <i class="fas fa-reply"></i> Répondre
            </button>
          </div>
        </div>
      `;
      repliesContainer.appendChild(replyEl);
    });
    repliesContainer.style.display = 'block';
    expandedReplies[commentId] = true;
    
    // Attach events for reply likes
    document.querySelectorAll('.reply-like-btn').forEach(btn => {
      btn.removeEventListener('click', handleReplyLike);
      btn.addEventListener('click', handleReplyLike);
    });
  }
}


function handleCommentLike(e) {
  e.preventDefault();
  const btn = e.currentTarget;
  const commentId = parseInt(btn.dataset.commentId);
  const post = posts.find(p => p.id === currentPostId);
  const comment = post.comments.find(c => c.id === commentId);
  
  if (btn.classList.contains('liked')) {
    comment.likes--;
    btn.classList.remove('liked');
  } else {
    comment.likes++;
    btn.classList.add('liked');
  }
  
  btn.innerHTML = btn.classList.contains('liked') ? `<i class="fas fa-thumbs-up"></i> Aimé` : `<i class="fas fa-thumbs-up"></i> Like`;
  renderCommentsModal();
}

function handleReplyLike(e) {
  e.preventDefault();
  const btn = e.currentTarget;
  btn.classList.toggle('liked');
  btn.innerHTML = btn.classList.contains('liked') ? `<i class="fas fa-thumbs-up"></i> Aimé` : `<i class="fas fa-thumbs-up"></i> Like`;
}

function handleCommentReply(e) {
  e.preventDefault();
  // Focus on input to reply
  modalCommentInput.focus();
  modalCommentInput.placeholder = 'Répondre au commentaire...';
}

function handleModalComment() {
  const commentText = modalCommentInput.value.trim();
  if (!commentText) return;
  
  const post = posts.find(p => p.id === currentPostId);
  if (post) {
    const newCommentId = Math.max(...post.comments.map(c => c.id || 0), 0) + 1;
    post.comments.push({
      id: newCommentId,
      text: commentText,
      isAnonymous: modalAnonymousCheckbox.checked,
      author: 'Vous',
      likes: 0,
      replies: []
    });
    modalCommentInput.value = '';
    modalCommentInput.placeholder = 'Ajouter un commentaire...';
    modalAnonymousCheckbox.checked = false;
    renderCommentsModal();
    renderFeed();
  }
}

// Modal events
if (commentsModalClose) {
  commentsModalClose.addEventListener('click', () => commentsModal.classList.add('hidden'));
}

commentsModal.addEventListener('click', (e) => {
  if (e.target === commentsModal) commentsModal.classList.add('hidden');
});

if (modalSubmitComment) {
  modalSubmitComment.addEventListener('click', handleModalComment);
}

if (modalCommentInput) {
  modalCommentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleModalComment();
  });
}

// Gestion des images pour les posts
if (addImageBtn) {
  addImageBtn.addEventListener('click', () => {
    postImageInput.click();
  });
}

if (postImageInput) {
  postImageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        postImages.push({
          src: event.target.result,
          file: file
        });
        renderPostImagesPreview();
      };
      reader.readAsDataURL(file);
    });
  });
}

if (clearImagesBtn) {
  clearImagesBtn.addEventListener('click', () => {
    postImages = [];
    postImageInput.value = '';
    renderPostImagesPreview();
  });
}

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
        <img src="${img.src}" alt="preview">
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
if (publishBtn) {
  publishBtn.addEventListener('click', () => {
    const content = postContentInput.value.trim();
    if (!content && postImages.length === 0) return;
    
    const newPost = {
      id: Date.now(),
      author: 'Alexandre Gauthier',
      avatar: 'AG',
      content: content,
      images: postImages.map(img => img.src), // Array d'images au lieu d'une seule
      time: 'À l\'instant',
      likes: 0,
      liked: false,
      comments: []
    };
    posts.unshift(newPost);
    renderFeed();
    postContentInput.value = '';
    postImages = [];
    postImageInput.value = '';
    renderPostImagesPreview();
  });
}

// Initialisation du feed
renderFeed();

// Initialisation de la grille découvrir
renderDiscoverGrid();

// ========== PROFIL AVEC FOLLOWERS (DONNÉES SIMULÉES) ==========
let currentUserProfile = {
  name: "Alexandre Gauthier",
  username: "@alex_gauthier",
  bio: "Lead Designer & Front-end Dev. Passionné par les interfaces modernes et l'UX.",
  location: "Butembo, DRC",
  memberSince: "Janvier 2024",
  avatarInitials: "AG",
  profilePhoto: null, // Peut contenir une photo en Base64
  postsCount: 12,
  followers: [
    { name: "Marie Lambert", username: "@marie_lam", avatar: "ML" },
    { name: "Thomas Dubois", username: "@thomas_d", avatar: "TD" },
    { name: "Sophie Caron", username: "@sophie_c", avatar: "SC" },
    { name: "Antoine Lefevre", username: "@antoine_l", avatar: "AL" }
  ],
  following: [
    { name: "Design System", username: "@designsys", avatar: "DS" },
    { name: "UI Daily", username: "@ui_daily", avatar: "UI" },
    { name: "Paul Martin", username: "@paul_m", avatar: "PM" },
    { name: "Claire Dupont", username: "@claire_d", avatar: "CD" }
  ],
  posts: [
    { id: 1, image: "https://picsum.photos/id/10/400/300", likes: 34, comments: 5 },
    { id: 2, image: "https://picsum.photos/id/20/400/300", likes: 78, comments: 12 },
    { id: 3, image: "https://picsum.photos/id/30/400/300", likes: 45, comments: 8 },
    { id: 4, image: "https://picsum.photos/id/40/400/300", likes: 22, comments: 3 },
    { id: 5, image: "https://picsum.photos/id/50/400/300", likes: 91, comments: 17 },
    { id: 6, image: "https://picsum.photos/id/60/400/300", likes: 56, comments: 9 }
  ]
};

function updateProfileUI() {
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
  
  document.getElementById("postsCount").innerText = currentUserProfile.postsCount;
  document.getElementById("followersCount").innerText = currentUserProfile.followers.length;
  document.getElementById("followingCount").innerText = currentUserProfile.following.length;

  // Mettre à jour le mini-avatar du formulaire de création de post
  const createPostAvatar = document.getElementById("createPostAvatar");
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

  // Générer grille des posts
  const grid = document.getElementById("profilePostsGrid");
  if (grid) {
    grid.innerHTML = currentUserProfile.posts.map(post => `
      <div class="grid-post-card">
        <img src="${post.image}" class="grid-post-image" alt="post">
        <div class="grid-post-info">
          <div class="grid-post-stats">
            <span><i class="far fa-heart"></i> ${post.likes}</span>
            <span><i class="far fa-comment"></i> ${post.comments}</span>
          </div>
        </div>
      </div>
    `).join('');
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
      <button class="btn-follow-sm">Suivre</button>
    </div>
  `).join('');
  followModal.classList.remove("hidden");
}

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
document.querySelector(".edit-profile-btn")?.addEventListener("click", () => {
  const newName = prompt("Nouveau nom :", currentUserProfile.name);
  const newBio = prompt("Nouvelle bio :", currentUserProfile.bio);
  if (newName) currentUserProfile.name = newName;
  if (newBio) currentUserProfile.bio = newBio;
  updateProfileUI();
});

// Initialisation
updateProfileUI();