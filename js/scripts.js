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
        color: '#2563eb',
        bgColor: '#dbeafe',
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
        bgColor: '#fee2e2',
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
        bgColor: '#fef3c7',
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
        bgColor: '#f3e8ff',
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
        follow: { icon: 'fas fa-user-check', color: '#2563eb', bgColor: '#dbeafe' },
        post: { icon: 'fas fa-heart', color: '#dc2626', bgColor: '#fee2e2' },
        mention: { icon: 'fas fa-at', color: '#9333ea', bgColor: '#f3e8ff' },
        update: { icon: 'fas fa-sync-alt', color: '#d97706', bgColor: '#fef3c7' }
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
const storyItems = document.querySelectorAll('.story-item:not([data-story="user"])');

function openStory(imageUrl, caption) {
  storyImage.src = imageUrl;
  storyCaption.textContent = caption || '';
  storyModal.classList.remove('hidden');
}
storyClose.addEventListener('click', () => storyModal.classList.add('hidden'));
storyModal.addEventListener('click', (e) => {
  if (e.target === storyModal) storyModal.classList.add('hidden');
});

storyItems.forEach(item => {
  item.addEventListener('click', () => {
    const storyId = item.getAttribute('data-story');
    let img = '';
    let txt = '';
    if (storyId === 'story1') { img = 'https://randomuser.me/api/portraits/women/68.jpg'; txt = 'Bonjour à tous ! ☀️'; }
    else if (storyId === 'story2') { img = 'https://randomuser.me/api/portraits/men/32.jpg'; txt = 'Nouveau projet excitant !'; }
    else { img = 'https://randomuser.me/api/portraits/women/45.jpg'; txt = 'En pleine réflexion...'; }
    openStory(img, txt);
  });
});

// Ajout d'une story par l'utilisateur
const addStoryBtn = document.querySelector('.story-item[data-story="user"]');
if (addStoryBtn) {
  addStoryBtn.addEventListener('click', () => {
    const fakeStoryUrl = 'https://picsum.photos/400/600?random=' + Date.now();
    const caption = prompt('Légende de votre story :', 'Nouvelle story !');
    openStory(fakeStoryUrl, caption || '');
    // Optionnel : ajouter visuellement la story dans la liste (simulation)
  });
}

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
    image: 'https://picsum.photos/id/20/600/400',
    time: 'Il y a 2 heures',
    likes: 24,
    liked: false,
    comments: [
      { text: 'Super boulot !', isAnonymous: true, author: 'Anonyme' },
      { text: "J'ai hâte de voir ça", isAnonymous: false, author: 'Vous' }
    ]
  },
  {
    id: 2,
    author: 'Marie Lambert',
    avatar: 'ML',
    content: "Quelqu'un pour un café-débat sur l'UX ce midi ?",
    image: null,
    time: 'Hier',
    likes: 12,
    liked: false,
    comments: [
      { text: 'Je suis partante !', isAnonymous: true, author: 'Anonyme' },
      { text: 'À la pause déjeuner', isAnonymous: false, author: 'Vous' }
    ]
  }
];

const feedContainer = document.getElementById('feedContainer');
const publishBtn = document.getElementById('publishPostBtn');
const postContentInput = document.getElementById('postContent');

function renderFeed() {
  if (!feedContainer) return;
  feedContainer.innerHTML = '';
  posts.forEach(post => {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.dataset.id = post.id;
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
        ${post.image ? `<img src="${post.image}" class="post-image" alt="image post">` : ''}
      </div>
      <div class="post-stats">
        <span><i class="far fa-heart"></i> ${post.likes} likes</span>
        <span><i class="far fa-comment"></i> ${post.comments.length} commentaires</span>
      </div>
      <div class="post-actions">
        <button class="post-action-btn like-btn ${post.liked ? 'liked' : ''}"><i class="far fa-heart"></i> Like</button>
        <button class="post-action-btn comment-btn"><i class="far fa-comment"></i> Commenter</button>
      </div>
      <div class="comments-section">
        <div class="comments-list">
          ${post.comments.map(c => `<div class="comment-item">${c.isAnonymous ? '<i class="fas fa-mask" style="margin-right: 8px; color: var(--text-secondary);"></i>' : '<strong style="margin-right: 8px;">' + c.author + '</strong>'} ${escapeHtml(c.text)}</div>`).join('')}
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
    post.comments.push({
      text: commentText,
      isAnonymous: anonymousCheckbox.checked,
      author: 'Vous'
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

// Publier un nouveau post
if (publishBtn) {
  publishBtn.addEventListener('click', () => {
    const content = postContentInput.value.trim();
    if (!content) return;
    const newPost = {
      id: Date.now(),
      author: 'Alexandre Gauthier',
      avatar: 'AG',
      content: content,
      image: null, // on pourrait ajouter une image via un input
      time: 'À l\'instant',
      likes: 0,
      liked: false,
      comments: []
    };
    posts.unshift(newPost);
    renderFeed();
    postContentInput.value = '';
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