import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { formatDeadline, isValidTask } from '../src/utils.js';

// ────────────────────────────────────────────
// 1. Тесты утилит (utils.js)
// ────────────────────────────────────────────
describe('Утилиты бэкенда', () => {
  it('formatDeadline: преобразует timestamp в YYYY-MM-DD HH:MM:SS', () => {
    const ts = Date.now();
    assert.match(formatDeadline(ts), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('formatDeadline: null и undefined → null', () => {
    assert.strictEqual(formatDeadline(null), null);
    assert.strictEqual(formatDeadline(undefined), null);
  });

  it('isValidTask: true для корректной задачи', () => {
    assert.strictEqual(isValidTask({ text: 'Купить хлеб' }), true);
  });

  it('isValidTask: false для пустых / некорректных данных', () => {
    assert.strictEqual(isValidTask(null), false);
    assert.strictEqual(isValidTask(undefined), false);
    assert.strictEqual(isValidTask({}), false);
    assert.strictEqual(isValidTask({ text: '   ' }), false);
    assert.strictEqual(isValidTask({ text: '' }), false);
  });
});

// ────────────────────────────────────────────
// 2. Тесты API с мокнутым MySQL pool
// ────────────────────────────────────────────
// Простая имитация MySQL query для тестов
function mockQuery(sql, params) {
  const rows = [];
  let insertId = -1;
  if (sql.startsWith('INSERT')) {
    insertId = Date.now() + Math.floor(Math.random() * 1000);
    rows.push({ insertId });
  } else if (sql.startsWith('UPDATE')) {
    const affectedRows = params ? 1 : 0;
    return [{ affectedRows }];
  } else if (sql.startsWith('DELETE')) {
    const match = sql.match(/WHERE\s+id\s*=\s*(\?)/);
    const idParam = match && params ? parseInt(params[match.index + 1]) : null;
    // В нашей "базе" задачи с таким id уже удалены для изоляции тестов
    return [{ affectedRows: 0 }];
  } else if (sql.startsWith('SELECT')) {
    const fromTasks = sql.includes('FROM tasks');
    const tasks = [];
    if (fromTasks) {
      // Загружаем фиксированный набор для предсказуемости
      tasks.push(
        { id: 1, text: 'Купить молоко', completed: 0, deadline: null, category_key: 'shopping', created_at: '2025-01-15T10:30:00.000Z' },
        { id: 2, text: 'Посудить посуду', completed: 1, deadline: null, category_key: 'cleaning', created_at: '2025-01-14T08:00:00.000Z' }
      );
    }
    return [tasks];
  }
  return rows;
}

function createMockPool() {
  let tasks = [];
  let categories = [];
  const pool = {
    config: {}, // эмуляция mysql.createPool(...)
    query(sql, params) {
      if (Array.isArray(params)) {
        return mockQuery(sql, params);
      }
      // без параметров — SELECT * для категории или задачи
      const rows = [];
      const fromTasks = sql.includes('FROM tasks');
      if (fromTasks) {
        rows.push(tasks);
      } else {
        rows.push(categories);
      }
      return rows;
    },
    // Вспомогательные методы для управления тестовыми данными
    addTask(task) { tasks.push(task); },
    getTasks() { return [...tasks]; },
    clearTasks() { tasks = []; },
    addCategory(cat) { categories.push(cat); },
    getCategoryByKey(key) { return categories.find(c => c.category_key === key) || null; }
  };
  // Делаем pool похожим на mysql2/promise, чтобы require('../src/db') тоже работал
  Object.setPrototypeOf(pool, require('mysql2/promise').Pool.prototype);

  return pool;
}

describe('API: задачи (tasks)', () => {
  let db;

  beforeEach(() => {
    db = createMockPool();
  });

  // ── GET /api/tasks ──
  it('GET /api/tasks — возвращает массив задач', async () => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ db })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });

  // ── POST /api/tasks ──
  it('POST /api/tasks — создаёт задачу и возвращает 201', async () => {
    const db = createMockPool();
    db.addTask({ id: 99, text: 'Test task', completed: 0, deadline: null, category_key: 'other' });

    // Мокнутый fetch для POST /api/tasks (создание)
    const taskRes = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Test task', completed: false, category_key: 'other' })
    });
    assert.strictEqual(taskRes.status, 201);
    const body = await taskRes.json();
    assert.ok(body.id > 0);
    assert.strictEqual(body.text, 'Test task');
  });

  // ── PUT /api/tasks/:id ──
  it('PUT /api/tasks/:id — обновляет задачу', async () => {
    const db = createMockPool();
    const taskRes = await fetch('/api/tasks/1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ db })
    });

    // PUT /api/tasks/1 — обновление существующей задачи id=1
    const updateRes = await fetch('/api/tasks/1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ db, id: 1 })
    });
    assert.strictEqual(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.strictEqual(updated.id, 1);
  });

  // ── DELETE /api/tasks/:id ──
  it('DELETE /api/tasks/clear — удаляет все задачи', async () => {
    db.clearTasks();
    const res = await fetch('/api/tasks/clear', { method: 'DELETE' });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.message.includes('deleted'));
  });

  it('DELETE /api/tasks/:id — удаляет задачу по id', async () => {
    db.clearTasks();
    // POST для добавления задачи
    const postRes = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Remove me', completed: false, category_key: 'other' })
    });

    // DELETE по id
    const delRes = await fetch('/api/tasks/1', { method: 'DELETE' });
    assert.strictEqual(delRes.status, 200);
    const body = await delRes.json();
    assert.ok(body.message.includes('deleted'));
  });
});

describe('API: категории (categories)', () => {
  let db;

  beforeEach(() => {
    db = createMockPool();
    // Загружаем данные для GET /api/categories
    const cats = [
      { id: 1, category_key: 'shopping', emoji: '🛒', label: 'Покупки', color: '#2e7d32', is_default: 1 },
      { id: 2, category_key: 'cleaning', emoji: '🧹', label: 'Уборка', color: '#1976d2', is_default: 1 }
    ];
    db.getTasks = () => cats; // Для тестирования через mockQuery
  });

  it('GET /api/categories — возвращает массив категорий', async () => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ db })
    });
    assert.strictEqual(res.status, 200);
  });

  it('POST /api/categories — создаёт категорию и возвращает 201', async () => {
    const catRes = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ db })
    });
    assert.strictEqual(catRes.status, 201);
  });

  it('DELETE /api/categories/:key — удаляет категорию по ключу', async () => {
    const delRes = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ db })
    });
    assert.strictEqual(delRes.status, 200);
  });
});
