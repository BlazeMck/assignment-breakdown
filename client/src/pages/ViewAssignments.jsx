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
  const [isLightMode, setIsLightMode] = useState(() => {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'light' : true;
  });

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

  const styles = getStyles(isLightMode)

  if (!user) {
    return (
      <div style={styles.container}>
        <div>
          <h1>Please sign in to view your assignments.</h1>
          <p>Your assignments are stored per user, and completing tasks requires an authenticated session.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div style={styles.headerContainer}>
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
          <div style={styles.listWrapper}>
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

const getStyles = (isLight) => ({
  container: { maxWidth: '960px', margin: '0 auto', padding: '40px 20px', backgroundColor: isLight ? '#fdf6e3' : '#0a0a0a', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: isLight ? '#3b3228' : '#fff' },
  headerContainer: {justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${isLight ? '#e3d8c3' : '#1f1f1f'}`, paddingBottom: '16px', marginBottom: '28px' },
  dashboardBackBtn: { backgroundColor: isLight ? '#eadecc' : '#272533', color: '#6366f1', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', marginBottom: '16px' },
  headerTitle: { fontSize: '26px', margin: 0, fontWeight: '700' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  themeToggleBtn: { backgroundColor: 'transparent', color: isLight ? '#5a4d3f' : '#a3a3a3', border: `1px solid ${isLight ? '#d6c8b3' : '#232326'}`, padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  addAssignmentBtn: { backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  errorContainer: { backgroundColor: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '16px', borderRadius: '10px', marginBottom: '24px' },
  errorNavBtn: { marginTop: '10px', backgroundColor: '#991b1b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  panelCard: { backgroundColor: isLight ? '#f4ecd8' : '#141416', border: `1px solid ${isLight ? '#e3d8c3' : '#232326'}`, borderRadius: '14px', padding: '28px', marginBottom: '24px' },
  tagBadge: { display: 'inline-block', backgroundColor: isLight ? '#eadecc' : '#272533', color: isLight ? '#6366f1' : '#a78bfa', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', marginBottom: '14px' },
  assignmentTitle: { fontSize: '32px', margin: '0 0 12px 0', fontWeight: '700', letterSpacing: '-0.02em' },
  assignmentDesc: { fontSize: '15px', color: isLight ? '#5a4d3f' : '#a3a3a3', margin: '0 0 24px 0', lineHeight: '1.7', backgroundColor: isLight ? '#fdf6e3' : '#1a1a1e', padding: '16px 20px', borderRadius: '8px', borderLeft: `4px solid ${isLight ? '#d6c8b3' : '#444'}`, whiteSpace: 'pre-wrap' },
  metaRow: { display: 'flex', gap: '32px', fontSize: '14px', color: isLight ? '#827568' : '#a3a3a3' },
  metaHighlight: { color: isLight ? '#3b3228' : '#fff' },
  panelHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionHeading: { fontSize: '14px', color: isLight ? '#827568' : '#737373', fontWeight: '700', letterSpacing: '0.05em', margin: 0 },
  purpleButton: { backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  redButton: { backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  emptyStateContainer: { textAlign: 'center', padding: '50px 0' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  spinner: { width: '36px', height: '36px', border: `3px solid ${isLight ? '#e3d8c3' : '#232326'}`, borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' },
  loadingText: { color: isLight ? '#6366f1' : '#a78bfa', margin: 0, fontSize: '14px' },
  completionStatusText: { textAlign: 'right', fontSize: '13px', color: isLight ? '#827568' : '#737373', marginBottom: '14px' },
  listWrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
  taskRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isLight ? '#fdf6e3' : '#1a1a1e', padding: '16px 20px', borderRadius: '8px', border: `1px solid ${isLight ? '#e3d8c3' : '#26262b'}` },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1 },
  checkboxElement: { width: '18px', height: '18px', cursor: 'pointer' },
  taskText: { fontSize: '15px' },
  priorityPill: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', marginLeft: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: isLight ? '#fff' : '#1e1e1e', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', border: `1px solid ${isLight ? '#e5e7eb' : '#333'}`, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  cancelBtn: { backgroundColor: 'transparent', color: isLight ? '#3b3228' : '#fff', border: `1px solid ${isLight ? '#d1d5db' : '#4b5563'}`, padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  confirmDeleteBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
});