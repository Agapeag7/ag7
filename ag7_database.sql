-- ==============================================================================
-- BASE DE DONNÉES AG7
-- Modèle MERISE - SQL MySQL/MariaDB
-- Date: 13 Avril 2026
-- ==============================================================================

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS ag7_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ag7_db;

-- ==============================================================================
-- TABLE 1: UTILISATEUR (USER)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_username VARCHAR(50) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    user_bio VARCHAR(500) NULL,
    user_location VARCHAR(100) NULL,
    user_photo_url LONGTEXT NULL COMMENT 'Base64 ou URL',
    user_member_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_posts_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_username (user_username),
    INDEX idx_user_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 2: PUBLICATION (POST)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS publications (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    post_user_id INT NOT NULL,
    post_content LONGTEXT NOT NULL,
    post_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    post_likes_count INT NOT NULL DEFAULT 0,
    post_comments INT NOT NULL DEFAULT 0,
    post_images_cnt INT NOT NULL DEFAULT 0 CHECK (post_images_cnt >= 0 AND post_images_cnt <= 10),
    post_visibility ENUM('public', 'followers') NOT NULL DEFAULT 'public',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    INDEX idx_post_user (post_user_id),
    INDEX idx_post_created (post_created_at DESC),
    INDEX idx_post_visibility (post_visibility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 3: IMAGE_PUBLICATION (POST_IMAGE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS images_publications (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    image_post_id INT NOT NULL,
    image_url LONGTEXT NOT NULL,
    image_mime_type VARCHAR(50) NOT NULL,
    image_order INT NOT NULL,
    image_width INT NULL,
    image_height INT NULL,
    image_size INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (image_post_id) REFERENCES publications(post_id) ON DELETE CASCADE,
    INDEX idx_image_post (image_post_id),
    UNIQUE KEY unique_image_order (image_post_id, image_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 4: COMMENTAIRE (COMMENT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS commentaires (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_post_id INT NOT NULL,
    comment_user_id INT NOT NULL,
    comment_text VARCHAR(500) NOT NULL,
    comment_anonym BOOLEAN NOT NULL DEFAULT FALSE,
    comment_likes INT NOT NULL DEFAULT 0,
    comment_parent_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (comment_post_id) REFERENCES publications(post_id) ON DELETE CASCADE,
    FOREIGN KEY (comment_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    FOREIGN KEY (comment_parent_id) REFERENCES commentaires(comment_id) ON DELETE CASCADE,
    INDEX idx_comment_post (comment_post_id),
    INDEX idx_comment_user (comment_user_id),
    INDEX idx_comment_parent (comment_parent_id),
    INDEX idx_comment_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 5: STORY (STORY)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS stories (
    story_id INT AUTO_INCREMENT PRIMARY KEY,
    story_user_id INT NOT NULL,
    story_type ENUM('text-image', 'text', 'image') NOT NULL,
    story_text VARCHAR(200) NULL,
    story_image_url LONGTEXT NULL,
    story_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    story_viewers INT NOT NULL DEFAULT 0,
    story_duration INT NOT NULL DEFAULT 24 COMMENT 'Durée en heures',
    story_expires_at DATETIME NOT NULL,
    
    FOREIGN KEY (story_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    INDEX idx_story_user (story_user_id),
    INDEX idx_story_created (story_created_at DESC),
    INDEX idx_story_expires (story_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 6: NOTIFICATION (NOTIFICATION)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    notif_id INT AUTO_INCREMENT PRIMARY KEY,
    notif_user_id INT NOT NULL,
    notif_type ENUM('message', 'follow', 'post', 'mention', 'update', 'like_comment', 'like_post', 'reply') NOT NULL,
    notif_icon VARCHAR(50) NOT NULL,
    notif_color VARCHAR(10) NOT NULL COMMENT 'Format Hex',
    notif_bg_color VARCHAR(10) NOT NULL COMMENT 'Format Hex',
    notif_title VARCHAR(100) NOT NULL,
    notif_text VARCHAR(255) NOT NULL,
    notif_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notif_read BOOLEAN NOT NULL DEFAULT FALSE,
    notif_entity_id INT NULL,
    notif_entity_type ENUM('post', 'user', 'comment', 'system') NULL,
    
    FOREIGN KEY (notif_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    INDEX idx_notif_user (notif_user_id),
    INDEX idx_notif_read (notif_read),
    INDEX idx_notif_created (notif_created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 7: CONVERSATION (CONVERSATION)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    conv_id INT AUTO_INCREMENT PRIMARY KEY,
    conv_user1_id INT NOT NULL,
    conv_user2_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    conv_archived BOOLEAN NOT NULL DEFAULT FALSE,
    
    FOREIGN KEY (conv_user1_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    FOREIGN KEY (conv_user2_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation (conv_user1_id, conv_user2_id),
    INDEX idx_conv_user1 (conv_user1_id),
    INDEX idx_conv_user2 (conv_user2_id),
    INDEX idx_conv_updated (updated_at DESC),
    
    CONSTRAINT chk_user_order CHECK (conv_user1_id < conv_user2_id),
    CONSTRAINT chk_different_users CHECK (conv_user1_id != conv_user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 8: MESSAGE (MESSAGE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS messages (
    msg_id INT AUTO_INCREMENT PRIMARY KEY,
    msg_conv_id INT NOT NULL,
    msg_sender_id INT NOT NULL,
    msg_recipient_id INT NOT NULL,
    msg_content LONGTEXT NOT NULL,
    msg_sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    msg_read BOOLEAN NOT NULL DEFAULT FALSE,
    msg_read_at DATETIME NULL,
    
    FOREIGN KEY (msg_conv_id) REFERENCES conversations(conv_id) ON DELETE CASCADE,
    FOREIGN KEY (msg_sender_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    FOREIGN KEY (msg_recipient_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    INDEX idx_msg_conv (msg_conv_id),
    INDEX idx_msg_sender (msg_sender_id),
    INDEX idx_msg_recipient (msg_recipient_id),
    INDEX idx_msg_sent (msg_sent_at DESC),
    INDEX idx_msg_read (msg_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 9: ABONNEMENT (FOLLOW)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS abonnements (
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    follow_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (follower_id, followed_id),
    FOREIGN KEY (follower_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    INDEX idx_followed (followed_id),
    
    CONSTRAINT chk_not_self_follow CHECK (follower_id != followed_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 10: LIKE_PUBLICATION (POST_LIKE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS likes_publications (
    like_post_user_id INT NOT NULL,
    like_post_id INT NOT NULL,
    like_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (like_post_user_id, like_post_id),
    FOREIGN KEY (like_post_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    FOREIGN KEY (like_post_id) REFERENCES publications(post_id) ON DELETE CASCADE,
    INDEX idx_like_post (like_post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 11: LIKE_COMMENTAIRE (COMMENT_LIKE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS likes_commentaires (
    like_com_user_id INT NOT NULL,
    like_comment_id INT NOT NULL,
    like_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (like_com_user_id, like_comment_id),
    FOREIGN KEY (like_com_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    FOREIGN KEY (like_comment_id) REFERENCES commentaires(comment_id) ON DELETE CASCADE,
    INDEX idx_like_comment (like_comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 12: PARAMÈTRES_THÈME (USER_THEME_SETTINGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS parametres_theme (
    settings_id INT AUTO_INCREMENT PRIMARY KEY,
    settings_user_id INT NOT NULL UNIQUE,
    settings_hue INT NOT NULL DEFAULT 160 CHECK (settings_hue >= 0 AND settings_hue <= 360),
    settings_bg_theme ENUM('light', 'dim', 'dark') NOT NULL DEFAULT 'light',
    settings_fontSize ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'medium',
    settings_dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
    settings_push_notif BOOLEAN NOT NULL DEFAULT TRUE,
    settings_sounds BOOLEAN NOT NULL DEFAULT TRUE,
    settings_show_status BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (settings_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    INDEX idx_settings_user (settings_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TABLE 13: VUE_STORY (STORY_VIEW)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS vues_stories (
    view_story_id INT NOT NULL,
    view_user_id INT NOT NULL,
    view_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (view_story_id, view_user_id),
    FOREIGN KEY (view_story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (view_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    INDEX idx_view_user (view_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- TRIGGERS - Gestion des compteurs dénormalisés
-- ==============================================================================

-- TRIGGER: Incrémenter le compteur de likes d'une publication
DELIMITER $$
CREATE TRIGGER tr_insert_post_like 
AFTER INSERT ON likes_publications 
FOR EACH ROW 
BEGIN
    UPDATE publications SET post_likes_count = post_likes_count + 1 WHERE post_id = NEW.like_post_id;
END$$
DELIMITER ;

-- TRIGGER: Décrémenter le compteur de likes d'une publication
DELIMITER $$
CREATE TRIGGER tr_delete_post_like 
AFTER DELETE ON likes_publications 
FOR EACH ROW 
BEGIN
    UPDATE publications SET post_likes_count = post_likes_count - 1 WHERE post_id = OLD.like_post_id;
END$$
DELIMITER ;

-- TRIGGER: Incrémenter le compteur de likes d'un commentaire
DELIMITER $$
CREATE TRIGGER tr_insert_comment_like 
AFTER INSERT ON likes_commentaires 
FOR EACH ROW 
BEGIN
    UPDATE commentaires SET comment_likes = comment_likes + 1 WHERE comment_id = NEW.like_comment_id;
END$$
DELIMITER ;

-- TRIGGER: Décrémenter le compteur de likes d'un commentaire
DELIMITER $$
CREATE TRIGGER tr_delete_comment_like 
AFTER DELETE ON likes_commentaires 
FOR EACH ROW 
BEGIN
    UPDATE commentaires SET comment_likes = comment_likes - 1 WHERE comment_id = OLD.like_comment_id;
END$$
DELIMITER ;

-- TRIGGER: Incrémenter le compteur de commentaires d'une publication
DELIMITER $$
CREATE TRIGGER tr_insert_comment 
AFTER INSERT ON commentaires 
FOR EACH ROW 
BEGIN
    UPDATE publications SET post_comments = post_comments + 1 WHERE post_id = NEW.comment_post_id;
END$$
DELIMITER ;

-- TRIGGER: Décrémenter le compteur de commentaires d'une publication
DELIMITER $$
CREATE TRIGGER tr_delete_comment 
AFTER DELETE ON commentaires 
FOR EACH ROW 
BEGIN
    UPDATE publications SET post_comments = post_comments - 1 WHERE post_id = OLD.comment_post_id;
END$$
DELIMITER ;

-- TRIGGER: Incrémenter le compteur de vues d'une story
DELIMITER $$
CREATE TRIGGER tr_insert_story_view 
AFTER INSERT ON vues_stories 
FOR EACH ROW 
BEGIN
    UPDATE stories SET story_viewers = story_viewers + 1 WHERE story_id = NEW.view_story_id;
END$$
DELIMITER ;

-- TRIGGER: Décrémenter le compteur de vues d'une story
DELIMITER $$
CREATE TRIGGER tr_delete_story_view 
AFTER DELETE ON vues_stories 
FOR EACH ROW 
BEGIN
    UPDATE stories SET story_viewers = story_viewers - 1 WHERE story_id = OLD.view_story_id;
END$$
DELIMITER ;

-- TRIGGER: Incrémenter le compteur de publications d'un utilisateur
DELIMITER $$
CREATE TRIGGER tr_insert_publication 
AFTER INSERT ON publications 
FOR EACH ROW 
BEGIN
    UPDATE utilisateurs SET user_posts_count = user_posts_count + 1 WHERE user_id = NEW.post_user_id;
END$$
DELIMITER ;

-- TRIGGER: Décrémenter le compteur de publications d'un utilisateur
DELIMITER $$
CREATE TRIGGER tr_delete_publication 
AFTER DELETE ON publications 
FOR EACH ROW 
BEGIN
    UPDATE utilisateurs SET user_posts_count = user_posts_count - 1 WHERE user_id = OLD.post_user_id;
END$$
DELIMITER ;

-- TRIGGER: Incrémenter le compteur d'images d'une publication
DELIMITER $$
CREATE TRIGGER tr_insert_image 
AFTER INSERT ON images_publications 
FOR EACH ROW 
BEGIN
    UPDATE publications SET post_images_cnt = post_images_cnt + 1 WHERE post_id = NEW.image_post_id;
END$$
DELIMITER ;

-- TRIGGER: Décrémenter le compteur d'images d'une publication
DELIMITER $$
CREATE TRIGGER tr_delete_image 
AFTER DELETE ON images_publications 
FOR EACH ROW 
BEGIN
    UPDATE publications SET post_images_cnt = post_images_cnt - 1 WHERE post_id = OLD.image_post_id;
END$$
DELIMITER ;


-- ==============================================================================
-- VUES MATERIALISÉES (Recommandées)
-- ==============================================================================

-- VUE: Statistiques utilisateur
CREATE VIEW vue_user_stats AS
SELECT 
    u.user_id,
    u.user_username,
    u.user_name,
    COUNT(DISTINCT p.post_id) AS posts_count,
    COUNT(DISTINCT ab.follower_id) AS followers_count,
    COUNT(DISTINCT ab2.followed_id) AS following_count,
    SUM(CASE WHEN lp.like_post_id IS NOT NULL THEN 1 ELSE 0 END) AS likes_received
FROM utilisateurs u
LEFT JOIN publications p ON u.user_id = p.post_user_id
LEFT JOIN abonnements ab ON u.user_id = ab.followed_id
LEFT JOIN abonnements ab2 ON u.user_id = ab2.follower_id
LEFT JOIN likes_publications lp ON p.post_id = lp.like_post_id
GROUP BY u.user_id;

-- VUE: Engagement des publications
CREATE VIEW vue_post_engagement AS
SELECT 
    p.post_id,
    p.post_user_id,
    p.post_created_at,
    p.post_likes_count,
    p.post_comments,
    (p.post_likes_count + p.post_comments) AS total_interactions
FROM publications p;

-- VUE: Publications tendance
CREATE VIEW vue_trending_posts AS
SELECT 
    p.post_id,
    p.post_user_id,
    u.user_username,
    p.post_content,
    p.post_likes_count,
    p.post_comments,
    (p.post_likes_count + p.post_comments) AS engagement_score,
    p.post_created_at,
    ROW_NUMBER() OVER (ORDER BY (p.post_likes_count + p.post_comments) DESC) AS ranking
FROM publications p
INNER JOIN utilisateurs u ON p.post_user_id = u.user_id
WHERE p.post_created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);


-- ==============================================================================
-- DONNÉES DE TEST / PEUPLEMENT INITIAL (Optionnel)
-- ==============================================================================

-- Insérer des utilisateurs de test
INSERT INTO utilisateurs (user_name, user_username, user_password, user_bio, user_location, user_member_date) VALUES
('Alexandre Gauthier', 'alex_gauthier', '$2y$10$example_hash_password', 'Lead Designer & Front-end Dev. Passionné par les interfaces modernes et l\'UX.', 'Butembo, DRC', NOW()),
('Marie Lambert', 'marie_lambert', '$2y$10$example_hash_password', 'UX Designer, Coffee addict ☕', 'Paris, France', NOW()),
('Thomas Dubois', 'thomas_dubois', '$2y$10$example_hash_password', 'Frontend Dev | React | Node.js', 'Lyon, France', NOW()),
('Sophie Caron', 'sophie_caron', '$2y$10$example_hash_password', 'Product Manager | Innovation enthusiast', 'Marseille, France', NOW()),
('Antoine Lefevre', 'antoine_lf', '$2y$10$example_hash_password', 'Digital Strategist | Growth Hacker', 'London, UK', NOW());

-- Insérer les paramètres de thème par défaut pour chaque utilisateur
INSERT INTO parametres_theme (settings_user_id, settings_hue, settings_bg_theme, settings_fontSize, settings_dark_mode)
SELECT user_id, 160, 'light', 'medium', FALSE FROM utilisateurs;

-- Insérer quelques abonnements
INSERT INTO abonnements (follower_id, followed_id) VALUES
(2, 1), (3, 1), (4, 1), (5, 1),
(1, 2), (1, 3), (1, 4);

-- Insérer une publication de test
INSERT INTO publications (post_user_id, post_content, post_visibility) VALUES
(1, 'Les nouvelles maquettes de l\'application Ag7 sont disponibles ! Support multi-images comme Instagram 🎨', 'public');

-- Insérer un commentaire de test
INSERT INTO commentaires (comment_post_id, comment_user_id, comment_text, comment_anonym) VALUES
(1, 2, 'Super boulot !', FALSE);

-- Insérer une story de test
INSERT INTO stories (story_user_id, story_type, story_text, story_created_at, story_expires_at) VALUES
(1, 'text-image', 'Bonjour à tous ! ☀️', NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR));

-- Insérer une conversation de test
INSERT INTO conversations (conv_user1_id, conv_user2_id) VALUES
(1, 2);

-- Insérer un message de test
INSERT INTO messages (msg_conv_id, msg_sender_id, msg_recipient_id, msg_content) VALUES
(1, 1, 2, 'Salut Marie ! Comment ça va ?');

-- Insérer des notifications de test
INSERT INTO notifications (notif_user_id, notif_type, notif_icon, notif_color, notif_bg_color, notif_title, notif_text) VALUES
(1, 'follow', 'fas fa-user-check', '#2668f1', '#0c4a6e', 'Nouveau suivi', 'Thomas Dubois suit votre profil.');


-- ==============================================================================
-- COMMANDES UTILES (Commentaires)
-- ==============================================================================
/*

-- Nettoyer toutes les données (attention: DESTRUCTIF):
-- TRUNCATE TABLE vues_stories;
-- TRUNCATE TABLE likes_commentaires;
-- TRUNCATE TABLE likes_publications;
-- TRUNCATE TABLE abonnements;
-- TRUNCATE TABLE messages;
-- TRUNCATE TABLE conversations;
-- TRUNCATE TABLE notifications;
-- TRUNCATE TABLE images_publications;
-- TRUNCATE TABLE commentaires;
-- TRUNCATE TABLE stories;
-- TRUNCATE TABLE publications;
-- TRUNCATE TABLE parametres_theme;
-- TRUNCATE TABLE utilisateurs;

-- Voir les statistiques des utilisateurs:
-- SELECT * FROM vue_user_stats;

-- Voir les posts tendance:
-- SELECT * FROM vue_trending_posts ORDER BY ranking;

-- Voir l'engagement des publications:
-- SELECT * FROM vue_post_engagement ORDER BY total_interactions DESC;

-- Supprimer la base de données complètement:
-- DROP DATABASE ag7_db;

*/

-- ==============================================================================
-- FIN DU SCRIPT SQL AG7
-- Version: 1.0
-- Date: 13 Avril 2026
-- Compliant: MERISE Standard
-- ==============================================================================
