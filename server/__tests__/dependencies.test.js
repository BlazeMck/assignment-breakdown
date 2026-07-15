/**
 * Dependency Service Unit Tests
 * Exercises detectDependencies() with the OpenAI client mocked, focusing on
 * input validation and the defensive cleanup of the model's output.
 */

// Mock the OpenAI SDK so no real API calls are made. The mock lets each test
// control what the chat completion returns.
const mockCreate = jest.fn();
jest.mock("openai", () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
);

const { detectDependencies } = require("../services/dependencies");

// Helper: shape a fake OpenAI chat completion around a dependencies payload.
function mockCompletion(dependencies) {
  return {
    choices: [{ message: { content: JSON.stringify({ dependencies }) } }],
  };
}

const TASKS = [
  { priority: 1, description: "Set up the database schema" },
  { priority: 2, description: "Build the API" },
  { priority: 3, description: "Build the dashboard UI" },
];

describe("detectDependencies", () => {
  const OLD_ENV = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = OLD_ENV;
  });

  it("throws when given an empty or non-array tasks input", async () => {
    await expect(detectDependencies([])).rejects.toThrow(/non-empty/i);
    await expect(detectDependencies(null)).rejects.toThrow(/non-empty/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns the model's per-task dependencies", async () => {
    mockCreate.mockResolvedValue(
      mockCompletion([
        { priority: 1, depends_on: [] },
        { priority: 2, depends_on: [1] },
        { priority: 3, depends_on: [2] },
      ]),
    );

    const result = await detectDependencies(TASKS);

    expect(result).toEqual([
      { priority: 1, depends_on: [] },
      { priority: 2, depends_on: [1] },
      { priority: 3, depends_on: [2] },
    ]);
    // Each task's priority + description should be in the prompt.
    const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
    expect(userMessage).toMatch(/Build the dashboard UI/);
  });

  it("strips self-references from the model's output", async () => {
    mockCreate.mockResolvedValue(
      mockCompletion([{ priority: 2, depends_on: [1, 2] }]),
    );

    const result = await detectDependencies(TASKS);

    // Task 2 cannot depend on itself.
    expect(result).toEqual([{ priority: 2, depends_on: [1] }]);
  });

  it("drops dependency priorities that are not real tasks", async () => {
    mockCreate.mockResolvedValue(
      mockCompletion([{ priority: 3, depends_on: [2, 99] }]),
    );

    const result = await detectDependencies(TASKS);

    // 99 is not a task in the input, so it is removed.
    expect(result).toEqual([{ priority: 3, depends_on: [2] }]);
  });

  it("de-duplicates repeated dependency priorities", async () => {
    mockCreate.mockResolvedValue(
      mockCompletion([{ priority: 3, depends_on: [1, 1, 2] }]),
    );

    const result = await detectDependencies(TASKS);

    expect(result).toEqual([{ priority: 3, depends_on: [1, 2] }]);
  });

  it("throws a clear error when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;

    // Load a fresh copy of the module so its lazily-created (and cached)
    // OpenAI client from earlier tests doesn't mask the missing key.
    await jest.isolateModulesAsync(async () => {
      const { detectDependencies: freshDetect } = require("../services/dependencies");
      await expect(freshDetect(TASKS)).rejects.toThrow(/OPENAI_API_KEY/);
    });
  });
});
