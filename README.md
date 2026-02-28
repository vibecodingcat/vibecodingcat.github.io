# VibeCodingCat GitHub Pages Site

React + Vite project configured for deployment to:

- https://vibecodingcat.github.io

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

```bash
npm run deploy
```

This publishes the built site from `dist/` to the `gh-pages` branch.

## Deploy automatically with GitHub Actions

A workflow is included at `.github/workflows/deploy-pages.yml`.

It will build and deploy on every push to `main`.

## Repository setup

1. Name the repository: `vibecodingcat.github.io`.
2. Push this project to GitHub.
3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
