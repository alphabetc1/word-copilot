/**
 * Mock setup for tests
 */

// Import Office mock
import "../__mocks__/officeMock";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock fetch
(globalThis as typeof globalThis & { fetch: jest.Mock }).fetch = jest.fn();

// Mock console methods to reduce noise (keep existing implementations available)
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});
