const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories - получить все категории
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    
    // Конвертируем эмодзи из базы (если кодировка битая)
    const fixedCategories = categories.map(cat => ({
      ...cat,
      emoji: cat.emoji.replace(/\\u[0-9a-fA-F]{4}/g, match => 
        String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
      )
    }));
    
    res.json(fixedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories - создать категорию
router.post('/', async (req, res) => {
  try {
    const { category_key, emoji, label, color, is_default } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO categories (category_key, emoji, label, color, is_default) VALUES (?, ?, ?, ?, ?)',
      [category_key, emoji, label, color, is_default || false]
    );
    
    res.status(201).json({
      id: result.insertId,
      category_key,
      emoji,
      label,
      color,
      is_default: is_default || false
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:key - удалить категорию
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const [result] = await db.query('DELETE FROM categories WHERE category_key = ?', [key]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;