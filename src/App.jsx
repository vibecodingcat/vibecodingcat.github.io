import { useEffect, useMemo, useState } from "react";
import { beautifyImageWithNanobanana } from "./lib/nanobananaApi";
import {
  logErrorToBackend,
  normalizeError,
  toUserMessage
} from "./lib/errorLogging";

const DEFAULT_PROMPT =
  "Beautify this drawing or image while preserving the core subject and composition. Improve line quality, lighting, color harmony, and detail with a polished artistic finish.";
const LOCAL_STORAGE_API_KEY = "vibecodingcat.google.apiKey";
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const [, base64] = result.split(",");

      if (!base64) {
        reject(new Error("Failed to read image data."));
        return;
      }

      resolve({
        previewUrl: result,
        base64,
        mimeType: file.type || "image/png",
        filename: file.name
      });
    };

    reader.onerror = () => reject(new Error("Unable to load image file."));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [rememberKey, setRememberKey] = useState(true);
  const [model, setModel] = useState("gemini-3.1-flash-image-preview");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [sourceImage, setSourceImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(
    "Upload a drawing or image to begin."
  );
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(apiKey.trim() && model.trim() && sourceImage && !isLoading);
  }, [apiKey, isLoading, model, sourceImage]);

  useEffect(() => {
    const savedKey = window.localStorage.getItem(LOCAL_STORAGE_API_KEY);

    if (savedKey) {
      setApiKey(savedKey);
      setRememberKey(true);
    }
  }, []);

  useEffect(() => {
    if (!rememberKey) {
      window.localStorage.removeItem(LOCAL_STORAGE_API_KEY);
      return;
    }

    if (apiKey.trim()) {
      window.localStorage.setItem(LOCAL_STORAGE_API_KEY, apiKey.trim());
    }
  }, [apiKey, rememberKey]);

  async function handleFileSelection(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please choose an image file (PNG, JPG, WEBP, etc.).");
      return;
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      const unsupportedTypeError = {
        message: JSON.stringify({
          error: {
            code: 400,
            status: "INVALID_ARGUMENT",
            message: `Unsupported MIME type: ${file.type}`
          }
        })
      };

      const errorRecord = normalizeError(unsupportedTypeError, {
        phase: "upload_validation",
        fileType: file.type,
        fallbackMessage: "Unsupported image format."
      });

      void logErrorToBackend(errorRecord);
      setStatusMessage(toUserMessage(errorRecord));
      return;
    }

    try {
      const imagePayload = await fileToDataUrl(file);
      setSourceImage(imagePayload);
      setEnhancedImage(null);
      setStatusMessage(`Loaded ${file.name}. Ready to beautify.`);
    } catch (error) {
      const errorRecord = normalizeError(error, {
        phase: "upload_read",
        fallbackMessage: "Unable to read uploaded file."
      });
      void logErrorToBackend(errorRecord);
      setStatusMessage(toUserMessage(errorRecord));
    }
  }

  function clearStoredKey() {
    setApiKey("");
    setRememberKey(false);
    window.localStorage.removeItem(LOCAL_STORAGE_API_KEY);
    setStatusMessage("Stored API key cleared from this browser.");
  }

  async function handleBeautify() {
    if (!canSubmit) {
      return;
    }

    setIsLoading(true);
    setStatusMessage("Transforming your image with Gemini image model...");

    try {
      const result = await beautifyImageWithNanobanana({
        apiKey: apiKey.trim(),
        model: model.trim(),
        sourceImage,
        prompt: prompt.trim() || DEFAULT_PROMPT
      });

      setEnhancedImage({
        ...result,
        previewUrl: `data:${result.mimeType};base64,${result.base64}`
      });
      setStatusMessage("Done. Your beautified image is ready.");
    } catch (error) {
      const errorRecord = normalizeError(error, {
        phase: "model_generate_content",
        model: model.trim(),
        sourceMimeType: sourceImage?.mimeType,
        fallbackMessage: "Generation failed. Please try again."
      });
      void logErrorToBackend(errorRecord);
      setStatusMessage(toUserMessage(errorRecord));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">VibeCodingCat Studio</p>
        <h1>Beautify your drawings with Gemini image AI</h1>
        <p className="lead">
          Upload a hand drawing or photo, add your Google API key, and generate
          a polished, high-aesthetic version in one click.
        </p>
      </section>

      <section className="panel-grid">
        <article className="panel controls-panel">
          <h2>Generation settings</h2>

          <label className="field" htmlFor="api-key">
            <span>Google API key</span>
            <input
              id="api-key"
              type="password"
              placeholder="Paste your key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <div className="inline-row">
              <label className="remember-toggle" htmlFor="remember-key">
                <input
                  id="remember-key"
                  type="checkbox"
                  checked={rememberKey}
                  onChange={(event) => setRememberKey(event.target.checked)}
                />
                Remember key on this device only
              </label>
              <button
                type="button"
                className="secondary-action"
                onClick={clearStoredKey}
              >
                Clear key
              </button>
            </div>
            <small className="hint">
              Key stays in your browser localStorage only. It is not committed to
              GitHub.
            </small>
          </label>

          <label className="field" htmlFor="model">
            <span>Model name</span>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="gemini-3.1-flash-image-preview"
            />
          </label>

          <label className="field" htmlFor="prompt">
            <span>Beautify prompt</span>
            <textarea
              id="prompt"
              rows={6}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>

          <label className="upload field" htmlFor="image-upload">
            <span>Upload source image</span>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelection}
            />
          </label>

          <button type="button" className="action" onClick={handleBeautify} disabled={!canSubmit}>
            {isLoading ? "Beautifying..." : "Beautify image"}
          </button>

          <p className="status">{statusMessage}</p>
        </article>

        <article className="panel preview-panel">
          <h2>Preview</h2>
          <div className="preview-grid">
            <div className="preview-card">
              <h3>Original</h3>
              {sourceImage ? (
                <img src={sourceImage.previewUrl} alt="Original upload" />
              ) : (
                <div className="placeholder">No image selected yet.</div>
              )}
            </div>

            <div className="preview-card">
              <h3>Beautified</h3>
              {enhancedImage ? (
                <>
                  <img src={enhancedImage.previewUrl} alt="Beautified result" />
                  <a
                    className="download"
                    href={enhancedImage.previewUrl}
                    download="beautified-image.png"
                  >
                    Download result
                  </a>
                </>
              ) : (
                <div className="placeholder">Your generated image will appear here.</div>
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
