declare global {
  const render: typeof import("@testing-library/react").render;
  const fireEvent: typeof import("@testing-library/react").fireEvent;
  const waitFor: typeof import("@testing-library/react").waitFor;
  const within: typeof import("@testing-library/react").within;
  const userEvent: typeof import("@testing-library/user-event").default;
}

// `screen` from Testing Library is intentionally not exposed as a global: it
// collides with the DOM's own `screen: Screen` global, so it stays a regular
// per-file import in spec files.

export {};
