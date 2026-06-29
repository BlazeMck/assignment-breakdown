const { randomUUID } = require("crypto");
const supabase = require("../lib/database");
const { validateTask, validateUuid } = require("../lib/validators");

async function getAssignmentOrFail(assignmentId) {
  const { data, error } = await supabase
    .from("assignments")
    .select("id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const err = new Error("Assignment not found");
    err.status = 404;
    throw err;
  }
  return data;
}

module.exports = async (req, res) => {
  try {
    const { assignmentId } = req.query;

    const { error: idError } = validateUuid(assignmentId);
    if (idError) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "Invalid assignmentId format",
      });
    }

    if (req.method === "POST") {
      await getAssignmentOrFail(assignmentId);

      const { error: validationError, value } = validateTask(req.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          message: validationError.message,
        });
      }

      const taskData = {
        id: randomUUID(),
        assignment_id: assignmentId,
        description: value.description,
        priority: value.priority,
        time_estimate: value.time_estimate ?? null,
        status: value.status,
      };

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert([taskData])
        .select();

      if (insertError) throw insertError;

      return res.status(201).json({
        success: true,
        data: data[0],
      });
    } else if (req.method === "GET") {
      await getAssignmentOrFail(assignmentId);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("priority", { ascending: true });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data,
      });
    } else {
      return res.status(405).json({
        success: false,
        error: "Method Not Allowed",
        message: `Method ${req.method} not allowed`,
      });
    }
  } catch (error) {
    console.error("Tasks error:", error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.status === 404 ? "Not Found" : "Internal Server Error",
      message: error.message || "Failed to process tasks.",
    });
  }
};
