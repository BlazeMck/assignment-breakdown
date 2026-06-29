const supabase = require("../lib/database");
const { validateTaskUpdate, validateUuid } = require("../lib/validators");

async function getTaskOrFail(taskId, assignmentId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }
  return data;
}

module.exports = async (req, res) => {
  try {
    const { assignmentId, taskId } = req.query;

    const { error: assignmentIdError } = validateUuid(assignmentId);
    if (assignmentIdError) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "Invalid assignmentId format",
      });
    }

    const { error: taskIdError } = validateUuid(taskId);
    if (taskIdError) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "Invalid taskId format",
      });
    }

    if (req.method === "PUT") {
      await getTaskOrFail(taskId, assignmentId);

      const { error: validationError, value } = validateTaskUpdate(req.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          message: validationError.message,
        });
      }

      const updateData = {
        ...value,
        updated_at: new Date(),
      };

      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .eq("assignment_id", assignmentId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Task not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: data[0],
      });
    } else if (req.method === "DELETE") {
      await getTaskOrFail(taskId, assignmentId);

      const { data, error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("assignment_id", assignmentId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Task not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Task deleted successfully",
        data: data[0],
      });
    } else {
      return res.status(405).json({
        success: false,
        error: "Method Not Allowed",
        message: `Method ${req.method} not allowed`,
      });
    }
  } catch (error) {
    console.error("Task error:", error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.status === 404 ? "Not Found" : "Internal Server Error",
      message: error.message || "Failed to process task.",
    });
  }
};
