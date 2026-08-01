// js/storage.js

const DEFAULT_CATEGORIES = {
  shopping: { emoji: "🛒", label: "Покупки", color: "#2e7d32", isDefault: true },
  cleaning: { emoji: "🧹", label: "Уборка", color: "#1976d2", isDefault: true },
  study: { emoji: "📚", label: "Учёба", color: "#f57c00", isDefault: true },
  work: { emoji: "💼", label: "Работа", color: "#7b1fa2", isDefault: true },
  health: { emoji: "❤️", label: "Здоровье", color: "#c2185b", isDefault: true },
  other: { emoji: "📦", label: "Другое", color: "#616161", isDefault: true },
};

export function getInitialCategories() {
  const stored = localStorage.getItem("homeCategories");
  const custom = stored ? JSON.parse(stored) : {};
  return { ...DEFAULT_CATEGORIES, ...custom };
}

export function saveCategories(categories) {
  const custom = {};
  Object.keys(categories).forEach((k) => {
    if (!categories[k].isDefault) custom[k] = categories[k];
  });
  localStorage.setItem("homeCategories", JSON.stringify(custom));
}

export function loadTasks() {
  const stored = localStorage.getItem("homeTasks");
  return stored ? JSON.parse(stored) : [];
}

export function saveTasks(tasks) {
  localStorage.setItem("homeTasks", JSON.stringify(tasks));
}

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