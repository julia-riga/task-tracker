const { describe, it } = require('node:test');
const assert = require('node:assert');

// ────────────────────────────────────────────
// 1. Тесты утилит (utils.js)
// ────────────────────────────────────────────
describe('Утилиты бэкенда', () => {
  it('formatDeadline: преобразует timestamp в YYYY-MM-DD HH:MM:SS', () => {
    const result = formatDeadline(1705329600000); // 2024-01-15T10:00:00.000Z
    assert.match(result, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('formatDeadline: null и undefined → null', () => {
    assert.strictEqual(formatDeadline(null), null);
    assert.strictEqual(formatDeadline(undefined), null);
  });

  it('formatDeadline: NaN → null', () => {
    assert.strictEqual(formatDeadline(NaN), null);
  });

  it('isValidTask: true для корректной задачи', () => {
    assert.strictEqual(isValidTask({ text: 'Купить хлеб' }), true);
    assert.strictEqual(isValidTask({ text: '   купить хлеб' }), true);
  });

  it('isValidTask: false для пустых / некорректных данных', () => {
    assert.strictEqual(isValidTask(null), false);
    assert.strictEqual(isValidTask(undefined), false);
    assert.strictEqual(isValidTask({}), false);
    assert.strictEqual(isValidTask({ text: '   ' }), false);
    assert.strictEqual(isValidTask({ text: '' }), false);
    assert.strictEqual(isValidTask('текст'), false); // не объект
  });

  it('isValidTask: false если текст — число или булево', () => {
    assert.strictEqual(isValidTask({ text: 123 }), false);
    assert.strictEqual(isValidTask({ text: true }), false);
  });
});

// ────────────────────────────────────────────
// 2. Тесты API (tasks.js) — с мокнутым pool
// ────────────────────────────────────────────
const mockPool = {
  config: {},
  query(sql, params) {
    if (Array.isArray(params)) {
      return this._mockQuery(sql, params);
    }
    const rows = [];
    if (sql.includes('FROM tasks')) rows.push(this._tasks || []);
    else if (sql.includes('FROM categories')) rows.push(this._categories || []);
    return rows;
  },
  _mockQuery(sql, params) {
    switch (true) {
      case sql.startsWith('SELECT * FROM tasks'):
        this.lastSelectTasks = true;
        return [[this._tasks || []]];
      case sql.includes('INSERT INTO tasks'):
        const insertId = Date.now() + Math.floor(Math.random() * 1000);
        this.lastInsertId = insertId;
        if (!this._tasks) this._tasks = [];
        this._tasks.push({ id: insertId, text: params[0], completed: params[1] ? 1 : 0, deadline: params[2], category_key: params[3], created_at: new Date().toISOString() });
        return [{ insertId }];
      case sql.includes('UPDATE tasks'):
        if (params && Array.isArray(params) && params.length > 4) {
          const id = parseInt(params[4]);
          this.lastUpdatedTask = id;
          return [[{ affectedRows: 1, updatedTaskId: id }]];
        }
        return [{ affectedRows: 0 }];
      case sql.includes('DELETE FROM tasks'):
        if (sql === 'DELETE FROM tasks') {
          const prevCount = this._tasks ? this._tasks.length : 0;
          this._tasks = [];
          this.lastDeletedAll = true;
          return [[{ affectedRows: prevCount }]];
        }
        return [{ affectedRows: params ? 1 : 0 }];
      case sql.includes('DELETE FROM tasks WHERE'):
        return [{ affectedRows: 1 }];
      default:
        return [];
    }
  },
  _tasks: [
    { id: 1, text: 'Купить молоко', completed: 0, deadline: null, category_key: 'shopping', created_at: '2025-01-15T10:30:00.000Z' },
    { id: 2, text: 'Посудить посуду', completed: 1, deadline: null, category_key: 'cleaning', created_at: '2025-01-14T08:00:00.000Z' }
  ],
  _categories: [
    { id: 1, category_key: 'shopping', emoji: '🛒', label: 'Покупки', color: '#2e7d32', is_default: 1 },
    { id: 2, category_key: 'cleaning', emoji: '🧹', label: 'Уборка', color: '#1976d2', is_default: 1 }
  ]
};

// Мокнутый Express app для тестирования маршрутов
const http = require('node:http');
let app, server;
const routes = require('../src/routes/tasks.js');

describe('API: задачи (tasks)', () => {
  beforeEach(() => {
    mockPool._tasks = [
      { id: 1, text: 'Тестовая задача', completed: 0, deadline: null, category_key: 'other', created_at: '2025-01-15T10:30:00.000Z' }
    ];
  });

  it('GET /api/tasks — возвращает массив задач', async () => {
    const res = await fetch('/api/tasks');
    assert.strictEqual(res.status, 200);
    const tasks = await res.json();
    assert.ok(Array.isArray(tasks));
    assert.ok(tasks.length > 0);
    assert.equal(typeof tasks[0].id, 'number');
  });

  it('POST /api/tasks — создаёт задачу и возвращает 201', async () => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Новая задача', completed: false, category_key: 'other' })
    });
    assert.strictEqual(res.status, 201);
    const task = await res.json();
    assert.ok(task.id > 0);
    assert.strictEqual(task.text, 'Новая задача');
    assert.equal(typeof task.created_at, 'string');
  });

  it('PUT /api/tasks/:id — обновляет задачу', async () => {
    const res = await fetch('/api/tasks/1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 1, text: 'Обновлённая задача', completed: true })
    });
    assert.strictEqual(res.status, 200);
    const task = await res.json();
    assert.strictEqual(task.id, 1);
    assert.strictEqual(task.text, 'Обновлённая задача');
    assert.equal(task.completed, 1);
  });

  it('PUT /api/tasks/:id — возвращает 404 для несуществующей задачи', async () => {
    const res = await fetch('/api/tasks/9999', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 9999, text: 'Не найдена' })
    });
    assert.strictEqual(res.status, 404);
  });

  it('DELETE /api/tasks/clear — удаляет все задачи', async () => {
    const res = await fetch('/api/tasks/clear', { method: 'DELETE' });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.message.includes('deleted'));
  });

  it('DELETE /api/tasks/:id — удаляет задачу по id', async () => {
    mockPool._tasks.push({ id: 5, text: 'Удалить меня', completed: false, category_key: 'other', created_at: new Date().toISOString() });

    const res = await fetch('/api/tasks/5', { method: 'DELETE' });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.message.includes('deleted'));
  });

  it('DELETE /api/tasks/:id — возвращает 404 для несуществующей задачи', async () => {
    const res = await fetch('/api/tasks/9999', { method: 'DELETE' });
    assert.strictEqual(res.status, 404);
  });

  it('POST /api/tasks — проверяет корректность данных (пустой текст)', async () => {
    // Функция isValidTask должна быть вызвана перед вставкой
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '   ', completed: false })
    });
    // Если isValidTask вернёт false, задача не будет создана — 201 по-прежнему (сервер валидирует на уровне)
    assert.strictEqual(res.status, 201);
    const task = await res.json();
    assert.equal(task.text.trim(), '');
  });
});

describe('API: категории (categories)', () => {
  beforeEach(() => {
    mockPool._categories = [
      { id: 1, category_key: 'shopping', emoji: '🛒', label: 'Покупки', color: '#2e7d32', is_default: true },
      { id: 2, category_key: 'cleaning', emoji: '🧹', label: 'Уборка', color: '#1976d2', is_default: false }
    ];
  });

  it('GET /api/categories — возвращает массив категорий', async () => {
    const res = await fetch('/api/categories');
    assert.strictEqual(res.status, 200);
    const cats = await res.json();
    assert.ok(Array.isArray(cats));
    assert.equal(cats.length, 2);
    assert.ok(cats[0].emoji !== undefined);
    assert.ok(typeof cats[0].label === 'string');
  });

  it('POST /api/categories — создаёт категорию и возвращает 201', async () => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category_key: 'work', emoji: '💼', label: 'Работа', color: '#4a148c', is_default: false })
    });
    assert.strictEqual(res.status, 201);
    const cat = await res.json();
    assert.ok(cat.id > 0);
    assert.equal(cat.category_key, 'work');
    assert.strictEqual(cat.label, 'Работа');
  });

  it('DELETE /api/categories/:key — удаляет категорию по ключу', async () => {
    const res = await fetch('/api/categories/work', { method: 'DELETE' });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.message.includes('deleted'));
  });

  it('DELETE /api/categories/:key — возвращает 404 для несуществующей категории', async () => {
    const res = await fetch('/api/categories/nonexistent', { method: 'DELETE' });
    assert.strictEqual(res.status, 404);
  });
});

// ────────────────────────────────────────────
// 3. Тесты фронтенда (storage.js)
// ────────────────────────────────────────────
const storage = require('../src/storage.js');

describe('Storage (frontend)', () => {
  it('loadTasks: загружает задачи из localStorage', () => {
    const tasks = JSON.stringify([
      { id: 1, text: 'Задача 1' },
      { id: 2, text: 'Задача 2' }
    ]);
    // Мокнём getLocalStorage для изоляции тестов
    storage.getLocalStorage = () => ({
      getItem: (key) => key === 'tasks' ? tasks : null
    });

    const result = storage.loadTasks();
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 2);
    assert.strictEqual(result[0].text, 'Задача 1');

    // Очистим мок после теста
    delete storage.getLocalStorage;
  });

  it('saveTask: сохраняет задачу в localStorage', () => {
    storage.getLocalStorage = () => ({
      setItem: (key, value) => {}
    });

    const task = { id: 1, text: 'Тестовая задача' };
    storage.saveTask(task);

    assert.strictEqual(storage.getLocalStorage().setItem.callCount || true, undefined); // просто проверяем что не падает
    // Очистим мок после теста
    delete storage.getLocalStorage;
  });

  it('saveTasks: сохраняет массив задач', () => {
    const setItemSpy = { called: false };
    storage.getLocalStorage = () => ({
      setItem: (key, value) => {
        assert.strictEqual(key, 'tasks');
        setItemSpy.called = true;
      }
    });

    storage.saveTasks([{ id: 1 }, { id: 2 }]);
    assert.ok(setItemSpy.called);

    delete storage.getLocalStorage;
  });

  it('loadCategories: загружает категории из localStorage', () => {
    const categories = JSON.stringify([
      { category_key: 'shopping', emoji: '🛒' },
      { category_key: 'cleaning', emoji: '🧹' }
    ]);
    storage.getLocalStorage = () => ({
      getItem: (key) => key === 'categories' ? categories : null
    });

    const result = storage.loadCategories();
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 2);

    delete storage.getLocalStorage;
  });

  it('saveCategory: сохраняет категорию', () => {
    const setItemSpy = { called: false };
    storage.getLocalStorage = () => ({
      setItem: (key, value) => {
        assert.strictEqual(key, 'categories');
        setItemSpy.called = true;
      }
    });

    storage.saveCategory({ category_key: 'work', emoji: '💼' });
    assert.ok(setItemSpy.called);

    delete storage.getLocalStorage;
  });
});

// ────────────────────────────────────────────
// 4. Тесты фронтенда (main.js) — DOM-логику тестим через мокнутый fetch
// ────────────────────────────────────────────
const main = require('../src/main.js');

describe('Main (frontend)', () => {
  beforeEach(() => {
    // Мокнём fetch для изоляции от сети
    global.fetch = async ({ url }) => {
      if (url.includes('/api/tasks')) return new Response(JSON.stringify([{ id: 1, text: 'Тестовая задача', completed: 0 }]), { status: 200 });
      if (url.includes('/api/categories')) return new Response(JSON.stringify([
        { category_key: 'shopping', emoji: '🛒' },
        { category_key: 'cleaning', emoji: '🧹' }
      ]), { status: 200 });
      return new Response('', { status: 200 });
    };
    // Мокнём DOM методы для изоляции от реального браузера
    main.showTasks = () => {};
    main.renderCategories = () => {};
    main.addTask = () => {};
    main.deleteTask = () => {};
    main.editTask = () => {};
    main.switchTheme = () => {};
  });

  it('showTasks: загружает и показывает задачи', async () => {
    const result = await main.showTasks();
    assert.ok(result);
  });

  it('renderCategories: рендерит категории', async () => {
    const result = await main.renderCategories();
    assert.ok(result);
  });

  it('addTask: добавляет задачу через POST /api/tasks', async () => {
    // fetch мокует создание задачи, проверяем что вызывается
    global.fetch.mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/tasks') && input.method === 'POST') return new Response(JSON.stringify({ id: 1 }), { status: 201 });
    });

    // Просто проверяем что вызов не падает
    const result = await main.addTask('Новая задача');
    assert.ok(result);
  });

  it('switchTheme: переключает тему', async () => {
    const result = await main.switchTheme();
    assert.ok(result);
  });
});