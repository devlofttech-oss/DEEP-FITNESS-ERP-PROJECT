import markAsset from '../assets/deep_fitness_mark.png';
import wordmarkAsset from '../assets/deep_fitness_wordmark.png';

/**
 * Brand artwork, as absolute URLs.
 *
 * The receipt is rendered inside a popup (about:blank) and an iframe srcDoc
 * (about:srcdoc); neither has a usable base URL, so a bundler path like
 * "/assets/mark-abc123.png" would not resolve there. Absolutise it against the
 * app origin so the same markup works in the page, the popup and in print.
 */
const absolute = (path) => {
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
};

export const BRAND_MARK = absolute(markAsset);
export const BRAND_WORDMARK = absolute(wordmarkAsset);

// The artwork is gold line-art drawn for a dark backing — it washes out on white.
export const BRAND_MARK_ON_DARK = true;
