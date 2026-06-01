/**
 * API CONVERSATIONS - Gestion complète des conversations et messages
 * ===================================================================
 * Appels API pour envoyer des messages, lister les conversations,
 * récupérer les messages, et gérer les notifications de lecture
 */

const ConversationsAPI = {
  
  // ===== MESSAGES =====
  
  /**
   * Envoyer un message à un utilisateur
   * @param {number} recipient_id - ID du destinataire
   * @param {string} content - Contenu du message
   * @returns {Promise<{success: boolean, msg_id?: number, conv_id?: number, message?: string}>}
   */
  async sendMessage(recipient_id, content) {
    try {
      const formData = new FormData();
      formData.append('action', 'sendMessage');
      formData.append('recipient_id', recipient_id);
      formData.append('msg_content', content);

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de l\'envoi du message');
      }

      return { 
        success: true, 
        msg_id: data.msg_id, 
        conv_id: data.conv_id,
        message: data.message 
      };
    } catch (error) {
      console.error('Erreur sendMessage:', error);
      return { success: false, message: error.message };
    }
  },

  // ===== CONVERSATIONS =====

  /**
   * Lister toutes les conversations de l'utilisateur connecté
   * @param {number} limit - Nombre de conversations à charger (défaut: 20)
   * @param {number} offset - Décalage pour pagination (défaut: 0)
   * @returns {Promise<{success: boolean, conversations?: Array, message?: string}>}
   */
  async getConversations(limit = 20, offset = 0) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getConversations');
      url.searchParams.set('limit', limit);
      url.searchParams.set('offset', offset);

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du chargement des conversations');
      }

      return { 
        success: true, 
        conversations: data.conversations || []
      };
    } catch (error) {
      console.error('Erreur getConversations:', error);
      return { success: false, message: error.message, conversations: [] };
    }
  },

  /**
   * Récupérer tous les messages d'une conversation
   * @param {number} conv_id - ID de la conversation
   * @param {number} limit - Nombre de messages à charger (défaut: 50)
   * @param {number} offset - Décalage pour pagination (défaut: 0)
   * @returns {Promise<{success: boolean, messages?: Array, conv_id?: number, message?: string}>}
   */
  async getMessages(conv_id, limit = 50, offset = 0) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getMessages');
      url.searchParams.set('conv_id', conv_id);
      url.searchParams.set('limit', limit);
      url.searchParams.set('offset', offset);

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du chargement des messages');
      }

      return { 
        success: true, 
        messages: data.messages || [],
        conv_id: data.conv_id
      };
    } catch (error) {
      console.error('Erreur getMessages:', error);
      return { success: false, message: error.message, messages: [] };
    }
  },

  // ===== NOTIFICATIONS DE LECTURE =====

  /**
   * Marquer tous les messages d'une conversation comme lus
   * @param {number} conv_id - ID de la conversation
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async markConversationRead(conv_id) {
    try {
      const formData = new FormData();
      formData.append('action', 'markConversationRead');
      formData.append('conv_id', conv_id);

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du marquage des messages comme lus');
      }

      return { success: true, message: 'Conversation marquée comme lue' };
    } catch (error) {
      console.error('Erreur markConversationRead:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Récupérer le nombre de messages non lus
   * @returns {Promise<{success: boolean, unread_count?: number, message?: string}>}
   */
  async getUnreadCount() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getUnreadCount');

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération du compteur');
      }

      return { 
        success: true, 
        unread_count: data.unread_count || 0
      };
    } catch (error) {
      console.error('Erreur getUnreadCount:', error);
      return { success: false, message: error.message, unread_count: 0 };
    }
  },

  // ===== GESTION DES MESSAGES =====

  /**
   * Supprimer un message spécifique
   * @param {number} msg_id - ID du message à supprimer
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async deleteMessage(msg_id) {
    try {
      const formData = new FormData();
      formData.append('action', 'deleteMessage');
      formData.append('msg_id', msg_id);

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression du message');
      }

      return { success: true, message: 'Message supprimé avec succès' };
    } catch (error) {
      console.error('Erreur deleteMessage:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Archiver une conversation
   * @param {number} conv_id - ID de la conversation
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async archiveConversation(conv_id) {
    try {
      const formData = new FormData();
      formData.append('action', 'archiveConversation');
      formData.append('conv_id', conv_id);

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de l\'archivage');
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Erreur archiveConversation:', error);
      return { success: false, message: error.message };
    }
  },

  async forwardMessage(msg_id, content, target_conv_id) {
    try {
        const formData = new FormData();
        formData.append('action', 'forwardMessage');
        formData.append('msg_id', msg_id);
        formData.append('target_conv_id', target_conv_id);
        formData.append('content', content);
        
        const response = await fetch(window.location.href, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Erreur lors du transfert');
        }
        return { success: true };
    } catch (error) {
        console.error('forwardMessage error:', error);
        return { success: false, message: error.message };
    }
  },

  async createChannel(name, description, members, isEphemeral, expiresAt) {
    const formData = new FormData();
    formData.append('action', 'createChannel');
    formData.append('name', name);
    formData.append('description', description);
    formData.append('members', JSON.stringify(members));
    formData.append('is_ephemeral', isEphemeral);
    if (expiresAt) formData.append('expires_at', expiresAt);
    const response = await fetch(window.location.href, { 
      method: 'POST', 
      body: formData, 
      credentials: 'include' 
    });
    return await response.json();
  },

  async getChannels() {
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'getChannels');
    const response = await fetch(url.toString());
    return await response.json();
  },
  async sendChannelMessage(canal_id, content) {
      const formData = new FormData();
      formData.append('action', 'sendChannelMessage');
      formData.append('canal_id', canal_id);
      formData.append('content', content);
      const response = await fetch(window.location.href, { 
        method: 'POST', 
        body: formData,
        credentials: 'include'
      });
      return await response.json();
  },
  async getChannelMessages(canal_id, limit = 50, offset = 0) {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getChannelMessages');
      url.searchParams.set('canal_id', canal_id);
      url.searchParams.set('limit', limit);
      url.searchParams.set('offset', offset);
      const response = await fetch(url.toString());
      return await response.json();
  },
  async deleteChannel(canal_id) {
      const formData = new FormData();
      formData.append('action', 'deleteChannel');
      formData.append('canal_id', canal_id);
      const response = await fetch(window.location.href, { 
        method: 'POST', 
        body: formData, 
        credentials: 'include' 
      });
      return await response.json();
  }
};
