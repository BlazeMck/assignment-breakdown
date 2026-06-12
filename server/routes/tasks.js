const express = require("express");
const { randomUUID } = require("crypto");
const supabase = require("../config/database");
const {
  validateTask,
  validateTaskUpdate,
  validateUuidParam,
} = require("../validators/taskValidator");

const router = express.Router({ mergeParams: true });

/**
 * Checks that the parent assignment exists before any task operation runs
 */
async function getAssignmentOrFail(assignmentId) {
  const { data, error } = await supabase
    .from("assignments")
    .select("id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError = new Error("Assignment not found");
    notFoundError.status = 404;
    throw notFoundError;
  }

  return data;
}

/**
 * Checks that a task exists and belongs to the current assignment
 */
async function getTaskOrFail(taskId, assignmentId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError = new Error("Task not found");
    notFoundError.status = 404;
    throw notFoundError;
  }

  return data;
}

/**
 * POST /api/assignments/:assignmentId/tasks
 * Creates a new task for a specific assignment
 */
router.post("/", async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { error: assignmentIdError } = validateUuidParam(
      assignmentId,
      "assignmentId",
    );

    if (assignmentIdError) {
      return next(assignmentIdError);
    }

    const { error, value } = validateTask(req.body);
    if (error) {
      return next(error);
    }

    await getAssignmentOrFail(assignmentId);

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
 * GET /api/assignments/:assignmentId/tasks
 * Retrieves all tasks for a specific assignment
 */
router.get("/", async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { error: assignmentIdError } = validateUuidParam(
      assignmentId,
      "assignmentId",
    );

    if (assignmentIdError) {
      return next(assignmentIdError);
    }

    await getAssignmentOrFail(assignmentId);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("priority", { ascending: true });

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
 * PUT /api/assignments/:assignmentId/tasks/:taskId
 * Updates an existing task's details
 */
router.put("/:taskId", async (req, res, next) => {
  try {
    const { assignmentId, taskId } = req.params;
    const { error: assignmentIdError } = validateUuidParam(
      assignmentId,
      "assignmentId",
    );
    if (assignmentIdError) {
      return next(assignmentIdError);
    }

    const { error: taskIdError } = validateUuidParam(taskId, "taskId");
    if (taskIdError) {
      return next(taskIdError);
    }

    const { error, value } = validateTaskUpdate(req.body);
    if (error) {
      return next(error);
    }

    await getAssignmentOrFail(assignmentId);
    await getTaskOrFail(taskId, assignmentId);

    const updateData = {
      ...value,
      updated_at: new Date(),
    };

    const { data, error: updateError } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId)
      .eq("assignment_id", assignmentId)
      .select();

    if (updateError) {
      throw updateError;
    }

    if (!data || data.length === 0) {
      const notFoundError = new Error("Task not found");
      notFoundError.status = 404;
      throw notFoundError;
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
 * DELETE /api/assignments/:assignmentId/tasks/:taskId
 * Removes a task from the database
 */
router.delete("/:taskId", async (req, res, next) => {
  try {
    const { assignmentId, taskId } = req.params;
    const { error: assignmentIdError } = validateUuidParam(
      assignmentId,
      "assignmentId",
    );
    if (assignmentIdError) {
      return next(assignmentIdError);
    }

    const { error: taskIdError } = validateUuidParam(taskId, "taskId");
    if (taskIdError) {
      return next(taskIdError);
    }

    await getAssignmentOrFail(assignmentId);
    await getTaskOrFail(taskId, assignmentId);

    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("assignment_id", assignmentId)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      const notFoundError = new Error("Task not found");
      notFoundError.status = 404;
      throw notFoundError;
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
