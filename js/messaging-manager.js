/**
 * MESSAGING MANAGER - Gestion dynamique de la messagerie
 * ======================================================
 * Gère:
 * - Chargement et affichage des conversations
 * - Sélection et affichage des messages
 * - Envoi de messages
 * - Notification de messages non-lus
 * - Marquage des conversations comme lues
 */

const MessagingManager = {
  currentConvId: null,
  currentUserId: null,
  messageRefreshInterval: null,
  conversationsRefreshInterval: null,
  lastMessageCount: 0,

  /**
   * Initialiser le gestionnaire de messagerie
   */
  async init() {
    console.log('MessagingManager init...');
    
    // Récupérer l'ID utilisateur courant depuis le backend
    this.currentUserId = await this.getCurrentUserId();
    
    if (!this.currentUserId) {
      console.error('Impossible de récupérer l\'ID utilisateur');
      return;
    }

    this.attachEventListeners();
    await this.loadConversations();
    this.startAutoRefresh();
    this.updateUnreadCount();
  },

  /**
   * Récupérer l'ID de l'utilisateur connecté
   */
  async getCurrentUserId() {
    try {
      const result = await ActusAPI.getFeed(1, 0);
      if (result.success && result.current_user_id) {
        return result.current_user_id;
      }
    } catch (error) {
      console.error('Erreur récupération user_id:', error);
    }
    return null;
  },

  /**
   * Charger et afficher toutes les conversations
   */
  async loadConversations(limit = 50, offset = 0) {
    try {
      const result = await ConversationsAPI.getConversations(limit, offset);
      
      if (!result.success) {
        showNotification('error', 'Erreur', result.message || 'Erreur lors du chargement des conversations');
        return;
      }

      this.displayConversations(result.conversations || []);
    } catch (error) {
      console.error('Erreur loadConversations:', error);
    }
  },

  /**
   * Afficher les conversations dans la sidebar
   */
  displayConversations(conversations) {
    const conversationList = document.querySelector('.conversation-list');
    if (!conversationList) return;

    conversationList.innerHTML = '';

    if (conversations.length === 0) {
      conversationList.innerHTML = '<li style="padding: 20px; text-align: center; color: var(--text-secondary);">Aucune conversation</li>';
      return;
    }

    conversations.forEach(conv => {
      const li = document.createElement('li');
      li.className = `conversation-item-chat ${conv.conv_id === this.currentConvId ? 'active' : ''}`;
      li.dataset.convId = conv.conv_id;
      li.dataset.userId = conv.other_user_id;

      // Avatar
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'avatar';
      
      if (conv.other_user_photo) {
        const img = document.createElement('img');
        img.src = conv.other_user_photo;
        img.alt = conv.other_user_name;
        img.loading = 'lazy';
        avatarDiv.appendChild(img);
      } else {
        // Initiales
        const initials = (conv.other_user_name || 'U')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        avatarDiv.textContent = initials;
      }

      // Info conversation
      const infoDiv = document.createElement('div');
      infoDiv.className = 'conversation-info';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'conversation-name';
      nameDiv.textContent = conv.other_user_name || 'Sans nom';

      const lastMsgDiv = document.createElement('div');
      lastMsgDiv.className = 'conversation-lastmsg';
      lastMsgDiv.textContent = conv.last_message ? conv.last_message.substring(0, 50) : 'Aucun message';

      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(lastMsgDiv);

      // Meta (timestamp + badge non-lus)
      const metaDiv = document.createElement('div');
      metaDiv.className = 'conversation-meta';

      const timestampDiv = document.createElement('div');
      timestampDiv.className = 'timestamp';
      timestampDiv.textContent = this.formatTimestamp(conv.last_message_time);

      metaDiv.appendChild(timestampDiv);

      // Badge non-lus
      if (conv.unread_count > 0) {
        const badge = document.createElement('span');
        badge.className = 'unread-badge';
        badge.textContent = conv.unread_count;
        metaDiv.appendChild(badge);
      }

      li.appendChild(avatarDiv);
      li.appendChild(infoDiv);
      li.appendChild(metaDiv);

      // Événement click
      li.addEventListener('click', () => this.selectConversation(conv.conv_id, conv.other_user_id, conv.other_user_name));

      conversationList.appendChild(li);
    });
  },

  /**
   * Sélectionner une conversation et charger ses messages
   */
  async selectConversation(convId, userId, userName) {
    this.currentConvId = convId;

    // Mettre à jour l'UI
    document.querySelectorAll('.conversation-item-chat').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-conv-id="${convId}"]`)?.classList.add('active');

    // Mettre à jour le header
    const header = document.querySelector('.conversation-header');
    if (header) {
      const nameEl = header.querySelector('.conversation-name');
      if (nameEl) nameEl.textContent = userName;
    }

    // Charger les messages
    await this.loadMessages(convId);

    // Marquer comme lue
    await ConversationsAPI.markConversationRead(convId);

    // Supprimer le badge non-lus
    const convItem = document.querySelector(`[data-conv-id="${convId}"] .unread-badge`);
    if (convItem) {
      convItem.remove();
    }
  },

  /**
   * Charger et afficher les messages d'une conversation
   */
  async loadMessages(convId, limit = 50, offset = 0) {
    try {
      const result = await ConversationsAPI.getMessages(convId, limit, offset);
      
      if (!result.success) {
        console.error('Erreur loadMessages:', result.message);
        return;
      }

      this.displayMessages(result.messages || []);
    } catch (error) {
      console.error('Erreur loadMessages:', error);
    }
  },

  /**
   * Afficher les messages dans la zone de conversation
   */
  displayMessages(messages) {
    const container = document.querySelector('.messages-container');
    if (!container) return;

    container.innerHTML = '';

    if (messages.length === 0) {
      container.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: var(--text-secondary);">Aucun message pour le moment</div>';
      return;
    }

    messages.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${msg.msg_sender_id === this.currentUserId ? 'me' : ''}`;
      bubble.dataset.msgId = msg.msg_id;

      // Contenu du message
      const contentDiv = document.createElement('div');
      contentDiv.style.marginBottom = '8px';
      contentDiv.textContent = msg.msg_content;

      bubble.appendChild(contentDiv);

      // Heure
      const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      timeDiv.textContent = this.formatMessageTime(msg.msg_sent_at);
      bubble.appendChild(timeDiv);

      // Actions (seulement pour les messages de l'utilisateur)
      if (msg.msg_sender_id === this.currentUserId) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'message-action-btn';
        deleteBtn.title = 'Supprimer';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => this.deleteMessage(msg.msg_id));

        actionsDiv.appendChild(deleteBtn);
        bubble.appendChild(actionsDiv);
      }

      container.appendChild(bubble);
    });

    // Scroller en bas
    container.scrollTop = container.scrollHeight;
  },

  /**
   * Envoyer un message
   */
  async sendMessage(content) {
    if (!this.currentConvId || !content.trim()) {
      showNotification('warning', 'Attention', 'Veuillez entrer un message');
      return;
    }

    try {
      // Récupérer l'ID du destinataire depuis la conversation sélectionnée
      const convItem = document.querySelector(`[data-conv-id="${this.currentConvId}"]`);
      const recipientId = convItem?.dataset.userId;

      if (!recipientId) {
        showNotification('error', 'Erreur', 'Destinataire non identifié');
        return;
      }

      const result = await ConversationsAPI.sendMessage(recipientId, content);
      
      if (!result.success) {
        showNotification('error', 'Erreur', result.message || 'Erreur lors de l\'envoi');
        return;
      }

      // Réinitialiser l'input
      const textarea = document.querySelector('.conversation-form-input');
      if (textarea) textarea.value = '';

      // Recharger les messages
      await this.loadMessages(this.currentConvId);
      
      showNotification('success', 'Succès', 'Message envoyé');
    } catch (error) {
      console.error('Erreur sendMessage:', error);
      showNotification('error', 'Erreur', error.message);
    }
  },

  /**
   * Supprimer un message
   */
  async deleteMessage(msgId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }

    try {
      const result = await ConversationsAPI.deleteMessage(msgId);
      
      if (!result.success) {
        showNotification('error', 'Erreur', result.message || 'Erreur lors de la suppression');
        return;
      }

      // Retirer le message du DOM
      const bubble = document.querySelector(`[data-msg-id="${msgId}"]`);
      if (bubble) bubble.remove();

      showNotification('success', 'Succès', 'Message supprimé');
    } catch (error) {
      console.error('Erreur deleteMessage:', error);
      showNotification('error', 'Erreur', error.message);
    }
  },

  /**
   * Mettre à jour le badge de messages non-lus
   */
  async updateUnreadCount() {
    try {
      const result = await ConversationsAPI.getUnreadCount();
      
      if (result.success) {
        const count = result.unread_count || 0;
        const badge = document.querySelector('.unread-messages-badge');
        
        if (count > 0 && badge) {
          badge.textContent = count;
          badge.style.display = 'flex';
        } else if (badge) {
          badge.style.display = 'none';
        }
        
        this.lastMessageCount = count;
      }
    } catch (error) {
      console.error('Erreur updateUnreadCount:', error);
    }
  },

  /**
   * Formater le timestamp pour affichage
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  },

  /**
   * Formater l'heure du message
   */
  formatMessageTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Attacher les écouteurs d'événements
   */
  attachEventListeners() {
    // Bouton submit (papier avion)
    const submitBtn = document.querySelector('.conversation-form-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const textarea = document.querySelector('.conversation-form-input');
        if (textarea) {
          this.sendMessage(textarea.value);
        }
      });
    }

    // Enter pour envoyer (Shift+Enter pour nouvelle ligne)
    const textarea = document.querySelector('.conversation-form-input');
    if (textarea) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage(textarea.value);
        }
      });
    }

    // Bouton retour à la liste (mobile)
    const backBtn = document.querySelector('#backToList');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // Sur mobile, afficher la liste et cacher la conversation
        const sidebar = document.querySelector('.chat-sidebar-list');
        const area = document.querySelector('.chat-conversation-area');
        if (sidebar && area) {
          sidebar.style.display = 'block';
          area.style.display = 'none';
        }
      });
    }

    // Click sur conversation item pour afficher la zone de discussion (mobile)
    document.addEventListener('click', (e) => {
      const convItem = e.target.closest('.conversation-item-chat');
      if (convItem && window.innerWidth < 768) {
        // Sur mobile, cacher la liste et afficher la conversation
        const sidebar = document.querySelector('.chat-sidebar-list');
        const area = document.querySelector('.chat-conversation-area');
        if (sidebar && area) {
          sidebar.style.display = 'none';
          area.style.display = 'flex';
        }
      }
    });
  },

  /**
   * Démarrer l'auto-refresh des conversations et des non-lus
   */
  startAutoRefresh() {
    // Rafraîchir les conversations toutes les 30s
    this.conversationsRefreshInterval = setInterval(() => {
      this.loadConversations();
    }, 30000);

    // Rafraîchir les non-lus toutes les 10s
    setInterval(() => {
      this.updateUnreadCount();
    }, 10000);

    // Si une conversation est ouverte, rafraîchir les messages toutes les 10s
    this.messageRefreshInterval = setInterval(() => {
      if (this.currentConvId) {
        this.loadMessages(this.currentConvId);
      }
    }, 10000);
  },

  /**
   * Arrêter l'auto-refresh
   */
  stopAutoRefresh() {
    if (this.conversationsRefreshInterval) clearInterval(this.conversationsRefreshInterval);
    if (this.messageRefreshInterval) clearInterval(this.messageRefreshInterval);
  }
};


