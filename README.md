# VibeCodingCat Image Beautifier

React + Vite app configured for deployment to:

- https://vibecodingcat.github.io

This app lets users upload hand drawings or photos and beautify them using the
official Google Gen AI SDK (`@google/genai`) with an image generation model.

## App features

- Image upload + side-by-side original/result preview
- Prompt control for beautification style
- Runtime API key input (no hardcoded keys)
- Optional local-only key persistence in browser localStorage
- Configurable model field (default: `gemini-3.1-flash-image-preview`)
- One-click result download

## Local development

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, then:

1. Paste your Google API key.
   - Enable **Remember key on this device only** if you want local storage.
   - Click **Clear key** anytime to delete it from localStorage.
2. Enter your model name (or keep `gemini-3.1-flash-image-preview`).
3. Upload an image and click **Beautify image**.

> Since this is a static GitHub Pages app, keys entered in the browser are not
> hidden by a backend. For production secrecy, route requests through your own
> server.

## Build

```bash
npm run build
```

## Backend error logging

The app includes centralized error capture for:

- Upload validation/read errors
- Model API errors (status code + provider status)
- Runtime `window.error` and `unhandledrejection`

Set a backend endpoint to receive structured logs:

```bash
VITE_ERROR_LOG_ENDPOINT=https://your-backend.example.com/api/error-logs
```

Each log record includes timestamp, message, statusCode, providerStatus,
providerDetails, and contextual metadata (phase, model, MIME type, etc.).

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
