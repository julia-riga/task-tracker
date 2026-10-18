const fs = require('fs');
const path = require('path');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tasksRoutes = require('./routes/tasks');
const categoriesRoutes = require('./routes/categories');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', tasksRoutes);
app.use('/api/categories', categoriesRoutes);

const db = require('./db');

// Автоматическая инициализация базы данных
(async () => {
  try {
    const initSql = fs.readFileSync(path.join(__dirname, '../sql/init.sql'), 'utf8');
    await db.query(initSql);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  }
})();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});