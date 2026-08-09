const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/tasks - получить все задачи
router.get('/', async (req, res) => {
  try {
    const [tasks] = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks - создать задачу
router.post('/', async (req, res) => {
  try {
    const { text, completed, deadline, category_key } = req.body;
    
    // Преобразуем миллисекунды в формат MySQL
    let formattedDeadline = null;
    if (deadline) {
      const date = new Date(Number(deadline));
      formattedDeadline = date.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    const [result] = await db.query(
      'INSERT INTO tasks (text, completed, deadline, category_key) VALUES (?, ?, ?, ?)',
      [text, completed ? 1 : 0, formattedDeadline, category_key]
    );
    
    res.status(201).json({
      id: result.insertId,
      text,
      completed: completed ? 1 : 0,
      deadline: deadline,
      category_key,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id - обновить задачу
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, deadline, category_key } = req.body;
    
    let formattedDeadline = null;
    if (deadline) {
      const date = new Date(Number(deadline));
      formattedDeadline = date.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    const [result] = await db.query(
      'UPDATE tasks SET text = ?, completed = ?, deadline = ?, category_key = ? WHERE id = ?',
      [text, completed, formattedDeadline, category_key, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ id: parseInt(id), text, completed, deadline, category_key });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ⚠️ ВАЖНО: маршрут /clear должен быть ВЫШЕ /:id
// DELETE /api/tasks/clear - удалить все задачи
router.delete('/clear', async (req, res) => {
  try {
    await db.query('DELETE FROM tasks');
    res.json({ message: 'All tasks deleted' });
  } catch (error) {
    console.error('Error clearing tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id - удалить задачу (теперь ПОСЛЕ /clear)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;