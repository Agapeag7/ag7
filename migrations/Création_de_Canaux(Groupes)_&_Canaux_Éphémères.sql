-- Table des canaux (groupes)
CREATE TABLE IF NOT EXISTS canaux (
    canal_id INT AUTO_INCREMENT PRIMARY KEY,
    canal_name VARCHAR(100) NOT NULL,
    canal_description TEXT,
    created_by INT NOT NULL,
    is_ephemeral BOOLEAN DEFAULT FALSE,
    expires_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES utilisateurs(user_id) ON DELETE CASCADE
);

-- Membres des canaux
CREATE TABLE IF NOT EXISTS canal_membres (
    canal_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (canal_id, user_id),
    FOREIGN KEY (canal_id) REFERENCES canaux(canal_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE
);

-- Messages de canal
CREATE TABLE IF NOT EXISTS messages_canal (
    msg_id INT AUTO_INCREMENT PRIMARY KEY,
    canal_id INT NOT NULL,
    sender_id INT NOT NULL,
    msg_content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (canal_id) REFERENCES canaux(canal_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE
);