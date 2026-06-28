const { randomUUID } = require("crypto");
const supabase = require("../lib/database");
const { breakdownAssignment } = require("../../server/services/breakdown");

module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      const { user_id, raw_text, due_date } = req.body || {};

      if (typeof user_id !== "string" || !user_id.trim()) {
        return res.status(400).json({
          success: false,
          error: "Bad Request",
          message: "user_id is required and must be a non-empty string.",
        });
      }

      if (typeof raw_text !== "string" || !raw_text.trim()) {
        return res.status(400).json({
          success: false,
          error: "Bad Request",
          message: "raw_text is required and must be a non-empty string.",
        });
      }

      if (!due_date) {
        return res.status(400).json({
          success: false,
          error: "Bad Request",
          message: "due_date is required.",
        });
      }

      const breakdown = await breakdownAssignment({
        rawText: raw_text,
        dueDate: due_date,
      });

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

      if (assignmentError) throw assignmentError;

      const assignment = assignmentRows[0];

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

      if (tasksError) throw tasksError;

      return res.status(201).json({
        success: true,
        data: { assignment, tasks },
      });
    } else if (req.method === "GET") {
      const { user_id } = req.query;

      if (typeof user_id !== "string" || !user_id.trim()) {
        return res.status(400).json({
          success: false,
          error: "Bad Request",
          message: "user_id query parameter is required.",
        });
      }

      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", user_id)
        .order("due_date", { ascending: true });

      if (assignmentsError) throw assignmentsError;

      const withTasks = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("*")
            .eq("assignment_id", assignment.id)
            .order("priority", { ascending: true });

          if (tasksError) throw tasksError;
          return { ...assignment, tasks: tasks || [] };
        }),
      );

      return res.status(200).json({
        success: true,
        data: withTasks,
      });
    } else {
      return res.status(405).json({
        success: false,
        error: "Method Not Allowed",
        message: `Method ${req.method} not allowed`,
      });
    }
  } catch (error) {
    console.error("Breakdown error:", error);
    const status = error.status || (error.message?.includes("OPENAI_API_KEY") ? 500 : 500);
    return res.status(status).json({
      success: false,
      error: "Internal Server Error",
      message: error.message?.includes("OPENAI_API_KEY")
        ? "Server is missing its OpenAI configuration."
        : error.message || "Failed to process breakdown.",
    });
  }
};
