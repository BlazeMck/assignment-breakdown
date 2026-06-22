export const markComplete = async (task) => {
  if (!task || !task.id || !task.assignment_id) {
    throw new Error("markComplete requires a task with id and assignment_id");
  }

  const payload = { status: "completed" };

  const res = await fetch(
    `/api/assignments/${task.assignment_id}/tasks/${task.id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // include credentials if your server uses cookie-based sessions
      // credentials: 'include',
    },
  );

  let body;
  try {
    body = await res.json();
  } catch (err) {
    throw new Error("Unexpected response from server");
  }

  if (!res.ok) {
    const message = body && (body.message || body.error || JSON.stringify(body));
    throw new Error(message || "Failed to update task status");
  }

  // Server responds with { success: true, data: <updated task> }
  return body.data;
};