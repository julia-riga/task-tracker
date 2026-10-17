# 📸 Скриншоты — Home Tasks

## Что нужно сделать:

1. Откройте `frontend/index.html` в браузере
2. Запустите backend (опционально): `cd backend && node src/server.js`
3. Сделайте скриншоты и положите их в эту папку

---

### required файлы:

| Файл | Описание |
|------|----------|
| `main-screen.png` | Главная страница с задачами, фильтр по категориям |
| `add-task.png` | Процесс добавления новой задачи (кнопка +) |
| `task-filter.png` | Фильтрация задач по статусу/категориям |
| `docker-compose.png` | Запуск через Docker Compose, работающее приложение |
| `api-health.png` | Ответ API `/api/health` в браузере |

---

### Советы:

- **Разрешение:** 1920×1080 или ваше нативное
- **Стиль:** светлая или тёмная тема (переключатель в шапке)
- **Фон:** чистая подложка или размытый фон
- **Композиция:** интерфейс в центре экрана

---

### Как сделать скриншот:

```bash
# Windows (Snipping Tool):
Win+Shift+S → выбрать область экрана

# macOS (Screenshot):
Cmd+Shift+4 → выделить область окна

# Linux (Gnome):
PrtSc или Win+PrintScreen
```

---

### Проверка перед коммитом:

Убедитесь что все 5 файлов присутствуют и корректно отображаются:

```bash
ls -la screenshots/
```

Ожидаемые файлы:
- `screenshots/main-screen.png` ✅
- `screenshots/add-task.png` ✅
- `screenshots/task-filter.png` ✅
- `screenshots/docker-compose.png` ✅
- `screenshots/api-health.png` ✅