const puppeteer = require('puppeteer');

async function main() {
  console.log('Launching browser...');
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080',
        '--disable-gpu'
      ]
    });
    
    console.log('Browser launched!');
    
    const page = await browser.newPage();
    console.log('Page created!');
    console.log('setViewport type:', typeof page.setViewport);
    
    // Try to navigate and take screenshot
    try {
      await page.goto('http://localhost:8080', { waitUntil: 'networkidle0', timeout: 15000 });
      console.log('Navigated OK, current URL:', page.url());
      
      await page.setViewport({ width: 1920, height: 1080 });
      console.log('setViewport succeeded!');
      
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.log('Screenshot taken!');
    } catch (navErr) {
      console.error('Navigation error:', navErr.message);
    }
    
    await browser.close();
    console.log('Browser closed.');
  } catch (err) {
    console.error('Launch error:', err.message);
    if (err.stack) console.error(err.stack.split('\n').slice(0,5).join('\n'));
  }
}

main().catch(console.error);
