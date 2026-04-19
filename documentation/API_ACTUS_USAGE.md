/**
 * GUIDE RAPIDE - API ACTUS
 * ========================================
 * Utilisation des endpoints depuis le frontend
 */

// ===== EXEMPLES D'UTILISATION =====

// 1. CHARGER LE FEED
// ────────────────────────
await ActusAPI.getFeed(50, 0);
// Retour: { success: true, posts: [...] }

// 2. CRÉER UNE PUBLICATION
// ────────────────────────
// Avec texte seul
await ActusAPI.createPost("Bonjour le monde!");

// Avec images
const files = document.getElementById('fileInput').files;
await ActusAPI.createPost("Mes vacances", 'public', Array.from(files));

// 3. LIKE SUR UNE PUBLICATION
// ────────────────────────
const result = await ActusAPI.toggleLike(123);
// result.isLiked: boolean (l'utilisateur a liké ou pas après l'action)
// result.likes_count: nombre total de likes

// 4. AJOUTER UN COMMENTAIRE
// ────────────────────────
// Commentaire principal
await ActusAPI.addComment(123, "Super post!");

// Répondre à un commentaire
await ActusAPI.addComment(123, "C'est vrai!", 456); // 456 = ID du commentaire

// Anonyme
await ActusAPI.addComment(123, "Commentaire secret", null, true);

// 5. RÉCUPÉRER LES COMMENTAIRES
// ────────────────────────
const result = await ActusAPI.getComments(123);
// Retour structure avec hiérarchie:
// {
//   comments: [
//     {
//       id, text, author, avatar, likes,
//       replies: [{ id, text, author, ... }]
//     }
//   ],
//   total: 5
// }

// 6. LIKE SUR COMMENTAIRE
// ────────────────────────
await ActusAPI.toggleCommentLike(456);

// 7. SUPPRIMER PUBLICATION
// ────────────────────────
await ActusAPI.deletePost(123);

// 8. SUPPRIMER COMMENTAIRE
// ────────────────────────
await ActusAPI.deleteComment(456);

// 9. STATS PUBLICATION
// ────────────────────────
const stats = await ActusAPI.getPostStats(123);
// stats: { post_id, likes, comments, views, created_at, author, author_id }

// ===== INTÉGRATION FRONTEND =====

// CHARGER LE FEED AVEC RENDU
loadActusFeed();
// Charge et affiche le feed dans #feedContainer

// CRÉER UN POST AVEC FICHIERS
const content = document.getElementById('postContent').value;
const files = document.getElementById('postImages').files;
await createActusPost(content, Array.from(files));

// ===== GESTION DES ERREURS =====

// Tous les appels retournent:
// { success: boolean, message?: string, ...data }

const result = await ActusAPI.createPost("Test");
if (!result.success) {
  console.error("Erreur:", result.message);
  // Erreurs possibles:
  // - "Non authentifié"
  // - "Post ID manquant"
  // - "Vous ne pouvez pas supprimer cette publication"
  // - "Publication non trouvée"
}

// ===== NOTIFICATIONS =====

// Le système affiche automatiquement les notifications:
showNotification('success', 'Titre', 'Message');
showNotification('error', 'Erreur', 'Description');
showNotification('warning', 'Attention', 'Message');
showNotification('info', 'Info', 'Message');

// ===== STRUCTURE DES DONNÉES =====

// POST (depuis getFeed)
{
  id: 123,
  author: "Jean",
  username: "@jeandupont",
  avatar: "imgApp/photo.jpg",
  content: "Texte du post",
  images: ["pub/img1.jpg", "pub/img2.jpg"],
  likes: 42,
  comments: 15,
  userHasLiked: true,
  timestamp: "2024-01-15 14:30:00",
  visibility: "public",
  user_id: 5
}

// COMMENTAIRE (depuis getComments)
{
  id: 456,
  text: "Super!",
  author: "Marie",
  username: "@mariesmith",
  avatar: "imgApp/marie.jpg",
  isAnonymous: false,
  likes: 3,
  timestamp: "2024-01-15 14:35:00",
  user_id: 8,
  parent_id: null,
  replies: [
    {
      id: 789,
      text: "Je suis d'accord!",
      author: "Paul",
      isAnonymous: false,
      likes: 1,
      parent_id: 456
    }
  ]
}

// ===== POINTS IMPORTANTS =====

/**
 * ⚠️ AUTHENTIFICATION
 * Tous les appels POST (create, delete, like) requièrent une session active
 * Les appels GET (getFeed, getComments, getStats) sont publics
 */

/**
 * 🖼️ IMAGES
 * - Format: File[] ou FileList
 * - Limite: Définie par PHP (upload_max_filesize)
 * - Upload: Automatique lors de createPost
 * - Suppression: Cascade lors du deletePost
 */

/**
 * 💬 COMMENTAIRES
 * - Texte: Max 500 caractères (coupé auto coté backend)
 * - Réponses: Chat thread via comment_parent_id
 * - Anonyme: Auteur non révélé au frontend
 * - Hiérarchie: Commentaires -> Réponses (2 niveaux max)
 */

/**
 * ❤️ LIKES
 * - Toggle: Ajouter ET retirer avec le même endpoint
 * - Compteurs: Automatiquement incrémentés/décrémentés
 * - Publications ET commentaires: Supportés
 */

/**
 * 🗑️ SUPPRESSION
 * - Cascade: Images, likes, commentaires, réponses
 * - Permissions: Uniquement par l'auteur (401 sinon)
 * - Irréversible: Pas de récupération possible
 */
