// backend/tests/utils.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatDeadline, isValidTask } from '../src/utils.js';

describe('Модуль утилит (utils.js)', () => {
  
  it('formatDeadline: корректно преобразует таймстамп в формат MySQL', () => {
    const timestamp = 1786298280000; // Пример даты
    const result = formatDeadline(timestamp);
    // Проверяем регулярным выражением формат YYYY-MM-DD HH:MM:SS
    assert.match(result, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('formatDeadline: возвращает null для некорректных данных', () => {
    assert.strictEqual(formatDeadline(null), null);
    assert.strictEqual(formatDeadline(undefined), null);
    assert.strictEqual(formatDeadline('invalid-string'), null);
  });

  it('isValidTask: возвращает true для валидной задачи', () => {
    const validTask = { text: 'Купить молоко', completed: false };
    assert.strictEqual(isValidTask(validTask), true);
  });

  it('isValidTask: возвращает false для пустой или некорректной задачи', () => {
    assert.strictEqual(isValidTask({ text: '   ' }), false); // Только пробелы
    assert.strictEqual(isValidTask({ text: '' }), false);    // Пустая строка
    assert.strictEqual(isValidTask(null), false);            // null
    assert.strictEqual(isValidTask({ completed: true }), false); // Нет текста
  });

});