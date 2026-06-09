const {
  validateAssignment,
  validateAssignmentUpdate,
} = require("../validators/assignmentValidator");

describe("Assignment Validators", () => {
  describe("validateAssignment", () => {
    it("should validate correct assignment data", () => {
      const validData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Complete project documentation",
        title: "Documentation",
        due_date: new Date().toISOString(),
      };

      const { error } = validateAssignment(validData);
      expect(error).toBeUndefined();
    });

    it("should reject missing user_id", () => {
      const invalidData = {
        raw_text: "Complete project documentation",
        title: "Documentation",
        due_date: new Date().toISOString(),
      };

      const { error } = validateAssignment(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("user_id");
    });

    it("should reject invalid UUID for user_id", () => {
      const invalidData = {
        user_id: "not-a-uuid",
        raw_text: "Complete project documentation",
        title: "Documentation",
        due_date: new Date().toISOString(),
      };

      const { error } = validateAssignment(invalidData);
      expect(error).toBeDefined();
    });

    it("should reject empty raw_text", () => {
      const invalidData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "",
        title: "Documentation",
        due_date: new Date().toISOString(),
      };

      const { error } = validateAssignment(invalidData);
      expect(error).toBeDefined();
    });

    it("should reject missing title", () => {
      const invalidData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Complete project documentation",
        due_date: new Date().toISOString(),
      };

      const { error } = validateAssignment(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("title");
    });

    it("should reject title longer than 255 characters", () => {
      const longTitle = "a".repeat(256);
      const invalidData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Complete project documentation",
        title: longTitle,
        due_date: new Date().toISOString(),
      };

      const { error } = validateAssignment(invalidData);
      expect(error).toBeDefined();
    });

    it("should reject invalid date format", () => {
      const invalidData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Complete project documentation",
        title: "Documentation",
        due_date: "not-a-date",
      };

      const { error } = validateAssignment(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe("validateAssignmentUpdate", () => {
    it("should validate partial update data", () => {
      const updateData = {
        title: "Updated Title",
      };

      const { error } = validateAssignmentUpdate(updateData);
      expect(error).toBeUndefined();
    });

    it("should allow updating raw_text", () => {
      const updateData = {
        raw_text: "Updated raw text",
      };

      const { error } = validateAssignmentUpdate(updateData);
      expect(error).toBeUndefined();
    });

    it("should allow updating due_date", () => {
      const updateData = {
        due_date: new Date().toISOString(),
      };

      const { error } = validateAssignmentUpdate(updateData);
      expect(error).toBeUndefined();
    });

    it("should allow updating multiple fields", () => {
      const updateData = {
        title: "New Title",
        raw_text: "New raw text",
        due_date: new Date().toISOString(),
      };

      const { error } = validateAssignmentUpdate(updateData);
      expect(error).toBeUndefined();
    });

    it("should reject empty update object", () => {
      const { error } = validateAssignmentUpdate({});
      expect(error).toBeDefined();
    });

    it("should reject title longer than 255 characters", () => {
      const longTitle = "a".repeat(256);
      const updateData = {
        title: longTitle,
      };

      const { error } = validateAssignmentUpdate(updateData);
      expect(error).toBeDefined();
    });

    it("should reject empty raw_text", () => {
      const updateData = {
        raw_text: "",
      };

      const { error } = validateAssignmentUpdate(updateData);
      expect(error).toBeDefined();
    });
  });
});
