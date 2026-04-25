## 2025-02-25 - Native Focus Outlines vs Custom CSS specificity
**Learning:** The application uses existing standard Tailwind utilities. Adding global custom element selectors like `button:focus-visible` introduces CSS specificity bugs with Tailwind properties like `border-radius`.
**Action:** Use existing Tailwind `focus-visible:ring-` utilities when improving keyboard focus styling on buttons instead of adding global CSS rules.
