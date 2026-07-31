# Culture Walk Design Guide

## Product Character

Culture Walk is a practical cultural-event map, not a marketing site. The interface should help users scan nearby events, compare schedules, and open details quickly. Keep the visual tone calm, contemporary, and grounded in real place information.

## Foundations

- Use the existing Pretendard-first font stack from `tailwind.config.ts`.
- Keep letter spacing at `0`; do not scale font sizes with viewport width.
- Use the semantic CSS variables in `src/app/globals.css` rather than hard-coded page-level palette values.
- Light mode uses a soft green-gray background with near-white surfaces. Dark mode uses deep green-black surfaces with warm white text.
- Preserve the warm accent (`--app-warm-text`) for exceptional status or price-related emphasis only. Do not turn it into a dominant UI color.

## Surfaces And Hierarchy

- Use `.surface-panel` for persistent map controls, sidebars, and detail panels.
- Use `.surface-card` for repeated event cards and clearly framed content.
- Use `.soft-chip` for compact filters, tags, and low-emphasis state controls.
- Do not nest cards inside cards. Sections should be open layouts; only repeated items, dialogs, and tools need a framed surface.
- Keep border radii restrained. Existing components should lead; new cards should not exceed 8px unless a modal or platform component requires it.

## Map Experience

- The map is the primary workspace. Desktop layout uses a fixed header, a list panel, and an adjacent detail panel; the map fills the remaining viewport.
- Selecting a list item opens details beside the list. Selecting a map marker opens the map-context detail flow. Selecting another item should replace the existing detail immediately.
- Do not reset map position, zoom, filters, or sort state when closing details.
- Marker states must remain distinguishable by size, contrast, and selected state. Avoid relying on color alone.
- Location permission belongs to actions that need it, such as distance sorting. Show a clear fallback when permission is unavailable.

## Responsive Behavior

- Design mobile first. On small screens, list and detail content use bottom-sheet or full-height flows instead of desktop side panels.
- Keep primary touch targets at least 44px in either dimension.
- Reserve stable dimensions for headers, toolbars, marker controls, thumbnails, and icon buttons so state changes do not shift layout.
- Ensure text wraps or truncates intentionally; no labels, buttons, or metadata may overlap adjacent content.
- Verify both light and dark mode at mobile and desktop widths for any visual change.

## Components And Controls

- Reuse `Button`, `IconButton`, `CultureCategoryBadge`, and existing shared styles before introducing a new component.
- Use Lucide icons for familiar actions such as close, menu, location, share, navigation, zoom, and image controls.
- Icon-only controls need an accessible label and a tooltip where the meaning is not obvious.
- Use segmented controls for mutually exclusive sort modes, toggles or checkboxes for binary filters, and chips only for compact filter sets.
- Keep Korean UI copy short, specific, and action-oriented.

## Motion And Feedback

- Use motion to explain panel entry, replacement, and dismissal, not as decoration.
- Existing map-panel transitions use approximately 280ms easing. Keep new transitions within that visual rhythm.
- Respect `prefers-reduced-motion`; do not introduce motion that bypasses the global reduced-motion rule.
- Loading states should preserve the final layout dimensions. Failure states should retain useful context and offer a clear retry path.

## Images And Empty States

- Prefer official event images supplied by the source. Keep image cropping consistent and avoid blurred decorative imagery.
- When images are absent or fail, show the existing restrained place/category icon treatment so list density remains stable.
- Image galleries must support changing the representative image and opening images without accidentally moving the map.

## Accessibility And Quality Checks

- Maintain text contrast in both themes and visible keyboard focus.
- Do not communicate event status, price, or selection through color alone.
- Give all interactive elements an accessible name.
- Before release, inspect the map, list, details, filters, and header at mobile and desktop widths, in light and dark mode.
