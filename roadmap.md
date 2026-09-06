# Aurelia Real Estate CRM — roadmap

- [x] Warm cream/terracotta/navy design system, serif headings
- [x] Typed mock data layer (users, projects, units, leads, bookings)
- [x] CRM store: auth, role scoping, lead + booking mutations
- [ ] Login page with demo role switch
- [ ] App shell: responsive nav, role badge, logout
- [ ] Dashboard: clickable stats, charts, recent activity
- [ ] Leads: table + search/filters + draggable pipeline + add + detail + book
- [ ] Projects list + project detail (gallery, units, master site plan)
- [ ] Bookings: flow, conflict handling, confirm/cancel
- [ ] Admin vs Sales scoping (team page admin-only)
- [ ] Loading / empty / error states + validated forms
- [ ] 3D hover/tilt on lead + property cards (pointer tilt, lifted shadow, image parallax, reduced-motion/touch fallback)
- [ ] Smooth stage-change transitions (moved card + animated counts) without breaking drag/drop or mobile
- [ ] Per-route head metadata
- [ ] Kanban drag-and-drop across all stages: animated card/count update, toast naming new stage, one-click Undo to exact prior stage, keyboard/touch fallback, no accidental drops, role scoping preserved
- [ ] Rich lead activity timeline: stage moves (from -> to), undo events, contact/assignment/note/booking edits; timestamp + acting user + icon/badge; chronological, instant, persisted in state; empty-state aware, responsive, accessible
