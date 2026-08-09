// js/storage.js
const API_BASE = 'http://localhost:3000/api';

const DEFAULT_CATEGORIES = {
  shopping: { emoji: "🛒", label: "Покупки", color: "#2e7d32", isDefault: true },
  cleaning: { emoji: "🧹", label: "Уборка", color: "#1976d2", isDefault: true },
  study: { emoji: "📚", label: "Учёба", color: "#f57c00", isDefault: true },
  work: { emoji: "💼", label: "Работа", color: "#7b1fa2", isDefault: true },
  health: { emoji: "❤️", label: "Здоровье", color: "#c2185b", isDefault: true },
  other: { emoji: "📦", label: "Другое", color: "#616161", isDefault: true },
};

// ==================== TASKS ====================
export async function loadTasks() {
  // Сначала пробуем загрузить с сервера
  try {
    const response = await fetch(`${API_BASE}/tasks`);
    if (response.ok) {
      const tasksFromAPI = await response.json();
      // Преобразуем формат из БД в формат приложения
      const tasks = tasksFromAPI.map(t => ({
        id: t.id,
        text: t.text,
        completed: t.completed === 1 || t.completed === true,
        createdAt: new Date(t.created_at).getTime(),
        deadline: t.deadline ? new Date(t.deadline).getTime() : null,
        category: t.category_key
      }));
      // Сохраняем в localStorage для офлайн-режима
      localStorage.setItem("homeTasks", JSON.stringify(tasks));
      return tasks;
    }
  } catch (err) {
    console.warn("Failed to load from server, using localStorage:", err);
  }
  
  // Если сервер недоступен — берем из localStorage
  const stored = localStorage.getItem("homeTasks");
  if (!stored || stored === "undefined") {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export async function saveTasks(tasks) {
  // Сохраняем в localStorage (для офлайн-режима)
  localStorage.setItem("homeTasks", JSON.stringify(tasks));
  
  // Отправляем на сервер
  try {
    // Сначала удаляем все старые задачи
    await fetch(`${API_BASE}/tasks/clear`, { method: 'DELETE' });
    
    // Добавляем новые задачи
    for (const task of tasks) {
      await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: task.text,
          completed: task.completed,  // Важно!
          deadline: task.deadline,
          category_key: task.category
        })
      });
    }
  } catch (err) {
    console.error("Failed to save to server:", err);
  }
}

// ==================== CATEGORIES ====================
export async function getInitialCategories() {
  // Пробуем загрузить с сервера
  try {
    const response = await fetch(`${API_BASE}/categories`);
    if (response.ok) {
      const categories = await response.json();
      // Преобразуем формат из БД в формат приложения
      const result = {};
      categories.forEach(cat => {
        result[cat.category_key] = {
          emoji: cat.emoji,
          label: cat.label,
          color: cat.color,
          isDefault: cat.is_default === 1 || cat.is_default === true
        };
      });
      // Сохраняем в localStorage
      localStorage.setItem("homeCategories", JSON.stringify(result));
      return result;
    }
  } catch (err) {
    console.warn("Failed to load categories from server:", err);
  }
  
  // Если не получилось — берем из localStorage
  const stored = localStorage.getItem("homeCategories");
  if (!stored || stored === "undefined") {
    return { ...DEFAULT_CATEGORIES };
  }
  try {
    const custom = JSON.parse(stored);
    return { ...DEFAULT_CATEGORIES, ...custom };
  } catch (e) {
    return { ...DEFAULT_CATEGORIES };
  }
}

export async function saveCategories(categories) {
  // Сохраняем только кастомные категории
  const custom = {};
  Object.keys(categories).forEach((k) => {
    if (!categories[k].isDefault) {
      custom[k] = categories[k];
    }
  });
  
  localStorage.setItem("homeCategories", JSON.stringify(custom));
  
  // Отправляем на сервер
  try {
    // Очищаем старые кастомные категории
    await fetch(`${API_BASE}/categories/clear`, { method: 'DELETE' });
    
    // Добавляем новые
    for (const [key, cat] of Object.entries(custom)) {
      await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category_key: key,
          emoji: cat.emoji,
          label: cat.label,
          color: cat.color,
          is_default: cat.isDefault
        })
      });
    }
  } catch (err) {
    console.error("Failed to save categories to server:", err);
  }
}

// ==================== THEME & LANGUAGE ====================
export function getTheme() {
  return localStorage.getItem("theme") || "light";
}

export function saveTheme(theme) {
  localStorage.setItem("theme", theme);
}

export function getLanguage() {
  return localStorage.getItem("language") || "ru";
}

export function saveLanguage(lang) {
  localStorage.setItem("language", lang);
}

export function getNotificationsEnabled() {
  return localStorage.getItem("notificationsEnabled") === "true";
}

export function saveNotificationsEnabled(enabled) {
  localStorage.setItem("notificationsEnabled", enabled);
}