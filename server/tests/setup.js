// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = 5001; // Use a different port for testing

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
console.error = (...args) => {
  if (process.env.DEBUG) {
    originalConsoleError(...args);
  }
};

// Global setup before all tests
beforeAll(() => {
  // Any global setup needed before all tests
});

// Global teardown after all tests
afterAll(() => {
  // Any global cleanup needed after all tests
  console.error = originalConsoleError;
});
