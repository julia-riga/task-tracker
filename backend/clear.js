const mysql = require('mysql2/promise');

async function clear() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rootpassword',
    database: 'task_tracker',
    charset: 'utf8mb4'
  });

  await connection.execute('DELETE FROM categories');
  await connection.execute('DELETE FROM tasks');
  
  console.log('✅ Таблицы очищены!');
  await connection.end();
}

clear().catch(console.error);