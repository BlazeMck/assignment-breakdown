/**
 * Error Handling Integration Tests
 * Verifies that the server correctly maps database errors and request malformations to HTTP responses
 */
const request = require("supertest");
const app = require("../server");
const supabase = require("../config/database");

jest.mock("../config/database");

describe("Assignment Error Handling", () => {
  beforeEach(() => {
    // Ensure a clean slate for mocks between error scenarios
    jest.clearAllMocks();
  });

  // Simulated database constraint failures
  describe("Database Errors", () => {
    it("should handle unique constraint violation", async () => {
      const assignmentData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Complete project",
        title: "Project",
        due_date: new Date().toISOString(),
      };

      const mockResponse = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "Unique violation" },
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app)
        .post("/api/assignments")
        .send(assignmentData);

      expect(response.status).toBe(409);
    });

    it("should handle foreign key constraint violation", async () => {
      const assignmentData = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Complete project",
        title: "Project",
        due_date: new Date().toISOString(),
      };

      const mockResponse = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "23503", message: "Foreign key violation" },
        }),
      };

      supabase.from.mockReturnValue(mockResponse);

      const response = await request(app)
        .post("/api/assignments")
        .send(assignmentData);

      expect(response.status).toBe(400);
    });
  });

  // Verification of security and protocol headers
  describe("CORS Headers", () => {
    it("should include CORS headers in response", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    it("should handle OPTIONS requests", async () => {
      const response = await request(app)
        .options("/api/assignments")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-methods"]).toBe(
        "GET, POST, PUT, DELETE, OPTIONS",
      );
    });
  });

  // Testing of invalid or improperly formatted client requests
  describe("Malformed Requests", () => {
    it("should handle JSON parse errors", async () => {
      const response = await request(app)
        .post("/api/assignments")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBe(400);
    });

    it("should handle missing Content-Type", async () => {
      const response = await request(app)
        .post("/api/assignments")
        .send({ title: "Test" });

      expect(response.status).toBe(400);
    });
  });
});
