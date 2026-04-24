<?php

/**
 * AG7 - Core Backend Library
 * ============================
 * PDO connection to `ag7_db`
 * Models: UtilisateurModel, PublicationModel, CommentaireModel, StoryModel, 
 *         NotificationModel, ConversationModel, MessageModel, AbonnementModel, LikeModel
 * Simple AJAX router (JSON responses) for frontend calls
 * 
 * Usage: include 'ag.class.php' in endpoint scripts and call AG7\Router::handle()
 */

// Session is already started by index.php - verify it's active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

class Database {
    private $pdo;
    
    public function __construct() {
        $this->connect();
    }
    
    public function connect() {
        $host = '127.0.0.1';
        $db   = 'ag7_db';
        $user = 'root';
        $pass = '';
        $charset = 'utf8mb4';
        
        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $options = [
            \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        try {
            $this->pdo = new \PDO($dsn, $user, $pass, $options);
        } catch (\PDOException $e) {
            die('Erreur de connexion à la base de données: ' . $e->getMessage());
        }
    }
    
    public function pdo() {
        return $this->pdo;
    }
}

class Utils {
    public static function jsonResponse($data, $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        session_write_close(); // Sauvegarder la session avant exit
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT);
    }
    
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    public static function uploadProfilePhoto($file) {
        // Accepter l'extension comme fallback si MIME échoue (pattern KelFoncia)
        $allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($ext, $allowedExt)) {
            error_log("Upload échoué: Extension .{$ext} non autorisée");
            return false;
        }
        
        // Vérifier le type MIME mais être flexible
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        $fileMime = $file['type'] ?? '';
        if (!empty($fileMime) && !in_array($fileMime, $allowedMimes)) {
            error_log("Warning: MIME type {$fileMime} non standard, mais extension .{$ext} acceptée");
        }
        
        // Vérifier les erreurs d'upload
        if ($file['error'] !== UPLOAD_ERR_OK) {
            error_log("Upload erreur code: {$file['error']}");
            return false;
        }
        
        // Vérifier que c'est un fichier uploadé
        if (!is_uploaded_file($file['tmp_name'])) {
            error_log("Fichier n'est pas un fichier uploadé valide");
            return false;
        }
        
        // Créer le dossier s'il n'existe pas
        $uploadDir = __DIR__ . '/imgApp';
        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0777, true)) {
                error_log("Impossible de créer dossier imgApp");
                return false;
            }
        }
        
        // Vérifier permissions d'écriture
        if (!is_writable($uploadDir)) {
            chmod($uploadDir, 0777);
            if (!is_writable($uploadDir)) {
                error_log("Dossier imgApp n'est pas writable. Perms: " . decoct(fileperms($uploadDir)));
                return false;
            }
        }
        
        // Générer nom unique TEMPORAIRE
        $tempName = 'profile_' . time() . '_' . uniqid() . '.' . $ext;
        $uploadPath = $uploadDir . '/' . $tempName;
        
        // Sauvegarder le fichier
        if (@move_uploaded_file($file['tmp_name'], $uploadPath)) {
            error_log("Photo uploadée: $tempName");
            return $tempName; // Retourner juste le nom du fichier
        }
        
        error_log("move_uploaded_file échoué: tmp=" . $file['tmp_name'] . ", dest=" . $uploadPath);
        return false;
    }
    
    public static function uploadPostImage($tmpName, $fileName) {
        // Accepter l'extension comme fallback si MIME échoue
        $allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        if (!in_array($ext, $allowedExt)) {
            error_log("Upload image échouée: Extension .{$ext} non autorisée");
            return false;
        }
        
        // Créer le dossier pub/ s'il n'existe pas
        $uploadDir = __DIR__ . '/pub';
        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0777, true)) {
                error_log("Impossible de créer dossier pub");
                return false;
            }
        }
        
        // Vérifier permissions d'écriture
        if (!is_writable($uploadDir)) {
            chmod($uploadDir, 0777);
            if (!is_writable($uploadDir)) {
                error_log("Dossier pub n'est pas writable");
                return false;
            }
        }
        
        // Générer nom unique - prefix "post_" pour les images de publications
        $imageName = 'post_' . time() . '_' . uniqid() . '.' . $ext;
        $uploadPath = $uploadDir . '/' . $imageName;
        
        // Sauvegarder le fichier
        if (@move_uploaded_file($tmpName, $uploadPath)) {
            error_log("Image de post uploadée: $imageName");
            return $imageName; // Retourner juste le nom du fichier
        }
        
        error_log("move_uploaded_file échoué pour image de post: tmp=" . $tmpName . ", dest=" . $uploadPath);
        return false;
    }

    public static function uploadStoryImage($tmpName, $fileName) {
        $allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        if (!in_array($ext, $allowedExt)) {
            error_log("Upload story échoué: Extension .{$ext} non autorisée");
            return false;
        }
        
        $uploadDir = __DIR__ . '/story';
        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0777, true)) {
                error_log("Impossible de créer dossier story");
                return false;
            }
        }
        
        if (!is_writable($uploadDir)) {
            chmod($uploadDir, 0777);
            if (!is_writable($uploadDir)) {
                error_log("Dossier story n'est pas writable");
                return false;
            }
        }
        
        $imageName = 'story_' . time() . '_' . uniqid() . '.' . $ext;
        $uploadPath = $uploadDir . '/' . $imageName;
        
        if (@move_uploaded_file($tmpName, $uploadPath)) {
            error_log("Story uploadée: $imageName");
            return $imageName;
        }
        
        error_log("move_uploaded_file échoué pour story: tmp=" . $tmpName . ", dest=" . $uploadPath);
        return false;
    }
}

abstract class BaseModel {
    protected $pdo;
    
    public function __construct($pdo = null) {
        $this->pdo = $pdo ?? (new Database())->pdo();
    }
}

/* ================== UTILISATEUR MODEL ================== */
class UtilisateurModel extends BaseModel {
    
    public function create(array $data) {
        $sql = 'INSERT INTO utilisateurs (user_name, user_username, user_password, user_bio, user_location, user_photo_url, user_member_date, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['user_name'],
            $data['user_username'],
            Utils::hashPassword($data['user_password']),
            $data['user_bio'] ?? null,
            $data['user_location'] ?? null,
            $data['user_photo_url'] ?? null
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function findById($id) {
        $stmt = $this->pdo->prepare('SELECT * FROM utilisateurs WHERE user_id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function findByUsername($username) {
        $stmt = $this->pdo->prepare('SELECT * FROM utilisateurs WHERE user_username = ? LIMIT 1');
        $stmt->execute([$username]);
        return $stmt->fetch();
    }
    
    public function findByUsernameOrName($input) {
        // Chercher par pseudo OU par nom
        $stmt = $this->pdo->prepare('SELECT * FROM utilisateurs WHERE user_username = ? OR user_name = ? LIMIT 1');
        $stmt->execute([$input, $input]);
        return $stmt->fetch();
    }
    
    public function verifyCredentials($username, $password) {
        // Chercher l'utilisateur par pseudo OU par nom
        $user = $this->findByUsernameOrName($username);
        if (!$user) return false;
        if (Utils::verifyPassword($password, $user['user_password'])) return $user;
        return false;
    }
    
    public function update($id, array $data) {
        $fields = [];
        $params = [];
        $allowed = ['user_name', 'user_bio', 'user_location', 'user_photo_url', 'user_cover_photo_url'];
        
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) return false;
        
        $fields[] = 'updated_at = NOW()';
        $params[] = $id;
        $sql = 'UPDATE utilisateurs SET ' . implode(', ', $fields) . ' WHERE user_id = ?';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
    
    public function getProfile($id) {
        $sql = 'SELECT user_id, user_name, user_username, user_bio, user_location, user_photo_url, user_cover_photo_url, user_posts_count, user_member_date, created_at 
                FROM utilisateurs WHERE user_id = ? LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function getAllUsers($limit = 50, $offset = 0) {
        $sql = 'SELECT user_id, user_name, user_username, user_bio, user_photo_url, user_posts_count 
                FROM utilisateurs ORDER BY created_at DESC LIMIT ? OFFSET ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([(int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }
    
    public function searchUsers($query, $limit = 20) {
        $searchTerm = '%' . $query . '%';
        $sql = 'SELECT user_id, user_name, user_username, user_photo_url FROM utilisateurs 
                WHERE user_name LIKE ? OR user_username LIKE ? LIMIT ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$searchTerm, $searchTerm, (int)$limit]);
        return $stmt->fetchAll();
    }
}

/* ================== PUBLICATION MODEL ================== */
class PublicationModel extends BaseModel {
    
    public function create(array $data) {
        $sql = 'INSERT INTO publications (post_user_id, post_content, post_created_at, post_visibility, updated_at) 
                VALUES (?, ?, NOW(), ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['post_user_id'],
            $data['post_content'],
            $data['post_visibility'] ?? 'public'
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function getById($id) {
        $sql = 'SELECT p.*, u.user_name, u.user_username, u.user_photo_url 
                FROM publications p 
                JOIN utilisateurs u ON p.post_user_id = u.user_id 
                WHERE p.post_id = ? LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function update($id, array $data) {
        $fields = [];
        $params = [];
        $allowed = ['post_content', 'post_visibility'];
        
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) return false;
        
        $fields[] = 'updated_at = NOW()';
        $params[] = $id;
        $sql = 'UPDATE publications SET ' . implode(', ', $fields) . ' WHERE post_id = ?';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare('DELETE FROM publications WHERE post_id = ?');
        return $stmt->execute([$id]);
    }
    
    public function getByUserId($user_id, $limit = 50, $offset = 0) {
        $sql = 'SELECT p.*, u.user_name, u.user_username, u.user_photo_url 
                FROM publications p 
                JOIN utilisateurs u ON p.post_user_id = u.user_id 
                WHERE p.post_user_id = ? AND p.post_visibility = "public"
                ORDER BY p.post_created_at DESC LIMIT ? OFFSET ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, (int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }
    
    public function getCountByUser($user_id) {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as count FROM publications WHERE post_user_id = ? AND post_visibility = "public"');
        $stmt->execute([$user_id]);
        $result = $stmt->fetch();
        return $result['count'] ?? 0;
    }
    
    public function getFeed($user_id = null, $limit = 50, $offset = 0) {
        $sql = 'SELECT p.*, u.user_name, u.user_username, u.user_photo_url 
                FROM publications p 
                JOIN utilisateurs u ON p.post_user_id = u.user_id 
                WHERE p.post_visibility = "public"';
        
        if ($user_id) {
            $sql .= ' OR (p.post_visibility = "followers" AND EXISTS (
                SELECT 1 FROM abonnements WHERE follower_id = ? AND followed_id = u.user_id
            ))';
        }
        
        $sql .= ' ORDER BY p.post_created_at DESC LIMIT ? OFFSET ?';
        
        $params = [];
        if ($user_id) {
            $params[] = $user_id;
        }
        $params[] = (int)$limit;
        $params[] = (int)$offset;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    public function incrementLikes($post_id) {
        $stmt = $this->pdo->prepare('UPDATE publications SET post_likes_count = post_likes_count + 1 WHERE post_id = ?');
        return $stmt->execute([$post_id]);
    }
    
    public function decrementLikes($post_id) {
        $stmt = $this->pdo->prepare('UPDATE publications SET post_likes_count = post_likes_count - 1 WHERE post_id = ?');
        return $stmt->execute([$post_id]);
    }
    
    public function incrementComments($post_id) {
        $stmt = $this->pdo->prepare('UPDATE publications SET post_comments = post_comments + 1 WHERE post_id = ?');
        return $stmt->execute([$post_id]);
    }
    
    public function decrementComments($post_id) {
        $stmt = $this->pdo->prepare('UPDATE publications SET post_comments = post_comments - 1 WHERE post_id = ?');
        return $stmt->execute([$post_id]);
    }
}

/* ================== IMAGE PUBLICATION MODEL ================== */
class ImagePublicationModel extends BaseModel {
    
    public function create(array $data) {
        $sql = 'INSERT INTO images_publications (image_post_id, image_url, image_mime_type, image_order, image_width, image_height, image_size, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['image_post_id'],
            $data['image_url'],
            $data['image_mime_type'],
            $data['image_order'],
            $data['image_width'] ?? null,
            $data['image_height'] ?? null,
            $data['image_size'] ?? null
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function getByPostId($post_id) {
        $sql = 'SELECT * FROM images_publications WHERE image_post_id = ? ORDER BY image_order ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$post_id]);
        return $stmt->fetchAll();
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare('DELETE FROM images_publications WHERE image_id = ?');
        return $stmt->execute([$id]);
    }
}

/* ================== COMMENTAIRE MODEL ================== */
class CommentaireModel extends BaseModel {
    
    public function create(array $data) {
        $sql = 'INSERT INTO commentaires (comment_post_id, comment_user_id, comment_text, comment_anonym, comment_parent_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['comment_post_id'],
            $data['comment_user_id'],
            $data['comment_text'],
            $data['comment_anonym'] ?? false,
            $data['comment_parent_id'] ?? null
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function getById($id) {
        $sql = 'SELECT c.*, u.user_name, u.user_username, u.user_photo_url 
                FROM commentaires c 
                JOIN utilisateurs u ON c.comment_user_id = u.user_id 
                WHERE c.comment_id = ? LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function getByPostId($post_id, $limit = 50, $offset = 0) {
        // Récupère TOUS les commentaires (principaux ET réponses) pour un post
        // actionGetComments() les organisera par hiérarchie
        $sql = 'SELECT c.*, u.user_name, u.user_username, u.user_photo_url 
                FROM commentaires c 
                JOIN utilisateurs u ON c.comment_user_id = u.user_id 
                WHERE c.comment_post_id = ?
                ORDER BY c.comment_parent_id, c.created_at DESC LIMIT ? OFFSET ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$post_id, (int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }
    
    public function getReplies($parent_id, $limit = 20) {
        $sql = 'SELECT c.*, u.user_name, u.user_username, u.user_photo_url 
                FROM commentaires c 
                JOIN utilisateurs u ON c.comment_user_id = u.user_id 
                WHERE c.comment_parent_id = ? 
                ORDER BY c.created_at ASC LIMIT ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$parent_id, (int)$limit]);
        return $stmt->fetchAll();
    }
    
    public function update($id, array $data) {
        $fields = [];
        $params = [];
        $allowed = ['comment_text'];
        
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) return false;
        
        $fields[] = 'updated_at = NOW()';
        $params[] = $id;
        $sql = 'UPDATE commentaires SET ' . implode(', ', $fields) . ' WHERE comment_id = ?';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare('DELETE FROM commentaires WHERE comment_id = ?');
        return $stmt->execute([$id]);
    }
    
    public function incrementLikes($comment_id) {
        $stmt = $this->pdo->prepare('UPDATE commentaires SET comment_likes = comment_likes + 1 WHERE comment_id = ?');
        return $stmt->execute([$comment_id]);
    }
    
    public function decrementLikes($comment_id) {
        $stmt = $this->pdo->prepare('UPDATE commentaires SET comment_likes = comment_likes - 1 WHERE comment_id = ?');
        return $stmt->execute([$comment_id]);
    }
}

/* ================== STORY MODEL ================== */
class StoryModel extends BaseModel {
    
    public function create(array $data) {
        $duration = $data['story_duration'] ?? 24;
        $expires_at = date('Y-m-d H:i:s', strtotime("+$duration hours"));
        
        $sql = 'INSERT INTO stories (story_user_id, story_type, story_text, story_image_url, story_created_at, story_duration, story_expires_at) 
                VALUES (?, ?, ?, ?, NOW(), ?, ?)';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['story_user_id'],
            $data['story_type'],
            $data['story_text'] ?? null,
            $data['story_image_url'] ?? null,
            $duration,
            $expires_at
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function getById($id) {
        $sql = 'SELECT s.*, u.user_name, u.user_username, u.user_photo_url 
                FROM stories s 
                JOIN utilisateurs u ON s.story_user_id = u.user_id 
                WHERE s.story_id = ? AND s.story_expires_at > NOW() LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function getByUserId($user_id) {
        $sql = 'SELECT s.*, u.user_name, u.user_username, u.user_photo_url 
                FROM stories s 
                JOIN utilisateurs u ON s.story_user_id = u.user_id 
                WHERE s.story_user_id = ? AND s.story_expires_at > NOW()
                ORDER BY s.story_created_at DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id]);
        return $stmt->fetchAll();
    }
    
    public function getActiveStories($limit = 20) {
        $sql = 'SELECT DISTINCT s.*, u.user_name, u.user_username, u.user_photo_url 
                FROM stories s 
                JOIN utilisateurs u ON s.story_user_id = u.user_id 
                WHERE s.story_expires_at > NOW()
                ORDER BY s.story_created_at DESC LIMIT ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([(int)$limit]);
        return $stmt->fetchAll();
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare('DELETE FROM stories WHERE story_id = ?');
        return $stmt->execute([$id]);
    }
    
    public function incrementViewers($story_id) {
        $stmt = $this->pdo->prepare('UPDATE stories SET story_viewers = story_viewers + 1 WHERE story_id = ?');
        return $stmt->execute([$story_id]);
    }
}

/* ================== NOTIFICATION MODEL ================== */
class NotificationModel extends BaseModel {
    
    public function create(array $data) {
        $sql = 'INSERT INTO notifications (notif_user_id, notif_type, notif_icon, notif_color, notif_bg_color, notif_title, notif_text, notif_entity_id, notif_entity_type, notif_created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['notif_user_id'],
            $data['notif_type'],
            $data['notif_icon'],
            $data['notif_color'],
            $data['notif_bg_color'],
            $data['notif_title'],
            $data['notif_text'],
            $data['notif_entity_id'] ?? null,
            $data['notif_entity_type'] ?? null
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function getByUserId($user_id, $limit = 50, $offset = 0) {
        $sql = 'SELECT * FROM notifications WHERE notif_user_id = ? 
                ORDER BY notif_created_at DESC LIMIT ? OFFSET ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, (int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }
    
    public function getUnreadCount($user_id) {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as count FROM notifications WHERE notif_user_id = ? AND notif_read = FALSE');
        $stmt->execute([$user_id]);
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    public function markRead($id) {
        $stmt = $this->pdo->prepare('UPDATE notifications SET notif_read = TRUE WHERE notif_id = ?');
        return $stmt->execute([$id]);
    }
    
    public function markAllRead($user_id) {
        $stmt = $this->pdo->prepare('UPDATE notifications SET notif_read = TRUE WHERE notif_user_id = ?');
        return $stmt->execute([$user_id]);
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare('DELETE FROM notifications WHERE notif_id = ?');
        return $stmt->execute([$id]);
    }
}

/* ================== ABONNEMENT (FOLLOW) MODEL ================== */
class AbonnementModel extends BaseModel {
    
    public function follow($follower_id, $followed_id) {
        if ($follower_id == $followed_id) return false;
        
        // Vérifier si déjà abonné
        $check = $this->isFollowing($follower_id, $followed_id);
        if ($check) return false;
        
        $sql = 'INSERT INTO abonnements (follower_id, followed_id, follow_date) VALUES (?, ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$follower_id, $followed_id]);
    }
    
    public function unfollow($follower_id, $followed_id) {
        $stmt = $this->pdo->prepare('DELETE FROM abonnements WHERE follower_id = ? AND followed_id = ?');
        return $stmt->execute([$follower_id, $followed_id]);
    }
    
    public function isFollowing($follower_id, $followed_id) {
        $stmt = $this->pdo->prepare('SELECT 1 FROM abonnements WHERE follower_id = ? AND followed_id = ? LIMIT 1');
        $stmt->execute([$follower_id, $followed_id]);
        return $stmt->fetch() !== false;
    }
    
    public function getFollowers($user_id, $limit = 50, $offset = 0) {
        $sql = 'SELECT u.user_id, u.user_name, u.user_username, u.user_photo_url 
                FROM abonnements a 
                JOIN utilisateurs u ON a.follower_id = u.user_id 
                WHERE a.followed_id = ? 
                ORDER BY a.follow_date DESC LIMIT ? OFFSET ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, (int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }
    
    public function getFollowing($user_id, $limit = 50, $offset = 0) {
        $sql = 'SELECT u.user_id, u.user_name, u.user_username, u.user_photo_url 
                FROM abonnements a 
                JOIN utilisateurs u ON a.followed_id = u.user_id 
                WHERE a.follower_id = ? 
                ORDER BY a.follow_date DESC LIMIT ? OFFSET ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, (int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }
    
    public function getFollowersCount($user_id) {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as count FROM abonnements WHERE followed_id = ?');
        $stmt->execute([$user_id]);
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    public function getFollowingCount($user_id) {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as count FROM abonnements WHERE follower_id = ?');
        $stmt->execute([$user_id]);
        $result = $stmt->fetch();
        return $result['count'];
    }
}

/* ================== LIKE_PUBLICATIONS MODEL ================== */
class LikePublicationModel extends BaseModel {
    
    public function like($user_id, $post_id) {
        // Vérifier si déjà liké
        if ($this->hasLiked($user_id, $post_id)) return false;
        
        $sql = 'INSERT INTO likes_publications (like_post_user_id, like_post_id, like_date) VALUES (?, ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute([$user_id, $post_id]);
        
        if ($result) {
            (new PublicationModel($this->pdo))->incrementLikes($post_id);
        }
        return $result;
    }
    
    public function unlike($user_id, $post_id) {
        $sql = 'DELETE FROM likes_publications WHERE like_post_user_id = ? AND like_post_id = ?';
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute([$user_id, $post_id]);
        
        if ($result) {
            (new PublicationModel($this->pdo))->decrementLikes($post_id);
        }
        return $result;
    }
    
    public function hasLiked($user_id, $post_id) {
        $stmt = $this->pdo->prepare('SELECT 1 FROM likes_publications WHERE like_post_user_id = ? AND like_post_id = ? LIMIT 1');
        $stmt->execute([$user_id, $post_id]);
        return $stmt->fetch() !== false;
    }
    
    public function getLikesCount($post_id) {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as count FROM likes_publications WHERE like_post_id = ?');
        $stmt->execute([$post_id]);
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    public function getLikedBy($post_id, $limit = 10) {
        $sql = 'SELECT u.user_id, u.user_name, u.user_username, u.user_photo_url 
                FROM likes_publications lp 
                JOIN utilisateurs u ON lp.like_post_user_id = u.user_id 
                WHERE lp.like_post_id = ? 
                ORDER BY lp.like_date DESC LIMIT ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$post_id, (int)$limit]);
        return $stmt->fetchAll();
    }
}

/* ================== LIKE_COMMENTAIRES MODEL ================== */
class LikeCommentaireModel extends BaseModel {
    
    public function like($user_id, $comment_id) {
        if ($this->hasLiked($user_id, $comment_id)) return false;
        
        $sql = 'INSERT INTO likes_commentaires (like_com_user_id, like_comment_id, like_date) VALUES (?, ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute([$user_id, $comment_id]);
        
        if ($result) {
            (new CommentaireModel($this->pdo))->incrementLikes($comment_id);
        }
        return $result;
    }
    
    public function unlike($user_id, $comment_id) {
        $sql = 'DELETE FROM likes_commentaires WHERE like_com_user_id = ? AND like_comment_id = ?';
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute([$user_id, $comment_id]);
        
        if ($result) {
            (new CommentaireModel($this->pdo))->decrementLikes($comment_id);
        }
        return $result;
    }
    
    public function hasLiked($user_id, $comment_id) {
        $stmt = $this->pdo->prepare('SELECT 1 FROM likes_commentaires WHERE like_com_user_id = ? AND like_comment_id = ? LIMIT 1');
        $stmt->execute([$user_id, $comment_id]);
        return $stmt->fetch() !== false;
    }
    
    public function getLikesCount($comment_id) {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as count FROM likes_commentaires WHERE like_comment_id = ?');
        $stmt->execute([$comment_id]);
        $result = $stmt->fetch();
        return $result['count'];
    }
}

/* ================== CONVERSATION MODEL ================== */
class ConversationModel extends BaseModel {
    
    public function create($user1_id, $user2_id) {
        // Assurer que user1_id < user2_id pour l'unicité
        if ($user1_id > $user2_id) {
            list($user1_id, $user2_id) = array($user2_id, $user1_id);
        }
        
        // Vérifier si conversation existe
        $check = $this->getBetween($user1_id, $user2_id);
        if ($check) return $check['conv_id'];
        
        $sql = 'INSERT INTO conversations (conv_user1_id, conv_user2_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user1_id, $user2_id]);
        return $this->pdo->lastInsertId();
    }
    
    public function getBetween($user1_id, $user2_id) {
        if ($user1_id > $user2_id) {
            list($user1_id, $user2_id) = array($user2_id, $user1_id);
        }
        
        $stmt = $this->pdo->prepare('SELECT * FROM conversations WHERE conv_user1_id = ? AND conv_user2_id = ? LIMIT 1');
        $stmt->execute([$user1_id, $user2_id]);
        return $stmt->fetch();
    }
    
    public function getById($id) {
        $stmt = $this->pdo->prepare('SELECT * FROM conversations WHERE conv_id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function getByUserId($user_id, $limit = 50, $offset = 0) {
        $sql = 'SELECT c.*, 
                CASE WHEN c.conv_user1_id = ? THEN u2.user_id ELSE u1.user_id END as other_user_id,
                CASE WHEN c.conv_user1_id = ? THEN u2.user_name ELSE u1.user_name END as other_user_name,
                CASE WHEN c.conv_user1_id = ? THEN u2.user_username ELSE u1.user_username END as other_user_username,
                CASE WHEN c.conv_user1_id = ? THEN u2.user_photo_url ELSE u1.user_photo_url END as other_user_photo
                FROM conversations c 
                JOIN utilisateurs u1 ON c.conv_user1_id = u1.user_id 
                JOIN utilisateurs u2 ON c.conv_user2_id = u2.user_id 
                WHERE c.conv_user1_id = ? OR c.conv_user2_id = ?
                ORDER BY c.updated_at DESC LIMIT ? OFFSET ?';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, $user_id, $user_id, $user_id, $user_id, $user_id, (int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }
}

/* ================== MESSAGE MODEL ================== */
class MessageModel extends BaseModel {
    
    public function send(array $data) {
        $sql = 'INSERT INTO messages (msg_conv_id, msg_sender_id, msg_recipient_id, msg_content, msg_sent_at) 
                VALUES (?, ?, ?, ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['msg_conv_id'],
            $data['msg_sender_id'],
            $data['msg_recipient_id'],
            $data['msg_content']
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function getById($id) {
        $stmt = $this->pdo->prepare('SELECT * FROM messages WHERE msg_id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function getByConversationId($conv_id, $limit = 50, $offset = 0) {
        $sql = 'SELECT m.*, u.user_name, u.user_username, u.user_photo_url 
                FROM messages m 
                JOIN utilisateurs u ON m.msg_sender_id = u.user_id 
                WHERE m.msg_conv_id = ? 
                ORDER BY m.msg_sent_at DESC LIMIT ? OFFSET ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$conv_id, (int)$limit, (int)$offset]);
        $messages = $stmt->fetchAll();
        return array_reverse($messages); // Reverse to get chronological order
    }
    
    public function markRead($id) {
        $stmt = $this->pdo->prepare('UPDATE messages SET msg_read = TRUE, msg_read_at = NOW() WHERE msg_id = ?');
        return $stmt->execute([$id]);
    }
    
    public function markConversationRead($conv_id, $user_id) {
        $stmt = $this->pdo->prepare('UPDATE messages SET msg_read = TRUE, msg_read_at = NOW() 
                                      WHERE msg_conv_id = ? AND msg_recipient_id = ? AND msg_read = FALSE');
        return $stmt->execute([$conv_id, $user_id]);
    }
    
    public function getUnreadCount($user_id) {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as count FROM messages WHERE msg_recipient_id = ? AND msg_read = FALSE');
        $stmt->execute([$user_id]);
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare('DELETE FROM messages WHERE msg_id = ?');
        return $stmt->execute([$id]);
    }
}

/* ================== USER PHOTO MODEL ================== */
class UserPhotoModel extends BaseModel {
    
    public function create(array $data) {
        $sql = 'INSERT INTO user_photos (photo_user_id, photo_type, photo_url, photo_mime_type, photo_size, is_current, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['photo_user_id'],
            $data['photo_type'],
            $data['photo_url'],
            $data['photo_mime_type'] ?? null,
            $data['photo_size'] ?? null,
            1
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function getByUserAndType($user_id, $type) {
        $sql = 'SELECT * FROM user_photos WHERE photo_user_id = ? AND photo_type = ? ORDER BY created_at DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, $type]);
        return $stmt->fetchAll();
    }
    
    public function getCurrentPhoto($user_id, $type) {
        $sql = 'SELECT * FROM user_photos WHERE photo_user_id = ? AND photo_type = ? AND is_current = TRUE LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, $type]);
        return $stmt->fetch();
    }
    
    public function setCurrentPhoto($user_id, $type, $photo_id) {
        // Désactiver la photo actuelle
        $stmt1 = $this->pdo->prepare('UPDATE user_photos SET is_current = FALSE WHERE photo_user_id = ? AND photo_type = ?');
        $stmt1->execute([$user_id, $type]);
        
        // Activer la nouvelle photo
        $stmt2 = $this->pdo->prepare('UPDATE user_photos SET is_current = TRUE WHERE photo_id = ? AND photo_user_id = ?');
        return $stmt2->execute([$photo_id, $user_id]);
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare('DELETE FROM user_photos WHERE photo_id = ?');
        return $stmt->execute([$id]);
    }
    
    public function deleteOldPhotos($user_id, $type, $keep = 5) {
        $sql = 'SELECT photo_id FROM user_photos WHERE photo_user_id = ? AND photo_type = ? 
                ORDER BY created_at DESC LIMIT -1 OFFSET ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, $type, $keep]);
        $photos = $stmt->fetchAll();
        
        foreach ($photos as $photo) {
            $this->delete($photo['photo_id']);
        }
        return true;
    }
}

/* ================== USER THEME SETTINGS MODEL ================== */
class UserThemeSettingsModel extends BaseModel {
    
    public function create($user_id) {
        $sql = 'INSERT INTO parametres_theme (settings_user_id, settings_hue, settings_bg_theme, settings_fontSize, settings_dark_mode, created_at, updated_at) 
                VALUES (?, 160, "light", "medium", FALSE, NOW(), NOW())';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id]);
        return $this->pdo->lastInsertId();
    }
    
    public function getByUserId($user_id) {
        $stmt = $this->pdo->prepare('SELECT * FROM parametres_theme WHERE settings_user_id = ? LIMIT 1');
        $stmt->execute([$user_id]);
        return $stmt->fetch();
    }
    
    public function update($user_id, array $data) {
        $fields = [];
        $params = [];
        $allowed = ['settings_hue', 'settings_bg_theme', 'settings_fontSize', 'settings_dark_mode'];
        
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) return false;
        
        $fields[] = 'updated_at = NOW()';
        $params[] = $user_id;
        $sql = 'UPDATE parametres_theme SET ' . implode(', ', $fields) . ' WHERE settings_user_id = ?';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
}

/* ================== STORY VIEWS MODEL ================== */
class StoryViewsModel extends BaseModel {
    
    public function addView($story_id, $user_id) {
        // Vérifier si l'utilisateur a déjà vu la story
        if ($this->hasViewed($story_id, $user_id)) {
            return false;
        }
        
        $sql = 'INSERT INTO vues_stories (view_story_id, view_user_id, view_date) VALUES (?, ?, NOW())';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$story_id, $user_id]);
    }
    
    public function hasViewed($story_id, $user_id) {
        $stmt = $this->pdo->prepare('SELECT 1 FROM vues_stories WHERE view_story_id = ? AND view_user_id = ? LIMIT 1');
        $stmt->execute([$story_id, $user_id]);
        return $stmt->fetch() !== false;
    }
    
    public function getViewers($story_id, $limit = 50) {
        $sql = 'SELECT u.user_id, u.user_name, u.user_username, u.user_photo_url, v.view_date 
                FROM vues_stories v 
                JOIN utilisateurs u ON v.view_user_id = u.user_id 
                WHERE v.view_story_id = ? 
                ORDER BY v.view_date DESC LIMIT ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$story_id, (int)$limit]);
        return $stmt->fetchAll();
    }
    
    public function getViewCount($story_id) {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as count FROM vues_stories WHERE view_story_id = ?');
        $stmt->execute([$story_id]);
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    public function removeView($story_id, $user_id) {
        $stmt = $this->pdo->prepare('DELETE FROM vues_stories WHERE view_story_id = ? AND view_user_id = ?');
        return $stmt->execute([$story_id, $user_id]);
    }
}

/* ================== UTILISATEUR FACADE ================== */
class Utilisateur extends BaseModel {
    private $um;
    
    public function __construct($pdo = null) {
        parent::__construct($pdo);
        $this->um = new UtilisateurModel($this->pdo);
    }
    
    public function create(array $data) {
        return $this->um->create($data);
    }
    
    public function findById($id) {
        return $this->um->findById($id);
    }
    
    public function findByUsername($username) {
        return $this->um->findByUsername($username);
    }
    
    public function verifyCredentials($username, $password) {
        return $this->um->verifyCredentials($username, $password);
    }
    
    public function update($id, array $data) {
        return $this->um->update($id, $data);
    }
    
    public function getProfile($id) {
        return $this->um->getProfile($id);
    }
    
    public function getAllUsers($limit = 50, $offset = 0) {
        return $this->um->getAllUsers($limit, $offset);
    }
    
    public function searchUsers($query, $limit = 20) {
        return $this->um->searchUsers($query, $limit);
    }
}

/* ================== ROUTER FOR AJAX ================== */
class Router {
    private $db;
    
    public function __construct() {
        $this->db = (new Database())->pdo();
    }
    
    public function handle() {
        $action = $_REQUEST['action'] ?? null;
        
        error_log('Router::handle() - Action: ' . ($action ?? 'NULL'));
        error_log('REQUEST method: ' . $_SERVER['REQUEST_METHOD']);
        
        if (!$action) {
            error_log('ERROR: Action non spécifiée');
            Utils::jsonResponse(['success' => false, 'message' => 'Action non spécifiée'], 400);
        }
        
        $method = 'action' . ucfirst($action);
        
        error_log('Looking for method: ' . $method);
        
        if (!method_exists($this, $method)) {
            error_log('ERROR: Method not found: ' . $method);
            Utils::jsonResponse(['success' => false, 'message' => 'Action non trouvée'], 404);
        }
        
        try {
            error_log('Calling method: ' . $method);
            $this->$method();
        } catch (Exception $e) {
            error_log('Exception in ' . $method . ': ' . $e->getMessage());
            Utils::jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    private function actionRegister() {
        $data = [
            'user_name' => $_POST['user_name'] ?? '',
            'user_username' => $_POST['user_username'] ?? '',
            'user_password' => $_POST['user_password'] ?? '',
        ];
        
        if (empty($data['user_name']) || empty($data['user_username']) || empty($data['user_password'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Données manquantes'], 400);
        }
        
        $user = new Utilisateur($this->db);
        $existing = $user->findByUsername($data['user_username']);
        
        if ($existing) {
            Utils::jsonResponse(['success' => false, 'message' => 'Pseudo déjà utilisé'], 409);
        }
        
        // Gérer l'upload de la photo de profil AVANT création
        $photoPath = null;
        if (isset($_FILES['user_photo']) && $_FILES['user_photo']['error'] === UPLOAD_ERR_OK) {
            $photoPath = Utils::uploadProfilePhoto($_FILES['user_photo']);
            if (!$photoPath) {
                Utils::jsonResponse(['success' => false, 'message' => 'Erreur lors de l\'upload de la photo'], 400);
            }
            $data['user_photo_url'] = $photoPath;
        } else if (isset($_FILES['user_photo'])) {
            // Si photo soumise mais erreur d'upload
            error_log("Upload error code: " . $_FILES['user_photo']['error']);
            Utils::jsonResponse(['success' => false, 'message' => 'Erreur d\'upload photo'], 400);
        }
        
        try {
            // Créer l'utilisateur
            $id = $user->create($data);
            if (!$id) {
                Utils::jsonResponse(['success' => false, 'message' => 'Erreur lors de la création de l\'utilisateur'], 500);
            }
            
            // Récupérer l'utilisateur créé
            $newUser = $user->findById($id);
            Utils::jsonResponse(['success' => true, 'message' => 'Utilisateur créé', 'user' => $newUser], 201);
            
        } catch (Exception $e) {
            Utils::jsonResponse(['success' => false, 'message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }
    
    private function actionLogin() {
        $username = $_POST['user_username'] ?? '';
        $password = $_POST['user_password'] ?? '';
        
        if (empty($username) || empty($password)) {
            Utils::jsonResponse(['success' => false, 'message' => 'Identifiants manquants'], 400);
        }
        
        $user = new Utilisateur($this->db);
        $userData = $user->verifyCredentials($username, $password);
        
        if (!$userData) {
            Utils::jsonResponse(['success' => false, 'message' => 'Identifiants incorrects'], 401);
        }
        
        $_SESSION['user_id'] = $userData['user_id'];
        $_SESSION['user_username'] = $userData['user_username'];
        
        Utils::jsonResponse(['success' => true, 'message' => 'Connexion réussie', 'user' => $userData]);
    }
    
    private function actionLogout() {
        session_destroy();
        Utils::jsonResponse(['success' => true, 'message' => 'Déconnexion réussie']);
    }

    private function actionDebug() {
        // Endpoint de debug - à supprimer en production
        $db = (new Database())->pdo();
        
        // Vérifier la connexion à la base de données
        try {
            $stmt = $db->query("SELECT VERSION()");
            $version = $stmt->fetch()['VERSION()'];
            
            // Vérifier la table utilisateurs
            $stmt = $db->query("SHOW TABLES LIKE 'utilisateurs'");
            $tableExists = $stmt->fetch() ? true : false;
            
            // Compter les utilisateurs
            $stmt = $db->query("SELECT COUNT(*) as count FROM utilisateurs");
            $userCount = $stmt->fetch()['count'] ?? 0;
            
            Utils::jsonResponse([
                'success' => true,
                'db_version' => $version,
                'table_exists' => $tableExists,
                'user_count' => $userCount,
                'images_dir' => is_dir(__DIR__ . '/images')
            ]);
        } catch (Exception $e) {
            Utils::jsonResponse([
                'success' => false,
                'message' => 'Erreur base de données',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    private function actionCreatePost() {
        // Log pour debug
        error_log('actionCreatePost() - USER_ID: ' . ($_SESSION['user_id'] ?? 'NONE'));
        
        if (!isset($_SESSION['user_id'])) {
            error_log('ERROR: Pas de user_id en session');
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $content = $_POST['post_content'] ?? '';
        $visibility = $_POST['post_visibility'] ?? 'public';
        $hasImages = !empty($_FILES['post_images']) && is_array($_FILES['post_images']['tmp_name']);
        
        error_log('Contenu: ' . strlen($content) . ' chars | Images: ' . ($hasImages ? 'OUI' : 'NON'));
        
        // Permettre de publier si contenu OU images (ou les deux)
        if (empty($content) && !$hasImages) {
            error_log('ERROR: Ni contenu ni images présents');
            Utils::jsonResponse(['success' => false, 'message' => 'Veuillez ajouter du texte ou des images'], 400);
        }
        
        $pub = new PublicationModel($this->db);
        $post_id = $pub->create([
            'post_user_id' => $_SESSION['user_id'],
            'post_content' => $content,
            'post_visibility' => $visibility
        ]);
        
        // Gérer les images uploadées
        if (!empty($_FILES['post_images'])) {
            $imgModel = new ImagePublicationModel($this->db);
            $order = 0;
            
            foreach ($_FILES['post_images']['tmp_name'] as $idx => $tmpName) {
                if ($_FILES['post_images']['error'][$idx] === UPLOAD_ERR_OK) {
                    $filename = Utils::uploadPostImage($tmpName, $_FILES['post_images']['name'][$idx]);
                    
                    if ($filename) {
                        $imgModel->create([
                            'image_post_id' => $post_id,
                            'image_url' => $filename,
                            'image_mime_type' => $_FILES['post_images']['type'][$idx],
                            'image_order' => $order++,
                            'image_size' => $_FILES['post_images']['size'][$idx]
                        ]);
                    }
                }
            }
        }
        
        Utils::jsonResponse(['success' => true, 'message' => 'Publication créée', 'post_id' => $post_id], 201);
    }
    
    private function actionGetFeed() {
        try {
            $user_id = $_SESSION['user_id'] ?? null;
            $limit = (int)($_GET['limit'] ?? 50);
            $offset = (int)($_GET['offset'] ?? 0);
            
            $pub = new PublicationModel($this->db);
            $publications = $pub->getFeed($user_id, $limit, $offset);
            
            // Enrichir chaque publication avec les images et les likes de l'utilisateur
            $imgModel = new ImagePublicationModel($this->db);
            $likeModel = new LikePublicationModel($this->db);
            $comModel = new CommentaireModel($this->db);
            
            $enriched = [];
            foreach ($publications as $post) {
                // Récupérer les images
                $images = $imgModel->getByPostId($post['post_id']);
                $imageUrls = [];
                foreach ($images as $img) {
                    $imageUrls[] = 'pub/' . $img['image_url'];
                }
                
                // Vérifier si l'utilisateur actuel a liké ce post
                $userHasLiked = false;
                if ($user_id) {
                    $userHasLiked = $likeModel->hasLiked($user_id, $post['post_id']);
                }
                
                // Compter les VRAIS likes depuis la table likes_publications (pas la colonne statique)
                $likesCount = $likeModel->getLikesCount($post['post_id']);
                
                // Récupérer les derniers commentaires (pour pré-affichage dans le feed)
                $comments = $comModel->getByPostId($post['post_id'], 3); // 3 derniers commentaires
                $commentsList = [];
                foreach ($comments as $comment) {
                    $commentsList[] = [
                        'id' => $comment['comment_id'],
                        'text' => $comment['comment_text'],
                        'author' => $comment['user_name'] ?? 'Utilisateur supprimé',
                        'isAnonymous' => (bool)($comment['comment_anonym'] ?? false),
                        'likes' => (int)($comment['comment_likes'] ?? 0)
                    ];
                }
                
                // Compter les VRAIS commentaires depuis la table commentaires (pas la colonne statique)
                $stmt = $this->db->prepare('SELECT COUNT(*) as count FROM commentaires WHERE comment_post_id = ? AND comment_parent_id IS NULL');
                $stmt->execute([$post['post_id']]);
                $result = $stmt->fetch();
                $commentsCount = (int)($result['count'] ?? 0);
                
                $enriched[] = [
                    'id' => $post['post_id'],
                    'author' => $post['user_name'],
                    'username' => '@' . $post['user_username'],
                    'avatar' => $post['user_photo_url'] ? 'imgApp/' . $post['user_photo_url'] : null,
                    'content' => $post['post_content'],
                    'images' => $imageUrls,
                    'likes' => (int)$likesCount,
                    'comments' => (int)$commentsCount,
                    'userHasLiked' => $userHasLiked,
                    'commentsList' => $commentsList,
                    'timestamp' => $post['post_created_at'],
                    'visibility' => $post['post_visibility'],
                    'user_id' => $post['post_user_id']
                ];
            }
            
            Utils::jsonResponse(['success' => true, 'posts' => $enriched, 'current_user_id' => $user_id]);
        } catch (Exception $e) {
            error_log('Erreur actionGetFeed: ' . $e->getMessage());
            Utils::jsonResponse(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    private function actionToggleLike() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $post_id = $_POST['post_id'] ?? null;
        
        if (!$post_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Post ID manquant'], 400);
        }
        
        $likeModel = new LikePublicationModel($this->db);
        $pubModel = new PublicationModel($this->db);
        $user_id = $_SESSION['user_id'];
        
        if ($likeModel->hasLiked($user_id, $post_id)) {
            $likeModel->unlike($user_id, $post_id);
            $pubModel->decrementLikes($post_id);
            $message = 'Like retiré';
            $isLiked = false;
        } else {
            $likeModel->like($user_id, $post_id);
            $pubModel->incrementLikes($post_id);
            $message = 'Publication liée';
            $isLiked = true;
        }
        
        $count = $likeModel->getLikesCount($post_id);
        
        Utils::jsonResponse([
            'success' => true, 
            'message' => $message, 
            'likes_count' => $count,
            'isLiked' => $isLiked
        ]);
    }
    
    private function actionAddComment() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $post_id = $_POST['post_id'] ?? null;
        $text = $_POST['comment_text'] ?? '';
        $parent_id = $_POST['comment_parent_id'] ?? null;
        $is_anonym = $_POST['comment_anonym'] ?? false;
        
        if (!$post_id || empty($text)) {
            Utils::jsonResponse(['success' => false, 'message' => 'Données manquantes'], 400);
        }
        
        $text = substr($text, 0, 500); // Limiter à 500 caractères
        
        $com = new CommentaireModel($this->db);
        $comment_id = $com->create([
            'comment_post_id' => $post_id,
            'comment_user_id' => $_SESSION['user_id'],
            'comment_text' => $text,
            'comment_anonym' => $is_anonym ? 1 : 0,
            'comment_parent_id' => $parent_id
        ]);
        
        // Incrémenter le compteur seulement si c'est un commentaire principal (pas une réponse)
        if (!$parent_id) {
            (new PublicationModel($this->db))->incrementComments($post_id);
        }
        
        // Récupérer le commentaire créé avec infos utilisateur
        $comment = $com->getById($comment_id);
        
        $response = [
            'success' => true,
            'message' => 'Commentaire ajouté',
            'comment' => [
                'id' => $comment['comment_id'],
                'text' => $comment['comment_text'],
                'author' => $comment['user_name'] ?? 'Utilisateur supprimé',
                'isAnonymous' => (bool)($comment['comment_anonym'] ?? false),
                'likes' => 0,
                'parent_id' => $comment['comment_parent_id']
            ]
        ];
        
        Utils::jsonResponse($response, 201);
    }
    
    private function actionGetComments() {
        $post_id = $_GET['post_id'] ?? null;
        
        if (!$post_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Post ID manquant'], 400);
        }
        
        $com = new CommentaireModel($this->db);
        $allComments = $com->getByPostId($post_id, 1000); // Récupérer tous
        
        // Organiser en commentaires principaux avec réponses
        $mainComments = [];
        $replies = [];
        
        foreach ($allComments as $comment) {
            $commentData = [
                'id' => $comment['comment_id'],
                'text' => $comment['comment_text'],
                'author' => $comment['user_name'] ?? 'Utilisateur supprimé',
                'username' => $comment['user_username'] ?? 'unknown',
                'avatar' => $comment['user_photo_url'] ? 'imgApp/' . $comment['user_photo_url'] : null,
                'isAnonymous' => (bool)($comment['comment_anonym'] ?? false),
                'likes' => (int)($comment['comment_likes'] ?? 0),
                'timestamp' => $comment['created_at'],
                'user_id' => $comment['comment_user_id'],
                'parent_id' => $comment['comment_parent_id']
            ];
            
            if ($comment['comment_parent_id']) {
                // C'est une réponse
                $replies[$comment['comment_parent_id']][] = $commentData;
            } else {
                // C'est un commentaire principal
                $commentData['replies'] = [];
                $mainComments[$comment['comment_id']] = $commentData;
            }
        }
        
        // Ajouter les réponses aux commentaires principaux
        foreach ($mainComments as &$mainComment) {
            if (isset($replies[$mainComment['id']])) {
                $mainComment['replies'] = $replies[$mainComment['id']];
            }
        }
        
        Utils::jsonResponse([
            'success' => true,
            'comments' => array_values($mainComments),
            'total' => count($allComments)
        ]);
    }
    
    private function actionToggleCommentLike() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $comment_id = $_POST['comment_id'] ?? null;
        
        if (!$comment_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Comment ID manquant'], 400);
        }
        
        $likeModel = new LikeCommentaireModel($this->db);
        $comModel = new CommentaireModel($this->db);
        $user_id = $_SESSION['user_id'];
        
        if ($likeModel->hasLiked($user_id, $comment_id)) {
            $likeModel->unlike($user_id, $comment_id);
            $comModel->decrementLikes($comment_id);
            $message = 'Like retiré';
            $isLiked = false;
        } else {
            $likeModel->like($user_id, $comment_id);
            $comModel->incrementLikes($comment_id);
            $message = 'Commentaire aimé';
            $isLiked = true;
        }
        
        $count = $likeModel->getLikesCount($comment_id);
        
        Utils::jsonResponse([
            'success' => true,
            'message' => $message,
            'likes_count' => $count,
            'isLiked' => $isLiked
        ]);
    }
    
    private function actionGetPostStats() {
        $post_id = $_GET['post_id'] ?? null;
        
        if (!$post_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Post ID manquant'], 400);
        }
        
        $pub = new PublicationModel($this->db);
        $post = $pub->getById($post_id);
        
        if (!$post) {
            Utils::jsonResponse(['success' => false, 'message' => 'Publication non trouvée'], 404);
        }
        
        $stats = [
            'post_id' => $post['post_id'],
            'likes' => (int)$post['post_likes_count'],
            'comments' => (int)($post['post_comments'] ?? 0),
            'views' => (int)($post['post_views'] ?? 0),
            'created_at' => $post['post_created_at'],
            'author' => $post['user_name'],
            'author_id' => $post['post_user_id']
        ];
        
        Utils::jsonResponse(['success' => true, 'stats' => $stats]);
    }

    private function actionCreateStory() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        $text = $_POST['story_text'] ?? '';
        $hasImage = isset($_FILES['story_image']) && $_FILES['story_image']['error'] === UPLOAD_ERR_OK;

        if (empty($text) && !$hasImage) {
            Utils::jsonResponse(['success' => false, 'message' => 'Aucun contenu'], 400);
        }

        $type = $hasImage ? 'text-image' : 'text';
        $imageUrl = null;

        if ($hasImage) {
            $imageUrl = Utils::uploadStoryImage($_FILES['story_image']['tmp_name'], $_FILES['story_image']['name']);
            if (!$imageUrl) {
                Utils::jsonResponse(['success' => false, 'message' => 'Échec de l\'upload'], 500);
            }
        }

        $storyModel = new StoryModel($this->db);
        $storyId = $storyModel->create([
            'story_user_id' => $_SESSION['user_id'],
            'story_type' => $type,
            'story_text' => $text,
            'story_image_url' => $imageUrl,
            'story_duration' => 24
        ]);

        Utils::jsonResponse(['success' => true, 'story_id' => $storyId, 'message' => 'Story créée']);
    }

    private function actionGetActiveStories() {
        $storyModel = new StoryModel($this->db);
        $stories = $storyModel->getActiveStories(100);
        $viewModel = new StoryViewsModel($this->db);
        $currentUserId = $_SESSION['user_id'] ?? null;

        $result = [];
        foreach ($stories as $story) {
            $isOwner = ($currentUserId && $story['story_user_id'] == $currentUserId);
            if ($isOwner) {
                $story['viewers_count'] = $viewModel->getViewCount($story['story_id']);
            } else {
                $story['viewers_count'] = null; // ou non envoyé, mais pour simplifier on met null
            }
            $story['is_owner'] = $isOwner;
            if ($currentUserId) {
                $story['viewed'] = $viewModel->hasViewed($story['story_id'], $currentUserId);
            }
            $result[] = $story;
        }

        Utils::jsonResponse(['success' => true, 'stories' => $result]);
    }

    private function actionGetUserStories() {
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            Utils::jsonResponse(['success' => false, 'message' => 'User ID manquant'], 400);
        }

        $storyModel = new StoryModel($this->db);
        $stories = $storyModel->getByUserId($userId);
        $viewModel = new StoryViewsModel($this->db);
        $currentUserId = $_SESSION['user_id'] ?? null;

        $result = [];
        foreach ($stories as $story) {
            $isOwner = ($currentUserId && $story['story_user_id'] == $currentUserId);
            if ($isOwner) {
                $story['viewers_count'] = $viewModel->getViewCount($story['story_id']);
            } else {
                $story['viewers_count'] = null;
            }
            $story['is_owner'] = $isOwner;
            if ($currentUserId) {
                $story['viewed'] = $viewModel->hasViewed($story['story_id'], $currentUserId);
            }
            $result[] = $story;
        }

        Utils::jsonResponse(['success' => true, 'stories' => $result]);
    }

    private function actionDeleteStory() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }

        $storyId = $_POST['story_id'] ?? null;
        if (!$storyId) {
            Utils::jsonResponse(['success' => false, 'message' => 'Story ID manquant'], 400);
        }

        $storyModel = new StoryModel($this->db);
        $story = $storyModel->getById($storyId);
        if (!$story || $story['story_user_id'] != $_SESSION['user_id']) {
            Utils::jsonResponse(['success' => false, 'message' => 'Action non autorisée'], 403);
        }

        $storyModel->delete($storyId);
        Utils::jsonResponse(['success' => true, 'message' => 'Story supprimée']);
    }
    
    private function actionFollowUser() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $followed_id = $_POST['followed_id'] ?? null;
        
        if (!$followed_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'User ID manquant'], 400);
        }
        
        $follow = new AbonnementModel($this->db);
        $follow->follow($_SESSION['user_id'], $followed_id);
        
        Utils::jsonResponse(['success' => true, 'message' => 'Abonnement réussi']);
    }
    
    private function actionUnfollowUser() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $followed_id = $_POST['followed_id'] ?? null;
        
        if (!$followed_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'User ID manquant'], 400);
        }
        
        $follow = new AbonnementModel($this->db);
        $follow->unfollow($_SESSION['user_id'], $followed_id);
        
        Utils::jsonResponse(['success' => true, 'message' => 'Désabonnement réussi']);
    }
    
    private function actionGetUserProfile() {
        $user_id = $_GET['user_id'] ?? null;
        
        if (!$user_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'User ID manquant'], 400);
        }
        
        $user = new Utilisateur($this->db);
        $profile = $user->getProfile($user_id);
        
        if (!$profile) {
            Utils::jsonResponse(['success' => false, 'message' => 'Utilisateur non trouvé'], 404);
        }
        
        $follow = new AbonnementModel($this->db);
        $profile['followers_count'] = $follow->getFollowersCount($user_id);
        $profile['following_count'] = $follow->getFollowingCount($user_id);
        
        $current_user_id = $_SESSION['user_id'] ?? null;
        if ($current_user_id) {
            $profile['is_following'] = $follow->isFollowing($current_user_id, $user_id);
        }
        
        Utils::jsonResponse(['success' => true, 'profile' => $profile]);
    }
    
    private function actionGetCurrentProfile() {
        // Récupérer les données de l'utilisateur connecté
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $user = new Utilisateur($this->db);
        $profile = $user->findById($_SESSION['user_id']);
        
        if (!$profile) {
            Utils::jsonResponse(['success' => false, 'message' => 'Utilisateur non trouvé'], 404);
        }
        
        // Récupérer les stats
        $follow = new AbonnementModel($this->db);
        $pub = new PublicationModel($this->db);
        
        $profile['posts_count'] = $pub->getCountByUser($_SESSION['user_id']);
        $profile['followers_count'] = $follow->getFollowersCount($_SESSION['user_id']);
        $profile['following_count'] = $follow->getFollowingCount($_SESSION['user_id']);
        
        // Formater la date de création (Janvier 2024 en français)
        if (!empty($profile['created_at'])) {
            $dateObj = new DateTime($profile['created_at']);
            $profile['member_since'] = $dateObj->format('F Y'); // Format: January 2024
            // Traduire en français
            $enToFr = [
                'January' => 'Janvier', 'February' => 'Février', 'March' => 'Mars',
                'April' => 'Avril', 'May' => 'Mai', 'June' => 'Juin',
                'July' => 'Juillet', 'August' => 'Août', 'September' => 'Septembre',
                'October' => 'Octobre', 'November' => 'Novembre', 'December' => 'Décembre'
            ];
            $profile['member_since'] = strtr($profile['member_since'], $enToFr);
        }
        
        // Retourner le filename uniquement (le frontend ajoute le chemin via getPhotoURL())
        // Ne pas ajouter de préfixe imgApp/ ici pour éviter la duplication
        
        Utils::jsonResponse(['success' => true, 'profile' => $profile]);
    }
    
    private function actionGetUserPosts() {
        $user_id = $_GET['user_id'] ?? (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        if (!$user_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'User ID manquant'], 400);
        }
        
        try {
            $pub = new PublicationModel($this->db);
            // Récupérer toutes les publications de l'utilisateur
            $publications = $pub->getByUserId($user_id, $limit, $offset);
            
            if (!$publications) {
                $publications = [];
            }
            
            // Enrichir les publications comme actionGetFeed
            $imgModel = new ImagePublicationModel($this->db);
            $likeModel = new LikePublicationModel($this->db);
            $comModel = new CommentaireModel($this->db);
            
            $enriched = [];
            $current_user_id = $_SESSION['user_id'] ?? null;
            
            foreach ($publications as $post) {
                // Récupérer les images
                $images = $imgModel->getByPostId($post['post_id']);
                $imageUrls = [];
                foreach ($images as $img) {
                    $imageUrls[] = 'pub/' . $img['image_url'];
                }
                
                // Vérifier si l'utilisateur actuel a liké ce post
                $userHasLiked = false;
                if ($current_user_id) {
                    $userHasLiked = $likeModel->hasLiked($current_user_id, $post['post_id']);
                }
                
                // Récupérer les derniers commentaires
                $comments = $comModel->getByPostId($post['post_id'], 3);
                $commentsList = [];
                foreach ($comments as $comment) {
                    $commentsList[] = [
                        'id' => $comment['comment_id'],
                        'text' => $comment['comment_text'],
                        'author' => $comment['user_name'] ?? 'Utilisateur supprimé',
                        'isAnonymous' => (bool)($comment['comment_anonym'] ?? false),
                        'likes' => (int)($comment['comment_likes'] ?? 0)
                    ];
                }
                
                $enriched[] = [
                    'id' => $post['post_id'],
                    'author' => $post['user_name'],
                    'username' => '@' . $post['user_username'],
                    'avatar' => $post['user_photo_url'] ? 'imgApp/' . $post['user_photo_url'] : null,
                    'content' => $post['post_content'],
                    'images' => $imageUrls,
                    'likes' => (int)$post['post_likes_count'],
                    'comments' => (int)($post['post_comments'] ?? 0),
                    'userHasLiked' => $userHasLiked,
                    'commentsList' => $commentsList,
                    'timestamp' => $post['post_created_at'],
                    'visibility' => $post['post_visibility'],
                    'user_id' => $post['post_user_id']
                ];
            }
            
            Utils::jsonResponse(['success' => true, 'posts' => $enriched]);
        } catch (Exception $e) {
            error_log('Erreur actionGetUserPosts: ' . $e->getMessage());
            Utils::jsonResponse(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    private function actionUpdateProfile() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $user = new Utilisateur($this->db);
        $data = [];
        
        // Mettre à jour le nom (optionnel)
        if (isset($_POST['user_name']) && !empty($_POST['user_name'])) {
            $data['user_name'] = trim($_POST['user_name']);
        }
        
        // Mettre à jour le pseudo (optionnel + vérifier unicité)
        if (isset($_POST['user_username']) && !empty($_POST['user_username'])) {
            $newUsername = trim($_POST['user_username']);
            // Vérifier que le pseudo n'existe pas ailleurs
            $existing = $user->findByUsername($newUsername);
            if ($existing && $existing['user_id'] != $_SESSION['user_id']) {
                Utils::jsonResponse(['success' => false, 'message' => 'Pseudo déjà utilisé'], 409);
            }
            $data['user_username'] = $newUsername;
        }
        
        // Mettre à jour la bio (optionnel)
        if (isset($_POST['user_bio'])) {
            $data['user_bio'] = trim($_POST['user_bio']);
        }
        
        // Upload photo de profil si fournie
        if (isset($_FILES['user_photo']) && $_FILES['user_photo']['error'] === UPLOAD_ERR_OK) {
            $photoPath = Utils::uploadProfilePhoto($_FILES['user_photo']);
            if (!$photoPath) {
                Utils::jsonResponse(['success' => false, 'message' => 'Erreur lors de l\'upload de la photo de profil'], 400);
            }
            $data['user_photo_url'] = $photoPath;
        }
        
        // Upload photo de couverture si fournie
        if (isset($_FILES['user_cover_photo']) && $_FILES['user_cover_photo']['error'] === UPLOAD_ERR_OK) {
            $coverPath = Utils::uploadProfilePhoto($_FILES['user_cover_photo']);
            if (!$coverPath) {
                Utils::jsonResponse(['success' => false, 'message' => 'Erreur lors de l\'upload de la photo de couverture'], 400);
            }
            $data['user_cover_photo_url'] = $coverPath;
        }
        
        // Ne rien faire s'il n'y a aucune donnée à mettre à jour
        if (empty($data)) {
            Utils::jsonResponse(['success' => false, 'message' => 'Aucune donnée à mettre à jour'], 400);
        }
        
        // Mettre à jour l'utilisateur
        try {
            $user->update($_SESSION['user_id'], $data);
            
            // Récupérer le profil mis à jour
            $profile = $user->findById($_SESSION['user_id']);
            
            if (!$profile) {
                Utils::jsonResponse(['success' => false, 'message' => 'Utilisateur non trouvé'], 404);
            }
            
            // Récupérer les stats
            $follow = new AbonnementModel($this->db);
            $pub = new PublicationModel($this->db);
            
            $profile['posts_count'] = $pub->getCountByUser($_SESSION['user_id']);
            $profile['followers_count'] = $follow->getFollowersCount($_SESSION['user_id']);
            $profile['following_count'] = $follow->getFollowingCount($_SESSION['user_id']);
            
            // Formater la date
            if (!empty($profile['created_at'])) {
                $dateObj = new DateTime($profile['created_at']);
                $profile['member_since'] = $dateObj->format('F Y');
                $enToFr = [
                    'January' => 'Janvier', 'February' => 'Février', 'March' => 'Mars',
                    'April' => 'Avril', 'May' => 'Mai', 'June' => 'Juin',
                    'July' => 'Juillet', 'August' => 'Août', 'September' => 'Septembre',
                    'October' => 'Octobre', 'November' => 'Novembre', 'December' => 'Décembre'
                ];
                $profile['member_since'] = strtr($profile['member_since'], $enToFr);
            }
            
            Utils::jsonResponse(['success' => true, 'message' => 'Profil mis à jour', 'profile' => $profile], 200);
        } catch (Exception $e) {
            Utils::jsonResponse(['success' => false, 'message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }
    
    private function actionSendMessage() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $recipient_id = $_POST['recipient_id'] ?? null;
        $content = $_POST['msg_content'] ?? '';
        
        if (!$recipient_id || empty($content)) {
            Utils::jsonResponse(['success' => false, 'message' => 'Données manquantes'], 400);
        }
        
        $conv = new ConversationModel($this->db);
        $conv_id = $conv->create($_SESSION['user_id'], $recipient_id);
        
        $msg = new MessageModel($this->db);
        $msg_id = $msg->send([
            'msg_conv_id' => $conv_id,
            'msg_sender_id' => $_SESSION['user_id'],
            'msg_recipient_id' => $recipient_id,
            'msg_content' => $content
        ]);
        
        Utils::jsonResponse(['success' => true, 'message' => 'Message envoyé', 'msg_id' => $msg_id], 201);
    }
    
    private function actionGetConversations() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $conv = new ConversationModel($this->db);
        $conversations = $conv->getByUserId($_SESSION['user_id'], $limit, $offset);
        
        Utils::jsonResponse(['success' => true, 'conversations' => $conversations]);
    }
    
    private function actionUploadUserPhoto() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $photo_type = $_POST['photo_type'] ?? null;
        $photo_url = $_POST['photo_url'] ?? null;
        
        if (!$photo_type || !$photo_url) {
            Utils::jsonResponse(['success' => false, 'message' => 'Données manquantes'], 400);
        }
        
        if (!in_array($photo_type, ['profile', 'cover'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Type de photo invalide'], 400);
        }
        
        $photoModel = new UserPhotoModel($this->db);
        $photo_id = $photoModel->create([
            'photo_user_id' => $_SESSION['user_id'],
            'photo_type' => $photo_type,
            'photo_url' => $photo_url,
            'photo_mime_type' => $_POST['photo_mime_type'] ?? null,
            'photo_size' => $_POST['photo_size'] ?? null
        ]);
        
        // Nettoyer les anciennes photos (garder 5 dernières)
        $photoModel->deleteOldPhotos($_SESSION['user_id'], $photo_type, 5);
        
        Utils::jsonResponse(['success' => true, 'message' => 'Photo uploadée', 'photo_id' => $photo_id], 201);
    }
    
    private function actionGetUserPhotos() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $photo_type = $_GET['photo_type'] ?? null;
        
        if (!$photo_type || !in_array($photo_type, ['profile', 'cover'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Type de photo invalide'], 400);
        }
        
        $photoModel = new UserPhotoModel($this->db);
        $photos = $photoModel->getByUserAndType($_SESSION['user_id'], $photo_type);
        
        Utils::jsonResponse(['success' => true, 'photos' => $photos]);
    }
    
    private function actionGetThemeSettings() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $themeModel = new UserThemeSettingsModel($this->db);
        $settings = $themeModel->getByUserId($_SESSION['user_id']);
        
        if (!$settings) {
            $themeModel->create($_SESSION['user_id']);
            $settings = $themeModel->getByUserId($_SESSION['user_id']);
        }
        
        Utils::jsonResponse(['success' => true, 'settings' => $settings]);
    }
    
    private function actionUpdateThemeSettings() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $themeModel = new UserThemeSettingsModel($this->db);
        $themeModel->update($_SESSION['user_id'], [
            'settings_hue' => $_POST['settings_hue'] ?? null,
            'settings_bg_theme' => $_POST['settings_bg_theme'] ?? null,
            'settings_fontSize' => $_POST['settings_fontSize'] ?? null,
            'settings_dark_mode' => $_POST['settings_dark_mode'] ?? null
        ]);
        
        Utils::jsonResponse(['success' => true, 'message' => 'Paramètres de thème mis à jour']);
    }
    
    private function actionAddStoryView() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $story_id = $_POST['story_id'] ?? null;
        
        if (!$story_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Story ID manquant'], 400);
        }
        
        $viewModel = new StoryViewsModel($this->db);
        $viewModel->addView($story_id, $_SESSION['user_id']);
        
        $storyModel = new StoryModel($this->db);
        $storyModel->incrementViewers($story_id);
        
        Utils::jsonResponse(['success' => true, 'message' => 'Vue enregistrée']);
    }
    
    private function actionGetStoryViewers() {
        $story_id = $_GET['story_id'] ?? null;
        
        if (!$story_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Story ID manquant'], 400);
        }
        
        $limit = (int)($_GET['limit'] ?? 50);
        
        $viewModel = new StoryViewsModel($this->db);
        $viewers = $viewModel->getViewers($story_id, $limit);
        
        Utils::jsonResponse(['success' => true, 'viewers' => $viewers, 'count' => count($viewers)]);
    }
    
    private function actionDeletePost() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $post_id = $_POST['post_id'] ?? null;
        
        if (!$post_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Post ID manquant'], 400);
        }
        
        $pub = new PublicationModel($this->db);
        $post = $pub->getById($post_id);
        
        if (!$post || $post['post_user_id'] != $_SESSION['user_id']) {
            Utils::jsonResponse(['success' => false, 'message' => 'Vous ne pouvez pas supprimer cette publication'], 403);
        }
        
        // Cascade delete: images, likes, commentaires
        $imgModel = new ImagePublicationModel($this->db);
        $images = $imgModel->getByPostId($post_id);
        foreach ($images as $img) {
            $imgModel->delete($img['image_id']);
            // Supprimer le fichier physique
            $filePath = __DIR__ . '/pub/' . $img['image_url'];
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }
        
        // Supprimer les likes
        $stmtLikes = $this->db->prepare('DELETE FROM likes_publications WHERE like_post_id = ?');
        $stmtLikes->execute([$post_id]);
        
        // Supprimer les commentaires et leurs likes/réponses
        $comModel = new CommentaireModel($this->db);
        $comments = $comModel->getByPostId($post_id, 1000); // Récupérer tous
        foreach ($comments as $comment) {
            // Supprimer les likes sur ce commentaire
            $stmtComLikes = $this->db->prepare('DELETE FROM likes_commentaires WHERE like_comment_id = ?');
            $stmtComLikes->execute([$comment['comment_id']]);
            
            // Supprimer le commentaire
            $comModel->delete($comment['comment_id']);
        }
        
        // Finalement supprimer la publication
        $pub->delete($post_id);
        
        Utils::jsonResponse(['success' => true, 'message' => 'Publication et tous ses contenus supprimés']);
    }
    
    private function actionDeleteComment() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $comment_id = $_POST['comment_id'] ?? null;
        
        if (!$comment_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Comment ID manquant'], 400);
        }
        
        $com = new CommentaireModel($this->db);
        $comment = $com->getById($comment_id);
        
        if (!$comment || $comment['comment_user_id'] != $_SESSION['user_id']) {
            Utils::jsonResponse(['success' => false, 'message' => 'Vous ne pouvez pas supprimer ce commentaire'], 403);
        }
        
        $post_id = $comment['comment_post_id'];
        $com->delete($comment_id);
        (new PublicationModel($this->db))->decrementComments($post_id);
        
        Utils::jsonResponse(['success' => true, 'message' => 'Commentaire supprimé']);
    }
    
    private function actionArchiveConversation() {
        if (!isset($_SESSION['user_id'])) {
            Utils::jsonResponse(['success' => false, 'message' => 'Non authentifié'], 401);
        }
        
        $conv_id = $_POST['conv_id'] ?? null;
        
        if (!$conv_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'Conversation ID manquant'], 400);
        }
        
        $stmt = $this->db->prepare('UPDATE conversations SET conv_archived = TRUE WHERE conv_id = ? AND (conv_user1_id = ? OR conv_user2_id = ?)');
        $result = $stmt->execute([$conv_id, $_SESSION['user_id'], $_SESSION['user_id']]);
        
        if ($result) {
            Utils::jsonResponse(['success' => true, 'message' => 'Conversation archivée']);
        } else {
            Utils::jsonResponse(['success' => false, 'message' => 'Erreur lors de l\'archivage'], 400);
        }
    }
    
    private function actionGetUserStats() {
        $user_id = $_GET['user_id'] ?? null;
        
        if (!$user_id) {
            Utils::jsonResponse(['success' => false, 'message' => 'User ID manquant'], 400);
        }
        
        $user = new Utilisateur($this->db);
        $profile = $user->getProfile($user_id);
        
        if (!$profile) {
            Utils::jsonResponse(['success' => false, 'message' => 'Utilisateur non trouvé'], 404);
        }
        
        $follow = new AbonnementModel($this->db);
        $pub = new PublicationModel($this->db);
        
        $followers = $follow->getFollowersCount($user_id);
        $following = $follow->getFollowingCount($user_id);
        
        $stmt = $this->db->prepare('SELECT SUM(post_likes_count) as total_likes, SUM(post_comments) as total_comments FROM publications WHERE post_user_id = ?');
        $stmt->execute([$user_id]);
        $engagement = $stmt->fetch();
        
        $stats = [
            'user_name' => $profile['user_name'],
            'user_username' => $profile['user_username'],
            'user_photo_url' => $profile['user_photo_url'],
            'user_posts_count' => $profile['user_posts_count'],
            'followers_count' => $followers,
            'following_count' => $following,
            'total_likes_received' => $engagement['total_likes'] ?? 0,
            'total_comments_received' => $engagement['total_comments'] ?? 0,
            'member_since' => $profile['user_member_date']
        ];
        
        Utils::jsonResponse(['success' => true, 'stats' => $stats]);
    }
}

// Auto-router pour les appels AJAX
if (php_sapi_name() !== 'cli' && !defined('AG7_NO_AUTO_ROUTER')) {
    if (isset($_REQUEST['action'])) {
        (new Router())->handle();
    }
}

?>
