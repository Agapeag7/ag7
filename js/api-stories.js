/**
 * API STORIES - Gestion des stories éphémères
 * =============================================
 * Appels API pour créer, récupérer et visualiser les stories
 */

const StoriesAPI = {
  
  /**
   * Créer une nouvelle story
   * @param {string} text - Texte de la story (optionnel)
   * @param {File} imageFile - Fichier image (optionnel)
   */
  async createStory(text, imageFile) {
    try {
      const formData = new FormData();
      formData.append('action', 'createStory');
      if (text && text.trim()) {
        formData.append('story_text', text.trim());
      }
      if (imageFile) {
        formData.append('story_image', imageFile);
      }

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la création de la story');
      }

      return { success: true, story_id: data.story_id, message: data.message };
    } catch (error) {
      console.error('Erreur createStory:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Récupérer toutes les stories actives (non expirées)
   */
  async getActiveStories() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getActiveStories');

      const response = await fetch(url.toString(), {
        method: 'GET'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du chargement des stories');
      }

      return { success: true, stories: data.stories };
    } catch (error) {
      console.error('Erreur getActiveStories:', error);
      return { success: false, message: error.message, stories: [] };
    }
  },

  /**
   * Enregistrer une vue pour une story
   * @param {number} storyId - ID de la story
   */
  async viewStory(storyId) {
    try {
      const formData = new FormData();
      formData.append('action', 'addStoryView');
      formData.append('story_id', storyId);

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de l\'enregistrement de la vue');
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur viewStory:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Récupérer les stories d'un utilisateur spécifique
   * @param {number} userId - ID de l'utilisateur
   */
  async getUserStories(userId) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getUserStories');
      url.searchParams.set('user_id', userId);

      const response = await fetch(url.toString(), {
        method: 'GET'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du chargement des stories');
      }

      return { success: true, stories: data.stories };
    } catch (error) {
      console.error('Erreur getUserStories:', error);
      return { success: false, message: error.message, stories: [] };
    }
  },

  /**
   * Supprimer une story
   * @param {number} storyId - ID de la story
   */
  async deleteStory(storyId) {
    try {
      const formData = new FormData();
      formData.append('action', 'deleteStory');
      formData.append('story_id', storyId);

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Erreur deleteStory:', error);
      return { success: false, message: error.message };
    }
  }
};