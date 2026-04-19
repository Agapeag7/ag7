/**
 * API ACTUS - Gestion complète des publications
 * ========================================
 * Appels API pour créer, lire, modifier et supprimer les publications
 */

const ActusAPI = {
  
  // ===== PUBLICATIONS =====
  
  /**
   * Créer une publication
   * @param {string} content - Contenu de la publication
   * @param {string} visibility - 'public' ou 'private'
   * @param {File[]} images - Tableau de fichiers images
   */
  async createPost(content, visibility = 'public', images = []) {
    try {
      const formData = new FormData();
      formData.append('action', 'createPost');
      formData.append('post_content', content);
      formData.append('post_visibility', visibility);
      
      // Ajouter les images
      images.forEach(img => {
        formData.append('post_images[]', img);
      });

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la création');
      }

      return { success: true, post_id: data.post_id, message: data.message };
    } catch (error) {
      console.error('Erreur createPost:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Charger le feed
   * @param {number} limit - Nombre de posts à charger
   * @param {number} offset - Décalage pour pagination
   */
  async getFeed(limit = 50, offset = 0) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getFeed');
      url.searchParams.set('limit', limit);
      url.searchParams.set('offset', offset);

      const response = await fetch(url.toString(), {
        method: 'GET'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du chargement');
      }

      return { success: true, posts: data.posts };
    } catch (error) {
      console.error('Erreur getFeed:', error);
      return { success: false, message: error.message, posts: [] };
    }
  },

  /**
   * Supprimer une publication
   * @param {number} post_id - ID de la publication
   */
  async deletePost(post_id) {
    try {
      const formData = new FormData();
      formData.append('action', 'deletePost');
      formData.append('post_id', post_id);

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
      console.error('Erreur deletePost:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Récupérer les stats d'une publication
   * @param {number} post_id - ID de la publication
   */
  async getPostStats(post_id) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getPostStats');
      url.searchParams.set('post_id', post_id);

      const response = await fetch(url.toString(), {
        method: 'GET'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération');
      }

      return { success: true, stats: data.stats };
    } catch (error) {
      console.error('Erreur getPostStats:', error);
      return { success: false, message: error.message };
    }
  },

  // ===== LIKES =====

  /**
   * Toggle like sur une publication
   * @param {number} post_id - ID de la publication
   */
  async toggleLike(post_id) {
    try {
      const formData = new FormData();
      formData.append('action', 'toggleLike');
      formData.append('post_id', post_id);

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du like');
      }

      return { 
        success: true, 
        isLiked: data.isLiked, 
        likes_count: data.likes_count,
        message: data.message 
      };
    } catch (error) {
      console.error('Erreur toggleLike:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Toggle like sur un commentaire
   * @param {number} comment_id - ID du commentaire
   */
  async toggleCommentLike(comment_id) {
    try {
      const formData = new FormData();
      formData.append('action', 'toggleCommentLike');
      formData.append('comment_id', comment_id);

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du like');
      }

      return { 
        success: true, 
        isLiked: data.isLiked, 
        likes_count: data.likes_count,
        message: data.message 
      };
    } catch (error) {
      console.error('Erreur toggleCommentLike:', error);
      return { success: false, message: error.message };
    }
  },

  // ===== COMMENTAIRES =====

  /**
   * Ajouter un commentaire ou une réponse
   * @param {number} post_id - ID de la publication
   * @param {string} comment_text - Texte du commentaire
   * @param {number} comment_parent_id - ID du commentaire parent (optionnel, pour les réponses)
   * @param {boolean} comment_anonym - Commentaire anonyme
   */
  async addComment(post_id, comment_text, comment_parent_id = null, comment_anonym = false) {
    try {
      console.log('📤 addComment() - Envoi au backend:', {post_id, comment_text, comment_parent_id, comment_anonym});
      
      const formData = new FormData();
      formData.append('action', 'addComment');
      formData.append('post_id', post_id);
      formData.append('comment_text', comment_text);
      if (comment_parent_id) {
        formData.append('comment_parent_id', comment_parent_id);
      }
      if (comment_anonym) {
        formData.append('comment_anonym', 1);
      }

      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('📥 addComment() - Réponse du backend:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de l\'ajout');
      }

      return { success: true, comment: data.comment, message: data.message };
    } catch (error) {
      console.error('❌ Erreur addComment:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Récupérer tous les commentaires d'une publication
   * Retour organisé avec hiérarchie commentaire/réponses
   * @param {number} post_id - ID de la publication
   */
  async getComments(post_id) {
    try {
      console.log('📥 getComments() - Récupération (post_id:', post_id, ')');
      
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'getComments');
      url.searchParams.set('post_id', post_id);
      
      console.log('🔗 URL:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET'
      });

      const data = await response.json();
      console.log('✅ getComments() - Réponse du backend:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors du chargement');
      }

      return { success: true, comments: data.comments, total: data.total };
    } catch (error) {
      console.error('❌ Erreur getComments:', error.message);
      return { success: false, message: error.message, comments: [], total: 0 };
    }
  },

  /**
   * Supprimer un commentaire
   * @param {number} comment_id - ID du commentaire
   */
  async deleteComment(comment_id) {
    try {
      const formData = new FormData();
      formData.append('action', 'deleteComment');
      formData.append('comment_id', comment_id);

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
      console.error('Erreur deleteComment:', error);
      return { success: false, message: error.message };
    }
  }
};

// Exporter pour utilisation globale
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActusAPI;
}
