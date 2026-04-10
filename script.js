// --- Модель данных ---
let tasks = [];
let categories = {};
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'status-date';
let currentSearch = '';
let notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
let currentTheme = localStorage.getItem('theme') || 'light';
let selectedEmoji = '📌';

// 🏷️ БАЗОВЫЕ КАТЕГОРИИ
const DEFAULT_CATEGORIES = {
    shopping: { emoji: '🛒', label: 'Покупки', color: '#2e7d32', isDefault: true },
    cleaning: { emoji: '🧹', label: 'Уборка', color: '#1976d2', isDefault: true },
    study:    { emoji: '📚', label: 'Учёба', color: '#f57c00', isDefault: true },
    work:     { emoji: '💼', label: 'Работа', color: '#7b1fa2', isDefault: true },
    health:   { emoji: '❤️', label: 'Здоровье', color: '#c2185b', isDefault: true },
    other:    { emoji: '📦', label: 'Другое', color: '#616161', isDefault: true }
};

const EMOJI_COLLECTION = {
    house: ['🏠', '🏡', '🧹', '🛏️', '🛁', '🍳', '🔧', '🚪', '🌱', '💡', '🧽', '🪣'],
    work: ['💼', '💻', '📊', '📈', '📝', '✍️', '📁', '🗂️', '⏰', '📅', '🎯', '💰'],
    health: ['❤️', '🏃', '🧘', '💪', '🥗', '🍎', '🚴', '🏥', '😴', '🏋️', '🧠', '💊'],
    shopping: ['🛒', '👕', '👟', '💳', '🎁', '👜', '📦', '🚚', '🏪', '🥛', '🍞', '🧴'],
    study: ['📚', '✏️', '🎓', '📖', '📝', '🎒', '🔬', '🖊️', '📓', '🎨', '📐', '🔖'],
    food: ['🍕', '🍔', '🍜', '🍰', '☕', '🍺', '🍱', '🥙', '🍦', '🍳', '🥗', '🍎'],
    travel: ['✈️', '🚗', '🚆', '🚌', '🗺️', '🧳', '🏖️', '⛰️', '🏨', '🎫', '🚲', '🛥️'],
    entertainment: ['🎬', '🎮', '🎪', '🎭', '🎨', '🎵', '🎸', '📺', '🎲', '🎯', '🎢', '🎤'],
    other: ['📌', '📦', '⭐', '🔔', '💭', '💡', '🔥', '✨', '🎉', '🌟', '💫', '📍']
};
EMOJI_COLLECTION.all = [...new Set(Object.values(EMOJI_COLLECTION).flat())];

// DOM элементы
const taskInput = document.getElementById('taskInput');
const deadlineInput = document.getElementById('deadlineInput');
const categoryInput = document.getElementById('categoryInput');
const categoryFiltersEl = document.getElementById('categoryFilters');
const addBtn = document.getElementById('addBtn');
const taskListEl = document.getElementById('taskList');
const statsPanel = document.getElementById('statsPanel');
const filterBtns = document.querySelectorAll('#mainFilters .filter-btn');
const sortSelect = document.getElementById('sortSelect');
const notificationEl = document.getElementById('notification');
const notifBtn = document.getElementById('notifBtn');
const notifStatus = document.getElementById('notifStatus');
const themeBtn = document.getElementById('themeBtn');
const themeStatus = document.getElementById('themeStatus');
const searchInput = document.getElementById('searchInput');
const chartBarsEl = document.getElementById('chartBars');
const chartSummaryEl = document.getElementById('chartSummary');
const categoryModal = document.getElementById('categoryModal');
const categoryListEl = document.getElementById('categoryList');
const emojiGrid = document.getElementById('emojiGrid');
const emojiPreview = document.getElementById('emojiPreview');
const previewIcon = document.getElementById('previewIcon');
const previewEmoji = document.getElementById('previewEmoji');
const newCategoryEmojiInput = document.getElementById('newCategoryEmoji');

// --- Вспомогательные функции ---
function getTodayMidnight() {
    const d = new Date(); d.setHours(0,0,0,0); return d.getTime();
}
function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function getDeadlineStatus(deadlineTs) {
    if (!deadlineTs) return null;
    const today = getTodayMidnight();
    const deadline = new Date(deadlineTs); deadline.setHours(0,0,0,0);
    if (deadline.getTime() < today) return 'overdue';
    if (deadline.getTime() === today) return 'today';
    return 'future';
}
function getDeadlineEmoji(status) {
    return status === 'overdue' ? '🔴' : status === 'today' ? '🟡' : '🟢';
}
function getDaysOverdue(deadlineTs) {
    if (!deadlineTs) return 0;
    const today = getTodayMidnight();
    const deadline = new Date(deadlineTs); deadline.setHours(0,0,0,0);
    const diff = today - deadline.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function showNotification(message, type = 'info') {
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type} show`;
    setTimeout(() => notificationEl.classList.remove('show'), 3000);
}

// --- Категории ---
function loadCategories() {
    const stored = localStorage.getItem('homeCategories');
    categories = { ...DEFAULT_CATEGORIES };
    if (stored) {
        try {
            const custom = JSON.parse(stored);
            if (custom && typeof custom === 'object') {
                Object.keys(custom).forEach(key => {
                    categories[key] = custom[key];
                });
            }
        } catch(e) { console.warn(e); }
    }
    renderCategorySelectors();
}
function saveCategories() {
    const custom = {};
    Object.keys(categories).forEach(key => {
        if (!categories[key].isDefault) custom[key] = categories[key];
    });
    localStorage.setItem('homeCategories', JSON.stringify(custom));
}
function generateCategoryKey() {
    return 'custom_' + Date.now().toString(36);
}
function renderCategorySelectors() {
    categoryInput.innerHTML = '<option value="">📌 Категория</option>';
    Object.keys(categories).forEach(key => {
        const cat = categories[key];
        categoryInput.innerHTML += `<option value="${key}">${cat.emoji} ${cat.label}</option>`;
    });
    categoryFiltersEl.innerHTML = '<button class="filter-btn active" data-category="all">🏷️ Все</button>';
    Object.keys(categories).forEach(key => {
        const cat = categories[key];
        const isActive = currentCategory === key ? 'active' : '';
        categoryFiltersEl.innerHTML += `<button class="filter-btn ${isActive}" data-category="${key}">${cat.emoji} ${cat.label}</button>`;
    });
    document.querySelectorAll('#categoryFilters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setCategory(btn.dataset.category));
    });
}
function renderCategoryList() {
    categoryListEl.innerHTML = '';
    Object.keys(categories).forEach(key => {
        const cat = categories[key];
        const taskCount = tasks.filter(t => t.category === key && !t.completed).length;
        categoryListEl.innerHTML += `
            <div class="category-item" data-category-key="${key}">
                <div class="category-item-info">
                    <span class="category-item-emoji">${cat.emoji}</span>
                    <span class="category-item-name">${cat.label}</span>
                    ${cat.isDefault ? '<span class="default-badge">Базовая</span>' : ''}
                    <span class="category-item-count">(${taskCount} активн.)</span>
                </div>
                <div class="category-item-actions">
                    <button class="category-btn delete delete-category-btn" data-key="${key}">🗑️</button>
                </div>
            </div>
        `;
    });
}
function deleteCategory(key) {
    const cat = categories[key];
    if (!cat) { showNotification('⚠️ Категория не найдена', 'warning'); return; }
    const taskCount = tasks.filter(t => t.category === key).length;
    let confirmMsg = `Удалить категорию "${cat.emoji} ${cat.label}"?`;
    if (taskCount > 0) confirmMsg += `\n\n⚠️ В этой категории ${taskCount} задач(и). Они станут без категории.`;
    if (!confirm(confirmMsg)) return;
    if (cat.isDefault) {
        if (!confirm('⚠️⚠️⚠️ ВНИМАНИЕ ⚠️⚠️⚠️\n\nЭто БАЗОВАЯ категория!\n\nВы уверены, что хотите её удалить?')) return;
    }
    if (taskCount > 0) {
        tasks.forEach(t => { if (t.category === key) t.category = 'other'; });
        saveTasksToStorage();
    }
    if (currentCategory === key) { currentCategory = 'all'; updateCategoryFilterButtons(); }
    const defaultCount = Object.values(categories).filter(c => c.isDefault).length;
    if (cat.isDefault && defaultCount <= 1) { showNotification('⚠️ Нельзя удалить последнюю базовую категорию', 'error'); return; }
    delete categories[key];
    saveCategories();
    renderCategorySelectors();
    renderCategoryList();
    render();
    showNotification(`✅ Категория "${cat.label}" удалена`, 'success');
}
function addNewCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const colorInput = document.getElementById('newCategoryColor');
    const name = nameInput.value.trim();
    const emoji = newCategoryEmojiInput.value.trim() || selectedEmoji;
    const color = colorInput.value;
    if (!name) { showNotification('⚠️ Введите название категории', 'warning'); return; }
    const key = generateCategoryKey();
    categories[key] = { emoji, label: name, color, isDefault: false };
    saveCategories();
    renderCategorySelectors();
    renderCategoryList();
    render();
    nameInput.value = '';
    newCategoryEmojiInput.value = '';
    selectedEmoji = '📌';
    emojiPreview.style.display = 'none';
    showNotification(`✅ Категория "${emoji} ${name}" добавлена`, 'success');
}
function resetCategories() {
    const customCount = Object.values(categories).filter(c => !c.isDefault).length;
    if (customCount === 0) { showNotification('ℹ️ Уже используются заводские настройки', 'info'); return; }
    if (!confirm(`🔄 Сброс категорий к заводским настройкам\n\nБудут удалены ${customCount} пользовательских категорий.\nЗадачи из удалённых категорий будут перенесены в "📦 Другое".\n\nПродолжить?`)) return;
    const customKeys = Object.keys(categories).filter(key => !categories[key].isDefault);
    tasks.forEach(t => { if (customKeys.includes(t.category)) t.category = 'other'; });
    categories = { ...DEFAULT_CATEGORIES };
    saveCategories();
    saveTasksToStorage();
    if (currentCategory !== 'all' && !categories[currentCategory]) currentCategory = 'all';
    renderCategorySelectors();
    renderCategoryList();
    render();
    showNotification('✅ Категории сброшены к заводским настройкам', 'success');
}
function updateCategoryFilterButtons() {
    document.querySelectorAll('#categoryFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentCategory);
    });
}
function openCategoryModal() {
    renderCategoryList();
    initEmojiPicker();
    selectedEmoji = '📌';
    newCategoryEmojiInput.value = '';
    emojiPreview.style.display = 'none';
    categoryModal.classList.add('show');
}
function closeCategoryModal() {
    categoryModal.classList.remove('show');
}
function setCategory(category) {
    currentCategory = category;
    updateCategoryFilterButtons();
    render();
}

// --- Emoji Picker ---
function initEmojiPicker() {
    const container = document.getElementById('emojiCategories');
    container.innerHTML = `
        <button class="emoji-category-tab active" data-category="all">Все</button>
        <button class="emoji-category-tab" data-category="house">🏠 Дом</button>
        <button class="emoji-category-tab" data-category="work">💼 Работа</button>
        <button class="emoji-category-tab" data-category="health">❤️ Здоровье</button>
        <button class="emoji-category-tab" data-category="shopping">🛒 Покупки</button>
        <button class="emoji-category-tab" data-category="other">📦 Другое</button>
    `;
    document.querySelectorAll('.emoji-category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const cat = e.currentTarget.getAttribute('data-category');
            showEmojiCategory(cat);
        });
    });
    showEmojiCategory('all');
}
function showEmojiCategory(category) {
    document.querySelectorAll('.emoji-category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-category') === category);
    });
    const emojis = EMOJI_COLLECTION[category] || EMOJI_COLLECTION.all;
    renderEmojiGrid(emojis);
}
function renderEmojiGrid(emojis) {
    emojiGrid.innerHTML = emojis.map(emoji => `
        <div class="emoji-item ${emoji === selectedEmoji ? 'selected' : ''}" data-emoji="${emoji}">
            ${emoji}
        </div>
    `).join('');
}
function selectEmoji(emoji) {
    selectedEmoji = emoji;
    newCategoryEmojiInput.value = emoji;
    document.querySelectorAll('.emoji-item').forEach(item => {
        item.classList.toggle('selected', item.getAttribute('data-emoji') === emoji);
    });
    previewIcon.textContent = emoji;
    previewEmoji.textContent = emoji;
    emojiPreview.style.display = 'flex';
}

// --- Тема и уведомления ---
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    themeStatus.textContent = theme === 'dark' ? 'Тёмная' : 'Светлая';
}
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    showNotification(`🌙 Тема: ${newTheme === 'dark' ? 'Тёмная' : 'Светлая'}`, 'info');
}
function updateNotificationButton() {
    if (notificationsEnabled) {
        notifBtn.classList.add('active');
        notifStatus.textContent = 'Вкл';
    } else {
        notifBtn.classList.remove('active');
        notifStatus.textContent = 'Выкл';
    }
}
function requestNotificationPermission() {
    if (!('Notification' in window)) { showNotification('❌ Ваш браузер не поддерживает уведомления', 'error'); return false; }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notificationsEnabled = true;
                localStorage.setItem('notificationsEnabled', 'true');
                updateNotificationButton();
                showNotification('✅ Уведомления включены!', 'success');
                checkOverdueTasks();
            }
        });
    } else {
        showNotification('⚠️ Уведомления заблокированы. Разрешите в настройках браузера', 'warning');
    }
    return false;
}
function toggleNotifications() {
    if (notificationsEnabled) {
        notificationsEnabled = false;
        localStorage.setItem('notificationsEnabled', 'false');
        updateNotificationButton();
        showNotification('🔕 Уведомления выключены', 'info');
    } else {
        requestNotificationPermission();
    }
}
function sendBrowserNotification(title, body, icon = '🧹') {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    new Notification(title, { body, icon: `image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`, requireInteraction: false, tag: 'tasks-overdue', timestamp: Date.now() });
}
function checkOverdueTasks() {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    const overdue = tasks.filter(t => !t.completed && getDeadlineStatus(t.deadline) === 'overdue');
    if (overdue.length > 0) {
        const taskNames = overdue.slice(0, 3).map(t => t.text).join(', ');
        const moreText = overdue.length > 3 ? ` и ещё ${overdue.length - 3}` : '';
        sendBrowserNotification('⚠️ Просроченные задачи!', `${overdue.length} ${overdue.length === 1 ? 'задача просрочена' : 'задачи просрочены'}:${moreText}\n${taskNames}`, '🔴');
    }
}

// --- Загрузка / сохранение задач ---
function loadTasksFromStorage() {
    const stored = localStorage.getItem('homeTasks');
    if (stored) {
        try {
            tasks = JSON.parse(stored).map(t => ({
                id: t.id ?? Date.now() + Math.random(),
                text: t.text, completed: t.completed ?? false,
                createdAt: t.createdAt ?? Date.now(),
                deadline: t.deadline ?? null,
                category: t.category ?? null
            }));
        } catch(e) { tasks = []; }
    } else {
        const now = Date.now();
        tasks = [
            { id: 1, text: 'Купить молоко', completed: false, createdAt: now - 300000, deadline: now + 86400000, category: 'shopping' },
            { id: 2, text: 'Помыть пол', completed: true, createdAt: now - 600000, deadline: null, category: 'cleaning' },
            { id: 3, text: 'Сдать отчёт', completed: false, createdAt: now - 100000, deadline: now - 172800000, category: 'work' },
        ];
    }
}
function saveTasksToStorage() {
    localStorage.setItem('homeTasks', JSON.stringify(tasks));
}

// --- Экспорт/Импорт ---
function exportTasks() {
    const exportData = { version: '1.0', exportedAt: new Date().toISOString(), totalTasks: tasks.length, categories, tasks };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`✅ Экспортировано ${tasks.length} задач`, 'success');
}
function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.tasks || !Array.isArray(data.tasks)) throw new Error('Неверный формат файла');
            if (!confirm(`📦 Импортировать ${data.tasks.length} задач? Текущие задачи будут заменены.`)) return;
            tasks = data.tasks.map(t => ({
                id: t.id ?? Date.now() + Math.random(),
                text: t.text, completed: t.completed ?? false,
                createdAt: t.createdAt ?? Date.now(),
                deadline: t.deadline ?? null,
                category: t.category ?? null
            }));
            if (data.categories) {
                categories = { ...DEFAULT_CATEGORIES, ...data.categories };
                saveCategories();
                renderCategorySelectors();
            }
            saveTasksToStorage();
            render();
            showNotification(`✅ Импортировано ${data.tasks.length} задач`, 'success');
        } catch (err) {
            showNotification(`❌ Ошибка импорта: ${err.message}`, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// --- График прогресса ---
function renderProgressChart() {
    const today = getTodayMidnight();
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const dayTime = today - (i * 24 * 60 * 60 * 1000);
        const dayEnd = dayTime + (24 * 60 * 60 * 1000);
        const completedCount = tasks.filter(t => t.completed && t.createdAt >= dayTime && t.createdAt < dayEnd).length;
        const date = new Date(dayTime);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        const dayDate = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        days.push({ name: dayName, date: dayDate, completed: completedCount });
    }
    const maxCompleted = Math.max(...days.map(d => d.completed), 1);
    chartBarsEl.innerHTML = days.map(day => {
        const height = (day.completed / maxCompleted) * 80;
        return `<div class="chart-bar"><span class="chart-bar-value">${day.completed}</span><div class="chart-bar-fill" style="height: ${Math.max(height, 4)}px;"></div><span class="chart-bar-label">${day.name}<br>${day.date}</span></div>`;
    }).join('');
    const totalWeek = days.reduce((sum, d) => sum + d.completed, 0);
    const avgPerDay = (totalWeek / 7).toFixed(1);
    const bestDay = days.reduce((best, d) => d.completed > best.completed ? d : best, days[0]);
    chartSummaryEl.innerHTML = `<span>📊 За неделю: <span class="highlight">${totalWeek}</span> задач</span><span>📈 В день: <span class="highlight">${avgPerDay}</span> в среднем</span><span>🏆 Лучший: <span class="highlight">${bestDay.name}</span> (${bestDay.completed})</span>`;
}

// --- Фильтрация и сортировка ---
function getFilteredAndSortedTasks() {
    let result = [...tasks];
    if (currentSearch) result = result.filter(t => t.text.toLowerCase().includes(currentSearch));
    if (currentFilter === 'active') result = result.filter(t => !t.completed);
    else if (currentFilter === 'completed') result = result.filter(t => t.completed);
    if (currentCategory !== 'all') result = result.filter(t => t.category === currentCategory);
    result.sort((a, b) => {
        switch(currentSort) {
            case 'deadline':
                const aOverdue = getDeadlineStatus(a.deadline) === 'overdue' && !a.completed;
                const bOverdue = getDeadlineStatus(b.deadline) === 'overdue' && !b.completed;
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;
                if (a.deadline && !b.deadline) return -1;
                if (!a.deadline && b.deadline) return 1;
                if (a.deadline && b.deadline) return a.deadline - b.deadline;
                return b.createdAt - a.createdAt;
            case 'category':
                if (a.category && !b.category) return -1;
                if (!a.category && b.category) return 1;
                if (a.category && b.category) {
                    const catDiff = a.category.localeCompare(b.category);
                    if (catDiff !== 0) return catDiff;
                }
                return b.createdAt - a.createdAt;
            case 'created': return b.createdAt - a.createdAt;
            case 'alpha': return a.text.localeCompare(b.text, 'ru');
            default:
                const statusDiff = Number(a.completed) - Number(b.completed);
                if (statusDiff !== 0) return statusDiff;
                return b.createdAt - a.createdAt;
        }
    });
    return result;
}

// --- Рендер ---
function render() {
    const filtered = getFilteredAndSortedTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const overdue = tasks.filter(t => !t.completed && getDeadlineStatus(t.deadline) === 'overdue').length;
    if (filtered.length === 0) {
        let emptyMessage = '📭 Список дел пуст. Добавьте первую задачу!';
        if (currentSearch) emptyMessage = `🔍 Ничего не найдено по запросу "${currentSearch}"`;
        else if (currentFilter === 'active') emptyMessage = '✨ Нет активных задач! Отдыхайте или добавьте новую.';
        else if (currentFilter === 'completed') emptyMessage = '🎉 Вы ещё не завершили ни одной задачи. Вперёд!';
        taskListEl.innerHTML = `<div class="empty-msg">${emptyMessage}</div>`;
    } else {
        taskListEl.innerHTML = filtered.map(task => {
            const deadlineStatus = getDeadlineStatus(task.deadline);
            const deadlineClass = deadlineStatus ? `deadline-${deadlineStatus}` : '';
            let deadlineText = '';
            if (task.deadline) {
                const emoji = getDeadlineEmoji(deadlineStatus);
                const dateStr = formatDate(task.deadline);
                if (deadlineStatus === 'overdue') deadlineText = `<span class="warning-icon">⚠️</span>${emoji} Просрочено (${getDaysOverdue(task.deadline)} дн.)`;
                else if (deadlineStatus === 'today') deadlineText = `${emoji} Сегодня (${dateStr})`;
                else deadlineText = `${emoji} ${dateStr}`;
            }
            const catInfo = task.category ? categories[task.category] : null;
            const catClass = catInfo ? (catInfo.isDefault ? catInfo.label.toLowerCase() : 'custom') : 'other';
            const catBadge = catInfo ? `<span class="category-badge ${catClass}">${catInfo.emoji} ${catInfo.label}</span>` : '';
            return `<li class="task-item ${deadlineClass}" data-id="${task.id}">
                <input type="checkbox" class="task-check" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                <div class="task-content">
                    <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
                    <div class="task-meta">${catBadge}${task.deadline ? `<span class="task-deadline ${deadlineStatus || ''}">${deadlineText}</span>` : ''}</div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" data-id="${task.id}" title="Редактировать">✏️</button>
                    <button class="delete-btn" data-id="${task.id}" title="Удалить">🗑️</button>
                </div>
            </li>`;
        }).join('');
    }
    let catStats = '';
    Object.keys(categories).forEach(catKey => {
        const count = tasks.filter(t => t.category === catKey && !t.completed).length;
        if (count > 0) catStats += `<span class="stat-cat">${categories[catKey].emoji} ${count}</span>`;
    });
    const overdueStat = overdue > 0 ? `<span class="stat-overdue">| ⚠️ Просрочено: ${overdue}</span>` : '';
    statsPanel.innerHTML = `<div>📊 Всего: ${total} | ✅ Выполнено: ${completed} | ⏳ Активно: ${active} ${overdueStat}</div>${catStats ? `<div class="stats-categories">${catStats}</div>` : ''}`;
    saveTasksToStorage();
    renderProgressChart();
}

// --- CRUD задач ---
function addTask() {
    const text = taskInput.value.trim();
    if (!text) { alert('Введите описание задачи'); return; }
    const deadlineVal = deadlineInput.value;
    const deadline = deadlineVal ? new Date(deadlineVal).getTime() : null;
    const category = categoryInput.value || null;
    tasks.push({ id: Date.now(), text, completed: false, createdAt: Date.now(), deadline, category });
    taskInput.value = ''; deadlineInput.value = ''; categoryInput.value = ''; taskInput.focus();
    render();
}
function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const wasOverdue = !task.completed && getDeadlineStatus(task.deadline) === 'overdue';
        task.completed = !task.completed;
        render();
        if (wasOverdue && task.completed && notificationsEnabled) showNotification('✅ Просроченная задача выполнена!', 'success');
    }
}
function deleteTask(id) {
    if (confirm('Удалить задачу?')) {
        tasks = tasks.filter(t => t.id !== id);
        render();
    }
}
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const deadlineStr = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';
    const newText = prompt('Редактировать задачу:', task.text);
    if (newText !== null && newText.trim()) {
        task.text = newText.trim();
        const newDeadline = prompt('Новый дедлайн (ГГГГ-ММ-ДД, оставьте пустым чтобы убрать):', deadlineStr);
        if (newDeadline !== null) task.deadline = newDeadline.trim() ? new Date(newDeadline).getTime() : null;
        let newCategory = task.category || '';
        const catPrompt = prompt('Категория (введите ключ или оставьте пустым):', newCategory);
        if (catPrompt !== null) task.category = catPrompt.trim() || null;
        render();
    } else if (newText !== null) alert('Текст не может быть пустым');
}
function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
    render();
}
function handleSearch() {
    currentSearch = searchInput.value.toLowerCase().trim();
    render();
}
function handleListClick(e) {
    const target = e.target;
    const li = target.closest('[data-id]');
    if (!li) return;
    const id = parseInt(li.dataset.id);
    if (target.classList.contains('task-check')) toggleTaskCompletion(id);
    else if (target.classList.contains('delete-btn')) deleteTask(id);
    else if (target.classList.contains('edit-btn')) editTask(id);
}

// --- Обработчики событий (без onclick) ---
function initEventListeners() {
    document.getElementById('exportBtn').addEventListener('click', exportTasks);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFileInput').click());
    document.getElementById('importFileInput').addEventListener('change', importTasks);
    notifBtn.addEventListener('click', toggleNotifications);
    themeBtn.addEventListener('click', toggleTheme);
    document.getElementById('categoriesBtn').addEventListener('click', openCategoryModal);
    document.getElementById('modalCloseBtn').addEventListener('click', closeCategoryModal);
    document.getElementById('resetCategoriesBtn').addEventListener('click', resetCategories);
    document.getElementById('addCategoryBtn').addEventListener('click', addNewCategory);
    searchInput.addEventListener('input', handleSearch);
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
    taskListEl.addEventListener('click', handleListClick);
    filterBtns.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
    sortSelect.addEventListener('change', (e) => { currentSort = e.target.value; render(); });
    deadlineInput.min = new Date().toISOString().split('T')[0];
    categoryModal.addEventListener('click', (e) => { if (e.target === categoryModal) closeCategoryModal(); });
    categoryListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-category-btn');
        if (btn) deleteCategory(btn.getAttribute('data-key'));
    });
    emojiGrid.addEventListener('click', (e) => {
        const emojiDiv = e.target.closest('.emoji-item');
        if (emojiDiv) selectEmoji(emojiDiv.getAttribute('data-emoji'));
    });
}

// --- Инициализация ---
function init() {
    applyTheme(currentTheme);
    loadCategories();
    loadTasksFromStorage();
    updateNotificationButton();
    initEventListeners();
    render();
    setTimeout(() => { if (notificationsEnabled) checkOverdueTasks(); }, 500);
}
init();