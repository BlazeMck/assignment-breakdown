const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const supabase = require("../config/database");
const { breakdownAssignment } = require("../services/breakdown");
const { validateUserId } = require("../validators/assignmentValidator");

/**
 * POST /api/breakdown
 * Takes raw assignment text + a due date, asks the LLM to break it into
 * prioritized tasks, then persists the assignment and its tasks for the user.
 *
 * Request body:  { user_id: uuid, raw_text: string, due_date: ISO date }
 * Response body: { success: true, data: { assignment, tasks } }
 */
router.post("/", async (req, res, next) => {
  try {
    const { user_id, raw_text, due_date } = req.body || {};

    // Validate the user the assignment will belong to.
    const { error: userError } = validateUserId(user_id);
    if (userError) {
      return next(userError);
    }

    if (typeof raw_text !== "string" || !raw_text.trim()) {
      const err = new Error("raw_text is required and must be a non-empty string.");
      err.status = 400;
      return next(err);
    }

    if (!due_date) {
      const err = new Error("due_date is required.");
      err.status = 400;
      return next(err);
    }

    // 1. Ask the LLM for a title + prioritized tasks.
    const breakdown = await breakdownAssignment({
      rawText: raw_text,
      dueDate: due_date,
    });

    // 2. Persist the assignment.
    const assignmentData = {
      id: randomUUID(),
      user_id,
      raw_text: raw_text.trim(),
      title: breakdown.title,
      due_date,
    };

    const { data: assignmentRows, error: assignmentError } = await supabase
      .from("assignments")
      .insert([assignmentData])
      .select();

    if (assignmentError) {
      throw assignmentError;
    }

    const assignment = assignmentRows[0];

    // 3. Persist the tasks, each linked to the new assignment.
    const taskRows = breakdown.tasks.map((task) => ({
      id: randomUUID(),
      assignment_id: assignment.id,
      description: task.description,
      priority: task.priority,
      time_estimate: task.time_estimate,
      status: task.status,
    }));

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .insert(taskRows)
      .select();

    if (tasksError) {
      throw tasksError;
    }

    res.status(201).json({
      success: true,
      data: { assignment, tasks },
    });
  } catch (error) {
    // Surface a clearer message when the server lacks its OpenAI config.
    if (error.message && error.message.includes("OPENAI_API_KEY")) {
      error.status = 500;
      error.message = "Server is missing its OpenAI configuration.";
    }
    next(error);
  }
});

module.exports = router;
