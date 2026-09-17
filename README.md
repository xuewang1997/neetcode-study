# NeetCode Study

A local-first, GitHub Pages-ready dashboard for an 8-week NeetCode 150 DSA rebuild curriculum.

## Local development

```bash
nvm use
npm install
npm run dev
```

## GitHub Pages

The repository includes a GitHub Actions workflow. In GitHub:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main`.
4. Open the Actions tab and wait for **Deploy to GitHub Pages** to finish.

The Vite base path is configured for a repository named `neetcode-study`.

## Progress storage

Progress is stored in browser `localStorage`, so it persists on the same browser/device. It is not synced across devices in v1.
