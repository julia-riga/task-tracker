# 🏠 Home Tasks — Task Tracker

A modern, feature-rich task management web application for organizing your home tasks by category, setting deadlines, and tracking progress.

![Home Tasks Logo](./frontend/logo.png)

## ✨ Features

- **📋 Task Management**: Create, edit, delete, and organize tasks
- **🏷️ Category Filtering**: Filter tasks by All, Active, or Completed status
- **🔍 Search Functionality**: Quickly find tasks with the built-in search
- **🌐 Multi-language Support**: Switch between English (EN) and Russian (RU)
- **🌓 Dark/Light Theme**: Toggle between light and dark themes via UI
- **📂 Categories**: Organize tasks with custom categories (Shopping, Cleaning, Study, Work, Health, Other)
- **🔔 Notifications**: Optional task notifications
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **💾 Local Storage**: Browser-only mode persists data locally in the browser (PWA)
- **🗄️ Full Stack Mode**: MySQL database with Express backend for multi-user persistence

## 🌍 Multi-Language Support

The application supports two languages:
- **English**: `en`
- **Russian**: `ru` (default language)

Switch with the language button in the header. All UI elements, including task text and messages, are localized.

## 📁 Project Structure

```text
├── frontend/           # Frontend application (standalone or Docker-based)
│   ├── js/             # JavaScript files
│   │   ├── main.js     # Main application logic
│   │   └── storage.js  # LocalStorage data persistence
│   ├── index.html      # Main HTML file with full UI structure
│   ├── style.css       # Fluent Design CSS (lavender edition)
│   ├── logo.png        # Application logo
│   ├── manifest.json   # PWA manifest for installability
│   ├── sw.js           # Service Worker for offline support & caching
│   └── Dockerfile      # Frontend container image definition
├── backend/            # Node.js API server with MySQL database
│   ├── src/            # Server source code
│   │   ├── db.js       # Database connection pool (MySQL2)
│   │   ├── server.js   # Express app entry point & routing
│   │   ├── utils.js    # Utility functions
│   │   └── routes/     # API route handlers
│   │       ├── tasks.js        # Task CRUD operations
│   │       └── categories.js   # Category management
│   ├── sql/            # Database schema & initialization scripts
│   │   └── init.sql      # Creates DB tables with default categories (UTF-8MB4)
│   ├── tests/          # Unit tests
│   │   └── utils.test.js
│   ├── Dockerfile      # Backend container image definition
│   ├── package.json    # Backend dependencies (Express, mysql2, cors, dotenv)
│   ├── .env.example    # Environment variables configuration template
│   └── .env            # Environment variables configuration
├── node_modules/       # Frontend dependencies only (frontend-only project)
├── docker-compose.yml  # Full stack orchestration: MySQL + API + Nginx frontend
├── package.json        # Frontend dependencies (Vite, React-like structure)
└── stylelintrc.json    # CSS linting configuration for consistent styling
```

## 🚀 Getting Started

### Prerequisites

- **For Browser Use**: A modern web browser (Chrome 90+, Firefox 85+, Safari 14+, Edge 90+)
- **For Full Stack Development**: Node.js 18+ and MySQL database (or Docker)
- **For Docker Setup**: Docker Desktop & Docker Compose

---

### Option 1: Quick Start — Frontend Only (PWA)

```bash
# Clone the repository
git clone https://github.com/julia-riga/task-tracker.git && cd task-tracker

# Open the frontend directly in browser
code frontend/
# Or simply open frontend/index.html with your browser
```

This gives you a fully functional PWA application that stores data locally. No server required! Data persists in LocalStorage via `storage.js`.

---

### Option 2: Full Stack Setup (with Backend & Database)

#### Method A: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/julia-riga/task-tracker.git && cd task-tracker

# Start everything with one command
docker-compose up -d

# Access the application at http://localhost:80
# Backend API available at http://localhost:3000/api/health
```

**What this starts:**
- ✅ MySQL database on port 3306 (mapped to 3306) — native_password auth, UTF-8MB4
- ✅ Node.js Express backend on port 3000 with connection pool (max 10 connections)
- ✅ Nginx frontend server on port 80, serves static files from built frontend
- 🔄 Auto-seeds default categories: Shopping (🛒), Cleaning (🧹), Study (📚), Work, Health, Other

#### Method B: Manual Setup

```bash
# Clone the repository
git clone https://github.com/julia-riga/task-tracker.git && cd task-tracker

# Step 1: Set up MySQL database manually
mysql -u root -p < backend/sql/init.sql

# Step 2: Start the backend server
cd backend/
cp .env.example .env          # Configure environment variables with DB credentials
npm install
node src/server.js             # Backend runs on port 3000

# Step 3: Serve frontend (Nginx or manual)
cd frontend/
nginx -g 'daemon off;'        # Or use a static file server
```

**Backend Environment Variables** (`.env`):
| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host (default: `mysql`) |
| `DB_USER` | MySQL username (default: `root`) |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (default: `task_tracker`) |
| `DB_PORT` | MySQL port (default: `3306`) |
| `PORT` | Backend port (default: `3000`) |

---

### Option 3: Frontend Only Mode

```bash
# Clone the repository
git clone https://github.com/julia-riga/task-tracker.git && cd task-tracker

# Open frontend/index.html directly in browser
code frontend/
```

This gives you a fully functional PWA application that stores data locally. No server required! Data persists in LocalStorage via `storage.js`.

---

## 🛠️ Development Workflow

1. **Backend Changes**: Edit files in `backend/src/`, run tests with `npm test`
2. **Database Modifications**: Update `sql/init.sql`, restart MySQL service
3. **Frontend Updates**: Modify `frontend/js/main.js` and `style.css`
4. **Docker Build**: `docker compose build --no-cache` for custom builds

---

## 📖 API Documentation

### Base URL

```
http://localhost:3000/api
```

#### Health Check

```bash
GET /api/health
# Response: { "status": "ok", "timestamp": "2024-..." }
```

#### Tasks Endpoints

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/tasks` | Get all tasks (with pagination) | `?status=active&category=shopping&sort=date&limit=10` |
| GET | `/api/tasks/[id]` | Get single task by ID | — |
| POST | `/api/tasks` | Create a new task | — |
| PUT | `/api/tasks/[id]` | Update an existing task | — |
| DELETE | `/api/tasks/[id]` | Delete a task | — |

#### Categories Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create a new category |
| PUT | `/api/categories/[id]` | Update a category |
| DELETE | `/api/categories/[id]` | Delete a category |

---

## 💾 Data Storage

### Frontend Only Mode
Data is stored in browser's LocalStorage using `storage.js`. It persists across sessions until cleared manually. No server required.

### Full Stack Mode
- **Database**: MySQL with InnoDB engine, UTF-8MB4 encoding
- **Tables**: `categories` (with emojis & colors) and `tasks` (with deadlines, status, category linkage)
- **Connection**: Connection pool with max 10 connections, UTF-8MB4 encoding

---

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome   | Latest  | ✅    |
| Firefox | Latest  | ✅    |
| Safari  | Latest  | ✅    |
| Edge    | Latest  | ✅    |

---

## 📦 Deployment Guide

### Docker Compose (Production)

```yaml
# docker-compose.yml — key services:
# - mysql:      MySQL 8.0 with utf8mb4 & native_password auth
# - backend:    Node.js/Express on port 3000, depends on MySQL
# - frontend:   Nginx server on port 80, serves static files from built frontend
```

To deploy:
```bash
docker-compose up -d --build
```

### Manual Deployment (Backend)

1. Install dependencies: `npm install` in `backend/`
2. Configure `.env` with your database credentials
3. Start server: `node src/server.js`
4. Set up Nginx to proxy `/api/*` requests to the backend

### Frontend Build & Serve

```bash
# If using Vite or similar build tool in frontend/
npm run build   # Builds to dist/ directory

# Serve with nginx:
nginx -c /path/to/nginx.conf
```

---

## 🧪 Testing

Run unit tests for the backend utilities:

```bash
cd backend/
npm test
```

---

## 📜 License

This project is open source and available under the ISC License.

---

## 👨‍🤝‍👩 Author

Home Tasks Team | [julia-riga/task-tracker](https://github.com/julia-riga/task-tracker)

---

*Organize your home tasks efficiently!*
```
