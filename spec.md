# DesertVision AI

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Single-page React app: DesertVision AI — a demo UI for an AI-powered offroad semantic scene segmentation system built for Duality AI's hackathon.
- Hero section: app name, tagline, "Powered by Duality AI × Falcon Digital Twin Platform", animated desert background (gradient/particle).
- Upload & Analyze section: drag-and-drop zone, image preview, "Analyze Scene" button, 2.5s mock processing delay with spinner, comment `// TODO: REPLACE WITH REAL API CALL` at integration point.
- Results panel (post-analysis): side-by-side toggle views (Original / Segmentation Mask / Blended Overlay), opacity slider, download button. Canvas-rendered segmentation mask placeholder using terrain-pattern colors.
- Class Legend + Stats bar: 10 classes with exact hex colors, animated horizontal bar chart showing mock coverage percentages.
- Model Info card: architecture, training data stats, val count, classes count, placeholder mIoU badge.
- How It Works section: 3 cards (Digital Twin Data, Deep Learning, UGV Autonomy) with lucide-react icons.
- Footer: hackathon credit, team name placeholder.

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Rename project to "DesertVision AI".
2. Select no additional Caffeine components (frontend-only demo).
3. Generate minimal Motoko backend.
4. Build frontend: single-page app in App.tsx with all 7 sections, mock data, canvas-based segmentation mask, animated stats bars, full dark desert theme using Tailwind inline styles + CSS variables. Use lucide-react for icons.
5. Validate and deploy.
