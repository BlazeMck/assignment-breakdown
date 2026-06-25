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
