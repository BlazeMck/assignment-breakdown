const express = require("express");
const router = express.Router();
const supabase = require("../config/database");
const {
  validateAssignment,
  validateAssignmentUpdate,
} = require("../validators/assignmentValidator");
const { randomUUID } = require("crypto");

const sendValidationError = (res, error) => {
  res.status(400).json({
    error: "Validation Error",
    details: error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    })),
  });
};

const sendNotFoundError = (res, message = "Assignment not found") => {
  res.status(404).json({
    success: false,
    error: message,
  });
};

// Create assignment
router.post("/", async (req, res, next) => {
  try {
    const { error, value } = validateAssignment(req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    const assignmentData = {
      id: randomUUID(),
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error: insertError } = await supabase
      .from("assignments")
      .insert([assignmentData])
      .select();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
});

// Get all assignments
router.get("/", async (req, res, next) => {
  try {
    const { user_id } = req.query;
    let query = supabase.from("assignments").select("*");

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    const { data, error } = await query.order("due_date", { ascending: true });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Get assignment by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return sendNotFoundError(res);
    }

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Update assignment
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = validateAssignmentUpdate(req.body);

    if (error) {
      return sendValidationError(res, error);
    }

    const updateData = {
      ...value,
      updated_at: new Date().toISOString(),
    };

    const { data, error: updateError } = await supabase
      .from("assignments")
      .update(updateData)
      .eq("id", id)
      .select();

    if (updateError) {
      throw updateError;
    }

    if (!data || data.length === 0) {
      return sendNotFoundError(res);
    }

    res.status(200).json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
});

// Delete assignment
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return sendNotFoundError(res);
    }

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
