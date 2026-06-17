/**
 * Task Validator Unit Tests
 * Ensures task payloads are constrained before they reach the database layer
 */
const {
  validateTask,
  validateTaskUpdate,
  validateUuidParam,
} = require("../validators/taskValidator");

describe("Task Validators", () => {
  describe("validateTask", () => {
    it("should validate correct task data", () => {
      const validData = {
        description: "Read chapter 4",
        priority: 1,
        time_estimate: 60,
        status: "pending",
      };

      const { error } = validateTask(validData);
      expect(error).toBeUndefined();
    });

    it("should reject missing description", () => {
      const { error } = validateTask({
        priority: 1,
        status: "pending",
      });

      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("description");
    });

    it("should reject invalid status", () => {
      const { error } = validateTask({
        description: "Read chapter 4",
        priority: 1,
        status: "done",
      });

      expect(error).toBeDefined();
    });

    it("should reject negative priority", () => {
      const { error } = validateTask({
        description: "Read chapter 4",
        priority: -1,
        status: "pending",
      });

      expect(error).toBeDefined();
    });
  });

  describe("validateTaskUpdate", () => {
    it("should validate partial task updates", () => {
      const { error } = validateTaskUpdate({
        description: "Write reflection",
      });

      expect(error).toBeUndefined();
    });

    it("should reject empty update payload", () => {
      const { error } = validateTaskUpdate({});

      expect(error).toBeDefined();
    });

    it("should reject invalid task status", () => {
      const { error } = validateTaskUpdate({
        status: "finished",
      });

      expect(error).toBeDefined();
    });
  });

  describe("validateUuidParam", () => {
    it("should validate a UUID", () => {
      const { error } = validateUuidParam(
        "550e8400-e29b-41d4-a716-446655440000",
        "assignmentId",
      );

      expect(error).toBeUndefined();
    });

    it("should reject a malformed UUID", () => {
      const { error } = validateUuidParam("not-a-uuid", "taskId");

      expect(error).toBeDefined();
    });
  });
});
