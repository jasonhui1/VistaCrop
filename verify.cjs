const { chromium } = require('playwright');
const fs = require('fs');

async function verify() {
  // Ensure directories exist
  if (!fs.existsSync('/home/jules/verification/screenshots')) {
    fs.mkdirSync('/home/jules/verification/screenshots', { recursive: true });
  }
  if (!fs.existsSync('/home/jules/verification/videos')) {
    fs.mkdirSync('/home/jules/verification/videos', { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '/home/jules/verification/videos/'
    }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/');

  // Click the Composer view button to load Composer
  await page.getByRole('button', { name: 'Composer' }).click();
  await page.waitForTimeout(1000); // Wait for composer to load

  // Focus Left Sidebar Toggle
  const leftToggle = page.getByRole('button', { name: 'Collapse sidebar' }).first();
  await leftToggle.focus();
  await page.waitForTimeout(500); // Wait for focus transition
  await page.screenshot({ path: '/home/jules/verification/screenshots/left_sidebar_focus_final.png' });

  // Focus Right Sidebar Toggle
  const rightToggle = page.getByRole('button', { name: 'Collapse sidebar' }).nth(1);
  await rightToggle.focus();
  await page.waitForTimeout(500); // Wait for focus transition
  await page.screenshot({ path: '/home/jules/verification/screenshots/right_sidebar_focus_final.png' });

  await context.close();
  await browser.close();
  console.log("Verification script completed.");
}

verify().catch(console.error);
