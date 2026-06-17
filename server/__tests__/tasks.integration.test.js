/**
 * Task Endpoints Integration Tests
 * Exercises task CRUD routes with a mocked Supabase client
 */
const request = require("supertest");
const app = require("../server");
const supabase = require("../config/database");

jest.mock("../config/database", () => ({
  from: jest.fn(),
}));

describe("Task Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (supabase.pool && typeof supabase.pool.end === "function") {
      await supabase.pool.end();
    }
  });

  describe("POST /api/assignments/:assignmentId/tasks", () => {
    it("should create a task for an existing assignment", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const taskData = {
        description: "Read chapter 4",
        priority: 1,
        time_estimate: 60,
        status: "pending",
      };

      const assignmentLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: assignmentId },
          error: null,
        }),
      };

      const taskInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: "task-id", assignment_id: assignmentId, ...taskData }],
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(assignmentLookup)
        .mockReturnValueOnce(taskInsert);

      const response = await request(app)
        .post(`/api/assignments/${assignmentId}/tasks`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assignment_id).toBe(assignmentId);
      expect(response.body.data.description).toBe("Read chapter 4");
    });

    it("should return 400 for invalid assignment_id", async () => {
      const response = await request(app)
        .post("/api/assignments/not-a-uuid/tasks")
        .send({
          description: "Read chapter 4",
          priority: 1,
          status: "pending",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation Error");
    });

    it("should reject invalid task data", async () => {
      const response = await request(app)
        .post("/api/assignments/550e8400-e29b-41d4-a716-446655440000/tasks")
        .send({
          description: "",
          priority: 1,
          status: "pending",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation Error");
    });

    it("should return 404 when assignment does not exist", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const assignmentLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(assignmentLookup);

      const response = await request(app)
        .post(`/api/assignments/${assignmentId}/tasks`)
        .send({
          description: "Read chapter 4",
          priority: 1,
          status: "pending",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Assignment not found");
    });
  });

  describe("GET /api/assignments/:assignmentId/tasks", () => {
    it("should return all tasks for an assignment", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const taskList = [
        {
          id: "task-1",
          assignment_id: assignmentId,
          description: "Read chapter 4",
          priority: 1,
          status: "pending",
        },
        {
          id: "task-2",
          assignment_id: assignmentId,
          description: "Write reflection",
          priority: 2,
          status: "pending",
        },
      ];

      const assignmentLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: assignmentId },
          error: null,
        }),
      };

      const taskQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: taskList,
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(assignmentLookup)
        .mockReturnValueOnce(taskQuery);

      const response = await request(app).get(
        `/api/assignments/${assignmentId}/tasks`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return 404 for a missing assignment", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const assignmentLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(assignmentLookup);

      const response = await request(app).get(
        `/api/assignments/${assignmentId}/tasks`,
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Assignment not found");
    });
  });

  describe("PUT /api/assignments/:assignmentId/tasks/:taskId", () => {
    it("should update a task", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const taskId = "650e8400-e29b-41d4-a716-446655440000";

      const assignmentLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: assignmentId },
          error: null,
        }),
      };

      const taskLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: taskId, assignment_id: assignmentId },
          error: null,
        }),
      };

      const taskUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: taskId,
              assignment_id: assignmentId,
              description: "Write reflection",
              priority: 2,
              status: "completed",
            },
          ],
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(assignmentLookup)
        .mockReturnValueOnce(taskLookup)
        .mockReturnValueOnce(taskUpdate);

      const response = await request(app)
        .put(`/api/assignments/${assignmentId}/tasks/${taskId}`)
        .send({
          status: "completed",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("completed");
    });

    it("should return 404 when task does not exist", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const taskId = "650e8400-e29b-41d4-a716-446655440000";

      const assignmentLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: assignmentId },
          error: null,
        }),
      };

      const taskLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(assignmentLookup)
        .mockReturnValueOnce(taskLookup);

      const response = await request(app)
        .put(`/api/assignments/${assignmentId}/tasks/${taskId}`)
        .send({ status: "completed" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });
  });

  describe("DELETE /api/assignments/:assignmentId/tasks/:taskId", () => {
    it("should delete a task", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const taskId = "650e8400-e29b-41d4-a716-446655440000";

      const assignmentLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: assignmentId },
          error: null,
        }),
      };

      const taskLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: taskId, assignment_id: assignmentId },
          error: null,
        }),
      };

      const taskDelete = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: taskId,
              assignment_id: assignmentId,
              description: "Write reflection",
            },
          ],
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(assignmentLookup)
        .mockReturnValueOnce(taskLookup)
        .mockReturnValueOnce(taskDelete);

      const response = await request(app).delete(
        `/api/assignments/${assignmentId}/tasks/${taskId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Task deleted successfully");
    });

    it("should return 404 when task does not exist", async () => {
      const assignmentId = "550e8400-e29b-41d4-a716-446655440000";
      const taskId = "650e8400-e29b-41d4-a716-446655440000";

      const assignmentLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: assignmentId },
          error: null,
        }),
      };

      const taskLookup = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(assignmentLookup)
        .mockReturnValueOnce(taskLookup);

      const response = await request(app).delete(
        `/api/assignments/${assignmentId}/tasks/${taskId}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });
  });
});
