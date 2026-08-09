// backend/seed.js
const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rootpassword',
    database: 'task_tracker',
    charset: 'utf8mb4' // Важно!
  });

  const categories = [
    { key: 'shopping', emoji: '🛒', label: 'Покупки', color: '#2e7d32' },
    { key: 'cleaning', emoji: '🧹', label: 'Уборка', color: '#1976d2' },
    { key: 'study', emoji: '📚', label: 'Учёба', color: '#f57c00' },
    { key: 'work', emoji: '', label: 'Работа', color: '#7b1fa2' },
    { key: 'health', emoji: '❤️', label: 'Здоровье', color: '#c2185b' },
    { key: 'other', emoji: '📦', label: 'Другое', color: '#616161' },
  ];

  for (const cat of categories) {
    try {
      await connection.execute(
        'INSERT INTO categories (category_key, emoji, label, color, is_default) VALUES (?, ?, ?, ?, 1)',
        [cat.key, cat.emoji, cat.label, cat.color]
      );
      console.log(`✅ Добавлено: ${cat.label}`);
    } catch (err) {
      console.log(`⏭️ Пропущено (уже есть): ${cat.label}`);
    }
  }

  await connection.end();
  console.log('🎉 Готово! Эмодзи теперь в базе.');
}

seed().catch(console.error);