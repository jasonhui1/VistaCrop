from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto('http://localhost:3000')

    # Wait for the composer tab and click it
    page.click("text=Composer")

    # Focus the left sidebar toggle
    # Let's use the explicit locator and focus it
    page.locator("button[aria-label='Collapse sidebar']").first.focus()

    # Wait for any potential transitions
    page.wait_for_timeout(500)

    # Take a screenshot
    page.screenshot(path="screenshot.png")

    browser.close()
