/**
 * Send an assignment to the backend to be broken down into prioritized tasks.
 *
 * @param {{ rawText: string, dueDate?: string }} assignment
 * @returns {Promise<{ title: string, tasks: Array<{description: string, priority: number, time_estimate: 'High'|'Medium'|'Low', status: string}> }>}
 * @throws {Error} with a user-facing message if the request fails.
 */
export async function breakdownAssignment(assignment) {
  let response;
  try {
    response = await fetch('/api/assignments/breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment),
    });
  } catch {
    // Network-level failure (server down, no connection, etc.)
    throw new Error('Could not reach the server. Is the backend running?');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to break down the assignment.');
  }

  return data;
}
