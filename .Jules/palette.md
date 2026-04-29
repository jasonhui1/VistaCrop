## 2024-05-15 - Missing Accessible Names on Composer Buttons
**Learning:** Icon-only buttons throughout the Composer view (sidebars, toolbar) frequently lack `aria-label`s and proper focus indicators, making them inaccessible to screen readers and difficult to navigate via keyboard.
**Action:** When working on new components or refactoring existing ones, ensure every icon-only button has an `aria-label` or `title` and includes `focus-visible` utility classes (like `focus-visible:ring-2`) to provide a clear visual indicator for keyboard navigation.
