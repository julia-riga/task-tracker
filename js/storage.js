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
  if (!stored || stored === "undefined") return { ...DEFAULT_CATEGORIES };
  try {
    const custom = JSON.parse(stored);
    return { ...DEFAULT_CATEGORIES, ...custom };
  } catch (e) {
    return { ...DEFAULT_CATEGORIES };
  }
}

export function saveCategories() {
  const custom = {};
  Object.keys(categories).forEach((k) => {
    if (!categories[k].isDefault) custom[k] = categories[k];
  });
  localStorage.setItem("homeCategories", JSON.stringify(custom));
}

export function loadTasks() {
  const stored = localStorage.getItem("homeTasks");
  if (!stored || stored === "undefined") return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export function saveTasks() {
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