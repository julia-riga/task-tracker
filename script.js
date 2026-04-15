// ==================== STATE & CONFIG ====================
let tasks = [];
let categories = {};
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'status-date';
let currentSearch = '';
let notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
let currentTheme = localStorage.getItem('theme') || 'light';
let selectedEmoji = '📌';
let currentLang = localStorage.getItem('language') || 'ru';

const DEFAULT_CATEGORIES = {
  shopping: { emoji: '🛒', label: 'Покупки', color: '#2e7d32', isDefault: true },
  cleaning: { emoji: '🧹', label: 'Уборка', color: '#1976d2', isDefault: true },
  study:    { emoji: '📚', label: 'Учёба', color: '#f57c00', isDefault: true },
  work:     { emoji: '💼', label: 'Работа', color: '#7b1fa2', isDefault: true },
  health:   { emoji: '❤️', label: 'Здоровье', color: '#c2185b', isDefault: true },
  other:    { emoji: '📦', label: 'Другое', color: '#616161', isDefault: true }
};

const EMOJI_COLLECTION = {
  house: ['🏠','🏡','🧹','🛏️','🛁','🍳','🔧','🚪','🌱','💡'],
  work: ['💼','💻','📊','📈','📝','✍️','📁','🗂️','⏰','📅'],
  health: ['❤️','🏃','🧘','💪','🥗','🍎','🚴','🏥','😴','🏋️'],
  shopping: ['🛒','👕','👟','💳','🎁','👜','📦','🚚','🏪','🥛'],
  study: ['📚','✏️','🎓','📖','📝','🎒','🔬','🖊️','📓','🎨'],
  other: ['📌','📦','⭐','🔔','💭','💡','🔥','✨','🎉','🌟']
};
EMOJI_COLLECTION.all = [...new Set(Object.values(EMOJI_COLLECTION).flat())];

// ==================== TRANSLATIONS ====================
const translations = {
  ru: {
    appTitle: 'Home Tasks', navAll: 'Все задачи', navActive: 'Активные', navCompleted: 'Выполненные',
    shoppingCat: 'Покупки', cleaningCat: 'Уборка', studyCat: 'Учёба', workCat: 'Работа', healthCat: 'Здоровье', otherCat: 'Другое',
    themeStatusLight: 'Светлая', themeStatusDark: 'Тёмная', notifStatusOn: 'Вкл', notifStatusOff: 'Выкл',
    mainTitle: 'Менеджер задач', subtitle: 'Организуйте домашние дела по категориям, ставьте дедлайны и отслеживайте прогресс',
    searchPlaceholder: 'Поиск задач...', categoriesBtn: 'Категории', exportBtn: 'Экспорт', importBtn: 'Импорт',
    weeklyProgressTitle: '📈 Прогресс за неделю', statTotalLabel: 'Всего', statCompletedLabel: 'Выполнено',
    statActiveLabel: 'Активных', statOverdueLabel: 'Просрочено', calendarTitle: '📅 Календарь',
    addTaskPlaceholder: 'Что нужно сделать?', categorySelectPlaceholder: '📌 Категория', addBtnText: 'Добавить',
    sortLabel: 'Сортировка:', sortStatusDate: 'Статус и дате', sortDeadline: 'Дедлайну', sortCategory: 'Категории',
    sortCreated: 'Дате создания', sortAlpha: 'Алфавиту', modalTitle: '🏷️ Управление категориями',
    emojiPickerTitle: '🎨 Выберите эмодзи для категории:', selectedText: 'Выбрано:', addCategoryBtnText: 'Добавить',
    resetBtnText: 'Сброс к заводским настройкам',
    overdue: 'Просрочено', today: 'Сегодня', days: 'дн.',
    editTaskPrompt: 'Редактировать задачу:', newDeadlinePrompt: 'Новый дедлайн (ГГГГ-ММ-ДД):',
    categoryPrompt: 'Категория:', confirmDeleteTask: 'Удалить задачу?',
    emptyTaskWarning: 'Введите описание задачи', emptyTextWarning: 'Текст не может быть пустым',
    taskAdded: 'Задача добавлена', taskDeleted: 'Задача удалена', taskUpdated: 'Задача обновлена',
    overdueTaskCompleted: 'Просроченная задача выполнена!',
    exportSuccess: 'Экспортировано задач:', importConfirm: 'Импортировать задачи? Текущие будут заменены.',
    importSuccess: 'Импортировано задач:', importError: 'Ошибка импорта:',
    themeChanged: 'Тема:', notificationsOn: 'Уведомления включены', notificationsOff: 'Уведомления выключены',
    notificationsBlocked: 'Уведомления заблокированы', browserNotSupport: 'Браузер не поддерживает уведомления',
    overdueNotificationTitle: '⚠️ Просроченные задачи!',
    overdueNotificationBody: (count, names) => `${count} задач(и) просрочено: ${names}`,
    emptyAll: '📭 Список дел пуст. Добавьте первую задачу!',
    emptySearch: (q) => `🔍 Ничего не найдено по запросу "${q}"`,
    emptyActive: '✨ Нет активных задач! Отдыхайте или добавьте новую.',
    emptyCompleted: '🎉 Вы ещё не завершили ни одной задачи. Вперёд!',
    weekSummary: (total, avg, bestDay, bestCount) => `📊 За неделю: ${total} задач | 📈 В день: ${avg} | 🏆 Лучший: ${bestDay} (${bestCount})`,
    statsPanel: (total, completed, active, overdue) => `📊 Всего: ${total} | ✅ Выполнено: ${completed} | ⏳ Активно: ${active} | ⚠️ Просрочено: ${overdue}`,
    confirmDeleteCategory: (emoji, label, count) => `Удалить категорию "${emoji} ${label}"?${count > 0 ? `\n\n⚠️ В ней ${count} задач(и).` : ''}`,
    defaultCategoryWarning: 'Нельзя удалить последнюю базовую категорию',
    categoryDeleted: 'Категория удалена', categoryAdded: 'Категория добавлена', categoriesReset: 'Категории сброшены',
    enterCategoryName: 'Введите название категории', confirmResetCategories: (count) => `Сбросить категории? Будут удалены ${count} пользовательских.`,
    confirmDefaultCategoryDelete: 'Это БАЗОВАЯ категория! Удалить?'
  },
  en: {
    appTitle: 'Home Tasks', navAll: 'All Tasks', navActive: 'Active', navCompleted: 'Completed',
    shoppingCat: 'Shopping', cleaningCat: 'Cleaning', studyCat: 'Study', workCat: 'Work', healthCat: 'Health', otherCat: 'Other',
    themeStatusLight: 'Light', themeStatusDark: 'Dark', notifStatusOn: 'On', notifStatusOff: 'Off',
    mainTitle: 'Task Manager', subtitle: 'Organize your home tasks by category, set deadlines and track progress',
    searchPlaceholder: 'Search tasks...', categoriesBtn: 'Categories', exportBtn: 'Export', importBtn: 'Import',
    weeklyProgressTitle: '📈 Weekly Progress', statTotalLabel: 'Total', statCompletedLabel: 'Completed',
    statActiveLabel: 'Active', statOverdueLabel: 'Overdue', calendarTitle: '📅 Calendar',
    addTaskPlaceholder: 'What needs to be done?', categorySelectPlaceholder: '📌 Category', addBtnText: 'Add Task',
    sortLabel: 'Sort by:', sortStatusDate: 'Status & Date', sortDeadline: 'Deadline', sortCategory: 'Category',
    sortCreated: 'Created Date', sortAlpha: 'Alphabetical', modalTitle: '🏷️ Category Management',
    emojiPickerTitle: '🎨 Choose emoji for category:', selectedText: 'Selected:', addCategoryBtnText: 'Add',
    resetBtnText: 'Reset to Defaults',
    overdue: 'Overdue', today: 'Today', days: 'd',
    editTaskPrompt: 'Edit task:', newDeadlinePrompt: 'New deadline (YYYY-MM-DD):',
    categoryPrompt: 'Category:', confirmDeleteTask: 'Delete task?',
    emptyTaskWarning: 'Enter task description', emptyTextWarning: 'Text cannot be empty',
    taskAdded: 'Task added', taskDeleted: 'Task deleted', taskUpdated: 'Task updated',
    overdueTaskCompleted: 'Overdue task completed!',
    exportSuccess: 'Exported tasks:', importConfirm: 'Import tasks? Current will be replaced.',
    importSuccess: 'Imported tasks:', importError: 'Import error:',
    themeChanged: 'Theme:', notificationsOn: 'Notifications on', notificationsOff: 'Notifications off',
    notificationsBlocked: 'Notifications blocked', browserNotSupport: 'Browser does not support notifications',
    overdueNotificationTitle: '⚠️ Overdue tasks!',
    overdueNotificationBody: (count, names) => `${count} task(s) overdue: ${names}`,
    emptyAll: '📭 Task list is empty. Add your first task!',
    emptySearch: (q) => `🔍 Nothing found for "${q}"`,
    emptyActive: '✨ No active tasks! Relax or add a new one.',
    emptyCompleted: '🎉 You haven\'t completed any tasks yet. Go ahead!',
    weekSummary: (total, avg, bestDay, bestCount) => `📊 This week: ${total} tasks | 📈 Daily avg: ${avg} | 🏆 Best: ${bestDay} (${bestCount})`,
    statsPanel: (total, completed, active, overdue) => `📊 Total: ${total} | ✅ Completed: ${completed} | ⏳ Active: ${active} | ⚠️ Overdue: ${overdue}`,
    confirmDeleteCategory: (emoji, label, count) => `Delete category "${emoji} ${label}"?${count > 0 ? `\n\n⚠️ ${count} task(s) will become uncategorized.` : ''}`,
    defaultCategoryWarning: 'Cannot delete the last default category',
    categoryDeleted: 'Category deleted', categoryAdded: 'Category added', categoriesReset: 'Categories reset',
    enterCategoryName: 'Enter category name', confirmResetCategories: (count) => `Reset categories? ${count} custom will be removed.`,
    confirmDefaultCategoryDelete: 'This is a DEFAULT category! Delete anyway?'
  }
};

function t(key, ...args) { let text = translations[currentLang][key]; return typeof text === 'function' ? text(...args) : text; }

function getCategoryLabel(categoryKey) {
  const c = categories[categoryKey];
  if (!c) return '';
  const categoryLabelKeys = { shopping: 'shoppingCat', cleaning: 'cleaningCat', study: 'studyCat', work: 'workCat', health: 'healthCat', other: 'otherCat' };
  return categoryLabelKeys[categoryKey] ? t(categoryLabelKeys[categoryKey]) : c.label;
}

// ==================== DOM ELEMENTS ====================
const $ = id => document.getElementById(id);
const taskInput = $('taskInput');
const deadlineInput = $('deadlineInput');
const categoryInput = $('categoryInput');
const categoryFiltersEl = $('categoryFilters');
const addBtn = $('addBtn');
const taskListEl = $('taskList');
const statsPanel = $('statsPanel');
const sortSelect = $('sortSelect');
const notificationEl = $('notification');
const notifBtn = $('notifBtn');
const notifStatus = $('notifStatus');
const themeBtn = $('themeBtn');
const themeStatus = $('themeStatus');
const searchInput = $('searchInput');
const chartBarsEl = $('chartBars');
const chartSummaryEl = $('chartSummary');
const categoryModal = $('categoryModal');
const categoryListEl = $('categoryList');
const emojiGrid = $('emojiGrid');
const emojiPreview = $('emojiPreview');
const previewIcon = $('previewIcon');
const previewEmoji = $('previewEmoji');
const newCategoryEmojiInput = $('newCategoryEmoji');
const langBtn = $('langBtn');
const langStatus = $('langStatus');

// ==================== HELPERS ====================
function getTodayMidnight() { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }
function formatDate(ts) { if (!ts) return ''; const d = new Date(ts); return d.toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }); }
function getDeadlineStatus(deadlineTs) {
  if (!deadlineTs) return null;
  const today = getTodayMidnight();
  const deadline = new Date(deadlineTs); deadline.setHours(0,0,0,0);
  if (deadline.getTime() < today) return 'overdue';
  if (deadline.getTime() === today) return 'today';
  return 'future';
}
function getDaysOverdue(deadlineTs) { if(!deadlineTs) return 0; const today = getTodayMidnight(); const deadline = new Date(deadlineTs); deadline.setHours(0,0,0,0); return Math.floor((today - deadline.getTime()) / 86400000); }
function escapeHtml(str) { return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m] || m)); }
function showNotification(message, type = 'info') { notificationEl.textContent = message; notificationEl.className = `notification ${type} show`; setTimeout(() => notificationEl.classList.remove('show'), 3000); }

// ==================== CATEGORIES ====================
function loadCategories() {
  const stored = localStorage.getItem('homeCategories');
  categories = { ...DEFAULT_CATEGORIES };
  if (stored) { try { const custom = JSON.parse(stored); Object.keys(custom).forEach(k => categories[k] = custom[k]); } catch(e) {} }
  renderCategorySelectors();
}
function saveCategories() { const custom = {}; Object.keys(categories).forEach(k => { if(!categories[k].isDefault) custom[k] = categories[k]; }); localStorage.setItem('homeCategories', JSON.stringify(custom)); }
function generateCategoryKey() { return 'custom_'+Date.now().toString(36); }
function renderCategorySelectors() {
  categoryInput.innerHTML = `<option value="">${t('categorySelectPlaceholder')}</option>`;
  Object.keys(categories).forEach(key => { const c = categories[key]; categoryInput.innerHTML += `<option value="${key}">${c.emoji} ${getCategoryLabel(key)}</option>`; });
  categoryFiltersEl.innerHTML = `<button class="filter-btn active" data-category="all">🏷️ ${t('navAll')}</button>`;
  Object.keys(categories).forEach(key => { const c = categories[key]; const isActive = currentCategory === key ? 'active' : ''; categoryFiltersEl.innerHTML += `<button class="filter-btn ${isActive}" data-category="${key}">${c.emoji} ${getCategoryLabel(key)}</button>`; });
  document.querySelectorAll('#categoryFilters .filter-btn').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.category)));
}
function renderCategoryList() {
  categoryListEl.innerHTML = '';
  Object.keys(categories).forEach(key => {
    const c = categories[key];
    const taskCount = tasks.filter(t => t.category === key && !t.completed).length;
    categoryListEl.innerHTML += `<div class="category-item"><div class="category-item-info"><span class="category-item-emoji">${c.emoji}</span><span class="category-item-name">${getCategoryLabel(key)}</span>${c.isDefault ? '<span class="default-badge">'+(currentLang==='ru'?'Базовая':'Default')+'</span>' : ''}<span class="category-item-count">(${taskCount} ${currentLang==='ru'?'активн.':'active'})</span></div><div class="category-item-actions"><button class="category-btn delete delete-category-btn" data-key="${key}">🗑️</button></div></div>`;
  });
}
function deleteCategory(key) {
  const cat = categories[key];
  if (!cat) return;
  const taskCount = tasks.filter(t => t.category === key).length;
  if (!confirm(t('confirmDeleteCategory', cat.emoji, getCategoryLabel(key), taskCount))) return;
  if (cat.isDefault && Object.values(categories).filter(c => c.isDefault).length <= 1) { showNotification(t('defaultCategoryWarning'), 'error'); return; }
  if (taskCount > 0) { tasks.forEach(t => { if (t.category === key) t.category = 'other'; }); saveTasksToStorage(); }
  if (currentCategory === key) { currentCategory = 'all'; updateCategoryFilterButtons(); }
  delete categories[key];
  saveCategories();
  renderCategorySelectors();
  renderCategoryList();
  render();
  showNotification(t('categoryDeleted'), 'success');
}
function addNewCategory() {
  const nameInput = $('newCategoryName');
  const colorInput = $('newCategoryColor');
  const name = nameInput.value.trim();
  const emoji = newCategoryEmojiInput.value.trim() || selectedEmoji;
  if (!name) { showNotification(t('enterCategoryName'), 'warning'); return; }
  const key = generateCategoryKey();
  categories[key] = { emoji, label: name, color: colorInput.value, isDefault: false };
  saveCategories();
  renderCategorySelectors();
  renderCategoryList();
  render();
  nameInput.value = '';
  newCategoryEmojiInput.value = '';
  selectedEmoji = '📌';
  emojiPreview.style.display = 'none';
  showNotification(t('categoryAdded'), 'success');
}
function resetCategories() {
  const customCount = Object.values(categories).filter(c => !c.isDefault).length;
  if (customCount === 0) return;
  if (!confirm(t('confirmResetCategories', customCount))) return;
  const customKeys = Object.keys(categories).filter(key => !categories[key].isDefault);
  tasks.forEach(t => { if (customKeys.includes(t.category)) t.category = 'other'; });
  categories = { ...DEFAULT_CATEGORIES };
  saveCategories();
  saveTasksToStorage();
  if (currentCategory !== 'all' && !categories[currentCategory]) currentCategory = 'all';
  renderCategorySelectors();
  renderCategoryList();
  render();
  showNotification(t('categoriesReset'), 'success');
}
function updateCategoryFilterButtons() { document.querySelectorAll('#categoryFilters .filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.category === currentCategory)); }
function setCategory(category) { currentCategory = category; updateCategoryFilterButtons(); render(); }

// ==================== EMOJI PICKER ====================
function initEmojiPicker() {
  const container = $('emojiCategories');
  container.innerHTML = `<button class="emoji-category-tab active" data-category="all">${currentLang==='ru'?'Все':'All'}</button><button class="emoji-category-tab" data-category="house">🏠 ${currentLang==='ru'?'Дом':'House'}</button><button class="emoji-category-tab" data-category="work">💼 ${currentLang==='ru'?'Работа':'Work'}</button><button class="emoji-category-tab" data-category="health">❤️ ${currentLang==='ru'?'Здоровье':'Health'}</button><button class="emoji-category-tab" data-category="shopping">🛒 ${currentLang==='ru'?'Покупки':'Shopping'}</button><button class="emoji-category-tab" data-category="other">📦 ${currentLang==='ru'?'Другое':'Other'}</button>`;
  document.querySelectorAll('.emoji-category-tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.emoji-category-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); showEmojiCategory(tab.dataset.category); }));
  showEmojiCategory('all');
}
function showEmojiCategory(category) { const emojis = EMOJI_COLLECTION[category] || EMOJI_COLLECTION.all; emojiGrid.innerHTML = emojis.map(e => `<div class="emoji-item ${e===selectedEmoji?'selected':''}" data-emoji="${e}">${e}</div>`).join(''); }
function selectEmoji(emoji) { selectedEmoji = emoji; newCategoryEmojiInput.value = emoji; document.querySelectorAll('.emoji-item').forEach(item => item.classList.toggle('selected', item.dataset.emoji === emoji)); previewIcon.textContent = emoji; previewEmoji.textContent = emoji; emojiPreview.style.display = 'flex'; }

// ==================== THEME & NOTIFICATIONS ====================
function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); currentTheme = theme; localStorage.setItem('theme', theme); themeStatus.textContent = theme === 'dark' ? t('themeStatusDark') : t('themeStatusLight'); }
function toggleTheme() { const newTheme = currentTheme === 'light' ? 'dark' : 'light'; applyTheme(newTheme); showNotification(`${t('themeChanged')} ${newTheme === 'dark' ? t('themeStatusDark') : t('themeStatusLight')}`, 'info'); }
function updateNotificationButton() { notifBtn.classList.toggle('active', notificationsEnabled); notifStatus.textContent = notificationsEnabled ? t('notifStatusOn') : t('notifStatusOff'); }
function requestNotificationPermission() { if (!('Notification' in window)) return showNotification(t('browserNotSupport'), 'error'); if (Notification.permission === 'granted') return true; if (Notification.permission !== 'denied') { Notification.requestPermission().then(permission => { if (permission === 'granted') { notificationsEnabled = true; localStorage.setItem('notificationsEnabled', 'true'); updateNotificationButton(); showNotification(t('notificationsOn'), 'success'); checkOverdueTasks(); } }); } else { showNotification(t('notificationsBlocked'), 'warning'); } return false; }
function toggleNotifications() { if (notificationsEnabled) { notificationsEnabled = false; localStorage.setItem('notificationsEnabled', 'false'); updateNotificationButton(); showNotification(t('notificationsOff'), 'info'); } else { requestNotificationPermission(); } }
function sendBrowserNotification(title, body, icon = '🧹') { if (!notificationsEnabled || Notification.permission !== 'granted') return; new Notification(title, { body, icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`, requireInteraction: false, tag: 'tasks-overdue', timestamp: Date.now() }); }
function checkOverdueTasks() { if (!notificationsEnabled || Notification.permission !== 'granted') return; const overdue = tasks.filter(t => !t.completed && getDeadlineStatus(t.deadline) === 'overdue'); if (overdue.length > 0) { const taskNames = overdue.slice(0,3).map(t=>t.text).join(', '); const more = overdue.length>3?` ${currentLang==='ru'?'и ещё':'and'} ${overdue.length-3}`:''; sendBrowserNotification(t('overdueNotificationTitle'), t('overdueNotificationBody', overdue.length, taskNames+more), '🔴'); } }

// ==================== STORAGE ====================
function loadTasksFromStorage() {
  const stored = localStorage.getItem('homeTasks');
  if (stored) { try { tasks = JSON.parse(stored).map(t => ({ ...t, id: t.id ?? Date.now()+Math.random() })); } catch(e) { tasks = []; } }
  else { const now = Date.now(); tasks = [ { id:1, text: currentLang==='ru'?'Купить молоко':'Buy milk', completed:false, createdAt:now-300000, deadline:now+86400000, category:'shopping' }, { id:2, text: currentLang==='ru'?'Помыть пол':'Clean floor', completed:true, createdAt:now-600000, deadline:null, category:'cleaning' }, { id:3, text: currentLang==='ru'?'Сдать отчёт':'Submit report', completed:false, createdAt:now-100000, deadline:now-172800000, category:'work' } ]; }
}
function saveTasksToStorage() { localStorage.setItem('homeTasks', JSON.stringify(tasks)); }

// ==================== EXPORT / IMPORT ====================
function exportTasks() { const data = { tasks, categories }; const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(a.href); showNotification(`${t('exportSuccess')} ${tasks.length}`, 'success'); }
function importTasks(event) { const file = event.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = e => { try { const data = JSON.parse(e.target.result); if(!data.tasks || !Array.isArray(data.tasks)) throw new Error('Invalid'); if(!confirm(t('importConfirm'))) return; tasks = data.tasks.map(t => ({ ...t, id: t.id ?? Date.now()+Math.random() })); if(data.categories) { categories = { ...DEFAULT_CATEGORIES, ...data.categories }; saveCategories(); renderCategorySelectors(); } saveTasksToStorage(); render(); showNotification(`${t('importSuccess')} ${data.tasks.length}`, 'success'); } catch(err) { showNotification(`${t('importError')} ${err.message}`, 'error'); } }; reader.readAsText(file); event.target.value = ''; }

// ==================== CHART & CALENDAR ====================
function renderProgressChart() {
  const today = getTodayMidnight(); const days = [];
  for(let i=6;i>=0;i--) { const dayTime = today - i*86400000; const completedCount = tasks.filter(t => t.completed && t.createdAt >= dayTime && t.createdAt < dayTime+86400000).length; const date = new Date(dayTime); days.push({ name: date.toLocaleDateString(currentLang==='ru'?'ru-RU':'en-US',{weekday:'short'}), date: date.toLocaleDateString(currentLang==='ru'?'ru-RU':'en-US',{day:'2-digit',month:'2-digit'}), completed: completedCount }); }
  const maxComp = Math.max(...days.map(d=>d.completed),1);
  chartBarsEl.innerHTML = days.map(day => `<div class="chart-bar"><span class="chart-bar-value">${day.completed}</span><div class="chart-bar-fill" style="height:${Math.max((day.completed/maxComp)*80,4)}px"></div><span class="chart-bar-label">${day.name}<br>${day.date}</span></div>`).join('');
  const totalWeek = days.reduce((s,d)=>s+d.completed,0); const avg = (totalWeek/7).toFixed(1); const best = days.reduce((b,d)=>d.completed>b.completed?d:b, days[0]); chartSummaryEl.innerHTML = t('weekSummary', totalWeek, avg, best.name, best.completed);
}

function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  if (!container) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const dayNames = currentLang === 'ru'
    ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = currentLang === 'ru'
    ? ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let html = `<div style="text-align:center;margin-bottom:12px;font-weight:600;">${monthNames[month]} ${year}</div>`;
  html += `<div class="calendar-grid">`;
  dayNames.forEach(day => html += `<div class="calendar-day-header">${day}</div>`);
  
  // Смещение для первого дня (0 - воскресенье, корректируем)
  let startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startOffset; i++) html += `<div class="calendar-day"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = (d === today && month === now.getMonth() && year === now.getFullYear());
    html += `<div class="calendar-day ${isToday ? 'active' : ''}">${d}</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

// ==================== FILTER & SORT ====================
function getFilteredAndSortedTasks() {
  let res = [...tasks];
  if(currentSearch) res = res.filter(t => t.text.toLowerCase().includes(currentSearch));
  if(currentFilter === 'active') res = res.filter(t => !t.completed);
  else if(currentFilter === 'completed') res = res.filter(t => t.completed);
  if(currentCategory !== 'all') res = res.filter(t => t.category === currentCategory);
  res.sort((a,b) => {
    if(currentSort === 'deadline') {
      const aOver = !a.completed && getDeadlineStatus(a.deadline)==='overdue';
      const bOver = !b.completed && getDeadlineStatus(b.deadline)==='overdue';
      if(aOver && !bOver) return -1; if(!aOver && bOver) return 1;
      if(a.deadline && !b.deadline) return -1; if(!a.deadline && b.deadline) return 1;
      if(a.deadline && b.deadline) return a.deadline - b.deadline;
      return b.createdAt - a.createdAt;
    }
    if(currentSort === 'category') { if(a.category && !b.category) return -1; if(!a.category && b.category) return 1; if(a.category && b.category) return a.category.localeCompare(b.category); return b.createdAt - a.createdAt; }
    if(currentSort === 'created') return b.createdAt - a.createdAt;
    if(currentSort === 'alpha') return a.text.localeCompare(b.text, currentLang==='ru'?'ru':'en');
    const diff = Number(a.completed) - Number(b.completed);
    return diff !== 0 ? diff : b.createdAt - a.createdAt;
  });
  return res;
}

// ==================== RENDER ====================
function render() {
  const taskListEl = document.getElementById('taskList');
  if (!taskListEl) {
    console.error('taskList element missing!');
    return;
  }
  const filtered = getFilteredAndSortedTasks();
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  const overdue = tasks.filter(t => !t.completed && getDeadlineStatus(t.deadline) === 'overdue').length;
  document.getElementById('totalTasks').innerText = total;
  document.getElementById('completedTasks').innerText = completed;
  document.getElementById('activeTasks').innerText = active;
  document.getElementById('overdueTasks').innerText = overdue;

  if(filtered.length === 0) {
    let msg = t('emptyAll');
    if(currentSearch) msg = t('emptySearch', currentSearch);
    else if(currentFilter === 'active') msg = t('emptyActive');
    else if(currentFilter === 'completed') msg = t('emptyCompleted');
    taskListEl.innerHTML = `<div class="empty-msg">${msg}</div>`;
  } else {
    taskListEl.innerHTML = filtered.map(task => {
      const deadlineStatus = getDeadlineStatus(task.deadline);
      const deadlineClass = deadlineStatus ? `deadline-${deadlineStatus}` : '';
      let deadlineHtml = '';
      if(task.deadline) {
        const emoji = deadlineStatus==='overdue'?'🔴':deadlineStatus==='today'?'🟡':'🟢';
        const dateStr = formatDate(task.deadline);
        if(deadlineStatus==='overdue') deadlineHtml = `<span style="display:inline-block;animation:shake 0.5s infinite;">⚠️</span> ${emoji} ${t('overdue')} (${getDaysOverdue(task.deadline)} ${t('days')})`;
        else if(deadlineStatus==='today') deadlineHtml = `${emoji} ${t('today')} (${dateStr})`;
        else deadlineHtml = `${emoji} ${dateStr}`;
      }
      const catInfo = task.category ? categories[task.category] : null;
      const catClass = catInfo ? (catInfo.isDefault ? catInfo.label.toLowerCase() : 'custom') : 'other';
      const catBadge = catInfo ? `<span class="category-badge ${catClass}">${catInfo.emoji} ${getCategoryLabel(task.category)}</span>` : '';
      return `<li class="task-item ${deadlineClass}" data-id="${task.id}"><input type="checkbox" class="task-check" ${task.completed ? 'checked' : ''} data-id="${task.id}"><div class="task-content"><span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span><div class="task-meta">${catBadge}${deadlineHtml}</div></div><div class="task-actions"><button class="edit-btn" data-id="${task.id}">✏️</button><button class="delete-btn" data-id="${task.id}">🗑️</button></div></li>`;
    }).join('');
  }
  let catStats = '';
  Object.keys(categories).forEach(k => { const cnt = tasks.filter(t => t.category === k && !t.completed).length; if(cnt>0) catStats += `<span class="stat-cat">${categories[k].emoji} ${cnt}</span>`; });
  statsPanel.innerHTML = `<div>${t('statsPanel', total, completed, active, overdue)}</div>${catStats ? `<div style="display:flex;gap:8px;flex-wrap:wrap;">${catStats}</div>` : ''}`;
  saveTasksToStorage();
  renderProgressChart();
  renderCalendar();
}

// ==================== CRUD TASKS ====================
function addTask() {
  const text = taskInput.value.trim();
  if(!text) { showNotification(t('emptyTaskWarning'), 'warning'); return; }
  const deadline = deadlineInput.value ? new Date(deadlineInput.value).getTime() : null;
  const category = categoryInput.value || null;
  tasks.push({ id: Date.now(), text, completed: false, createdAt: Date.now(), deadline, category });
  taskInput.value = ''; deadlineInput.value = ''; categoryInput.value = '';
  render();
  showNotification(t('taskAdded'), 'success');
}
function toggleTaskCompletion(id) { const tsk = tasks.find(t => t.id === id); if(tsk) { const wasOverdue = !tsk.completed && getDeadlineStatus(tsk.deadline) === 'overdue'; tsk.completed = !tsk.completed; render(); if(wasOverdue && tsk.completed && notificationsEnabled) showNotification(t('overdueTaskCompleted'), 'success'); } }
function deleteTask(id) { if(confirm(t('confirmDeleteTask'))) { tasks = tasks.filter(t => t.id !== id); render(); showNotification(t('taskDeleted'), 'info'); } }
function editTask(id) {
  const tsk = tasks.find(t => t.id === id);
  if(!tsk) return;
  const newText = prompt(t('editTaskPrompt'), tsk.text);
  if(newText !== null && newText.trim()) {
    tsk.text = newText.trim();
    const newDeadline = prompt(t('newDeadlinePrompt'), tsk.deadline ? new Date(tsk.deadline).toISOString().slice(0,10) : '');
    if(newDeadline !== null) tsk.deadline = newDeadline.trim() ? new Date(newDeadline).getTime() : null;
    const newCat = prompt(t('categoryPrompt'), tsk.category || '');
    if(newCat !== null) tsk.category = newCat.trim() || null;
    render();
    showNotification(t('taskUpdated'), 'info');
  } else if(newText !== null) showNotification(t('emptyTextWarning'), 'warning');
}
function setFilter(filter) { currentFilter = filter; document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.filter === filter)); render(); }
function handleSearch() { currentSearch = searchInput.value.toLowerCase().trim(); render(); }
function handleListClick(e) { const li = e.target.closest('[data-id]'); if(!li) return; const id = parseInt(li.dataset.id); if(e.target.classList.contains('task-check')) toggleTaskCompletion(id); else if(e.target.classList.contains('delete-btn')) deleteTask(id); else if(e.target.classList.contains('edit-btn')) editTask(id); }

// ==================== LANGUAGE ====================
function applyLanguage() {
  document.getElementById('appTitle').innerText = t('appTitle');
  document.getElementById('navAll').innerText = t('navAll');
  document.getElementById('navActive').innerText = t('navActive');
  document.getElementById('navCompleted').innerText = t('navCompleted');
  document.getElementById('mainTitle').innerText = t('mainTitle');
  document.getElementById('subtitle').innerText = t('subtitle');
  document.getElementById('searchInput').placeholder = t('searchPlaceholder');
  document.getElementById('categoriesBtnText').innerText = t('categoriesBtn');
  document.getElementById('exportBtnText').innerText = t('exportBtn');
  document.getElementById('importBtnText').innerText = t('importBtn');
  document.getElementById('weeklyProgressTitle').innerText = t('weeklyProgressTitle');
  document.getElementById('statTotalLabel').innerText = t('statTotalLabel');
  document.getElementById('statCompletedLabel').innerText = t('statCompletedLabel');
  document.getElementById('statActiveLabel').innerText = t('statActiveLabel');
  document.getElementById('statOverdueLabel').innerText = t('statOverdueLabel');
  document.getElementById('calendarTitleText').innerText = t('calendarTitle');
  document.getElementById('taskInput').placeholder = t('addTaskPlaceholder');
  document.getElementById('addBtnText').innerText = t('addBtnText');
  document.getElementById('sortLabel').innerText = t('sortLabel');
  document.getElementById('sortStatusDate').innerText = t('sortStatusDate');
  document.getElementById('sortDeadline').innerText = t('sortDeadline');
  document.getElementById('sortCategory').innerText = t('sortCategory');
  document.getElementById('sortCreated').innerText = t('sortCreated');
  document.getElementById('sortAlpha').innerText = t('sortAlpha');
  document.getElementById('modalTitle').innerText = t('modalTitle');
  document.getElementById('emojiPickerTitle').innerText = t('emojiPickerTitle');
  document.getElementById('selectedText').innerHTML = `${t('selectedText')} <span id="previewEmoji">${selectedEmoji}</span>`;
  document.getElementById('addCategoryBtnText').innerText = t('addCategoryBtnText');
  document.getElementById('resetBtnText').innerText = t('resetBtnText');
  document.getElementById('themeStatus').innerText = currentTheme === 'dark' ? t('themeStatusDark') : t('themeStatusLight');
  document.getElementById('notifStatus').innerText = notificationsEnabled ? t('notifStatusOn') : t('notifStatusOff');
  document.getElementById('langStatus').innerText = currentLang === 'ru' ? 'RU' : 'EN';
  renderCategorySelectors();
  render();
}
function toggleLanguage() { currentLang = currentLang === 'ru' ? 'en' : 'ru'; localStorage.setItem('language', currentLang); applyLanguage(); }

// ==================== EVENT LISTENERS ====================
function initEventListeners() {
  $('exportBtn').addEventListener('click', exportTasks);
  $('importBtn').addEventListener('click', () => $('importFileInput').click());
  $('importFileInput').addEventListener('change', importTasks);
  notifBtn.addEventListener('click', toggleNotifications);
  themeBtn.addEventListener('click', toggleTheme);
  langBtn.addEventListener('click', toggleLanguage);
  $('categoriesBtn').addEventListener('click', () => { renderCategoryList(); initEmojiPicker(); selectedEmoji = '📌'; newCategoryEmojiInput.value = ''; emojiPreview.style.display = 'none'; categoryModal.classList.add('show'); });
  $('modalCloseBtn').addEventListener('click', () => categoryModal.classList.remove('show'));
  $('resetCategoriesBtn').addEventListener('click', resetCategories);
  $('addCategoryBtn').addEventListener('click', addNewCategory);
  searchInput.addEventListener('input', handleSearch);
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', e => { if(e.key === 'Enter') addTask(); });
  taskListEl.addEventListener('click', handleListClick);
  document.querySelectorAll('.nav-item[data-filter]').forEach(item => item.addEventListener('click', () => setFilter(item.dataset.filter)));
  sortSelect.addEventListener('change', e => { currentSort = e.target.value; render(); });
  deadlineInput.min = new Date().toISOString().split('T')[0];
  categoryModal.addEventListener('click', e => { if(e.target === categoryModal) categoryModal.classList.remove('show'); });
  categoryListEl.addEventListener('click', e => { const btn = e.target.closest('.delete-category-btn'); if(btn) deleteCategory(btn.dataset.key); });
  emojiGrid.addEventListener('click', e => { const emojiDiv = e.target.closest('.emoji-item'); if(emojiDiv) selectEmoji(emojiDiv.dataset.emoji); });
}

// ==================== INIT ====================
function init() {
  applyTheme(currentTheme);
  loadCategories();
  loadTasksFromStorage();
  updateNotificationButton();
  initEventListeners();
  applyLanguage();
  render();
  setTimeout(() => { if(notificationsEnabled) checkOverdueTasks(); }, 500);
}
init();