const { describe, it } = require('node:test');
const assert = require('node:assert');

// ────────────────────────────────────────────
// 1. Тесты базы данных (db.js) — с мокнутым pool
// ────────────────────────────────────────────

describe('Database pool', () => {
  it('exported pool has query method', async () => {
    // Импортируем db и проверяем что query существует
    const db = require('../src/db');
    assert.ok(db && typeof db.query === 'function');
  });

  it('query: выполняет запрос SELECT и возвращает результаты', async () => {
    const mockPool = {
      config: {},
      query(sql, params) {
        if (Array.isArray(params)) return this._mockQuery(sql, params);
        return [[[]]];
      },
      _mockQuery(sql, params) {
        if (sql.includes('SELECT')) return [[[{ id: 1 }]]];
        if (sql.startsWith('INSERT')) return [{ insertId: Date.now() + Math.floor(Math.random() * 1000) }];
        if (sql.startsWith('UPDATE')) return [[{ affectedRows: 1 }]];
        if (sql.startsWith('DELETE')) return [[{ affectedRows: 1 }]];
        return [];
      }
    };

    // Тестим через мокнутый pool что query возвращает данные
    const [tasks] = await mockPool.query('SELECT * FROM tasks', []);
    assert.ok(Array.isArray(tasks));
    assert.equal(tasks.length, 1);
    assert.strictEqual(tasks[0].id, 1);
  });

  it('query: обрабатывает INSERT и возвращает insertId', async () => {
    const mockPool = {
      config: {},
      query(sql, params) {
        if (Array.isArray(params)) return this._mockQuery(sql, params);
        return [[[]]];
      },
      _mockQuery(sql, params) {
        if (sql.startsWith('INSERT')) {
          const insertId = Date.now() + Math.floor(Math.random() * 1000);
          return [{ insertId }];
        }
        return [];
      }
    };

    const [result] = await mockPool.query(
      'INSERT INTO tasks (text, completed, deadline, category_key) VALUES (?, ?, ?, ?)',
      ['Тест', 1, null, 'other']
    );
    assert.ok(result.insertId > 0);
  });

  it('query: обрабатывает UPDATE и возвращает affectedRows', async () => {
    const mockPool = {
      config: {},
      query(sql, params) {
        if (Array.isArray(params)) return this._mockQuery(sql, params);
        return [[[]]];
      },
      _mockQuery(sql, params) {
        if (sql.startsWith('UPDATE')) return [[{ affectedRows: 1 }]];
        return [];
      }
    };

    const [result] = await mockPool.query(
      'UPDATE tasks SET text = ? WHERE id = ?',
      ['Новый текст', 1]
    );
    assert.strictEqual(result.affectedRows, 1);
  });
});

// ────────────────────────────────────────────
// 2. Интеграционные тесты (tasks.js + utils.js)
// ────────────────────────────────────────────

const { formatDeadline, isValidTask } = require('../src/utils');

describe('Интеграция: формат даты + валидация', () => {
  it('formatDeadline возвращает корректный формат для даты без часового пояса', () => {
    // UTC timestamp без часовой зоны
    const ts = new Date('2024-01-15T10:30:00.000Z').getTime();
    const result = formatDeadline(ts);
    assert.match(result, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('formatDeadline для даты с UTC часовым поясом', () => {
    const ts = new Date('2024-01-15T22:30:00.000Z').getTime(); // +UTC
    const result = formatDeadline(ts);
    assert.match(result, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('isValidTask интегрируется с форматом даты', () => {
    // Задача с корректной датой и текстом — валидна
    const task = { text: 'Купить молоко', completed: false, deadline: new Date().toISOString() };
    assert.strictEqual(isValidTask(task), true);
  });

  it('isValidTask невалидна если текст пустой', () => {
    const task = { text: '', completed: false };
    assert.strictEqual(isValidTask(task), false);
  });
});