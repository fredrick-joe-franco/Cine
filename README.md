# Cine — streamscout front-end

This repository contains the streamscout front-end application (built with Vite + React). It provides a minimal UI for browsing and exploring streaming content.

Repository layout
- `streamscout/` — the Vite + React application source

Prerequisites
- Node.js (LTS) and npm
- Git

Local development (quick)
1. Install dependencies (installs `streamscout`'s deps):

   npm --prefix streamscout install

2. Start the dev server:

   npm --prefix streamscout run dev

3. Open the URL shown by Vite (usually http://localhost:5173)

Useful npm scripts (run from repo root)
- Install deps: `npm --prefix streamscout install`
- Dev server: `npm --prefix streamscout run dev`
- Build: `npm --prefix streamscout run build`
- Preview build: `npm --prefix streamscout run preview`

Git / repository notes
- A local git repository and initial commit have been created.
- The repository has been pushed to `origin` on GitHub and `main` is tracking `origin/main`.

Troubleshooting
- If git complains about missing user.name/email:

  git config user.name "Your Name"
  git config user.email "you@example.com"

- If npm fails, verify Node.js is installed and on your PATH.

Optional next steps
- Add a LICENSE (MIT/Apache)
- Add CI (GitHub Actions) for linting/tests
- Add CONTRIBUTING.md and ISSUE_TEMPLATE for open-source collaboration

If you want, I can add any of the optional items above (CI, license, contributing). Tell me which and I'll implement it and push the changes.
