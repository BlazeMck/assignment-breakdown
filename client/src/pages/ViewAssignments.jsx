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

  useEffect(() => {
  const syncTheme = () => {
    const saved = localStorage.getItem('theme');
    setIsLightMode(saved ? saved === 'light' : true);
  };
  
  // 1. Sync right away when the view mounts
  syncTheme(); 
  
  // 2. Catch the themeChanged event fired from the Navbar
  window.addEventListener('themeChanged', syncTheme); 
  
  // 3. Clean up the listener when navigating away
  return () => window.removeEventListener('themeChanged', syncTheme);
}, []);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) || assignments[0] || null,
    [assignments, selectedAssignmentId],
  );

  const taskCount = selectedAssignment?.tasks?.length ?? 0;

  const handleToggleTaskStatus = async (task) => {

  if (!selectedAssignment){
    return;
  } 

  

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
        tasks: assignment.tasks.map((existingTask) => {
          if (existingTask.id !== task.id) {
            return existingTask;
          }
          
          // SAFELY apply the update using the explicit nextStatus state
          return { 
            ...existingTask, 
            status: nextStatus 
          };
        }),
      };
    })
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

const formatDate = (isoString) => {
    if (!isoString) return "No due date set";
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const styles = getStyles(isLightMode);

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.panelCard}>
          <h1 style={styles.assignmentTitle}>Please sign in to view your assignments.</h1>
          <p style={{ color: isLightMode ? '#5a4d3f' : '#a3a3a3' }}>
            Your assignments are stored per user, and completing tasks requires an authenticated session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div>
        {/* Main Selection Header */}
        <div style={styles.headerWrapper}>
          <div style={styles.headerContainer}>
            <h1 style={styles.headerTitle}>My Assignments</h1>
            <p style={styles.headerSubtitle}>Select an assignment to view tasks and toggle completion status.</p>
          </div>
          
          <div style={styles.selectorContainer}>
            <label style={styles.selectorLabel}>Choose assignment</label>
            <select
              value={selectedAssignment?.id ?? ""}
              onChange={(event) => setSelectedAssignmentId(event.target.value)}
              style={styles.dropdownElement}
            >
              {assignments.length === 0 ? (
                <option value="">No assignments found</option>
              ) : (
                assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Dynamic Contextual States */}
        {loading ? (
          <div style={styles.emptyStateContainer}>
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading assignments…</p>
            </div>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}>
            <strong>System Connection Notice:</strong> {error}
          </div>
        ) : !selectedAssignment ? (
          <div style={styles.emptyStateContainer}>
            <p style={{ color: isLightMode ? '#827568' : '#a3a3a3' }}>
              No assignments are available. Create one from the Submit Assignment page.
            </p>
          </div>
        ) : (
          <div style={styles.listWrapper}>
            {/* Active Core Assignment Information Display */}
            <div style={styles.panelCard}>
              <span style={styles.tagBadge}>
                {selectedAssignment.raw_text ? "Original request loaded" : "Assignment loaded"}
              </span>
              <h1 style={styles.assignmentTitle}>{selectedAssignment.title}</h1>
              {selectedAssignment.raw_text && (
                <p style={styles.assignmentDesc}>{selectedAssignment.raw_text}</p>
              )}
              <div style={styles.metaRow}>
                <span>Due <strong style={styles.metaHighlight}>{formatDate(selectedAssignment.due_date) || "No due date set"}</strong></span>
                <span>·</span>
                <span>{taskCount} task{taskCount === 1 ? "" : "s"} total</span>
              </div>
            </div>

            {/* Structured Task Sub-Grid Layout */}
            <div style={styles.listWrapper}>
              <h3 style={styles.sectionHeading}>AI TASK BREAKDOWN</h3>
              
              {selectedAssignment.tasks && selectedAssignment.tasks.length > 0 ? (
                selectedAssignment.tasks.map((task) => {
                  const taskIsSaving = savingTaskIds.has(task.id);
                  const isDone = task.status === "completed";
                  const nextAction = isDone ? "Revert to incomplete" : "Mark complete";
                  
                  // Dynamic custom priority evaluations matching your exact visual scale rules
                  const pVal = Number(task.priority);
                  const leftBorderColor = '#10b981';
                  const taskTextColor = isDone ? (isLightMode ? '#a89f91' : '#525252') : (isLightMode ? '#3b3228' : '#e5e7eb');
                  
                  let pillBg, pillColor;
                  pillBg = isLightMode ? '#d1fae5' : '#162d20'; pillColor = isLightMode ? '#065f46' : '#6ee7b7';

                  return (
                    <div key={task.id} style={{ ...styles.taskRow, borderLeft: `4px solid ${leftBorderColor}` }}>
                      <div style={styles.taskLayoutRow}>
                        <div style={{ spaceY: '8px', flex: 1 }}>
                          <p style={{ ...styles.taskText, textDecoration: isDone ? 'line-through' : 'none', color: taskTextColor }}>
                            {task.description}
                          </p>
                          <div style={styles.badgeRow}>
                            {/* FIXED: Removed timeEstimateLabels so it prints the raw sequence number */}
                            <span style={{ ...styles.priorityPill, color: pillColor, backgroundColor: pillBg }}>
                              Priority {task.priority}
                            </span>
                            <span style={{ ...styles.priorityPill, backgroundColor: isLightMode ? '#eadecc' : '#272533', color: isLightMode ? '#6366f1' : '#a78bfa' }}>
                              {statusLabels[task.status] ?? task.status}
                            </span>
                            {task.time_estimate != null && (
                              <span style={{ ...styles.priorityPill, backgroundColor: isLightMode ? '#eadecc' : '#272533', color: isLightMode ? '#5a4d3f' : '#a3a3a3' }}>
                                Estimate {task.time_estimate}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          disabled={taskIsSaving}
                          style={isDone ? styles.cancelBtn : styles.purpleButton}
                        >
                          {taskIsSaving ? "Saving…" : nextAction}
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={styles.emptyStateContainer}>
                  <p style={{ color: isLightMode ? '#827568' : '#a3a3a3' }}>This assignment has no tasks yet.</p>
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
  container: { 
    maxWidth: '960px', 
    margin: '0 auto', 
    padding: '40px 20px', 
    backgroundColor: isLight ? '#fdf6e3' : '#0a0a0a', 
    minHeight: '100vh', 
    fontFamily: 'Inter, system-ui, sans-serif', 
    color: isLight ? '#3b3228' : '#fff',
    transition: 'background-color 0.3s ease, color 0.3s ease'
  },
  headerWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px', 
    borderBottom: `1px solid ${isLight ? '#e3d8c3' : '#1f1f1f'}`, 
    paddingBottom: '24px', 
    marginBottom: '28px', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  headerContainer: { display: 'flex', flexDirection: 'column', gap: '4px' },
  headerTitle: { fontSize: '32px', margin: 0, fontBold: '800', color: isLight ? '#2d251e' : '#fff', letterSpacing: '-0.02em' },
  headerSubtitle: { fontSize: '15px', color: isLight ? '#6b5c4c' : '#a3a3a3', margin: 0 },
  selectorContainer: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%' },
  selectorLabel: { fontSize: '14px', fontWeight: '600', color: isLight ? '#5a4d3f' : '#cbd5e1', whiteSpace: 'nowrap' },
  dropdownElement: { 
    borderRadius: '12px', 
    border: `1px solid ${isLight ? '#d6c8b3' : '#27262b'}`, 
    backgroundColor: isLight ? '#fff' : '#141416', 
    padding: '10px 16px', 
    color: isLight ? '#3b3228' : '#e5e7eb', 
    fontSize: '15px', 
    fontWeight: '500', 
    outline: 'none', 
    cursor: 'pointer', 
    minWidth: '240px' 
  },
  errorContainer: { 
    backgroundColor: isLight ? '#fee2e2' : '#2d1616', 
    border: `1px solid ${isLight ? '#f87171' : '#7f1d1d'}`, 
    color: isLight ? '#991b1b' : '#fca5a5', 
    padding: '16px 20px', 
    borderRadius: '12px', 
    marginBottom: '24px', 
    fontSize: '15px' 
  },
  panelCard: { 
    backgroundColor: isLight ? '#f4ecd8' : '#141416', 
    border: `1px solid ${isLight ? '#e3d8c3' : '#232326'}`, 
    borderRadius: '16px', 
    padding: '32px', 
    marginBottom: '24px' 
  },
  tagBadge: { 
    display: 'inline-block', 
    backgroundColor: isLight ? '#eadecc' : '#272533', 
    color: isLight ? '#4f46e5' : '#a78bfa', // Slightly darker indigo for better light contrast
    fontSize: '12px', 
    fontWeight: '700', 
    padding: '4px 12px', 
    borderRadius: '8px', 
    marginBottom: '16px' 
  },
  assignmentTitle: { 
    fontSize: '28px', 
    margin: '0 0 14px 0', 
    fontWeight: '800', 
    letterSpacing: '-0.02em', 
    lineHeight: '1.2',
    color: isLight ? '#2d251e' : '#fff'
  },
  assignmentDesc: { 
    fontSize: '15px', 
    color: isLight ? '#5a4d3f' : '#a3a3a3', 
    margin: '0 0 24px 0', 
    lineHeight: '1.7', 
    backgroundColor: isLight ? '#fdf6e3' : '#1a1a1e', 
    padding: '18px 22px', 
    borderRadius: '10px', 
    borderLeft: `4px solid ${isLight ? '#c4b5a0' : '#444'}`, 
    whiteSpace: 'pre-wrap' 
  },
  metaRow: { display: 'flex', gap: '16px', fontSize: '14px', color: isLight ? '#6b5c4c' : '#737373', alignItems: 'center' },
  metaHighlight: { color: isLight ? '#2d251e' : '#fff', fontWeight: '600' },
  sectionHeading: { fontSize: '13px', color: isLight ? '#6b5c4c' : '#737373', fontWeight: '700', letterSpacing: '0.06em', margin: '12px 0 4px 0' },
  purpleButton: { 
    backgroundColor: '#6366f1', 
    color: '#fff', 
    border: 'none', 
    padding: '10px 18px', 
    borderRadius: '10px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    fontSize: '14px', 
    whiteSpace: 'nowrap'
  },
  cancelBtn: { 
    backgroundColor: isLight ? '#eadecc' : 'transparent', 
    color: isLight ? '#2d251e' : '#e5e7eb', 
    border: `1px solid ${isLight ? '#c4b5a0' : '#3a3a40'}`, 
    padding: '10px 18px', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '14px', 
    whiteSpace: 'nowrap' 
  },
  emptyStateContainer: { 
    textAlign: 'center', 
    padding: '48px 0', 
    backgroundColor: isLight ? '#f4ecd8' : '#141416', 
    borderRadius: '16px', 
    border: `1px dashed ${isLight ? '#c4b5a0' : '#27262b'}` 
  },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  spinner: { width: '32px', height: '32px', border: `3px solid ${isLight ? '#e3d8c3' : '#232326'}`, borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: isLight ? '#4f46e5' : '#a78bfa', margin: 0, fontSize: '15px', fontWeight: '500' },
  listWrapper: { display: 'flex', flexDirection: 'column', gap: '14px' },
  taskRow: { 
    backgroundColor: isLight ? '#fff' : '#141416', // Bright white tasks on parchment background looks incredibly sharp
    padding: '20px 24px', 
    borderRadius: '14px', 
    border: `1px solid ${isLight ? '#e3d8c3' : '#232326'}`, 
    boxShadow: isLight ? '0 2px 4px rgba(59,50,40,0.04)' : '0 1px 3px rgba(0,0,0,0.02)' 
  },
  taskLayoutRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' },
  taskText: { fontSize: '16px', fontWeight: '600', margin: '0 0 10px 0', lineHeight: '1.4' },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' },
  priorityPill: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px' }
});