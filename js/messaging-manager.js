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
        console.warn('MessagingManager: utilisateur non connecté, initialisation reportée');
        return;
    }
    this.attachEventListeners();
    await this.loadConversationsAndChannels();
    this.showEmptyState();
    this.startAutoRefresh();
    this.updateUnreadCount();
  },

  async selectConversationOrChannel(id, name, type = 'conversation', userId = null) {
    this.currentConvId = id;
    this.currentIsChannel = (type === 'channel');

    // Gestion mobile (identique)
    const sidebar = document.querySelector('.chat-sidebar-list');
    const area = document.querySelector('.chat-conversation-area');
    if (sidebar && area) {
      sidebar.classList.remove('hidden');
      area.classList.add('active-chat');
      if (window.innerWidth <= 768) sidebar.classList.add('hidden');
    }
    this.showConversationArea();

    // Mise à jour du header
    const header = document.querySelector('.conversation-header');
    if (header) {
      header.querySelector('.conversation-name').textContent = name;
    }

    if (type === 'channel') {
      // Charger les messages du canal
      const msgs = await ConversationsAPI.getChannelMessages(id, 50);
      if (msgs.success) this.displayMessages(msgs.messages, true);
      
      let deleteBtn = header?.querySelector('.channel-delete-btn');
      if (!deleteBtn) {
        deleteBtn = document.createElement('button');
        deleteBtn.className = 'channel-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.color = 'var(--text-secondary)';
        deleteBtn.style.fontSize = '1.2rem';
        deleteBtn.style.marginLeft = 'auto';
        deleteBtn.title = 'Supprimer le canal';
        header?.appendChild(deleteBtn);
      }
      deleteBtn.onclick = async () => {
        showConfirmation(
          'Supprimer le canal',
          `Êtes-vous sûr de vouloir supprimer le canal "${name}" ? Cette action est irréversible.`,
          async () => {
            const result = await ConversationsAPI.deleteChannel(id);
            if (result.success) {
              showNotification('success', 'Canal supprimé', '');
              await this.loadConversationsAndChannels(); // recharger la liste
              this.showEmptyState(); // retourner à l'état vide
              this.currentConvId = null;
            } else {
              showNotification('error', 'Erreur', result.message);
            }
          }
        );
      };
    } else {
      // Conversation privée
      const msgs = await ConversationsAPI.getMessages(id, 50, 0);
      if (msgs.success) this.displayMessages(msgs.messages || []);
      await ConversationsAPI.markConversationRead(id);
      // Supprimer le badge non-lu
      const convItem = document.querySelector(`[data-conv-id="${id}"] .unread-badge`);
      if (convItem) convItem.remove();
    }

    // Mettre à jour l'état actif dans la liste
    document.querySelectorAll('.conversation-item-chat').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-conv-id="${id}"]`)?.classList.add('active');
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
  
  displayConversationList(items, type = 'conversation') {
    const conversationList = document.querySelector('.conversation-list');
    if (!conversationList) return;

    conversationList.innerHTML = '';

    if (items.length === 0) {
      conversationList.innerHTML = '<li style="padding: 20px; text-align: center; color: var(--text-secondary);">Aucune conversation</li>';
      return;
    }

    // Ajouter un séparateur pour les canaux
    if (type === 'channel') {
      const separator = document.createElement('li');
      separator.className = 'conversation-separator';
      separator.textContent = 'Canaux';
      conversationList.appendChild(separator);
    }

    items.forEach(item => {
      const li = document.createElement('li');
      li.className = `conversation-item-chat ${(type === 'channel' ? item.canal_id : item.conv_id) === this.currentConvId ? 'active' : ''}`;
      li.dataset.convId = type === 'channel' ? item.canal_id : item.conv_id;

      // Avatar
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'avatar';
      if (type === 'channel') {
        avatarDiv.innerHTML = '<i class="fas fa-users"></i>';
      } else {
        const otherUser = item;
        if (otherUser.other_user_photo) {
          const img = document.createElement('img');
          img.src = otherUser.other_user_photo;
          img.alt = otherUser.other_user_name;
          img.loading = 'lazy';
          avatarDiv.appendChild(img);
        } else {
          const initials = (otherUser.other_user_name || 'U')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          avatarDiv.textContent = initials;
        }
      }
      li.appendChild(avatarDiv);

      // Infos (nom, dernier message)
      const infoDiv = document.createElement('div');
      infoDiv.className = 'conversation-info';
      const nameDiv = document.createElement('div');
      nameDiv.className = 'conversation-name';
      nameDiv.textContent = type === 'channel' ? item.canal_name : (item.other_user_name || 'Sans nom');
      const lastMsgDiv = document.createElement('div');
      lastMsgDiv.className = 'conversation-lastmsg';
      lastMsgDiv.textContent = item.last_message ? item.last_message.substring(0, 50) : 'Aucun message';
      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(lastMsgDiv);
      li.appendChild(infoDiv);

      // Meta (timestamp, badge éphémère ou non-lus)
      const metaDiv = document.createElement('div');
      metaDiv.className = 'conversation-meta';
      if (type === 'channel') {
        if (item.is_ephemeral && item.expires_at) {
          metaDiv.innerHTML = `<span class="ephemeral-badge"><i class="fas fa-hourglass-half"></i> Éphémère</span>`;
        } else {
          const timestampDiv = document.createElement('div');
          timestampDiv.className = 'timestamp';
          timestampDiv.textContent = this.formatTimestamp(item.last_message_time);
          metaDiv.appendChild(timestampDiv);
        }
      } else {
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        timestampDiv.textContent = this.formatTimestamp(item.last_message_time);
        metaDiv.appendChild(timestampDiv);
        if (item.unread_count > 0) {
          const badge = document.createElement('span');
          badge.className = 'unread-badge';
          badge.textContent = item.unread_count;
          metaDiv.appendChild(badge);
        }
      }
      li.appendChild(metaDiv);

      // Événement click
      li.addEventListener('click', () => {
        if (type === 'channel') {
          this.selectConversationOrChannel(item.canal_id, item.canal_name, 'channel');
        } else {
          this.selectConversationOrChannel(item.conv_id, item.other_user_name, 'conversation', item.other_user_id);
        }
      });
      conversationList.appendChild(li);
    });
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
        // Recharger les messages du canal (appel API direct)
        const msgs = await ConversationsAPI.getChannelMessages(this.currentConvId, 50);
        if (msgs.success) this.displayMessages(msgs.messages, true);
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

      // Recharger les messages de la conversation (appel API direct)
      const msgs = await ConversationsAPI.getMessages(this.currentConvId, 50, 0);
      if (msgs.success) this.displayMessages(msgs.messages || []);
      
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
    // Récupérer VOS CONTACTS d'abord (gens que vous suivez OU qui vous suivent)
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'getMyContacts');
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (!data.success || !data.contacts) {
      showNotification('error', 'Erreur', 'Impossible de charger vos contacts');
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
    
    // Afficher les contacts en priorité
    let contactsHTML = '<div style="font-size: 12px; color: var(--text-secondary); font-weight: 500; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid var(--hover-bg);">VOS CONTACTS</div>';
    
    data.contacts.forEach(user => {
      const relationshipLabel = user.type === 'follower' 
        ? 'Vous suit' 
        : 'Vous suivez';
      contactsHTML += `
        <label style="display: flex; align-items: center; padding: 8px; margin: 4px 0; border-radius: 6px; cursor: pointer; transition: background 0.2s;">
          <input type="checkbox" value="${user.id}" style="margin-right: 10px; cursor: pointer;"> 
          <span style="flex: 1;">
            <strong>${user.name}</strong> <small>(@${user.username.substring(1)})</small>
            <br/>
            <small style="color: var(--text-secondary);">${relationshipLabel}</small>
          </span>
        </label>
      `;
    });
    
    checkboxesContainer.innerHTML = contactsHTML;
    
    // Ajouter un bouton pour découvrir d'autres utilisateurs
    const discoverSection = document.createElement('div');
    discoverSection.style.marginTop = '16px';
    discoverSection.style.paddingTop = '12px';
    discoverSection.style.borderTop = '1px solid var(--hover-bg)';
    discoverSection.innerHTML = `
      <button id="toggleDiscoverUsers" style="width: 100%; padding: 8px; background: var(--hover-bg); border: none; border-radius: 6px; cursor: pointer; color: var(--text-primary); font-size: 13px;">
        Découvrir d'autres utilisateurs
      </button>
      <div id="discoverUsersSection" style="display: none; margin-top: 12px; max-height: 300px; overflow-y: auto; border: 1px solid var(--hover-bg); border-radius: 6px; padding: 8px;"></div>
    `;
    checkboxesContainer.appendChild(discoverSection);
    
    // Gérer le toggle découverte
    const toggleBtn = document.getElementById('toggleDiscoverUsers');
    const discoverSection2 = document.getElementById('discoverUsersSection');
    let discoverLoaded = false;
    
    toggleBtn.onclick = async () => {
      if (!discoverLoaded) {
        // Charger les utilisateurs pour découverte
        const discoverUrl = new URL(window.location.href);
        discoverUrl.searchParams.set('action', 'getDiscoverUsers');
        discoverUrl.searchParams.set('limit', 50);
        const discoverRes = await fetch(discoverUrl.toString());
        const discoverData = await discoverRes.json();
        
        if (discoverData.success && discoverData.users) {
          let discoverHTML = '';
          discoverData.users.forEach(user => {
            discoverHTML += `
              <label style="display: flex; align-items: center; padding: 8px; margin: 4px 0; border-radius: 6px; cursor: pointer;">
                <input type="checkbox" value="${user.id}" style="margin-right: 10px; cursor: pointer;"> 
                <span style="flex: 1;">
                  <strong>${user.name}</strong> <small>(@${user.username.substring(1)})</small>
                </span>
              </label>
            `;
          });
          discoverSection2.innerHTML = discoverHTML || '<p style="text-align: center; color: var(--text-secondary);">Aucun utilisateur trouvé</p>';
          discoverLoaded = true;
        }
      }
      
      const isVisible = discoverSection2.style.display !== 'none';
      discoverSection2.style.display = isVisible ? 'none' : 'block';
      toggleBtn.textContent = isVisible 
        ? 'Découvrir d\'autres utilisateurs' 
        : 'Masquer la découverte';
    };

    const ephemeralCheck = document.getElementById('channelEphemeral');
    const ephemeralDateDiv = document.getElementById('ephemeralDate');
    ephemeralCheck.addEventListener('change', () => {
      ephemeralDateDiv.style.display = ephemeralCheck.checked ? 'block' : 'none';
    });

    const confirmBtn = document.getElementById('confirmCreateChannel');
    confirmBtn.onclick = async () => {
      const name = document.getElementById('channelName').value.trim();
      const desc = document.getElementById('channelDesc').value.trim();
      
      // Récupérer les checkbox sélectionnées PARTOUT (contacts + découverte)
      const members = Array.from(checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
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
    // 1. Charger les conversations privées
    const convResult = await ConversationsAPI.getConversations(50, 0);
    if (convResult.success) {
      this.displayConversationList(convResult.conversations || [], 'conversation');
    } else {
      showNotification('error', 'Erreur', convResult.message);
    }

    // 2. Charger les canaux
    const channelsResult = await ConversationsAPI.getChannels();
    if (channelsResult.success && channelsResult.channels) {
      this.displayConversationList(channelsResult.channels, 'channel');
    } else if (!channelsResult.success) {
      showNotification('error', 'Erreur', channelsResult.message);
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
    if (!this.currentUserId) return;

    this.conversationsRefreshInterval = setInterval(async () => {
      // Recharger les conversations (appel API direct + affichage)
      const convResult = await ConversationsAPI.getConversations(50, 0);
      if (convResult.success) {
        this.displayConversationList(convResult.conversations || [], 'conversation');
      }
      // Recharger les canaux
      const channelsResult = await ConversationsAPI.getChannels();
      if (channelsResult.success && channelsResult.channels) {
        this.displayConversationList(channelsResult.channels, 'channel');
      }
    }, 30000);

    setInterval(() => {
      this.updateUnreadCount();
    }, 10000);

    // Rafraîchir les messages si une conversation/canal est ouvert
    this.messageRefreshInterval = setInterval(async () => {
      if (this.currentConvId) {
        if (this.currentIsChannel) {
          // Recharger les messages du canal
          const msgs = await ConversationsAPI.getChannelMessages(this.currentConvId, 50);
          if (msgs.success) this.displayMessages(msgs.messages, true);
        } else {
          // Recharger les messages de la conversation
          const msgs = await ConversationsAPI.getMessages(this.currentConvId, 50, 0);
          if (msgs.success) this.displayMessages(msgs.messages || []);
        }
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


