const express = require("express");
const router = express.Router();
const supabase = require("../config/database");
const {
  validateAssignment,
  validateAssignmentUpdate,
  validateUserId,
} = require("../validators/assignmentValidator");
const { randomUUID } = require("crypto");

/**
 * POST /api/assignments
 * Creates a new assignment for a specific user
 */
router.post("/", async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = validateAssignment(req.body);
    if (error) {
      return next(error);
    }

    // Generate unique ID and prepare data
    const assignmentData = {
      id: randomUUID(),
      ...value,
    };

    // Insert into database
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

/**
 * GET /api/assignments
 * Retrieves assignments, optionally filtered by user_id
 */
router.get("/", async (req, res, next) => {
  try {
    const { user_id, sort_by = "due_date", order = "asc" } = req.query;

    // Validate user_id format if provided in query
    if (user_id) {
      const { error } = validateUserId(user_id);
      if (error) {
        return next(error);
      }
    }

    let query = supabase.from("assignments").select("*");

    // Apply user filter
    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    // Apply sorting
    const { data, error } = await query.order(sort_by, {
      ascending: order !== "desc",
    });

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

/**
 * GET /api/assignments/:id
 * Retrieves a single assignment by its unique ID
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Handle non-existent resource
    if (!data) {
      const err = new Error("Assignment not found");
      err.status = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/assignments/:id
 * Updates an existing assignment's details
 */
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate update payload
    const { error, value } = validateAssignmentUpdate(req.body);

    if (error) {
      return next(error);
    }

    // Explicitly map validated properties to database fields
    const updateData = {
      ...value,
      updated_at: new Date(),
    };

    // Perform update
    const { data, error: updateError } = await supabase
      .from("assignments")
      .update(updateData)
      .eq("id", id)
      .select();

    if (updateError) {
      throw updateError;
    }

    // Handle non-existent resource
    if (!data || data.length === 0) {
      const err = new Error("Assignment not found");
      err.status = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/assignments/:id
 * Removes an assignment from the database
 */
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

    // Handle non-existent resource
    if (!data || data.length === 0) {
      const err = new Error("Assignment not found");
      err.status = 404;
      throw err;
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
