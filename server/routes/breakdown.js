const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const supabase = require("../config/database");
const { breakdownAssignment } = require("../services/breakdown");

/**
 * POST /api/breakdown
 * Takes raw assignment text + a due date, asks the LLM to break it into
 * prioritized tasks, then persists the assignment and its tasks for the user.
 *
 * user_id is the Firebase Authentication UID of the logged-in user.
 *
 * Request body:  { user_id: string, raw_text: string, due_date: ISO date, existing_assignment_id?: string }
 * Response body: { success: true, data: { assignment, tasks } }
 */
router.post("/", async (req, res, next) => {
  try {
    const { user_id, raw_text, due_date, existing_assignment_id } = req.body || {};

    // user_id is the Firebase UID (a non-empty string), not a DB uuid.
    if (typeof user_id !== "string" || !user_id.trim()) {
      const err = new Error("user_id is required and must be a non-empty string.");
      err.status = 400;
      return next(err);
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

    let assignment;

    // 2. Persist or update the assignment.
    if (existing_assignment_id) {
      // OVERWRITE EXISTING: Update core details
      const { data: updatedRows, error: updateError } = await supabase
        .from("assignments")
        .update({ 
          title: breakdown.title, 
          raw_text: raw_text.trim(), 
          due_date 
        })
        .eq("id", existing_assignment_id)
        .select();

      if (updateError) {
        throw updateError;
      }
      assignment = updatedRows[0];

      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("assignment_id", existing_assignment_id);
        
      if (deleteError) {
        throw deleteError;
      }
    } else {
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
      assignment = assignmentRows[0];
    }

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

/**
 * GET /api/breakdown?user_id=<firebase uid>
 * Returns all of a user's assignments, each with its tasks nested, ordered
 * by due date. Used to load a user's saved breakdowns after they log in.
 */
router.get("/", async (req, res, next) => {
  try {
    const { user_id } = req.query;

    if (typeof user_id !== "string" || !user_id.trim()) {
      const err = new Error("user_id query parameter is required.");
      err.status = 400;
      return next(err);
    }

    // Fetch the user's assignments.
    const { data: assignments, error: assignmentsError } = await supabase
      .from("assignments")
      .select("*")
      .eq("user_id", user_id)
      .order("due_date", { ascending: true });

    if (assignmentsError) {
      throw assignmentsError;
    }

    // Attach each assignment's tasks.
    const withTasks = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("assignment_id", assignment.id)
          .order("priority", { ascending: true });

        if (tasksError) {
          throw tasksError;
        }

        return { ...assignment, tasks: tasks || [] };
      }),
    );

    res.status(200).json({
      success: true,
      data: withTasks,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;