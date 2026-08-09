SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;
SET character_set_client=utf8mb4;
SET character_set_results=utf8mb4;

CREATE DATABASE IF NOT EXISTS task_tracker 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE task_tracker;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_key VARCHAR(50) UNIQUE NOT NULL,
  emoji VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  label VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  color VARCHAR(20) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deadline TIMESTAMP NULL,
  category_key VARCHAR(50) NULL,
  FOREIGN KEY (category_key) REFERENCES categories(category_key) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (category_key, emoji, label, color, is_default) VALUES
('shopping', '🛒', 'Покупки', '#2e7d32', TRUE),
('cleaning', '', 'Уборка', '#1976d2', TRUE),
('study', '', 'Учёба', '#f57c00', TRUE),
('work', '💼', 'Работа', '#7b1fa2', TRUE),
('health', '❤️', 'Здоровье', '#c2185b', TRUE),
('other', '📦', 'Другое', '#616161', TRUE);