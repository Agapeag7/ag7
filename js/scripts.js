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
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const nameInput = document.getElementById('signup-name');

    let isLoginMode = true;

    // Bascule connexion / inscription
    function setAuthMode(mode) {
      isLoginMode = mode;
      if (mode) {
        loginTitle.textContent = 'Se connecter';
        loginSubtitle.textContent = 'Accédez à votre espace de discussion';
        authSubmitBtn.textContent = 'Se connecter';
        toggleMessage.textContent = 'Pas encore de compte ?';
        toggleAuthLink.textContent = 'Créer un compte';
        nameField.style.display = 'none';
        if (nameInput) nameInput.required = false;
      } else {
        loginTitle.textContent = 'Créer un compte';
        loginSubtitle.textContent = 'Rejoignez la communauté Ag7';
        authSubmitBtn.textContent = 'S\'inscrire';
        toggleMessage.textContent = 'Déjà un compte ?';
        toggleAuthLink.textContent = 'Se connecter';
        nameField.style.display = 'block';
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
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        alert('Veuillez remplir tous les champs');
        return;
      }
      if (!isLoginMode) {
        const name = nameInput.value.trim();
        if (!name) { alert('Le nom est requis'); return; }
      }
      // Connexion réussie
      loginSection.classList.add('hidden');
      appSection.classList.remove('hidden');
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
      settings: document.getElementById('view-settings')
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
    }

    // Écouteurs sur les liens de navigation
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = item.getAttribute('data-view');
        if (viewId) switchView(viewId);
      });
    });

    // ---------- MODE SOMBRE (toggle + localStorage) ----------
    const darkToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Appliquer le thème sauvegardé
    const savedTheme = localStorage.getItem('ag7-theme');
    if (savedTheme === 'dark') {
      body.classList.add('dark');
      if (darkToggle) darkToggle.checked = true;
    } else {
      body.classList.remove('dark');
      if (darkToggle) darkToggle.checked = false;
    }

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
      });
    }

    // ---------- QUELQUES INTERACTIONS SUPPLÉMENTAIRES (simulation) ----------
    // Rendre fonctionnel l'envoi de message (simulation)
    const sendBtn = document.querySelector('.send-btn');
    const messageInput = document.querySelector('.message-input-area textarea');
    const messagesContainer = document.querySelector('.messages-container');

    if (sendBtn && messageInput && messagesContainer) {
      function addMessage(text, isMe = true) {
        if (!text.trim()) return;
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isMe ? 'me' : ''}`;
        bubble.innerHTML = `${text}<div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>`;
        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        messageInput.value = '';
      }

      sendBtn.addEventListener('click', () => addMessage(messageInput.value, true));
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          addMessage(messageInput.value, true);
        }
      });
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