-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 26 juin 2026 à 14:47
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `ag7_db`
--

DELIMITER $$
--
-- Procédures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_add_user_photo` (IN `p_user_id` INT, IN `p_photo_type` ENUM('profile','cover'), IN `p_photo_url` LONGTEXT, IN `p_photo_mime_type` VARCHAR(50), IN `p_photo_size` INT)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Marquer les anciennes photos du même type comme non-courantes
    UPDATE user_photos 
    SET is_current = FALSE 
    WHERE photo_user_id = p_user_id 
    AND photo_type = p_photo_type;
    
    -- Insérer la nouvelle photo
    INSERT INTO user_photos (photo_user_id, photo_type, photo_url, photo_mime_type, photo_size, is_current)
    VALUES (p_user_id, p_photo_type, p_photo_url, p_photo_mime_type, p_photo_size, TRUE);
    
    -- Mettre à jour le timestamp dans la table utilisateurs
    IF p_photo_type = 'profile' THEN
        UPDATE utilisateurs SET user_photo_updated_at = CURRENT_TIMESTAMP WHERE user_id = p_user_id;
    ELSE
        UPDATE utilisateurs SET user_cover_updated_at = CURRENT_TIMESTAMP WHERE user_id = p_user_id;
    END IF;
    
    COMMIT;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `abonnements`
--

CREATE TABLE `abonnements` (
  `follower_id` int(11) NOT NULL,
  `followed_id` int(11) NOT NULL,
  `follow_date` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Déchargement des données de la table `abonnements`
--

-- --------------------------------------------------------

--
-- Structure de la table `canal_membres`
--

CREATE TABLE `canal_membres` (
  `canal_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `joined_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `canal_membres`
--

-- --------------------------------------------------------

--
-- Structure de la table `canaux`
--

CREATE TABLE `canaux` (
  `canal_id` int(11) NOT NULL,
  `canal_name` varchar(100) NOT NULL,
  `canal_description` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `is_ephemeral` tinyint(1) DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `canaux`
--

-- --------------------------------------------------------

--
-- Structure de la table `commentaires`
--

CREATE TABLE `commentaires` (
  `comment_id` int(11) NOT NULL,
  `comment_post_id` int(11) NOT NULL,
  `comment_user_id` int(11) NOT NULL,
  `comment_text` varchar(500) DEFAULT NULL COMMENT 'Texte du commentaire (NULL si commentaire vocal)',
  `comment_audio_url` longtext DEFAULT NULL COMMENT 'URL du fichier audio (commentaire vocal)',
  `comment_duration` int(11) DEFAULT NULL COMMENT 'Durée de l''audio en secondes',
  `comment_anonym` tinyint(1) NOT NULL DEFAULT 0,
  `comment_likes` int(11) NOT NULL DEFAULT 0,
  `comment_parent_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `commentaires`
--

--
-- Déclencheurs `commentaires`
--
DELIMITER $$
CREATE TRIGGER `tr_delete_comment` AFTER DELETE ON `commentaires` FOR EACH ROW BEGIN
    UPDATE publications SET post_comments = post_comments - 1 WHERE post_id = OLD.comment_post_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_insert_comment` AFTER INSERT ON `commentaires` FOR EACH ROW BEGIN
    UPDATE publications SET post_comments = post_comments + 1 WHERE post_id = NEW.comment_post_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `conversations`
--

CREATE TABLE `conversations` (
  `conv_id` int(11) NOT NULL,
  `conv_user1_id` int(11) NOT NULL,
  `conv_user2_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `conv_archived` tinyint(1) NOT NULL DEFAULT 0,
  `last_message` text DEFAULT NULL,
  `last_message_time` datetime DEFAULT NULL
) ;

--
-- Déchargement des données de la table `conversations`
--

-- --------------------------------------------------------

--
-- Structure de la table `images_publications`
--

CREATE TABLE `images_publications` (
  `image_id` int(11) NOT NULL,
  `image_post_id` int(11) NOT NULL,
  `image_url` longtext NOT NULL,
  `image_mime_type` varchar(50) NOT NULL,
  `image_order` int(11) NOT NULL,
  `image_width` int(11) DEFAULT NULL,
  `image_height` int(11) DEFAULT NULL,
  `image_size` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `images_publications`
--

--
-- Déclencheurs `images_publications`
--
DELIMITER $$
CREATE TRIGGER `tr_delete_image` AFTER DELETE ON `images_publications` FOR EACH ROW BEGIN
    UPDATE publications SET post_images_cnt = post_images_cnt - 1 WHERE post_id = OLD.image_post_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_insert_image` AFTER INSERT ON `images_publications` FOR EACH ROW BEGIN
    UPDATE publications SET post_images_cnt = post_images_cnt + 1 WHERE post_id = NEW.image_post_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `likes_commentaires`
--

CREATE TABLE `likes_commentaires` (
  `like_com_user_id` int(11) NOT NULL,
  `like_comment_id` int(11) NOT NULL,
  `like_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `likes_commentaires`
--

--
-- Déclencheurs `likes_commentaires`
--
DELIMITER $$
CREATE TRIGGER `tr_delete_comment_like` AFTER DELETE ON `likes_commentaires` FOR EACH ROW BEGIN
    UPDATE commentaires SET comment_likes = comment_likes - 1 WHERE comment_id = OLD.like_comment_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_insert_comment_like` AFTER INSERT ON `likes_commentaires` FOR EACH ROW BEGIN
    UPDATE commentaires SET comment_likes = comment_likes + 1 WHERE comment_id = NEW.like_comment_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `likes_publications`
--

CREATE TABLE `likes_publications` (
  `like_post_user_id` int(11) NOT NULL,
  `like_post_id` int(11) NOT NULL,
  `like_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `likes_publications`
--

--
-- Déclencheurs `likes_publications`
--
DELIMITER $$
CREATE TRIGGER `tr_delete_post_like` AFTER DELETE ON `likes_publications` FOR EACH ROW BEGIN
    UPDATE publications SET post_likes_count = post_likes_count - 1 WHERE post_id = OLD.like_post_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_insert_post_like` AFTER INSERT ON `likes_publications` FOR EACH ROW BEGIN
    UPDATE publications SET post_likes_count = post_likes_count + 1 WHERE post_id = NEW.like_post_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `msg_id` int(11) NOT NULL,
  `msg_conv_id` int(11) NOT NULL,
  `msg_sender_id` int(11) NOT NULL,
  `msg_recipient_id` int(11) NOT NULL,
  `msg_content` longtext NOT NULL,
  `msg_sent_at` datetime NOT NULL DEFAULT current_timestamp(),
  `msg_read` tinyint(1) NOT NULL DEFAULT 0,
  `msg_read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages`
--

-- --------------------------------------------------------

--
-- Structure de la table `messages_canal`
--

CREATE TABLE `messages_canal` (
  `msg_id` int(11) NOT NULL,
  `canal_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `msg_content` text NOT NULL,
  `sent_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages_canal`
--

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `notif_id` int(11) NOT NULL,
  `notif_user_id` int(11) NOT NULL,
  `notif_type` enum('message','follow','post','mention','update','like_comment','like_post','reply') NOT NULL,
  `notif_icon` varchar(50) NOT NULL,
  `notif_color` varchar(10) NOT NULL COMMENT 'Format Hex',
  `notif_bg_color` varchar(10) NOT NULL COMMENT 'Format Hex',
  `notif_title` varchar(100) NOT NULL,
  `notif_text` varchar(255) NOT NULL,
  `notif_created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `notif_read` tinyint(1) NOT NULL DEFAULT 0,
  `notif_entity_id` int(11) DEFAULT NULL,
  `notif_entity_type` enum('post','user','comment','system') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `parametres_theme`
--

CREATE TABLE `parametres_theme` (
  `settings_id` int(11) NOT NULL,
  `settings_user_id` int(11) NOT NULL,
  `settings_hue` int(11) NOT NULL DEFAULT 160 CHECK (`settings_hue` >= 0 and `settings_hue` <= 360),
  `settings_bg_theme` enum('light','dim','dark') NOT NULL DEFAULT 'light',
  `settings_fontSize` enum('small','medium','large') NOT NULL DEFAULT 'medium',
  `settings_dark_mode` tinyint(1) NOT NULL DEFAULT 0,
  `settings_push_notif` tinyint(1) NOT NULL DEFAULT 1,
  `settings_sounds` tinyint(1) NOT NULL DEFAULT 1,
  `settings_show_status` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `polls`
--

CREATE TABLE `polls` (
  `poll_id` int(11) NOT NULL,
  `poll_post_id` int(11) NOT NULL COMMENT 'Lien unique à une publication',
  `poll_user_id` int(11) NOT NULL COMMENT 'Créateur du sondage',
  `poll_question` varchar(255) NOT NULL COMMENT 'Question du sondage',
  `poll_image_url` longtext DEFAULT NULL COMMENT 'Image associée au sondage',
  `poll_total_votes` int(11) NOT NULL DEFAULT 0 COMMENT 'Total des votes',
  `poll_created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `poll_expires_at` datetime DEFAULT NULL COMMENT 'Date d''expiration du sondage'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `polls`
--

-- --------------------------------------------------------

--
-- Structure de la table `poll_options`
--

CREATE TABLE `poll_options` (
  `option_id` int(11) NOT NULL,
  `option_poll_id` int(11) NOT NULL,
  `option_text` varchar(255) NOT NULL COMMENT 'Texte de l''option',
  `option_image_url` varchar(255) DEFAULT NULL,
  `option_order` int(11) NOT NULL COMMENT 'Ordre d''affichage',
  `option_votes` int(11) NOT NULL DEFAULT 0 COMMENT 'Nombre de votes pour cette option',
  `option_description` varchar(500) DEFAULT NULL COMMENT 'Petite description optionnelle'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `poll_options`
--

-- --------------------------------------------------------

--
-- Structure de la table `poll_votes`
--

CREATE TABLE `poll_votes` (
  `vote_id` int(11) NOT NULL,
  `vote_poll_id` int(11) NOT NULL,
  `vote_option_id` int(11) NOT NULL,
  `vote_user_id` int(11) NOT NULL,
  `vote_created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `poll_votes`
--

--
-- Déclencheurs `poll_votes`
--
DELIMITER $$
CREATE TRIGGER `tr_delete_poll_vote` AFTER DELETE ON `poll_votes` FOR EACH ROW BEGIN
    UPDATE poll_options SET option_votes = option_votes - 1 WHERE option_id = OLD.vote_option_id;
    UPDATE polls SET poll_total_votes = poll_total_votes - 1 WHERE poll_id = OLD.vote_poll_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_insert_poll_vote` AFTER INSERT ON `poll_votes` FOR EACH ROW BEGIN
    UPDATE poll_options SET option_votes = option_votes + 1 WHERE option_id = NEW.vote_option_id;
    UPDATE polls SET poll_total_votes = poll_total_votes + 1 WHERE poll_id = NEW.vote_poll_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `publications`
--

CREATE TABLE `publications` (
  `post_id` int(11) NOT NULL,
  `post_user_id` int(11) NOT NULL,
  `post_content` longtext NOT NULL,
  `post_audio_url` longtext DEFAULT NULL COMMENT 'URL du fichier audio (publication vocale)',
  `post_audio_duration` int(11) DEFAULT NULL COMMENT 'Durée de l''audio en secondes',
  `post_audio_listens` int(11) NOT NULL DEFAULT 0 COMMENT 'Nombre d''écoutes de la publication vocale',
  `post_created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `post_likes_count` int(11) NOT NULL DEFAULT 0,
  `post_comments` int(11) NOT NULL DEFAULT 0,
  `post_images_cnt` int(11) NOT NULL DEFAULT 0 CHECK (`post_images_cnt` >= 0 and `post_images_cnt` <= 10),
  `post_visibility` enum('public','followers') NOT NULL DEFAULT 'public',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `publications`
--

--
-- Déclencheurs `publications`
--
DELIMITER $$
CREATE TRIGGER `tr_delete_publication` AFTER DELETE ON `publications` FOR EACH ROW BEGIN
    UPDATE utilisateurs SET user_posts_count = user_posts_count - 1 WHERE user_id = OLD.post_user_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_insert_publication` AFTER INSERT ON `publications` FOR EACH ROW BEGIN
    UPDATE utilisateurs SET user_posts_count = user_posts_count + 1 WHERE user_id = NEW.post_user_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `stories`
--

CREATE TABLE `stories` (
  `story_id` int(11) NOT NULL,
  `story_user_id` int(11) NOT NULL,
  `story_type` enum('text-image','text','image') NOT NULL,
  `story_text` varchar(200) DEFAULT NULL,
  `story_image_url` longtext DEFAULT NULL,
  `story_created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `story_viewers` int(11) NOT NULL DEFAULT 0,
  `story_duration` int(11) NOT NULL DEFAULT 24 COMMENT 'Durée en heures',
  `story_expires_at` datetime NOT NULL,
  `event_id` int(11) DEFAULT NULL,
  `is_collaborative` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `stories`
--

-- --------------------------------------------------------

--
-- Structure de la table `story_events`
--

CREATE TABLE `story_events` (
  `event_id` int(11) NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `event_description` text DEFAULT NULL,
  `event_cover_url` varchar(255) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `is_public` tinyint(1) DEFAULT 1,
  `invite_code` varchar(32) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `story_event_members`
--

CREATE TABLE `story_event_members` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('owner','contributor','viewer') DEFAULT 'contributor',
  `joined_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user_photos`
--

CREATE TABLE `user_photos` (
  `photo_id` int(11) NOT NULL,
  `photo_user_id` int(11) NOT NULL,
  `photo_type` enum('profile','cover') NOT NULL COMMENT 'Type de photo: profil ou couverture',
  `photo_url` longtext NOT NULL COMMENT 'Photo - Base64 ou URL',
  `photo_mime_type` varchar(50) DEFAULT NULL COMMENT 'Type MIME de l''image',
  `photo_size` int(11) DEFAULT NULL COMMENT 'Taille en bytes',
  `is_current` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Photo actuellement utilisée',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `user_id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_username` varchar(50) NOT NULL,
  `user_password` varchar(255) NOT NULL,
  `user_bio` varchar(500) DEFAULT NULL,
  `user_location` varchar(100) DEFAULT NULL,
  `user_photo_url` longtext DEFAULT NULL COMMENT 'Photo de profil - Base64 ou URL',
  `user_cover_photo_url` longtext DEFAULT NULL COMMENT 'Photo de couverture - Base64 ou URL',
  `user_photo_updated_at` datetime DEFAULT NULL COMMENT 'Dernière mise à jour de la photo de profil',
  `user_cover_updated_at` datetime DEFAULT NULL COMMENT 'Dernière mise à jour de la photo de couverture',
  `user_member_date` datetime NOT NULL DEFAULT current_timestamp(),
  `user_posts_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

-- --------------------------------------------------------

--
-- Structure de la table `vues_stories`
--

CREATE TABLE `vues_stories` (
  `view_story_id` int(11) NOT NULL,
  `view_user_id` int(11) NOT NULL,
  `view_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vues_stories`
--

--
-- Déclencheurs `vues_stories`
--
DELIMITER $$
CREATE TRIGGER `tr_delete_story_view` AFTER DELETE ON `vues_stories` FOR EACH ROW BEGIN
    UPDATE stories SET story_viewers = story_viewers - 1 WHERE story_id = OLD.view_story_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_insert_story_view` AFTER INSERT ON `vues_stories` FOR EACH ROW BEGIN
    UPDATE stories SET story_viewers = story_viewers + 1 WHERE story_id = NEW.view_story_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_post_engagement`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `vue_post_engagement` (
`post_id` int(11)
,`post_user_id` int(11)
,`post_created_at` datetime
,`post_likes_count` int(11)
,`post_comments` int(11)
,`total_interactions` bigint(12)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_trending_posts`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `vue_trending_posts` (
`post_id` int(11)
,`post_user_id` int(11)
,`user_username` varchar(50)
,`post_content` longtext
,`post_likes_count` int(11)
,`post_comments` int(11)
,`engagement_score` bigint(12)
,`post_created_at` datetime
,`ranking` bigint(21)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_user_stats`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `vue_user_stats` (
`user_id` int(11)
,`user_username` varchar(50)
,`user_name` varchar(255)
,`posts_count` bigint(21)
,`followers_count` bigint(21)
,`following_count` bigint(21)
,`likes_received` decimal(22,0)
);

-- --------------------------------------------------------

--
-- Structure de la vue `vue_post_engagement`
--
DROP TABLE IF EXISTS `vue_post_engagement`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_post_engagement`  AS SELECT `p`.`post_id` AS `post_id`, `p`.`post_user_id` AS `post_user_id`, `p`.`post_created_at` AS `post_created_at`, `p`.`post_likes_count` AS `post_likes_count`, `p`.`post_comments` AS `post_comments`, `p`.`post_likes_count`+ `p`.`post_comments` AS `total_interactions` FROM `publications` AS `p` ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_trending_posts`
--
DROP TABLE IF EXISTS `vue_trending_posts`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_trending_posts`  AS SELECT `p`.`post_id` AS `post_id`, `p`.`post_user_id` AS `post_user_id`, `u`.`user_username` AS `user_username`, `p`.`post_content` AS `post_content`, `p`.`post_likes_count` AS `post_likes_count`, `p`.`post_comments` AS `post_comments`, `p`.`post_likes_count`+ `p`.`post_comments` AS `engagement_score`, `p`.`post_created_at` AS `post_created_at`, row_number() over ( order by `p`.`post_likes_count` + `p`.`post_comments` desc) AS `ranking` FROM (`publications` `p` join `utilisateurs` `u` on(`p`.`post_user_id` = `u`.`user_id`)) WHERE `p`.`post_created_at` >= current_timestamp() - interval 7 day ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_user_stats`
--
DROP TABLE IF EXISTS `vue_user_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_user_stats`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`user_username` AS `user_username`, `u`.`user_name` AS `user_name`, count(distinct `p`.`post_id`) AS `posts_count`, count(distinct `ab`.`follower_id`) AS `followers_count`, count(distinct `ab2`.`followed_id`) AS `following_count`, sum(case when `lp`.`like_post_id` is not null then 1 else 0 end) AS `likes_received` FROM ((((`utilisateurs` `u` left join `publications` `p` on(`u`.`user_id` = `p`.`post_user_id`)) left join `abonnements` `ab` on(`u`.`user_id` = `ab`.`followed_id`)) left join `abonnements` `ab2` on(`u`.`user_id` = `ab2`.`follower_id`)) left join `likes_publications` `lp` on(`p`.`post_id` = `lp`.`like_post_id`)) GROUP BY `u`.`user_id` ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `abonnements`
--
ALTER TABLE `abonnements`
  ADD PRIMARY KEY (`follower_id`,`followed_id`),
  ADD KEY `idx_followed` (`followed_id`);

--
-- Index pour la table `canal_membres`
--
ALTER TABLE `canal_membres`
  ADD PRIMARY KEY (`canal_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `canaux`
--
ALTER TABLE `canaux`
  ADD PRIMARY KEY (`canal_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `commentaires`
--
ALTER TABLE `commentaires`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `idx_comment_post` (`comment_post_id`),
  ADD KEY `idx_comment_user` (`comment_user_id`),
  ADD KEY `idx_comment_parent` (`comment_parent_id`),
  ADD KEY `idx_comment_created` (`created_at`);

--
-- Index pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`conv_id`),
  ADD UNIQUE KEY `unique_conversation` (`conv_user1_id`,`conv_user2_id`),
  ADD KEY `idx_conv_user1` (`conv_user1_id`),
  ADD KEY `idx_conv_user2` (`conv_user2_id`),
  ADD KEY `idx_conv_updated` (`updated_at`),
  ADD KEY `idx_updated` (`updated_at`);

--
-- Index pour la table `images_publications`
--
ALTER TABLE `images_publications`
  ADD PRIMARY KEY (`image_id`),
  ADD UNIQUE KEY `unique_image_order` (`image_post_id`,`image_order`),
  ADD KEY `idx_image_post` (`image_post_id`);

--
-- Index pour la table `likes_commentaires`
--
ALTER TABLE `likes_commentaires`
  ADD PRIMARY KEY (`like_com_user_id`,`like_comment_id`),
  ADD KEY `idx_like_comment` (`like_comment_id`);

--
-- Index pour la table `likes_publications`
--
ALTER TABLE `likes_publications`
  ADD PRIMARY KEY (`like_post_user_id`,`like_post_id`),
  ADD KEY `idx_like_post` (`like_post_id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`msg_id`),
  ADD KEY `idx_msg_conv` (`msg_conv_id`),
  ADD KEY `idx_msg_sender` (`msg_sender_id`),
  ADD KEY `idx_msg_recipient` (`msg_recipient_id`),
  ADD KEY `idx_msg_sent` (`msg_sent_at`),
  ADD KEY `idx_msg_read` (`msg_read`),
  ADD KEY `idx_conv_read` (`msg_conv_id`,`msg_recipient_id`,`msg_read`);

--
-- Index pour la table `messages_canal`
--
ALTER TABLE `messages_canal`
  ADD PRIMARY KEY (`msg_id`),
  ADD KEY `canal_id` (`canal_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notif_id`),
  ADD KEY `idx_notif_user` (`notif_user_id`),
  ADD KEY `idx_notif_read` (`notif_read`),
  ADD KEY `idx_notif_created` (`notif_created_at`);

--
-- Index pour la table `parametres_theme`
--
ALTER TABLE `parametres_theme`
  ADD PRIMARY KEY (`settings_id`),
  ADD UNIQUE KEY `settings_user_id` (`settings_user_id`),
  ADD KEY `idx_settings_user` (`settings_user_id`);

--
-- Index pour la table `polls`
--
ALTER TABLE `polls`
  ADD PRIMARY KEY (`poll_id`),
  ADD UNIQUE KEY `poll_post_id` (`poll_post_id`),
  ADD KEY `idx_poll_post` (`poll_post_id`),
  ADD KEY `idx_poll_user` (`poll_user_id`),
  ADD KEY `idx_poll_created` (`poll_created_at`);

--
-- Index pour la table `poll_options`
--
ALTER TABLE `poll_options`
  ADD PRIMARY KEY (`option_id`),
  ADD UNIQUE KEY `unique_option_order` (`option_poll_id`,`option_order`),
  ADD KEY `idx_option_poll` (`option_poll_id`);

--
-- Index pour la table `poll_votes`
--
ALTER TABLE `poll_votes`
  ADD PRIMARY KEY (`vote_id`),
  ADD UNIQUE KEY `unique_user_poll_vote` (`vote_poll_id`,`vote_user_id`) COMMENT 'Un vote par utilisateur par sondage',
  ADD KEY `idx_vote_poll` (`vote_poll_id`),
  ADD KEY `idx_vote_option` (`vote_option_id`),
  ADD KEY `idx_vote_user` (`vote_user_id`);

--
-- Index pour la table `publications`
--
ALTER TABLE `publications`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `idx_post_user` (`post_user_id`),
  ADD KEY `idx_post_created` (`post_created_at`),
  ADD KEY `idx_post_visibility` (`post_visibility`);

--
-- Index pour la table `stories`
--
ALTER TABLE `stories`
  ADD PRIMARY KEY (`story_id`),
  ADD KEY `idx_story_user` (`story_user_id`),
  ADD KEY `idx_story_created` (`story_created_at`),
  ADD KEY `idx_story_expires` (`story_expires_at`),
  ADD KEY `event_id` (`event_id`);

--
-- Index pour la table `story_events`
--
ALTER TABLE `story_events`
  ADD PRIMARY KEY (`event_id`),
  ADD UNIQUE KEY `invite_code` (`invite_code`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `story_event_members`
--
ALTER TABLE `story_event_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `event_user` (`event_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `user_photos`
--
ALTER TABLE `user_photos`
  ADD PRIMARY KEY (`photo_id`),
  ADD KEY `idx_photo_user` (`photo_user_id`),
  ADD KEY `idx_photo_type` (`photo_type`),
  ADD KEY `idx_photo_created` (`created_at`),
  ADD KEY `idx_photo_current` (`is_current`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `user_username` (`user_username`),
  ADD KEY `idx_user_username` (`user_username`),
  ADD KEY `idx_user_created` (`created_at`);

--
-- Index pour la table `vues_stories`
--
ALTER TABLE `vues_stories`
  ADD PRIMARY KEY (`view_story_id`,`view_user_id`),
  ADD KEY `idx_view_user` (`view_user_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `canaux`
--
ALTER TABLE `canaux`
  MODIFY `canal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `commentaires`
--
ALTER TABLE `commentaires`
  MODIFY `comment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT pour la table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `conv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `images_publications`
--
ALTER TABLE `images_publications`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `msg_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `messages_canal`
--
ALTER TABLE `messages_canal`
  MODIFY `msg_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notif_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `parametres_theme`
--
ALTER TABLE `parametres_theme`
  MODIFY `settings_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `polls`
--
ALTER TABLE `polls`
  MODIFY `poll_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `poll_options`
--
ALTER TABLE `poll_options`
  MODIFY `option_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT pour la table `poll_votes`
--
ALTER TABLE `poll_votes`
  MODIFY `vote_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT pour la table `publications`
--
ALTER TABLE `publications`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT pour la table `stories`
--
ALTER TABLE `stories`
  MODIFY `story_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT pour la table `story_events`
--
ALTER TABLE `story_events`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `story_event_members`
--
ALTER TABLE `story_event_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `user_photos`
--
ALTER TABLE `user_photos`
  MODIFY `photo_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `abonnements`
--
ALTER TABLE `abonnements`
  ADD CONSTRAINT `abonnements_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `abonnements_ibfk_2` FOREIGN KEY (`followed_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `canal_membres`
--
ALTER TABLE `canal_membres`
  ADD CONSTRAINT `canal_membres_ibfk_1` FOREIGN KEY (`canal_id`) REFERENCES `canaux` (`canal_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `canal_membres_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `canaux`
--
ALTER TABLE `canaux`
  ADD CONSTRAINT `canaux_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `commentaires`
--
ALTER TABLE `commentaires`
  ADD CONSTRAINT `commentaires_ibfk_1` FOREIGN KEY (`comment_post_id`) REFERENCES `publications` (`post_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commentaires_ibfk_2` FOREIGN KEY (`comment_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commentaires_ibfk_3` FOREIGN KEY (`comment_parent_id`) REFERENCES `commentaires` (`comment_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`conv_user1_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`conv_user2_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `images_publications`
--
ALTER TABLE `images_publications`
  ADD CONSTRAINT `images_publications_ibfk_1` FOREIGN KEY (`image_post_id`) REFERENCES `publications` (`post_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `likes_commentaires`
--
ALTER TABLE `likes_commentaires`
  ADD CONSTRAINT `likes_commentaires_ibfk_1` FOREIGN KEY (`like_com_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_commentaires_ibfk_2` FOREIGN KEY (`like_comment_id`) REFERENCES `commentaires` (`comment_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `likes_publications`
--
ALTER TABLE `likes_publications`
  ADD CONSTRAINT `likes_publications_ibfk_1` FOREIGN KEY (`like_post_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_publications_ibfk_2` FOREIGN KEY (`like_post_id`) REFERENCES `publications` (`post_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`msg_conv_id`) REFERENCES `conversations` (`conv_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`msg_sender_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`msg_recipient_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages_canal`
--
ALTER TABLE `messages_canal`
  ADD CONSTRAINT `messages_canal_ibfk_1` FOREIGN KEY (`canal_id`) REFERENCES `canaux` (`canal_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_canal_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`notif_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `parametres_theme`
--
ALTER TABLE `parametres_theme`
  ADD CONSTRAINT `parametres_theme_ibfk_1` FOREIGN KEY (`settings_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `polls`
--
ALTER TABLE `polls`
  ADD CONSTRAINT `polls_ibfk_1` FOREIGN KEY (`poll_post_id`) REFERENCES `publications` (`post_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `polls_ibfk_2` FOREIGN KEY (`poll_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `poll_options`
--
ALTER TABLE `poll_options`
  ADD CONSTRAINT `poll_options_ibfk_1` FOREIGN KEY (`option_poll_id`) REFERENCES `polls` (`poll_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `poll_votes`
--
ALTER TABLE `poll_votes`
  ADD CONSTRAINT `poll_votes_ibfk_1` FOREIGN KEY (`vote_poll_id`) REFERENCES `polls` (`poll_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `poll_votes_ibfk_2` FOREIGN KEY (`vote_option_id`) REFERENCES `poll_options` (`option_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `poll_votes_ibfk_3` FOREIGN KEY (`vote_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `publications`
--
ALTER TABLE `publications`
  ADD CONSTRAINT `publications_ibfk_1` FOREIGN KEY (`post_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `stories`
--
ALTER TABLE `stories`
  ADD CONSTRAINT `stories_ibfk_1` FOREIGN KEY (`story_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stories_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `story_events` (`event_id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `story_events`
--
ALTER TABLE `story_events`
  ADD CONSTRAINT `story_events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `story_event_members`
--
ALTER TABLE `story_event_members`
  ADD CONSTRAINT `story_event_members_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `story_events` (`event_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `story_event_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_photos`
--
ALTER TABLE `user_photos`
  ADD CONSTRAINT `user_photos_ibfk_1` FOREIGN KEY (`photo_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `vues_stories`
--
ALTER TABLE `vues_stories`
  ADD CONSTRAINT `vues_stories_ibfk_1` FOREIGN KEY (`view_story_id`) REFERENCES `stories` (`story_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vues_stories_ibfk_2` FOREIGN KEY (`view_user_id`) REFERENCES `utilisateurs` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
