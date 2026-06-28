const supabase = require("../../lib/database");
const { validateAssignmentUpdate, validateUuid } = require("../../lib/validators");

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

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", assignmentId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Assignment not found",
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } else if (req.method === "PUT") {
      const { error: validationError, value } = validateAssignmentUpdate(req.body);
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
        .from("assignments")
        .update(updateData)
        .eq("id", assignmentId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Assignment not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: data[0],
      });
    } else if (req.method === "DELETE") {
      const { data, error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Assignment not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Assignment deleted successfully",
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
    console.error("Assignment error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message || "Failed to process assignment.",
    });
  }
};
