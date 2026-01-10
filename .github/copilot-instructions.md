# Copilot Instructions - Taste & Go WebGIS

## Project Overview
Full-stack Web GIS application for food/location suggestions with Firebase backend. Multi-page entry points (React SPA + traditional HTML pages) deployed to Firebase Hosting.

## Architecture

### Frontend Stack
- **Build**: Vite (multi-page entry points via `rollupOptions.input`)
- **Framework**: React 18 (components in `src/`) + vanilla HTML/JS pages in root
- **Styling**: `style.css` (global) + component-level styles
- **Mapping**: Leaflet + react-leaflet for geospatial visualization
- **Auth**: Firebase Authentication (email, anonymous)

### Backend
- **Cloud Functions**: Express.js in `functions/` (deployed separately)
- **Database**: Firestore with security rules (`firestore.rules`)
- **Real-time**: Firebase listeners for suggestion updates
- **API**: RESTful endpoints in `/suggestions` (filter by country/city/category/timeSlot)

### Deployment
- **Hosting**: Firebase Hosting (serves `dist/`)
- **Root directory**: Base path `/full-stack-web-gis-irem122/`
- **Rewrites**: All routes → `index.html` for client-side routing

## File Organization Pattern

### React Entry Point
```
src/
  ├── main.jsx           # React DOM mount (id="root" in index.html)
  ├── App.jsx            # Root component with Map + Form
  ├── firebase.js        # Auth initialization
  ├── styles.css         # Global styles
  └── components/
      ├── Map.jsx        # Leaflet map integration
      └── SuggestionForm.jsx
```

### Multi-Page HTML Entries
- `index.html` - Welcome page (main entry)
- `login.html`, `register.html` - Auth pages
- `map.html` - Map view
- `admin.html`, `admin-login.html`, `admin-dashboard.html` - Admin panel
- `auth.html` - Auth callback handler

Each has matching `.js` file (legacy bundle pattern before Vite refactor).

### Cloud Functions
```
functions/
  ├── index.js          # Express server + Firestore queries
  └── package.json      # dependencies: express, firebase-admin, cors
```

## Critical Developer Workflows

### Build & Deploy
```bash
npm run build          # Vite builds to `dist/` (outputs multiple HTML + assets)
firebase deploy       # Deploys both hosting (dist/) and functions/
```

### Local Development
```bash
npm run dev           # Vite dev server on port 3000
npm run functions    # Emulate Cloud Functions locally
```

### Key Entry Points in Vite Config
- Main app: `main.jsx` → React DOM in `index.html`
- Legacy pages: Direct HTML entry (no JSX bundling needed)
- Output format: Separate bundles for each page via `rollupOptions.input`

## Project-Specific Patterns

### Firebase Configuration
- Config stored in `src/firebase.js` and `firebase-client.js`
- Uses anonymous auth for demo; upgrade to email/password for production
- Service account key (`serviceAccountKey.json`) required for Cloud Functions (not in repo)

### Data Model
Suggestions have structure:
```javascript
{
  id, country, city, timeSlot, category, visibility: 'public|private',
  coords: { lat, lng }, description, images: []
}
```

Firestore composite indexes required for multi-filter queries (see `firestore.rules`).

### Authentication Pattern
- Frontend: Firebase SDK client auth
- Backend: ID token validation in Cloud Functions (currently stubbed at `/admin/moderate`)
- Custom claims: Check admin role via `idTokenResult.claims`

## Important Files to Reference

| File | Purpose |
|------|---------|
| `vite.config.js` | Multi-page entry + base path `/full-stack-web-gis-irem122/` |
| `firebase.json` | Hosting output dir (`dist/`) + functions source |
| `firestore.rules` | Collection access rules (read public, write with auth) |
| `src/App.jsx` | Core React component layout (Map + FilterForm) |
| `functions/index.js` | Suggestion filtering API + stub admin endpoints |

## Common Tasks

**Add new page**: Add `.html` entry to Vite config `rollupOptions.input` + create corresponding `.js` file

**Update Firestore schema**: Modify data model, update composite indexes in Firebase Console, patch functions query

**Add admin feature**: Implement token validation in `functions/` using `admin.auth().verifyIdToken()` + add custom claim check

**Deploy**: Always build (`npm run build`) before `firebase deploy` — `dist/` must be current

## Notes
- Repo uses both React (modern) and vanilla JS (legacy pages) — avoid breaking either pattern
- Cloud Functions require real service account in production (currently commented in `functions/index.js`)
- Database structure may require Firestore indexes for composite queries
