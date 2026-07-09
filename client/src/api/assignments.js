/**
 * Send an assignment to the backend to be broken down into prioritized tasks
 * and persisted for the given user.
 *
 * @param {{ user_id: string, raw_text: string, due_date: string }} payload
 * @returns {Promise<{ assignment: object, tasks: Array<object> }>}
 * @throws {Error} with a user-facing message if the request fails.
 */
export async function createBreakdown(payload) {
  let response;
  try {
    response = await fetch("/api/breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Network-level failure (server down, no connection, etc)
    throw new Error("Could not reach the server. Is the backend running?");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to break down the assignment.");
  }

  return data.data;
}

/**
 * Fetch all of a user's assignments, each with its tasks nested.
 *
 * @param {string} userId - the logged-in user's Firebase UID
 * @returns {Promise<Array<{ id: string, title: string, tasks: Array<object> }>>}
 * @throws {Error} with a user-facing message if the request fails.
 */
export async function getUserBreakdowns(userId) {
  let response;
  try {
    response = await fetch(`/api/breakdown?user_id=${encodeURIComponent(userId)}`);
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to load your assignments.");
  }

  return data.data;
}

/**
 * Fetch a single assignment by ID with its nested tasks.
 * 
 * @param {string} assignmentId 
 * @returns {Promise<{ assignment: object, tasks: Array<object> }>}
 */
export async function getAssignmentDetails(assignmentId) {
  let response;
  try {
    response = await fetch(`/api/assignments/${assignmentId}`);
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to fetch assignment details.");
  }

  return data;
}

/**
 * Toggle or update a task's status on the backend.
 * Assuming there is a task router or assignment sub-router handling individual tasks.
 * 
 * @param {string} taskId 
 * @param {string} status - e.g., 'completed' or 'pending'
 */
export async function updateTaskStatus(assignmentId, taskId, status) {
  let response;
  try {
    response = await fetch(`/api/assignments/${assignmentId}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to update task status.");
  }

  return data.data;
}

/**
 * Delete a single assignment by ID with its nested tasks.
 * 
 * @param {string} assignmentId 
 */
export async function deleteAssignment(assignmentId) {
  let response;
  try {
    response = await fetch(`/api/assignments/${assignmentId}`, {
      method: "DELETE",
    });
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to delete assignment.");
  }

  return data;
}