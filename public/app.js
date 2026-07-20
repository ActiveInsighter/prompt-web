import {
  buildRawPath,
  identifierFromViewerUrl,
  normalizeViewerInput,
} from './viewer-core.js';

const form = document.querySelector('#open-source-form');
const input = document.querySelector('#source-target');
const message = document.querySelector('#form-message');

function renderSource(identifier) {
  document.body.className = 'source-mode';
  document.body.replaceChildren();

  const source = document.createElement('pre');
  source.className = 'source-document';
  source.setAttribute('aria-live', 'polite');
  source.textContent = 'Loading Markdown source…';
  document.body.append(source);

  const endpoint = `/api/files/fetch?identifier=${encodeURIComponent(identifier)}`;
  fetch(endpoint, {
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      if (response.ok) return response.json();

      let detail = `Request failed with status ${response.status}.`;
      try {
        const payload = await response.json();
        if (typeof payload.error === 'string') detail = payload.error;
      } catch {
        // Keep the HTTP status fallback when the response is not JSON.
      }
      throw new Error(detail);
    })
    .then((file) => {
      if (typeof file.content !== 'string') {
        throw new TypeError('The file response does not contain Markdown source.');
      }

      document.title = `${file.fileName ?? file.title ?? 'Markdown'} · Source`;
      source.textContent = file.content;
      source.dataset.rawUrl = buildRawPath(file.uri ?? identifier);
    })
    .catch((error) => {
      document.title = 'Markdown source unavailable';
      source.textContent = `Unable to load Markdown source.\n\n${
        error instanceof Error ? error.message : String(error)
      }`;
    });
}

const identifier = identifierFromViewerUrl(window.location.href, window.location.origin);
if (identifier) {
  renderSource(identifier);
} else if (form instanceof HTMLFormElement && input instanceof HTMLInputElement) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (message) message.textContent = '';

    try {
      const destination = normalizeViewerInput(input.value, window.location.origin);
      window.location.assign(destination);
    } catch (error) {
      if (message) {
        message.textContent = error instanceof Error ? error.message : String(error);
      }
      input.focus();
    }
  });

  input.focus();
}
