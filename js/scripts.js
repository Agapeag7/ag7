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

// ========== PROFIL AVEC FOLLOWERS (DONNÉES SIMULÉES) ==========
let currentUserProfile = {
  name: "Alexandre Gauthier",
  username: "@alex_gauthier",
  bio: "Lead Designer & Front-end Dev. Passionné par les interfaces modernes et l'UX.",
  location: "Butembo, DRC",
  memberSince: "Janvier 2024",
  avatarInitials: "AG",
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
  document.getElementById("profileAvatar").innerText = currentUserProfile.avatarInitials;
  document.getElementById("postsCount").innerText = currentUserProfile.postsCount;
  document.getElementById("followersCount").innerText = currentUserProfile.followers.length;
  document.getElementById("followingCount").innerText = currentUserProfile.following.length;

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