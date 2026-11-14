import '@testing-library/jest-dom';

// Mock ResizeObserver for Recharts ResponsiveContainer in jsdom
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;
global.ResizeObserver = ResizeObserver;
