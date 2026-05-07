-- Migration: Add Vocal Comments Support
-- Date: May 7, 2026
-- Purpose: Add audio columns to commentaires table to support vocal comments

-- Alter table commentaires to add audio support columns
ALTER TABLE commentaires 
ADD COLUMN comment_audio_url LONGTEXT NULL COMMENT 'URL du fichier audio (commentaire vocal)' AFTER comment_text,
ADD COLUMN comment_duration INT NULL COMMENT 'Durée de l\'audio en secondes' AFTER comment_audio_url,
MODIFY COLUMN comment_text VARCHAR(500) NULL COMMENT 'Texte du commentaire (NULL si commentaire vocal)';

-- Create audio/comments directory (handled by PHP, but documenting here)
-- Directory: /audio/comments/
-- Permission: 0777 (will be set automatically by PHP if needed)

-- Note: Files will be saved as: comment_TIMESTAMP_UNIQID.EXTENSION
-- Examples: comment_1715078400_507a3e.mp3, comment_1715078401_507a3f.wav
