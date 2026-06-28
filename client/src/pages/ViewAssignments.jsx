import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { getUserBreakdowns, updateTaskStatus } from "../api/assignments";

const statusLabels = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

const timeEstimateLabels = {
  1: "Low",
  2: "Medium",
  3: "High",
};

export default function ViewAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingTaskIds, setSavingTaskIds] = useState(new Set());

  useEffect(() => {
    if (!user?.uuid) {
      return;
    }

    setError("");
    setLoading(true);

    getUserBreakdowns(user.uuid)
      .then((data) => {
        setAssignments(data || []);
        if (data && data.length > 0) {
          setSelectedAssignmentId((current) => current || data[0].id);
        }
      })
      .catch((fetchError) => {
        setError(fetchError.message || "Unable to load assignments.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.uuid]);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) || assignments[0] || null,
    [assignments, selectedAssignmentId],
  );

  const taskCount = selectedAssignment?.tasks?.length ?? 0;

  const handleToggleTaskStatus = async (task) => {
    if (!selectedAssignment) return;

    const nextStatus = task.status === "completed" ? "pending" : "completed";
    setSavingTaskIds((current) => new Set(current).add(task.id));

    try {
      const updatedTask = await updateTaskStatus(selectedAssignment.id, task.id, nextStatus);
      setAssignments((currentAssignments) =>
        currentAssignments.map((assignment) => {
          if (assignment.id !== selectedAssignment.id) {
            return assignment;
          }

          return {
            ...assignment,
            tasks: assignment.tasks.map((existingTask) =>
              existingTask.id === task.id ? { ...existingTask, ...updatedTask } : existingTask,
            ),
          };
        }),
      );
    } catch (toggleError) {
      setError(toggleError.message || "Unable to update task status.");
    } finally {
      setSavingTaskIds((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md p-8 max-w-xl w-full text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Please sign in to view your assignments.</h1>
          <p className="text-slate-600 dark:text-slate-300">Your assignments are stored per user, and completing tasks requires an authenticated session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Assignments</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Select an assignment to view tasks and toggle completion status.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Choose assignment</label>
            <select
              value={selectedAssignment?.id ?? ""}
              onChange={(event) => setSelectedAssignmentId(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {assignments.length === 0 ? (
                <option value="">No assignments found</option>
              ) : (
                assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} ({assignment.due_date})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">Loading assignments…</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : !selectedAssignment ? (
          <div className="rounded-3xl border border-slate-200 p-8 text-slate-600 dark:border-slate-700 dark:text-slate-300">No assignments are available. Create one from the Submit Assignment page.</div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{selectedAssignment.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Due on {selectedAssignment.due_date} · {taskCount} task{taskCount === 1 ? "" : "s"}</p>
                </div>
                <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{selectedAssignment.raw_text ? "Original request loaded" : "Assignment loaded"}</span>
              </div>
            </div>

            <div className="grid gap-4">
              {selectedAssignment.tasks && selectedAssignment.tasks.length > 0 ? (
                selectedAssignment.tasks.map((task) => {
                  const taskIsSaving = savingTaskIds.has(task.id);
                  const nextAction = task.status === "completed" ? "Revert to incomplete" : "Mark complete";
                  return (
                    <div key={task.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">{task.description}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">Priority {task.priority}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{statusLabels[task.status] ?? task.status}</span>
                            {task.time_estimate != null && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">Estimate {timeEstimateLabels[task.time_estimate] ?? task.time_estimate}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          disabled={taskIsSaving}
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
                        >
                          {taskIsSaving ? "Saving…" : nextAction}
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
                  This assignment has no tasks yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}