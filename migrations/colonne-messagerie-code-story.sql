ALTER TABLE messages ADD INDEX idx_conv_read (msg_conv_id, msg_recipient_id, msg_read);
ALTER TABLE conversations ADD INDEX idx_updated (updated_at);

ALTER TABLE conversations ADD COLUMN last_message TEXT NULL,
                          ADD COLUMN last_message_time DATETIME NULL;