## 2025-05-18 - Added Accessibility and Focus Styles to Icon-Only Toolbar Buttons
**Learning:** Icon-only buttons inside flex containers and absolutely positioned overlay elements (like custom dropdown items) frequently suffer from poor keyboard focus visibility because the default focus ring can be clipped or obscured by adjacent content.
**Action:** When applying `focus-visible:ring-2` to these interactive elements, ensure to also apply `relative focus-visible:z-10` to guarantee the focus ring remains fully visible and layered above surrounding elements during keyboard navigation.
