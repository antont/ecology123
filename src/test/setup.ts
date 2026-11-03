import '@testing-library/jest-dom'

// jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs one to mount
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
