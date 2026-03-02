// Suppress console.error during tests for cleaner output
// Errors are still caught and tested, just not logged to console
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
