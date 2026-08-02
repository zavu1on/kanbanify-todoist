import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  cleanup();
});

// Common testing helpers, available in every *.spec.ts(x) file without imports.
// `screen` is deliberately excluded: it collides with the DOM's own `screen: Screen`
// global, so it's kept as a regular per-file import in spec files.
Object.assign(globalThis, {
  render,
  fireEvent,
  waitFor,
  within,
  userEvent,
});

// jsdom does not implement matchMedia; Mantine relies on it for color-scheme detection.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
