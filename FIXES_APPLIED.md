Voici les corrections précises à appliquer dans messaging-manager.js pour éliminer les appels aux fonctions supprimées (loadMessages, loadChannelMessages, loadConversations).

1. Corriger sendMessage() (lignes ~412–454)
Code actuel (à remplacer) :

javascript
// Recharger les messages du canal
await this.loadChannelMessages(this.currentConvId);

// ... plus bas :
await this.loadMessages(this.currentConvId);
Code corrigé (remplacer les deux appels) :

Pour un canal (dans le bloc if (this.currentIsChannel)) :
javascript
// Recharger les messages du canal (appel API direct)
const msgs = await ConversationsAPI.getChannelMessages(this.currentConvId, 50);
if (msgs.success) this.displayMessages(msgs.messages, true);
Pour une conversation privée (dans le bloc else) :
javascript
// Recharger les messages de la conversation (appel API direct)
const msgs = await ConversationsAPI.getMessages(this.currentConvId, 50, 0);
if (msgs.success) this.displayMessages(msgs.messages || []);
Extrait complet corrigé de sendMessage() (à copier/coller) :

javascript
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
}
2. Corriger startAutoRefresh() (lignes ~800+)
Code actuel (à remplacer) :

javascript
this.conversationsRefreshInterval = setInterval(() => {
    this.loadConversations();
}, 30000);

// ...
this.messageRefreshInterval = setInterval(() => {
  if (this.currentConvId) {
    this.loadMessages(this.currentConvId);
  }
}, 10000);
Code corrigé (remplacer les appels inexistants par des appels API directs) :

javascript
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

// Rafraîchir les messages si une conversation/canal est ouvert
this.messageRefreshInterval = setInterval(async () => {
  if (this.currentConvId) {
    if (this.currentIsChannel) {
      const msgs = await ConversationsAPI.getChannelMessages(this.currentConvId, 50);
      if (msgs.success) this.displayMessages(msgs.messages, true);
    } else {
      const msgs = await ConversationsAPI.getMessages(this.currentConvId, 50, 0);
      if (msgs.success) this.displayMessages(msgs.messages || []);
    }
  }
}, 10000);
Remarque : Il n’y a plus besoin de loadConversations(). Vous pouvez supprimer la méthode loadConversations() si elle existe encore (elle a été commentée ou supprimée précédemment). Vérifiez qu’il n’y a pas d’appel résiduel.

3. Supprimer définitivement les anciennes méthodes (si pas déjà fait)
Assurez-vous que les fonctions suivantes n’apparaissent plus dans le fichier (elles sont commentées ou supprimées) :

loadConversations()

loadMessages()

loadChannelMessages()

loadChannels()

selectConversation() (commenté)

selectChannel() (commenté)

Résumé des modifications
Fichier	Lignes concernées	Action
messaging-manager.js	sendMessage() (412–454)	Remplacer loadChannelMessages et loadMessages par appels API directs
messaging-manager.js	startAutoRefresh() (800+)	Remplacer loadConversations() et loadMessages() par appels API directs