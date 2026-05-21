-- Migration: Add Vocal Posts Support
-- Date: May 21, 2026
-- Purpose: Add audio columns to publications table to support vocal posts

-- Alter table publications to add audio support columns
ALTER TABLE publications 
ADD COLUMN post_audio_url LONGTEXT NULL COMMENT 'URL du fichier audio (publication vocale)' AFTER post_content,
ADD COLUMN post_audio_duration INT NULL COMMENT 'Durée de l\'audio en secondes' AFTER post_audio_url,
ADD COLUMN post_audio_listens INT NOT NULL DEFAULT 0 COMMENT 'Nombre d\'écoutes de la publication vocale' AFTER post_audio_duration;

-- Create audio/posts directory (handled by PHP, but documenting here)
-- Directory: /audio/posts/
-- Permission: 0777 (will be set automatically by PHP if needed)

-- Note: Files will be saved as: post_TIMESTAMP_UNIQID.EXTENSION
-- Examples: post_1715078400_507a3e.mp3, post_1715078401_507a3f.wav
