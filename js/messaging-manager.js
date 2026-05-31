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
  currentIsChannel: false,
  messageRefreshInterval: null,
  conversationsRefreshInterval: null,
  lastMessageCount: 0,

  showEmptyState() {
    const header = document.querySelector('.conversation-header');
    const form = document.querySelector('.conversation-form');
    const container = document.querySelector('.messages-container');

    if (header) header.style.display = 'none';
    if (form) form.style.display = 'none';

    // Gestion de l'affichage mobile
    const sidebar = document.querySelector('.chat-sidebar-list');
    const area = document.querySelector('.chat-conversation-area');
    if (sidebar && area) {
      sidebar.classList.remove('hidden');
      area.classList.remove('active-chat');
    }

    if (container) {
      // Sur mobile, ne pas afficher le message (la zone est masquée)
      if (window.innerWidth <= 768) {
        container.innerHTML = ''; // vide
      } else {
        container.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-secondary); text-align: center; padding: 20px;">
            <div>
              <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
              <p style="font-size: 16px;">Veuillez sélectionner une conversation</p>
            </div>
          </div>
        `;
      }
    }
  },

  showConversationArea() {
    const header = document.querySelector('.conversation-header');
    const form = document.querySelector('.conversation-form');
    if (header) header.style.display = '';
    if (form) form.style.display = '';
  },

  /**
   * Initialiser le gestionnaire de messagerie
   */
  async init() {
    this.currentUserId = await this.getCurrentUserId();
    if (!this.currentUserId) {
      console.error('Impossible de récupérer l\'ID utilisateur');
      return;
    }
    this.attachEventListeners();
    await this.loadConversationsAndChannels(); // ← REMPLACER loadConversations()
    this.showEmptyState();
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

    // --- NOUVEAU : Gestion de l'affichage mobile ---
    const sidebar = document.querySelector('.chat-sidebar-list');
    const area = document.querySelector('.chat-conversation-area');
    if (sidebar && area) {
      // Sur tous les écrans, on peut s'assurer que la sidebar n'a pas la classe 'hidden'
      sidebar.classList.remove('hidden');
      area.classList.add('active-chat');
      // Sur mobile, on masque la sidebar (le CSS fera le reste avec la media query)
      if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
      }
    }

    this.showConversationArea(); // Affiche header et formulaire

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
    if (convItem) convItem.remove();
  },

  async selectChannel(canalId, channelName) {
  this.currentConvId = canalId;
  this.currentIsChannel = true; // nouvelle propriété

  // Même gestion mobile que selectConversation
  const sidebar = document.querySelector('.chat-sidebar-list');
  const area = document.querySelector('.chat-conversation-area');
  if (sidebar && area) {
    sidebar.classList.remove('hidden');
    area.classList.add('active-chat');
    if (window.innerWidth <= 768) sidebar.classList.add('hidden');
  }

  this.showConversationArea();

  // Mettre à jour le header
  const header = document.querySelector('.conversation-header');
    if (header) {
      header.querySelector('.conversation-name').textContent = channelName;
      // éventuellement ajouter une icône "canal"
    }

    // Charger les messages du canal
    await this.loadChannelMessages(canalId);

    // Pas de marquage de lecture pour les canaux (optionnel)
  },

  async loadChannelMessages(canalId, limit = 50) {
    const result = await ConversationsAPI.getChannelMessages(canalId, limit);
    if (result.success) {
      this.displayMessages(result.messages, true); // paramètre isChannel = true
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
  displayMessages(messages, isChannel = false) {
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

        const forwardBtn = document.createElement('button');
        forwardBtn.className = 'message-action-btn';
        forwardBtn.title = 'Transférer';
        forwardBtn.innerHTML = '<i class="fas fa-share"></i>';
        forwardBtn.addEventListener('click', () => this.showForwardModal(msg.msg_id, msg.msg_content));
        actionsDiv.appendChild(forwardBtn);

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
      if (this.currentIsChannel) {
        const result = await ConversationsAPI.sendChannelMessage(this.currentConvId, content);
        if (!result.success) {
          showNotification('error', 'Erreur', result.message || 'Erreur lors de l\'envoi');
          return;
        }
        // Réinitialiser l'input
        const textarea = document.querySelector('.conversation-form-input');
        if (textarea) textarea.value = '';
        // Recharger les messages du canal
        await this.loadChannelMessages(this.currentConvId);
        showNotification('success', 'Succès', 'Message envoyé');
        return;
      }

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
    if (!confirm('Supprimer ce message ?')) return;
    const result = await ConversationsAPI.deleteMessage(msgId);
    if (result.success) {
        document.querySelector(`[data-msg-id="${msgId}"]`)?.remove();
        showNotification('success', 'Supprimé', 'Message supprimé');
    } else {
        showNotification('error', 'Erreur', result.message);
    }
  },

  async forwardMessage(msgId, content, targetConvId) {
    const result = await ConversationsAPI.forwardMessage(msgId, content, targetConvId);
    if (result.success) {
        showNotification('success', 'Transféré', 'Message transféré');
    } else {
        showNotification('error', 'Erreur', result.message);
    }
  },

  // Ouvrir la modale de transfert
  showForwardModal(msgId, content) {
    const modal = document.createElement('div');
    modal.className = 'forward-modal';
    modal.innerHTML = `
        <div class="forward-modal-content">
            <h3>Transférer vers</h3>
            <select id="forwardConvSelect">
                <option value="">Choisir une conversation...</option>
            </select>
            <div class="forward-actions">
                <button class="btn-secondary cancel-forward">Annuler</button>
                <button class="btn-primary confirm-forward">Transférer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Charger les conversations
    ConversationsAPI.getConversations(50, 0).then(res => {
        const select = modal.querySelector('#forwardConvSelect');
        if (res.conversations) {
            res.conversations.forEach(conv => {
                const option = document.createElement('option');
                option.value = conv.conv_id;
                option.textContent = conv.other_user_name;
                select.appendChild(option);
            });
        }
    });
    
    modal.querySelector('.confirm-forward').onclick = () => {
        const targetConvId = modal.querySelector('#forwardConvSelect').value;
        if (!targetConvId) {
            showNotification('warning', 'Attention', 'Sélectionnez une conversation');
            return;
        }
        this.forwardMessage(msgId, content, targetConvId);
        modal.remove();
    };
    modal.querySelector('.cancel-forward').onclick = () => modal.remove();
  },

  async openCreateChannelModal() {
    // Récupérer les utilisateurs (abonnés / abonnements)
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'getDiscoverUsers');
    url.searchParams.set('limit', 50);
    const response = await fetch(url.toString());
    const data = await response.json();
    if (!data.success || !data.users) {
      showNotification('error', 'Erreur', 'Impossible de charger les membres');
      return;
    }

    const modal = document.getElementById('createChannelModal');
    const closeBtn = modal.querySelector('.create-channel-close');

    closeBtn.onclick = () => {
      modal.classList.add('hidden');
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    };

    const checkboxesContainer = document.getElementById('membersCheckboxes');
    if (!modal || !checkboxesContainer) return;

    checkboxesContainer.innerHTML = '';
    data.users.forEach(user => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${user.id}"> ${user.name} (@${user.username})`;
      checkboxesContainer.appendChild(label);
    });

    const ephemeralCheck = document.getElementById('channelEphemeral');
    const ephemeralDateDiv = document.getElementById('ephemeralDate');
    ephemeralCheck.addEventListener('change', () => {
      ephemeralDateDiv.style.display = ephemeralCheck.checked ? 'block' : 'none';
    });

    const confirmBtn = document.getElementById('confirmCreateChannel');
    confirmBtn.onclick = async () => {
      const name = document.getElementById('channelName').value.trim();
      const desc = document.getElementById('channelDesc').value.trim();
      const members = Array.from(checkboxesContainer.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
      const isEphemeral = ephemeralCheck.checked;
      const expiresAt = isEphemeral ? document.getElementById('channelExpiresAt').value : null;

      if (!name || members.length < 2) {
        showNotification('warning', 'Attention', 'Nom requis et au moins 2 autres membres');
        return;
      }
      const result = await ConversationsAPI.createChannel(name, desc, members, isEphemeral, expiresAt);
      if (result.success) {
        showNotification('success', 'Canal créé', '');
        modal.classList.add('hidden');
        await this.loadChannels(); // recharger la liste
      } else {
        showNotification('error', 'Erreur', result.message);
      }
    };
    modal.classList.remove('hidden');
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

  // Après le chargement des conversations privées, charger les canaux
  async loadConversationsAndChannels() {
    await this.loadConversations(); // privées
    await this.loadChannels();      // canaux
  },

  async loadChannels() {
    const result = await ConversationsAPI.getChannels();
    if (result.success && result.channels) {
      this.displayChannels(result.channels);
    }
  },

  displayChannels(channels) {
    const conversationList = document.querySelector('.conversation-list');
    if (!conversationList) return;

    // Ajouter un séparateur ou un titre "Canaux"
    const separator = document.createElement('li');
    separator.className = 'conversation-separator';
    separator.textContent = 'Canaux';
    conversationList.appendChild(separator);

    channels.forEach(channel => {
      const li = document.createElement('li');
      li.className = `conversation-item-chat ${channel.canal_id === this.currentConvId ? 'active' : ''}`;
      li.dataset.convId = channel.canal_id;
      li.dataset.isChannel = 'true';   // marqueur pour différencier

      // Avatar de canal (icône groupe)
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'avatar';
      avatarDiv.innerHTML = '<i class="fas fa-users"></i>';

      // Info canal
      const infoDiv = document.createElement('div');
      infoDiv.className = 'conversation-info';
      infoDiv.innerHTML = `
        <div class="conversation-name">${escapeHtml(channel.canal_name)}</div>
        <div class="conversation-lastmsg">${escapeHtml(channel.last_message || 'Nouveau canal')}</div>
      `;

      // Meta (timestamp éphémère)
      const metaDiv = document.createElement('div');
      metaDiv.className = 'conversation-meta';
      if (channel.is_ephemeral && channel.expires_at) {
        metaDiv.innerHTML = `<span class="ephemeral-badge"><i class="fas fa-hourglass-half"></i> Éphémère</span>`;
      } else {
        metaDiv.innerHTML = `<span class="timestamp">${this.formatTimestamp(channel.last_message_time)}</span>`;
      }

      li.appendChild(avatarDiv);
      li.appendChild(infoDiv);
      li.appendChild(metaDiv);
      li.addEventListener('click', () => this.selectChannel(channel.canal_id, channel.canal_name));
      conversationList.appendChild(li);
    });
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
    const submitBtn = document.querySelector('.conversation-form-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const textarea = document.querySelector('.conversation-form-input');
        if (textarea) this.sendMessage(textarea.value);
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
        const sidebar = document.querySelector('.chat-sidebar-list');
        const area = document.querySelector('.chat-conversation-area');
        if (sidebar && area) {
          sidebar.classList.remove('hidden');
          area.classList.remove('active-chat');
        }
        this.showEmptyState();
        this.currentConvId = null;
      });
    }

    const newChannelBtn = document.getElementById('newChannelBtn');
    if (newChannelBtn) {
      newChannelBtn.addEventListener('click', () => this.openCreateChannelModal());
    }
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


