## 2024-05-18 - Accessible Toggle Buttons
**Learning:** For toggle buttons grouped inside an `overflow-hidden` container (like a segmented control), adding focus rings can get clipped unless you add `relative focus-visible:z-10`. Screen readers need `aria-pressed` on these buttons to know their state.
**Action:** Always add `aria-pressed` to interactive toggle buttons/lists and verify focus rings are fully visible for keyboard users, using `relative focus-visible:z-10` where necessary for grouped flex items.
