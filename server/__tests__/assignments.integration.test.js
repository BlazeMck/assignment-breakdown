/**
 * Assignments Integration Tests
 * Validates API endpoints for assignment CRUD operations using a mocked database client
 */
const request = require("supertest");
const app = require("../server");
const supabase = require("../config/database");

// Mock database
jest.mock("../config/database", () => ({
  from: jest.fn(),
}));

describe("Assignment Endpoints", () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Properly close the database pool to prevent hanging handles
    if (supabase.pool && typeof supabase.pool.end === "function") {
      await supabase.pool.end();
    }
  });

  // Tests for assignment creation
  describe("POST /api/assignments", () => {
    it("should create a new assignment", async () => {
      const assignmentData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Complete project documentation",
        title: "Documentation",
        due_date: new Date().toISOString(),
      };

      const mockResponse = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: "test-id", ...assignmentData }],
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app)
        .post("/api/assignments")
        .send(assignmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.title).toBe("Documentation");
    });

    it("should return 400 for invalid data", async () => {
      const invalidData = {
        raw_text: "Complete project documentation",
        title: "Documentation",
        // Missing user_id and due_date
      };

      const response = await request(app)
        .post("/api/assignments")
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation Error");
    });

    it("should return 400 for missing required fields", async () => {
      const incompleteData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const response = await request(app)
        .post("/api/assignments")
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation Error");
    });
  });

  // Tests for assignment retrieval (list and filtering)
  describe("GET /api/assignments", () => {
    it("should retrieve all assignments", async () => {
      const mockAssignments = [
        {
          id: "id1",
          user_id: "550e8400-e29b-41d4-a716-446655440000",
          title: "Task 1",
          due_date: new Date().toISOString(),
        },
        {
          id: "id2",
          user_id: "550e8400-e29b-41d4-a716-446655440000",
          title: "Task 2",
          due_date: new Date().toISOString(),
        },
      ];

      const mockResponse = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAssignments,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app).get("/api/assignments");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should filter assignments by user_id", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const mockAssignments = [
        {
          id: "id1",
          user_id: userId,
          title: "Task 1",
        },
      ];

      const mockResponse = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAssignments,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app)
        .get("/api/assignments")
        .query({ user_id: userId });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  // Tests for single assignment retrieval
  describe("GET /api/assignments/:id", () => {
    it("should retrieve a specific assignment", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const mockAssignment = {
        id: assignmentId,
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Test Assignment",
        due_date: new Date().toISOString(),
      };

      const mockResponse = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockAssignment,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app).get(
        `/api/assignments/${assignmentId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(assignmentId);
    });

    it("should return 404 for non-existent assignment", async () => {
      const mockResponse = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null, // maybeSingle returns null data, not an error for not found
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app).get(
        "/api/assignments/non-existent-id",
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Assignment not found"); // Expect specific error message
    });
  });

  // Tests for updating assignments
  describe("PUT /api/assignments/:id", () => {
    it("should update an assignment", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const updateData = {
        title: "Updated Title",
      };

      const mockResponse = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: assignmentId, ...updateData }],
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app)
        .put(`/api/assignments/${assignmentId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Title");
    });

    it("should return 400 for invalid update data", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app)
        .put(`/api/assignments/${assignmentId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation Error");
    });

    it("should return 404 when assignment does not exist", async () => {
      const assignmentId = "non-existent-id";

      const mockResponse = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app)
        .put(`/api/assignments/${assignmentId}`)
        .send({ title: "New Title" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Assignment not found");
    });
  });

  // Tests for assignment deletion
  describe("DELETE /api/assignments/:id", () => {
    it("should delete an assignment", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";

      const mockResponse = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: assignmentId, title: "Deleted Assignment" }],
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app).delete(
        `/api/assignments/${assignmentId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Assignment deleted successfully");
    });

    it("should return 404 when assignment does not exist", async () => {
      const assignmentId = "non-existent-id";

      const mockResponse = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app).delete(
        `/api/assignments/${assignmentId}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Assignment not found");
    });
  });

  // Utility and edge case routing tests
  describe("Health check", () => {
    it("should return 200 for health endpoint", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("404 handling", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await request(app).get("/api/unknown");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Not Found");
    });
  });
});
