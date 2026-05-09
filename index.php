<?php
// ===== BACKEND - AJAX Handler =====
// Configurer et démarrer la session AVANT tout
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// Inclure la classe au démarrage pour les appels AJAX
if ((($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'GET') && isset($_REQUEST['action']))) {
    include 'ag.class.php';
    exit; // Le auto-router d'ag.class.php va s'exécuter et appeler exit
}

// Vérifier si utilisateur déjà connecté
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    $user_username = $_SESSION['user_username'] ?? '';
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Ag7</title>
  <link rel="website icon" type="png" href="ico/AG7.png">
  <!-- Icone -->
  <!-- Font Awesome 6 (icônes réelles) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <link rel="stylesheet" href="css/style.css">
  <style>
    
  </style>
</head>
<body>

<!-- CONTENEUR DE NOTIFICATIONS TOAST -->
<div id="notificationContainer" class="notification-container"></div>

<!-- SECTION LOGIN (affichée par défaut) -->
<div id="login-section" class="section">
  <div class="login-container">
    <div class="login-header">
      <img src="ico/AG7.png" alt="Ag7" class="login-logo" loading="lazy">
      <h2 id="login-title">Se connecter</h2>
      <p id="login-subtitle">Accédez à votre espace de discussion</p>
    </div>

    <!-- Formulaire dynamique (connexion / inscription) -->
    <form id="auth-form" class="login-form">
      <!-- Champ Nom (caché en mode connexion) -->
      <div id="name-field" class="input-group" style="display: none;">
        <i class="fas fa-user"></i>
        <input type="text" placeholder="Nom" id="signup-name">
      </div>
      
      <!-- Sélecteur photo profil (caché en mode connexion) -->
      <div id="profile-pic-field" style="display: none;">
        <label style="display: block; margin-bottom: 12px; font-weight: 500; font-size: 14px;"><i class="fas fa-image"></i> Choisir une photo de profil (optionnel)</label>
        <div style="position: relative; cursor: pointer; border: 2px dashed var(--emerald-500); border-radius: 16px; padding: 20px; text-align: center; background: var(--hover-bg); transition: 0.2s;" id="photo-upload-area">
          <input type="file" id="profile-photo-input" accept="image/*" style="display: none;">
          <i class="fas fa-cloud-upload-alt" style="font-size: 28px; color: var(--emerald-500); margin-bottom: 8px; display: block;"></i>
          <span id="photo-upload-text" style="display: block; font-size: 14px; color: var(--text-secondary);">Cliquez pour uploader une photo</span>
          <img id="photo-preview" src="" style="display: none; max-width: 100%; max-height: 120px; border-radius: 12px; margin-top: 12px;" loading="lazy">
        </div>
      </div>
      
      <div class="input-group">
        <i class="fas fa-user-tag"></i>
        <input type="text" placeholder="Pseudo" id="auth-username" required>
      </div>
      <div class="input-group">
        <i class="fas fa-lock"></i>
        <input type="password" placeholder="Mot de passe" id="auth-password" required>
      </div>
      <button type="submit" class="login-btn" id="auth-submit-btn">Se connecter</button>
    </form>

    <div class="toggle-mode">
      <span id="toggle-message">Pas encore de compte ?</span>
      <a href="#" id="toggle-auth-mode">Créer un compte</a>
    </div>
  </div>
</div>

<!-- SECTION APPLICATION (cachée initialement) -->
<div id="app-section" class="section hidden">

<div class="app-wrapper">

  <!-- SIDEBAR NAVIGATION FIXE -->
  <div class="nav-sidebar">
    <div class="nav-logo"></div>
    <ul class="nav-menu">
      <li class="nav-item active" data-view="chat"><a href="#" data-title="Chat"><i class="fas fa-comment-dots"></i><span>Chat</span></a></li>
      <li class="nav-item" data-view="feed"><a href="#" data-title="Actualités"><i class="fas fa-newspaper"></i><span>Actus</span></a></li>
      <li class="nav-item" data-view="contacts"><a href="#" data-title="Découvrir"><i class="fas fa-compass"></i><span>Découvrir</span></a></li>
      <li class="nav-item" data-view="notifications"><a href="#" data-title="Notifications"><i class="fas fa-bell"></i><span>Notifs</span></a></li>
      <li class="nav-item" data-view="profile"><a href="#" data-title="Profil"><i class="fas fa-user-circle"></i><span>Profil</span></a></li>
      <li class="nav-item" data-view="settings"><a href="#" data-title="Paramètres"><i class="fas fa-sliders-h"></i><span>Réglages</span></a></li>
    </ul>
    <div class="nav-footer">
      <div class="nav-item"><a href="#" data-title="Déconnexion" id="logoutBtn"><i class="fas fa-sign-out-alt"></i></a></div>
    </div>
  </div>

  <!-- CONTENEUR DES VUES (SPA) -->
  <div class="main-view">
    <!-- HEADER GLOBAL -->
    <div class="app-header">
      <img src="ico/AG7.png" alt="Ag7" class="app-header-logo" loading="lazy">
      <h1 class="app-header-title">Ag7</h1>
    </div>

    <!-- ========== VUE CHAT ========== -->
    <div id="view-chat" class="view active">
      <div class="chat-layout">
        <!-- Liste conversations -->
        <div class="chat-sidebar-list">
          <div class="section-title">Messages</div>
          <div class="search-box">
            <input type="text" placeholder="Rechercher une conversation...">
            <button><i class="fas fa-search"></i></button>
          </div>
          <ul class="conversation-list">
            <li class="conversation-item-chat active">
              <div class="avatar"><i class="fas fa-users"></i></div>
              <div class="conversation-info">
                <div class="conversation-name">Équipe Design</div>
                <div class="conversation-lastmsg">Claire : Les maquettes sont prêtes !</div>
              </div>
              <div class="conversation-meta">
                <div class="timestamp">12:30</div>
                <span class="unread-badge">3</span>
              </div>
            </li>
            <li class="conversation-item-chat">
              <div class="avatar">ML</div>
              <div class="conversation-info">
                <div class="conversation-name">Marie Lambert</div>
                <div class="conversation-lastmsg">On se voit demain ?</div>
              </div>
              <div class="conversation-meta">
                <div class="timestamp">09:15</div>
              </div>
            </li>
            <li class="conversation-item-chat">
              <div class="avatar">TD</div>
              <div class="conversation-info">
                <div class="conversation-name">Thomas Dubois</div>
                <div class="conversation-lastmsg">Merci pour les infos !</div>
              </div>
              <div class="conversation-meta">
                <div class="timestamp">Hier</div>
                <span class="unread-badge">1</span>
              </div>
            </li>
            <li class="conversation-item-chat">
              <div class="avatar"><i class="fas fa-code"></i></div>
              <div class="conversation-info">
                <div class="conversation-name">Projet Ag7</div>
                <div class="conversation-lastmsg">Commit final pushé</div>
              </div>
              <div class="conversation-meta">
                <div class="timestamp">Lun</div>
              </div>
            </li>
          </ul>
        </div>
        <!-- Zone de discussion -->
        <div class="chat-conversation-area">
          <div class="conversation-header">
            <button class="back-btn" id="backToList"><i class="fas fa-arrow-left"></i></button>
            <div class="avatar" style="width:44px;height:44px;margin-right:14px;"><i class="fas fa-comments"></i></div>
            <div>
              <div class="conversation-name">Équipe Design</div>
              <div style="font-size:13px;color:var(--text-secondary);"><span class="status-dot online"></span> En ligne · 4 membres</div>
            </div>
            <div style="margin-left: auto; display: flex; gap: 12px;">
              <i class="fas fa-phone-alt" style="color: var(--text-secondary); cursor: pointer;"></i>
              <i class="fas fa-video" style="color: var(--text-secondary); cursor: pointer;"></i>
            </div>
          </div>
          <div class="messages-container">
            <div class="message-bubble">
              Salut tout le monde ! Prêts pour la review ?
              <div class="message-time">10:15</div>
              <div class="message-actions">
                <button class="message-action-btn" title="Répondre" data-action="reply"><i class="fas fa-reply"></i></button>
                <button class="message-action-btn" title="Partager" data-action="share"><i class="fas fa-share"></i></button>
                <button class="message-action-btn" title="Transférer" data-action="transfer"><i class="fas fa-arrow-right"></i></button>
              </div>
            </div>
            <div class="message-bubble me">
              Hello ! Oui, j'ai préparé les slides et le prototype.
              <div class="message-time">10:18</div>
              <div class="message-actions">
                <button class="message-action-btn" title="Répondre" data-action="reply"><i class="fas fa-reply"></i></button>
                <button class="message-action-btn" title="Partager" data-action="share"><i class="fas fa-share"></i></button>
                <button class="message-action-btn" title="Transférer" data-action="transfer"><i class="fas fa-arrow-right"></i></button>
              </div>
            </div>
            <div class="message-bubble">
              Parfait, on se connecte à 14h. J'ai partagé le lien Meet.
              <div class="message-time">10:20</div>
              <div class="message-actions">
                <button class="message-action-btn" title="Répondre" data-action="reply"><i class="fas fa-reply"></i></button>
                <button class="message-action-btn" title="Partager" data-action="share"><i class="fas fa-share"></i></button>
                <button class="message-action-btn" title="Transférer" data-action="transfer"><i class="fas fa-arrow-right"></i></button>
              </div>
            </div>
            <div class="message-bubble me">
              Super, à tout à l'heure !
              <div class="message-time">10:21</div>
              <div class="message-actions">
                <button class="message-action-btn" title="Répondre" data-action="reply"><i class="fas fa-reply"></i></button>
                <button class="message-action-btn" title="Partager" data-action="share"><i class="fas fa-share"></i></button>
                <button class="message-action-btn" title="Transférer" data-action="transfer"><i class="fas fa-arrow-right"></i></button>
              </div>
            </div>
          </div>
          <div class="conversation-form">
            <button type="button" class="conversation-form-button"><i class="fas fa-face-smile"></i></button>
            <div class="conversation-form-group">
              <textarea class="conversation-form-input" rows="1" placeholder="Tapez votre message ici..."></textarea>
              <button type="button" class="conversation-form-record"><i class="fas fa-microphone"></i></button>
            </div>
            <button type="button" class="conversation-form-button conversation-form-submit"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== VUE DÉCOUVRIR (SUIVRE UTILISATEURS) ========== -->
    <div id="view-contacts" class="view">
      <div class="view-header">
        <h2>Découvrir</h2>
        <input type="text" placeholder="Rechercher un utilisateur..." class="search-users-input" id="searchUsersInput" style="flex: 1; max-width: 300px;">
      </div>
      <div class="discover-grid" id="discoverGrid">
        <!-- Cartes utilisateurs générées dynamiquement -->
      </div>
    </div>

    <!-- ========== VUE NOTIFICATIONS ========== -->
    <div id="view-notifications" class="view">
      <div class="view-header">
        <h2>Notifications</h2>
        <button class="btn-primary"><i class="fas fa-check-double"></i> Tout marquer lu</button>
      </div>
      <div style="background: var(--card-bg); border-radius: 24px; border: 1px solid var(--border-light); padding: 8px;">
        <div id="notificationsContainer">
          <!-- Notifications injectées dynamiquement ici -->
        </div>
      </div>
    </div>

    <!-- ========== VUE PROFIL ========== -->
    <div id="view-profile" class="view">
      <div class="profile-cover-wrapper">
        <div class="profile-cover">
          <img src="https://picsum.photos/id/104/1200/400" alt="cover" class="cover-img" loading="lazy">
          <button class="change-cover-btn"><i class="fas fa-camera"></i></button>
        </div>
      </div>
      
      <div class="profile-info-wrapper">
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar-large" id="profileAvatar">AG</div>
          <button class="change-profile-btn"><i class="fas fa-camera"></i></button>
        </div>
        <div class="profile-actions">
          <button class="btn-primary edit-profile-btn"><i class="fas fa-pen"></i> Modifier le profil</button>
        </div>
      </div>
      <div class="profile-bio">
        <h2 id="profileName">Alexandre Gauthier</h2>
        <p class="profile-username">@alex_gauthier</p>
        <p class="profile-bio-text">Lead Designer & Front-end Dev. Passionné par les interfaces modernes et l'UX.</p>
        <div class="profile-location-date">
          <span><i class="fas fa-map-pin"></i> Butembo, DRC</span>
          <span><i class="fas fa-calendar-alt"></i> Membre depuis Janvier 2024</span>
        </div>
      </div>

      <!-- Statistiques interactives -->
      <div class="profile-stats">
        <div class="stat-item" data-type="posts">
          <span class="stat-number" id="postsCount">12</span>
          <span class="stat-label">Publications</span>
        </div>
        <div class="stat-item" data-type="followers">
          <span class="stat-number" id="followersCount">245</span>
          <span class="stat-label">Abonnés</span>
        </div>
        <div class="stat-item" data-type="following">
          <span class="stat-number" id="followingCount">189</span>
          <span class="stat-label">Abonnements</span>
        </div>
      </div>

      <!-- Grille des publications de l'utilisateur -->
      <div class="profile-posts-grid" id="profilePostsGrid">
        <!-- Posts générés dynamiquement -->
      </div>
    </div>

    <!-- MODALE POUR LISTE FOLLOWERS/FOLLOWING -->
    <div id="followModal" class="follow-modal hidden">
      <div class="follow-modal-content">
        <div class="follow-modal-header">
          <h3 id="followModalTitle">Abonnés</h3>
          <button class="follow-modal-close">&times;</button>
        </div>
        <div class="follow-list" id="followList">
          <!-- Liste générée dynamiquement -->
        </div>
      </div>
    </div>

    <!-- MODALE MODIFICATION PROFIL -->
    <div id="editProfileModal" class="edit-profile-modal hidden">
      <div class="edit-profile-card">
        <button class="edit-profile-close">&times;</button>
        <h2>Modifier mon profil</h2>
        <form id="editProfileForm" class="edit-profile-form">
          
          <!-- Photo de profil -->
          <div class="edit-section">
            <label><i class="fas fa-user-circle"></i> Photo de profil</label>
            <div class="photo-upload-container" id="profilePhotoUpload">
              <div class="photo-preview">
                <img id="profilePhotoPreview" src="" alt="Photo profil" style="display: none;" loading="lazy">
                <span id="profilePhotoInitials">AG</span>
              </div>
              <input type="file" id="profilePhotoInput" accept="image/*" style="display: none;">
              <button type="button" class="btn-secondary">Changer</button>
            </div>
          </div>
          
          <!-- Photo de couverture -->
          <div class="edit-section">
            <label><i class="fas fa-image"></i> Photo de couverture</label>
            <div class="photo-upload-container" id="coverPhotoUpload">
              <div class="photo-preview">
                <img id="coverPhotoPreview" src="" alt="Photo couverture" style="width:100%; height: 150px; object-fit: cover;" loading="lazy">
              </div>
              <input type="file" id="coverPhotoInput" accept="image/*" style="display: none;">
              <button type="button" class="btn-secondary">Changer</button>
            </div>
          </div>
          
          <!-- Nom -->
          <div class="edit-section">
            <label for="editName"><i class="fas fa-font"></i> Nom</label>
            <input type="text" id="editName" name="user_name" placeholder="Votre nom complet" maxlength="100">
          </div>
          
          <!-- Pseudo -->
          <div class="edit-section">
            <label for="editUsername"><i class="fas fa-user-tag"></i> Pseudo</label>
            <input type="text" id="editUsername" name="user_username" placeholder="Votre pseudo" maxlength="50">
          </div>
          
          <!-- Bio -->
          <div class="edit-section">
            <label for="editBio"><i class="fas fa-pen-fancy"></i> Biographie</label>
            <textarea id="editBio" name="user_bio" placeholder="Parlez-nous de vous..." maxlength="500" rows="4"></textarea>
            <small id="bioCharCount">0/500</small>
          </div>
          
          <div class="edit-actions">
            <button type="button" class="btn-secondary edit-profile-cancel">Annuler</button>
            <button type="submit" class="btn-primary">Enregistrer les modifications</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========== VUE PARAMETRES ========== -->
    <div id="view-settings" class="view">
      <div class="view-header">
        <h2>Paramètres</h2>
      </div>
      <div class="settings-group">
        <h3 style="margin-bottom: 24px; font-size: 20px;"><i class="fas fa-palette" style="margin-right: 8px;"></i>Apparence</h3>
        <div class="toggle-switch" style="display: none;">
          <span><i class="fas fa-moon" style="margin-right: 12px; width: 20px;"></i>Mode sombre</span>
          <input type="checkbox" id="darkModeToggle">
        </div>
        <button id="customizeThemeBtn" style="background: var(--emerald-500); color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; margin-top: 16px; width: 100%; font-weight: 600; transition: 0.2s;">
          <i class="fas fa-sliders-h"></i> Personnaliser le thème
        </button>
      </div>
      <div class="settings-group">
        <h3 style="margin-bottom: 24px; font-size: 20px;"><i class="fas fa-bell" style="margin-right: 8px;"></i>Notifications</h3>
        <div class="toggle-switch" style="margin-bottom: 20px;">
          <span><i class="fas fa-mobile-alt" style="margin-right: 12px;"></i>Notifications push</span>
          <input type="checkbox" checked>
        </div>
        <div class="toggle-switch">
          <span><i class="fas fa-volume-up" style="margin-right: 12px;"></i>Sons de message</span>
          <input type="checkbox" checked>
        </div>
      </div>
      <div class="settings-group">
        <h3 style="margin-bottom: 24px; font-size: 20px;"><i class="fas fa-shield-alt" style="margin-right: 8px;"></i>Confidentialité</h3>
        <div class="toggle-switch">
          <span><i class="fas fa-user-secret" style="margin-right: 12px;"></i>Afficher statut en ligne</span>
          <input type="checkbox" checked>
        </div>
      </div>
      <div style="margin-top: 20px; color: var(--text-secondary); font-size: 14px; text-align: center;">
        <i class="far fa-save"></i> Les préférences sont sauvegardées automatiquement
      </div>

      <!-- ========== MODAL PERSONNALISATION THEME ========== -->
      <div id="themeModal" class="customize-theme">
        <div class="customize-theme-card">
          <button class="customize-theme-close">&times;</button>
          <h2>Personnalisez votre vue</h2>
          <p class="customize-theme-subtitle">Gérez la taille, la couleur et l'arrière-plan</p>

          <!-- TAILLE DE POLICE -->
          <div class="customize-font-size">
            <h4><i class="fas fa-font"></i> Taille de police</h4>
            <div class="font-size-display">
              <span class="font-size-preview-small">Aa</span>
              <div class="font-sizes-selector">
                <span class="font-size-1" title="Petite"></span>
                <span class="font-size-2 active" title="Normale"></span>
                <span class="font-size-3" title="Grande"></span>
                <span class="font-size-4" title="Très grande"></span>
                <span class="font-size-5" title="Énorme"></span>
              </div>
              <span class="font-size-preview-large">Aa</span>
            </div>
          </div>

          <!-- COULEUR PRIMAIRE -->
          <div class="customize-color">
            <h4><i class="fas fa-palette"></i> Couleur primaire</h4>
            <div class="colors-selector">
              <span class="color-1 active" style="background: #047857;" title="Émeraude"></span>
              <span class="color-2" style="background: #3b82f6;" title="Bleu"></span>
              <span class="color-3" style="background: #ec4899;" title="Rose"></span>
              <span class="color-4" style="background: #f59e0b;" title="Orange"></span>
              <span class="color-5" style="background: #8b5cf6;" title="Violet"></span>
            </div>
          </div>

          <!-- ARRIERE-PLAN -->
          <div class="customize-background">
            <h4><i class="fas fa-image"></i> Arrière-plan</h4>
            <div class="backgrounds-selector">
              <div class="bg-1 active" title="Clair">
                <span class="bg-preview"></span>
                <span class="bg-label">Clair</span>
              </div>
              <div class="bg-2" title="Dim">
                <span class="bg-preview"></span>
                <span class="bg-label">Dim</span>
              </div>
              <div class="bg-3" title="Sombre">
                <span class="bg-preview"></span>
                <span class="bg-label">Sombre</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== VUE ACTUALITÉS (FEED + STORIES) ========== -->
    <div id="view-feed" class="view">
      <!-- Stories horizontales -->
      <div class="stories-container" id="storiesContainer">
        <div class="story-item" id="addStoryBtn" data-story="user">
          <div class="story-avatar add-story">
            <i class="fas fa-plus"></i>
          </div>
          <span class="story-name">Votre story</span>
        </div>
        <!-- Stories seront générées dynamiquement ici -->
      </div>

      <!-- Création d'une publication -->
      <div class="create-post-card">
        <div class="create-post-header">
          <div class="mini-avatar" id="createPostAvatar">AG</div>
          <textarea id="postContent" rows="2" placeholder="Quoi de neuf ?"></textarea>
        </div>
        <div id="postImagesPreview" class="post-images-preview" style="display: none;">
          <div class="preview-grid"></div>
          <button type="button" id="clearImagesBtn" class="btn-secondary" style="margin-top: 12px;">Supprimer les images</button>
        </div>
        <div class="create-post-actions">
          <button id="addImageBtn" class="action-btn"><i class="fas fa-image"></i> Image</button>
          <input type="file" id="postImageInput" accept="image/*" multiple style="display: none;">
          <button id="createPollBtn" class="action-btn"><i class="fas fa-poll"></i> Sondage</button>
          <button id="publishPostBtn" class="btn-primary">Publier</button>
        </div>
      </div>

      <!-- Flux des publications -->
      <div id="feedContainer" class="feed-container">
        <!-- Les posts seront injectés ici dynamiquement -->
      </div>
    </div>

    <!-- Modale story (cachée) -->
    <div id="storyModal" class="story-modal hidden">
      <div class="story-modal-content">
        <button class="story-close">&times;</button>
        <button class="story-delete-btn" id="storyDeleteBtn" style="position: absolute; top: 12px; right: 50px; background: none; border: none; color: white; cursor: pointer; font-size: 24px; z-index: 1050; display: none;"><i class="fas fa-trash"></i></button>
        <div class="story-viewers-count" id="storyViewersCount"></div>
        <div class="story-viewer">
          <img id="storyImage" src="" alt="Story" loading="lazy">
          <div class="story-caption"></div>
        </div>
      </div>
    </div>

    <!-- Modale Carousel Images -->
    <div id="imageCarouselModal" class="image-carousel-modal hidden">
      <div class="carousel-container">
        <button class="carousel-close">&times;</button>
        <button class="carousel-prev"><i class="fas fa-chevron-left"></i></button>
        
        <div class="carousel-viewer">
          <img id="carouselImage" src="" alt="carousel-image" loading="lazy">
          <div class="image-counter" id="imageCounter"></div>
        </div>
        
        <button class="carousel-next"><i class="fas fa-chevron-right"></i></button>
        
        <div class="carousel-dots" id="carouselDots"></div>
      </div>
    </div>

    <!-- Modale commentaires post -->
    <div id="commentsModal" class="comments-modal hidden">
      <div class="comments-modal-content">
        <button class="comments-modal-close">&times;</button>
        <h3>Tous les commentaires</h3>
        <div class="all-comments-list"></div>
        <!-- <div class="add-comment-form">
          <input type="text" class="modal-comment-input" placeholder="Ajouter un commentaire...">
          <label class="modal-anonymous-toggle">
            <input type="checkbox" class="modal-anonymous-checkbox">
            <i class="fas fa-mask"></i>
          </label>
          <button class="modal-submit-comment">Envoyer</button>
        </div> -->
      </div>
    </div>

    <!-- Modale création story -->
    <div id="createStoryModal" class="create-story-modal hidden">
      <div class="create-story-card">
        <button class="create-story-close">&times;</button>
        <h2>Créer une story</h2>
        <div class="create-story-form">
          <textarea id="storyText" rows="4" placeholder="Quoi de neuf ? (optionnel)"></textarea>
          <div class="create-story-image-upload">
            <input type="file" id="storyImageInput" accept="image/*" style="display: none;">
            <button type="button" id="uploadStoryImageBtn" class="btn-secondary">
              <i class="fas fa-image"></i> Ajouter une image
            </button>
            <img id="storyImagePreview" src="" alt="Preview" style="display: none; max-width: 100%; max-height: 200px; margin-top: 12px; border-radius: 12px;" loading="lazy">
          </div>
          <div class="create-story-actions">
            <button type="button" id="cancelStoryBtn" class="btn-secondary">Annuler</button>
            <button type="button" id="publishStoryBtn" class="btn-primary">Publier la story</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modale création sondage -->
    <!-- Modale création sondage -->
    <div id="createPollModal" class="create-poll-modal hidden">
      <div class="create-poll-card">
        <button class="create-poll-close">&times;</button>
        <h2>Créer un sondage</h2>
        <div class="create-poll-form">
          <div class="form-group">
            <label for="pollQuestion">Question du sondage</label>
            <textarea id="pollQuestion" rows="2" placeholder="Posez votre question..." maxlength="255"></textarea>
          </div>
          
          <div class="form-group">
            <label for="pollImage">Image (optionnel)</label>
            <div class="poll-image-upload">
              <input type="file" id="pollImageInput" accept="image/*" style="display: none;">
              <button type="button" id="uploadPollImageBtn" class="btn-secondary">
                <i class="fas fa-image"></i> Ajouter une image
              </button>
              <img id="pollImagePreview" src="" alt="Preview" style="display: none; max-width: 100%; max-height: 150px; margin-top: 12px; border-radius: 12px;" loading="lazy">
            </div>
          </div>
          
          <div class="form-group">
            <label>Options du sondage (2-5)</label>
            <div id="pollOptionsContainer">
              <!-- Groupe option 1 -->
              <div class="poll-option-group">
                <input type="text" class="poll-option-input" placeholder="Option 1" maxlength="255">
                <input type="file" class="poll-option-image" accept="image/*" onchange="previewOptionImage(this, 1)">
                <img id="optionPreview1" style="display:none; max-width:80px; margin-top:4px;">
              </div>
              <!-- Groupe option 2 -->
              <div class="poll-option-group">
                <input type="text" class="poll-option-input" placeholder="Option 2" maxlength="255">
                <input type="file" class="poll-option-image" accept="image/*" onchange="previewOptionImage(this, 2)">
                <img id="optionPreview2" style="display:none; max-width:80px; margin-top:4px;">
              </div>
            </div>
            <button type="button" id="addPollOptionBtn" class="btn-secondary" style="margin-top: 12px;">
              <i class="fas fa-plus"></i> Ajouter option
            </button>
          </div>
          
          <div class="create-poll-actions">
            <button type="button" id="cancelPollBtn" class="btn-secondary">Annuler</button>
            <button type="button" id="publishPollBtn" class="btn-primary">Créer le sondage</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modale Détails Publication (depuis profil) -->
    <div id="postDetailModal" class="post-detail-modal hidden">
      <div class="post-detail-card">
        <button class="post-detail-close">&times;</button>
        <div class="post-detail-content">
          <div class="post-detail-header">
            <div class="post-detail-author-info">
              <div class="post-detail-avatar" id="postDetailAvatar">AG</div>
              <div>
                <div class="post-detail-author-name" id="postDetailAuthor">Auteur</div>
                <div class="post-detail-timestamp" id="postDetailTime">À l'instant</div>
              </div>
            </div>
            <button class="post-detail-delete-btn" id="postDetailDeleteBtn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 18px; display: none;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          
          <div class="post-detail-text" id="postDetailText"></div>
          
          <img id="postDetailImage" src="" alt="post" class="post-detail-image" style="display: none; width: 100%; max-height: 500px; object-fit: cover; border-radius: 12px; margin: 16px 0;">
          
          <div class="post-detail-stats">
            <span><span id="postDetailLikes">0</span> J'aime</span>
            <span><span id="postDetailComments">0</span> Commentaires</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Suppression Publication -->
    <div id="deletePostModal" class="delete-post-modal hidden">
      <div class="delete-post-card">
        <button class="delete-post-close">&times;</button>
        <div style="text-align: center; margin-bottom: 24px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 16px; display: block;"></i>
          <h2 style="margin: 0; color: #ef4444;">Supprimer la publication</h2>
        </div>
        <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px; font-size: 15px;">
          Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible
        </p>
        <div class="delete-post-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" id="cancelDeleteBtn" class="btn-secondary">Annuler</button>
          <button type="button" id="confirmDeleteBtn" class="btn-danger" style="background: #ef4444; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600;">Supprimer</button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmation Générique -->
    <div id="confirmationModal" class="confirmation-modal hidden">
      <div class="confirmation-card">
        <div class="confirmation-header">
          <i class="fas fa-exclamation-circle confirmation-icon"></i>
          <h2 id="confirmationTitle">Confirmation</h2>
        </div>
        <p id="confirmationMessage" class="confirmation-message"></p>
        <div class="confirmation-actions">
          <button type="button" id="confirmationCancel" class="btn-secondary">Annuler</button>
          <button type="button" id="confirmationConfirm" class="btn-danger">Confirmer</button>
        </div>
      </div>
    </div>

    <!-- Modal Vue Profil Utilisateur -->
    <div id="userProfileModal" class="user-profile-modal hidden">
      <div class="user-profile-card">
        <button class="user-profile-close">&times;</button>
        <div class="user-profile-header">
          <div class="user-profile-cover" id="userProfileCover"></div>
          <div class="user-profile-avatar" id="userProfileAvatar">AG</div>
          <button class="user-profile-follow-btn" id="userProfileFollowBtn" style="display: none; position: absolute; top: 12px; right: 12px; padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer; font-weight: 600; transition: 0.2s; background: var(--emerald-500); color: white;">Suivre</button>
        </div>
        <div class="user-profile-info">
          <h2 id="userProfileName">Nom utilisateur</h2>
          <p id="userProfileUsername" style="color: var(--text-secondary); margin-bottom: 12px;">@username</p>
          <p id="userProfileBio" style="color: var(--text-secondary); margin-bottom: 16px;"></p>
          <div class="user-profile-meta">
            <div class="meta-item">
              <i class="fas fa-map-marker-alt"></i>
              <span id="userProfileLocation">Localisation</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-calendar"></i>
              <span id="userProfileMemberSince">Membre depuis Avril 2026</span>
            </div>
          </div>
          <div class="user-profile-stats">
            <div class="stat-item">
              <span class="stat-number" id="userProfileFollowersCount">0</span>
              <span class="stat-label">Abonnés</span>
            </div>
            <div class="stat-item">
              <span class="stat-number" id="userProfileFollowingCount">0</span>
              <span class="stat-label">Abonnements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

</div> <!-- Fin app-section -->

<!-- API Actus -->
<script src="js/api-actus.js"></script>
<!-- Intégration Actus Complète -->
<script src="js/actus-complete.js"></script>

<!-- API Stories (NOUVEAU) -->
<script src="js/api-stories.js"></script>

<script src="js/scripts.js"></script>

<!-- Petite police système pour un rendu optimal -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</body>
</html>