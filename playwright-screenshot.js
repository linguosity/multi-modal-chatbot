// Playwright screenshot utility for UI analysis
const { chromium } = require('playwright');
const fs = require('fs').promises;

async function takeScreenshot(url = 'http://localhost:3000') {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    const screenshot = await page.screenshot({ 
      encoding: 'base64', 
      fullPage: true 
    });
    
    console.log(JSON.stringify({ screenshot }));
  } catch (error) {
    console.error('Screenshot failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  const url = process.argv[2] || 'http://localhost:3000';
  takeScreenshot(url);
}

module.exports = { takeScreenshot };