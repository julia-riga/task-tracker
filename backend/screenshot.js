// screenshot.js — generates screenshots for README
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const PORT = 8080;

// Fixed viewport — used for every page (setViewport removed in Puppeteer v25+)
const VIEWPORT = { width: 1920, height: 1080 };

function startServer() {
  return new Promise((resolve) => {
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png'
    };

    const server = http.createServer((req, res) => {
      let filePath = path.join(FRONTEND_DIR, req.url === '/' ? 'index.html' : req.url);
      
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        
        const contentType = mimeTypes[path.extname(filePath)] || 'application/octet-stream';
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
      });
    });

    server.listen(PORT, () => {
      console.log(`Frontend server started at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function takeScreenshot(page, filepath) {
  // viewport already set via defaultViewport in launch options
  await new Promise(r => setTimeout(r, 800)); // let the DOM settle before capturing
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`✅ Saved ${path.basename(filepath)}`);
}

async function generateHtml(title, body) {
  return `<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>body{font-family:'Segoe UI',Arial,sans-serif; padding:40px; background:#f9fafb} h1{color:#6c5ce7} .card{background:#f5f3ff; border-radius:8px; padding:20px; margin-top:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1)} pre{font-size:14px; white-space:pre-wrap}</style>
  </head><body>${body}</body></html>`;
}

async function main() {
  console.log('🚀 Starting screenshot generator...\n');
  
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  
  // Start HTTP server for frontend/
  await startServer();
  
  try {
    // Launch puppeteer with headless browser + fixed viewport (no setViewport on pages)
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080',
        '--disable-gpu'
      ],
      defaultViewport: { ...VIEWPORT },
    });

    const page = await browser.newPage();

    // ─── 1️⃣ Main screen (main-screen.png) ──────────────
    console.log('\n📸 1/4 — Main screen');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000)); // let SPA render
    await takeScreenshot(
      path.join(SCREENSHOTS_DIR, 'main-screen.png'),
      'Main screen with tasks list and sidebar'
    );

    // ─── 2️⃣ Add task (add-task.png) ─────────────────────
    console.log('\n📸 2/4 — Add task');
    
    // Click the "+" button to open add-task modal
    await page.click('#addBtn, .add-btn, [class*="add"]');
    
    // Wait for modal/form to appear (up to 3 seconds)
    let modalVisible = false;
    try {
      const el = await page.$('.modal-content, .task-form, .form-container');
      if (el) modalVisible = true;
    } catch {}
    
    if (!modalVisible) {
      // Try clicking buttons by text content as fallback
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent.trim(), btn);
        if ((text.toLowerCase().includes('add') || text.includes('+')) && !modalVisible) {
          await page.click(btn);
          console.log(`✅ Clicked button: "${text}"`);
          break;
        }
      }
    }
    
    // Wait for modal to render
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(
      path.join(SCREENSHOTS_DIR, 'add-task.png'),
      'Adding a new task'
    );

    // ─── 3️⃣ Task filter (task-filter.png) ────────────────
    console.log('\n📸 3/4 — Filter tasks');

    // Click "All Tasks" nav item to show all filters
    await page.click('.nav-item[data-filter="all"]');
    await new Promise(r => setTimeout(r, 500));

    // Try clicking Shopping category filter
    const shoppingBtn = await page.$('button:has-text("Shopping"), .category-btn[title="Shopping"], [data-category*="shopping"]');
    if (shoppingBtn) {
      console.log('✅ Clicked Shopping filter');
      await page.click(shoppingBtn);
    } else {
      // Try other category buttons by text content
      const categories = ['Cleaning', 'Study', 'Work', 'Health'];
      for (const cat of categories) {
        const btns = await page.$$(`button:has-text("${cat}")`);
        if (btns.length > 0) {
          console.log(`✅ Clicked ${cat} filter`);
          await page.click(btns[0]);
          break;
        }
      }
    }

    // Wait for filtered list to appear
    await new Promise(r => setTimeout(r, 1000));
    
    // Refresh main screen after applying filter
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(
      path.join(SCREENSHOTS_DIR, 'task-filter.png'),
      'Task filtering by category'
    );

    // ─── 4️⃣ API health (api-health.png) ──────────────────
    console.log('\n📸 4/4 — API Health');

    const apiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3000/api/health', { mode: 'no-cors' });
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.message };
      }
    });

    if (!apiResponse.error) {
      console.log(`✅ Backend responded (${apiResponse.status})`);
      
      const healthHtml = await generateHtml('API Health', 
        `<div class="card">
          <h1>🏥 API Health Check</h1>
          <p><strong>Status:</strong> ✅ OK — ${apiResponse.status}</p>
          <pre>GET /api/health → ${JSON.stringify({ status: 'ok' })}</pre>
        </div>`
      );
    } else {
      console.log(`⚠️ Backend API not reachable (${apiResponse.error})`);
      
      const healthHtml = await generateHtml('API Health', 
        `<div class="card">
          <h1>🏥 API Health Check</h1>
          <p>Status: ⚠️ Backend not running (port 3000)</p>
          <pre>To start backend:<br>cd backend && node src/server.js</pre>
        </div>`
      );
    }

    const htmlPath = path.join(__dirname, 'api-health.html');
    fs.writeFileSync(htmlPath, healthHtml);

    const healthPage = await browser.newPage();
    await healthPage.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    
    await takeScreenshot(
      path.join(SCREENSHOTS_DIR, 'api-health.png'),
      'API /api/health endpoint response'
    );

    healthPage.close();
    
    // Clean up temp HTML file
    fs.unlinkSync(htmlPath);

    // Close browser
    await browser.close();
    
    console.log('\n🎉 All screenshots generated!');
    console.log(`Files: ${SCREENSHOTS_DIR}`);
  } catch (error) {
    console.error('❌ Error generating screenshots:', error.message);
    process.exit(1);
  }
}

main();