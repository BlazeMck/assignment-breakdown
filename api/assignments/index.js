const { randomUUID } = require("crypto");
const supabase = require("../lib/database");
const { validateAssignment, validateAssignmentUpdate, validateUuid } = require("../lib/validators");

module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      const { error, value } = validateAssignment(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          message: error.message,
        });
      }

      const assignmentData = {
        id: randomUUID(),
        ...value,
      };

      const { data, error: insertError } = await supabase
        .from("assignments")
        .insert([assignmentData])
        .select();

      if (insertError) throw insertError;

      return res.status(201).json({
        success: true,
        data: data[0],
      });
    } else if (req.method === "GET") {
      const { user_id, sort_by = "due_date", order = "asc" } = req.query;

      let query = supabase.from("assignments").select("*");

      if (user_id) {
        const { error: validationError } = validateUuid(user_id);
        if (validationError) {
          return res.status(400).json({
            success: false,
            error: "Validation Error",
            message: "Invalid user_id format",
          });
        }
        query = query.eq("user_id", user_id);
      }

      const { data, error } = await query.order(sort_by, {
        ascending: order !== "desc",
      });

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
    console.error("Assignments error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message || "Failed to process assignments.",
    });
  }
};
