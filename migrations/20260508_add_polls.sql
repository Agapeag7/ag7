-- Migration: Add Polls/Surveys Support
-- Date: May 8, 2026
-- Purpose: Add tables to support poll/survey publications

-- ==============================================================================
-- TABLE 14: SONDAGE (POLL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS polls (
    poll_id INT AUTO_INCREMENT PRIMARY KEY,
    poll_post_id INT NOT NULL UNIQUE COMMENT 'Lien unique à une publication',
    poll_user_id INT NOT NULL COMMENT 'Créateur du sondage',
    poll_question VARCHAR(255) NOT NULL COMMENT 'Question du sondage',
    poll_image_url LONGTEXT NULL COMMENT 'Image associée au sondage',
    poll_total_votes INT NOT NULL DEFAULT 0 COMMENT 'Total des votes',
    poll_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    poll_expires_at DATETIME NULL COMMENT 'Date d\'expiration du sondage',
    
    FOREIGN KEY (poll_post_id) REFERENCES publications(post_id) ON DELETE CASCADE,
    FOREIGN KEY (poll_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    INDEX idx_poll_post (poll_post_id),
    INDEX idx_poll_user (poll_user_id),
    INDEX idx_poll_created (poll_created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 15: OPTION_SONDAGE (POLL_OPTION)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS poll_options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    option_poll_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL COMMENT 'Texte de l\'option',
    option_order INT NOT NULL COMMENT 'Ordre d\'affichage',
    option_votes INT NOT NULL DEFAULT 0 COMMENT 'Nombre de votes pour cette option',
    option_description VARCHAR(500) NULL COMMENT 'Petite description optionnelle',
    
    FOREIGN KEY (option_poll_id) REFERENCES polls(poll_id) ON DELETE CASCADE,
    INDEX idx_option_poll (option_poll_id),
    UNIQUE KEY unique_option_order (option_poll_id, option_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 16: VOTE_SONDAGE (POLL_VOTE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS poll_votes (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    vote_poll_id INT NOT NULL,
    vote_option_id INT NOT NULL,
    vote_user_id INT NOT NULL,
    vote_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vote_poll_id) REFERENCES polls(poll_id) ON DELETE CASCADE,
    FOREIGN KEY (vote_option_id) REFERENCES poll_options(option_id) ON DELETE CASCADE,
    FOREIGN KEY (vote_user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_poll_vote (vote_poll_id, vote_user_id) COMMENT 'Un vote par utilisateur par sondage',
    INDEX idx_vote_poll (vote_poll_id),
    INDEX idx_vote_option (vote_option_id),
    INDEX idx_vote_user (vote_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TRIGGERS - Polls vote counting
-- ==============================================================================

-- TRIGGER: Incrémenter le compteur de votes quand un vote est inséré
DELIMITER $$
CREATE TRIGGER tr_insert_poll_vote 
AFTER INSERT ON poll_votes 
FOR EACH ROW 
BEGIN
    UPDATE poll_options SET option_votes = option_votes + 1 WHERE option_id = NEW.vote_option_id;
    UPDATE polls SET poll_total_votes = poll_total_votes + 1 WHERE poll_id = NEW.vote_poll_id;
END$$
DELIMITER ;

-- TRIGGER: Décrémenter le compteur de votes quand un vote est supprimé
DELIMITER $$
CREATE TRIGGER tr_delete_poll_vote 
AFTER DELETE ON poll_votes 
FOR EACH ROW 
BEGIN
    UPDATE poll_options SET option_votes = option_votes - 1 WHERE option_id = OLD.vote_option_id;
    UPDATE polls SET poll_total_votes = poll_total_votes - 1 WHERE poll_id = OLD.vote_poll_id;
END$$
DELIMITER ;

-- Note: Files for poll images will be saved in /pub/ directory like other post images
-- Examples: post_1715168000_50a3e.jpg
