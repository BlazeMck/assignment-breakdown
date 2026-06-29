import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAssignmentDetails, updateTaskStatus, createBreakdown, deleteAssignment } from '../api/assignments';

const DEMO_TASK_POOL = [
  { description: "Write thesis statement", priority: 1 },
  { description: "Find 3 sources", priority: 2 },
  { description: "Draft conclusion", priority: 3 },
  { description: "Outline main arguments", priority: 2 },
  { description: "Review citation format", priority: 1 },
  { description: "Proofread final draft", priority: 3 },
];

function shuffleDemoTasks() {
  const shuffled = [...DEMO_TASK_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map((t, i) => ({
    id: `demo-${Date.now()}-${i}`,
    description: t.description,
    priority: t.priority,
    status: 'pending',
  }));
}

const getSortVal = (p) => {
  const pStr = String(p).toLowerCase();
  if (pStr === '3' || pStr === 'high') return 3;
  if (pStr === '2' || pStr === 'medium') return 2;
  if (pStr === '1' || pStr === 'low') return 1;
  return 0;
};

export default function AssignmentView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Robust ID parsing: checks path parameters AND query strings simultaneously
  const { id: pathId } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const queryId = urlParams.get('id');
  
  const id = pathId || queryId;
  const isDemo = id === 'demo' || !id;

  // State Management
  const [assignment, setAssignment] = useState({ title: "Loading Assignment...", raw_text: "", due_date: "" });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingTaskIds, setSavingTaskIds] = useState(new Set());
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'light' : true;
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = isLightMode ? '#fdf6e3' : '#0a0a0a';
    document.body.style.transition = 'background-color 0.3s ease';
  }, [isLightMode]);

  // Data Hydration Lifecycle
  useEffect(() => {
    if (isDemo) {
      setAssignment({ title: "Example: The Industrial Revolution", raw_text: "Analyze the industrial revolution.", due_date: "2026-06-24" });
      
      const savedDemoTasks = localStorage.getItem('demoDashboardTasks');
      if (savedDemoTasks) {
        setTasks(JSON.parse(savedDemoTasks));
      } else {
        setTasks([
          { id: "1", description: "Write thesis statement", priority: 1, status: "pending" },
          { id: "2", description: "Find 3 sources", priority: 2, status: "pending" },
          { id: "3", description: "Draft conclusion", priority: 3, status: "completed" }
        ]);
      }
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    getAssignmentDetails(id)
      .then((payload) => {
        if (!payload) throw new Error("Server returned an empty response payload.");
        const coreData = payload.data || payload; 

        if (coreData && typeof coreData === 'object') {
          setAssignment({
            title: coreData.title || "Untitled Assignment",
            raw_text: coreData.raw_text || "No description text provided.",
            due_date: coreData.due_date || ""
          });
          setTasks(coreData.tasks || []);
        } else {
          throw new Error("Data wrapper properties are empty or misaligned.");
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to parse database records.");
        setAssignment({ title: "Error Loading Data", raw_text: "", due_date: "" });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isDemo]);

  const hasGenerated = useMemo(() => tasks.length > 0, [tasks]);

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    if (isDemo) {
      setTasks(prev => {
        const updated = prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        localStorage.setItem('demoDashboardTasks', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    setSavingTaskIds((current) => new Set(current).add(taskId));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await updateTaskStatus(id, taskId, newStatus); 
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
      setErrorMessage(err.message || "Failed to sync task with server.");
    } finally {
      setSavingTaskIds((current) => {
        const next = new Set(current);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 600));
      const newTasks = shuffleDemoTasks();
      setTasks(newTasks);
      localStorage.setItem('demoDashboardTasks', JSON.stringify(newTasks));
      setLoading(false);
      return;
    }

    if (!assignment.raw_text) {
      setLoading(false);
      return;
    }
    setTasks([]);
    
    try {
        const activeUser = user || { uuid: "demo-user-123" };
        await createBreakdown({
            user_id: activeUser.uuid,
            title: assignment.title,
            raw_text: assignment.raw_text,
            due_date: assignment.due_date,
            existing_assignment_id: id
        });
        window.location.reload();
    } catch (err) {
        alert("Failed to regenerate: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (isDemo) return;
    try {
      await deleteAssignment(id);
      navigate('/');
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const toTitleCase = (str) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (isoString) => {
    if (!isoString) return "No due date set";
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => getSortVal(a.priority) - getSortVal(b.priority));
  }, [tasks]);

  const displayTitle = toTitleCase(assignment.title);
  const displayDate = formatDate(assignment.due_date);
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const styles = getStyles(isLightMode);

  return (
    <div style={styles.container}>
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>

      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{marginTop: 0, fontSize: '20px'}}>Delete Assignment?</h3>
            <p style={{color: '#888', marginBottom: '24px', lineHeight: '1.5'}}>
              Are you sure you want to completely delete this assignment and all its generated tasks? This action cannot be undone.
            </p>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button style={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button style={styles.confirmDeleteBtn} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.headerContainer}>
        <div>
          <button style={styles.dashboardBackBtn} onClick={() => navigate('/')}>
            ← Back to Dashboard
          </button>
          <h2 style={styles.headerTitle}>{displayTitle || "Project Details"}</h2>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.themeToggleBtn} onClick={() => {
            const newMode = !isLightMode;
            localStorage.setItem('theme', newMode ? 'light' : 'dark');
            window.dispatchEvent(new Event('themeChanged'));
            }}>
            {isLightMode ? '☾ Dark' : '☀ Light'}
          </button>
          <button style={styles.addAssignmentBtn} onClick={() => navigate('/submit')}>
            + Add assignment
          </button>
        </div>
      </div>

      {errorMessage && (
        <div style={styles.errorContainer}>
          <strong>System Connection Notice:</strong> {errorMessage} <br/>
          <button onClick={() => navigate('/')} style={styles.errorNavBtn}>Return to Project Dashboard</button>
        </div>
      )}

      <div style={styles.panelCard}>
        <span style={styles.tagBadge}>Assignment</span>
        <h1 style={styles.assignmentTitle}>{displayTitle || "Loading Details..."}</h1>
        <p style={styles.assignmentDesc}>{assignment.raw_text}</p>
        <div style={styles.metaRow}>
          <span>Due <strong style={styles.metaHighlight}>{displayDate}</strong></span>
        </div>
      </div>

      <div style={styles.panelCard}>
        <div style={styles.panelHeaderRow}>
          <h3 style={styles.sectionHeading}>AI TASK BREAKDOWN</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isDemo && (
              <button style={styles.redButton} onClick={() => setShowDeleteModal(true)}>
                🗑 Delete Assignment
              </button>
            )}
            <button 
              style={styles.purpleButton} 
              onClick={handleRegenerate} 
              // disabled={loading || (!isDemo && !!errorMessage)}
              disabled={true}
            >
              {loading ? 'Processing...' : hasGenerated ? '⟳ Regenerate' : '↻ Generate tasks'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyStateContainer}>
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>AI is analyzing requirements...</p>
            </div>
          </div>
        ) : !hasGenerated ? (
          <div style={styles.emptyStateContainer}>
            <p style={{color: isLightMode ? '#827568' : '#a3a3a3', margin: 0, fontSize: '15px'}}>
              Hit "Generate tasks" to get an automated AI breakdown of this assignment.
            </p>
          </div>
        ) : (
          <div>
            <div style={styles.completionStatusText}>{completedCount} of {totalCount} complete</div>
            <div style={styles.listWrapper}>
              {sortedTasks.map((task) => {
                const isDone = task.status === 'completed';
                const pVal = getSortVal(task.priority);
                const priorityLabel = pVal === 3 ? 'High' : pVal === 2 ? 'Medium' : 'Low';
                const leftBorderColor = pVal === 3 ? '#6366f1' : pVal === 2 ? '#f59e0b' : '#10b981';
                const taskTextColor = isDone ? (isLightMode ? '#a89f91' : '#525252') : (isLightMode ? '#3b3228' : '#e5e7eb');
                let pillBg, pillColor;
                if (pVal === 3) { pillBg = isLightMode ? '#fcdbc4' : '#2d1616'; pillColor = isLightMode ? '#9c2b2e' : '#fca5a5'; }
                else if (pVal === 2) { pillBg = isLightMode ? '#fceac4' : '#2d2216'; pillColor = isLightMode ? '#92400e' : '#fcd34d'; }
                else { pillBg = isLightMode ? '#d1fae5' : '#162d20'; pillColor = isLightMode ? '#065f46' : '#6ee7b7'; }

                return (
                  <div key={task.id || task.description} style={{ ...styles.taskRow, borderLeft: `4px solid ${leftBorderColor}` }}>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" checked={isDone} onChange={() => handleToggleTask(task.id, task.status)} style={styles.checkboxElement} />
                      <span style={{ ...styles.taskText, textDecoration: isDone ? 'line-through' : 'none', color: taskTextColor }}>{task.description}</span>
                    </label>
                    <span style={{ ...styles.priorityPill, color: pillColor, backgroundColor: pillBg }}>{priorityLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const getStyles = (isLight) => ({
  container: { maxWidth: '960px', margin: '0 auto', padding: '40px 20px', backgroundColor: isLight ? '#fdf6e3' : '#0a0a0a', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: isLight ? '#3b3228' : '#fff' },
  headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${isLight ? '#e3d8c3' : '#1f1f1f'}`, paddingBottom: '16px', marginBottom: '28px' },
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