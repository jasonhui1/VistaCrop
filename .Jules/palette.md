## 2024-05-14 - Playwright target for "Freeform" button
**Learning:** In Playwright verification scripts, `page.getByText('Freeform')` will cause a strict mode violation because the text exists in multiple elements.
**Action:** Use a more specific locator like `page.getByRole('button', { name: 'Freeform' })` or `page.locator('button:has-text("Freeform")')` to target the mode toggle button.
