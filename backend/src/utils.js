// backend/src/utils.js

/**
 * Преобразует таймстамп (мс) в формат даты MySQL (YYYY-MM-DD HH:MM:SS)
 */
export function formatDeadline(deadline) {
  if (!deadline) return null;
  const date = new Date(Number(deadline));
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/*
 * Проверяет, является ли объект корректной задачей
 */
export function isValidTask(task) {
  if (!task || typeof task !== 'object') return false;
  if (typeof task.text !== 'string') return false;
  return task.text.trim().length > 0;
}