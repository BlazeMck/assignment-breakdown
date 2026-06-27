/**
 * Breakdown Integration Tests
 * Exercises POST/GET /api/breakdown with the database and OpenAI service mocked,
 * focusing on validation/error handling and the persist-then-return happy path.
 */
const request = require("supertest");
const app = require("../server");
const supabase = require("../config/database");
const { breakdownAssignment } = require("../services/breakdown");

// Mock the database client (same pattern as the other integration suites).
jest.mock("../config/database", () => ({
  from: jest.fn(),
}));

// Mock the OpenAI service so no real API calls are made.
jest.mock("../services/breakdown", () => ({
  breakdownAssignment: jest.fn(),
}));

const VALID_BODY = {
  user_id: "firebaseUid_abc123",
  raw_text: "Write a 5 page paper on climate change with 3 sources.",
  due_date: "2026-07-01",
};

// A deterministic stand-in for what the LLM would return
const FAKE_BREAKDOWN = {
  title: "Climate change paper",
  tasks: [
    { description: "Research 3 sources", priority: 1, time_estimate: 2, status: "pending" },
    { description: "Write the draft", priority: 2, time_estimate: 3, status: "pending" },
  ],
};

describe("Breakdown Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (supabase.pool && typeof supabase.pool.end === "function") {
      await supabase.pool.end();
    }
  });

  describe("POST /api/breakdown — validation", () => {
    it("should return 400 when user_id is missing", async () => {
      const { user_id, ...body } = VALID_BODY;

      const response = await request(app).post("/api/breakdown").send(body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/user_id/i);
      // The LLM and DB should never be touched on a validation failure.
      expect(breakdownAssignment).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should return 400 when user_id is an empty string", async () => {
      const response = await request(app)
        .post("/api/breakdown")
        .send({ ...VALID_BODY, user_id: "   " });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/user_id/i);
    });

    it("should return 400 when raw_text is missing", async () => {
      const { raw_text, ...body } = VALID_BODY;

      const response = await request(app).post("/api/breakdown").send(body);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/raw_text/i);
      expect(breakdownAssignment).not.toHaveBeenCalled();
    });

    it("should return 400 when raw_text is empty/whitespace", async () => {
      const response = await request(app)
        .post("/api/breakdown")
        .send({ ...VALID_BODY, raw_text: "   " });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/raw_text/i);
    });

    it("should return 400 when due_date is missing", async () => {
      const { due_date, ...body } = VALID_BODY;

      const response = await request(app).post("/api/breakdown").send(body);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/due_date/i);
      expect(breakdownAssignment).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/breakdown — success", () => {
    it("should break down the assignment and persist it with its tasks", async () => {
      breakdownAssignment.mockResolvedValue(FAKE_BREAKDOWN);

      // First .from() call inserts the assignment, second inserts the tasks.
      const assignmentInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: "assignment-1", user_id: VALID_BODY.user_id, title: FAKE_BREAKDOWN.title }],
          error: null,
        }),
      };
      const tasksInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: FAKE_BREAKDOWN.tasks.map((t, i) => ({ id: `task-${i}`, assignment_id: "assignment-1", ...t })),
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(assignmentInsert)
        .mockReturnValueOnce(tasksInsert);

      const response = await request(app).post("/api/breakdown").send(VALID_BODY);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assignment.title).toBe(FAKE_BREAKDOWN.title);
      expect(response.body.data.tasks).toHaveLength(2);
      // The LLM was called with the submitted text + due date.
      expect(breakdownAssignment).toHaveBeenCalledWith({
        rawText: VALID_BODY.raw_text,
        dueDate: VALID_BODY.due_date,
      });
    });

    it("should surface a clear error when the OpenAI key is missing", async () => {
      breakdownAssignment.mockRejectedValue(
        new Error("OPENAI_API_KEY is not set in the environment."),
      );

      const response = await request(app).post("/api/breakdown").send(VALID_BODY);

      expect(response.status).toBe(500);
      expect(response.body.message).toMatch(/OpenAI configuration/i);
    });
  });

  describe("GET /api/breakdown", () => {
    it("should return 400 when user_id query param is missing", async () => {
      const response = await request(app).get("/api/breakdown");

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/user_id/i);
    });

    it("should return a user's assignments with their tasks nested", async () => {
      const assignmentsLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: "assignment-1", user_id: "firebaseUid_abc123", title: "Paper" }],
          error: null,
        }),
      };
      const tasksLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: "task-1", assignment_id: "assignment-1", description: "Do it", priority: 1 }],
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(assignmentsLookup)
        .mockReturnValueOnce(tasksLookup);

      const response = await request(app)
        .get("/api/breakdown")
        .query({ user_id: "firebaseUid_abc123" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tasks).toHaveLength(1);
      expect(response.body.data[0].tasks[0].assignment_id).toBe("assignment-1");
    });
  });
});
