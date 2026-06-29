import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserBreakdowns, deleteAssignment, updateTaskStatus } from '../api/assignments';
import CalendarView from '../components/CalendarView';

const TEMPLATE_DEMO = {
  id: "demo",
  title: "Example: The Industrial Revolution",
  raw_text: "A 5-page research paper analyzing the economic impacts of the industrial revolution in Europe.",
  due_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
  tasks: [
    { id: "t1", description: "Write thesis statement", status: "pending", priority: 1 },
    { id: "t2", description: "Find 3 sources", status: "pending", priority: 2 },
    { id: "t3", description: "Draft conclusion", status: "completed", priority: 3 }
  ]
};

// Universal helpers for sorting and labeling
const getSortVal = (p) => {
  const pStr = String(p).toLowerCase();
  if (pStr === '3' || pStr === 'high') return 3;
  if (pStr === '2' || pStr === 'medium') return 2;
  if (pStr === '1' || pStr === 'low') return 1;
  return 0;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'light' : true;
  });
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('dashboardViewMode') || 'calendar');
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  const [displayDate, setDisplayDate] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('dashboardViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (projects.length > 0 && projects[0].id === 'demo') {
      localStorage.setItem('demoDashboardTasks', JSON.stringify(projects[0].tasks));
    }
  }, [projects]);

  useEffect(() => {
    document.body.style.backgroundColor = isLightMode ? '#fdf6e3' : '#0a0a0a';
    document.body.style.transition = 'background-color 0.3s ease';
  }, [isLightMode]);

  const loadProjects = async () => {
    const activeUid = user?.uuid;
    try {
      const data = await getUserBreakdowns(activeUid);
      if (!data || data.length === 0) {
        const savedDemoTasks = localStorage.getItem('demoDashboardTasks');
        const demoToUse = savedDemoTasks 
          ? { ...TEMPLATE_DEMO, tasks: JSON.parse(savedDemoTasks) }
          : TEMPLATE_DEMO;
        setProjects([demoToUse]);
      } else {
        setProjects(data);
      }
    } catch (err) {
      setProjects([TEMPLATE_DEMO]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/welcome")
    }
    loadProjects();
  }, [user]);

  const confirmDelete = async () => {
    if (!projectToDelete || projectToDelete === "demo") return;
    try {
      await deleteAssignment(projectToDelete);
      const updated = projects.filter(p => p.id !== projectToDelete);
      setProjects(updated.length === 0 ? [TEMPLATE_DEMO] : updated);
      setProjectToDelete(null);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleToggleTask = async (projectId, taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t) };
    }));

    if (projectId === 'demo') return;

    try {
      await updateTaskStatus(projectId, taskId, newStatus);
    } catch (err) {
      setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: currentStatus } : t) };
      }));
      alert(err.message || "Failed to sync task with server.");
    }
  };

  const formatDashboardDate = (dateInput) => {
    if (!dateInput) return "No date";
    const cleanString = dateInput.split('T')[0]; 
    const date = new Date(cleanString + "T12:00:00");
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toTitleCase = (str) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const styles = getStyles(isLightMode);

  const renderCustomCalendar = () => {
    const currentMonth = displayDate.getMonth();
    const currentYear = displayDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const calendarData = {};
    projects.forEach(p => {
      const dueDate = new Date(p.due_date);
      if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
        const d = dueDate.getDate();
        if (!calendarData[d]) {
          calendarData[d] = [];
        }
        let highestPriority = 1;
        (p.tasks || []).forEach(t => {
          const pVal = getSortVal(t.priority);
          if (pVal > highestPriority) highestPriority = pVal;
        });
        calendarData[d].push({ title: p.title, priority: highestPriority });
      }
    });

    const prevMonth = () => {
      setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1));
    };

    const nextMonth = () => {
      setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1));
    };

    return (
      <div style={styles.calendarCard}>
        <div style={styles.calendarTitleRow}>
          <button style={styles.monthArrow} onClick={prevMonth}>←</button>
          <span style={styles.monthTitle}>
            📅 {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button style={styles.monthArrow} onClick={nextMonth}>→</button>
        </div>
        <div style={styles.calendarWeekHeader}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d}>{d}</div>)}
        </div>
        <div style={styles.calendarGrid}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const data = calendarData[day];
            return (
              <div key={day} style={styles.calendarCell}>
                <span style={styles.cellDayNumber}>{day}</span>
                <div style={styles.indicatorContainer}>
                  {data && data.map((item, index) => {
                    const pVal = item.priority;
                    const color = pVal === 3 ? '#6366f1' : pVal === 2 ? '#f59e0b' : '#10b981';
                    const label = pVal === 3 ? 'High' : pVal === 2 ? 'Medium' : 'Low';
                    return (
                      <div key={index} title={`${item.title} - ${label} Priority`} style={styles.dotHitbox}>
                        <div style={{...styles.colorDot, backgroundColor: color}}></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div style={styles.legendRow}>
          <span style={styles.legendTitle}>Suggested Task Priority:</span>
          <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#6366f1'}}></div> High</div>
          <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#f59e0b'}}></div> Medium</div>
          <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#10b981'}}></div> Low</div>
        </div>
      </div>
    );
  };

  const renderTaskList = () => {
    return (
      <div style={styles.taskListSection}>
        <div style={styles.taskListHeaderRow}>
          <h2 style={styles.taskListHeading}>Tasks</h2>
          <span style={styles.taskListSubtitle}>[ Individual Task Components ]</span>
        </div>

        <div style={styles.taskListStack}>
          {projects.map((project) => {
            const tasks = (project.tasks || []).sort((a, b) => getSortVal(a.priority) - getSortVal(b.priority));
            const total = tasks.length;
            const done = tasks.filter(t => t.status === 'completed').length;
            const progress = total === 0 ? 0 : Math.round((done / total) * 100);
            const displayDate = formatDashboardDate(project.due_date);
            const displayTitle = toTitleCase(project.title);

            return (
              <div key={project.id} style={styles.taskCard}>
                <div style={styles.taskCardHeaderRow}>
                  <h3 style={styles.taskCardTitle}>{displayTitle}</h3>
                  <span style={styles.taskCardDate}>🕐 {displayDate}</span>
                </div>

                <div style={styles.taskCardProgressRow}>
                  <div style={styles.taskCardProgressBg}>
                    <div style={{ ...styles.taskCardProgressFill, width: `${progress}%` }}></div>
                  </div>
                  <span style={styles.taskCardProgressLabel}>{done}/{total}</span>
                </div>

                <div style={styles.taskCardList}>
                  {tasks.map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <label key={task.id} style={styles.taskCardItem}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleTask(project.id, task.id, task.status)}
                          style={styles.taskCardCheckbox}
                        />
                        <span style={{
                          ...styles.taskCardItemText,
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? (isLightMode ? '#a89f91' : '#6b6b6b') : (isLightMode ? '#3b3228' : '#e5e7eb'),
                        }}>
                          {task.description || `Task ${task.id}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      
      {projectToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{marginTop: 0, fontSize: '20px'}}>Delete Assignment?</h3>
            <p style={{color: '#888', marginBottom: '24px', lineHeight: '1.5'}}>
              Are you sure you want to completely delete this assignment and all its generated tasks? This action cannot be undone.
            </p>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button style={styles.cancelBtn} onClick={() => setProjectToDelete(null)}>Cancel</button>
              <button style={styles.confirmDeleteBtn} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.headerContainer}>
        <div>
          <h1 style={styles.headerTitle}>My Projects</h1>
          <p style={styles.subText}>Track and manage your upcoming assignments.</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.viewToggleBtn} onClick={() => setViewMode(viewMode === "grid" ? "calendar" : "grid")}>
            {viewMode === "grid" ? "📅 Calendar View" : "🗂 Grid View"}
          </button>
          {/* <button style={styles.themeToggleBtn} onClick={() => {
            const newMode = !isLightMode;
            localStorage.setItem('theme', newMode ? 'light' : 'dark');
            window.dispatchEvent(new Event('themeChanged'));
            }}>
            {isLightMode ? '☾ Dark' : '☀ Light'}
            </button> */}
          <button style={styles.addBtn} onClick={() => navigate('/submit')}>
            + Add assignment
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: isLightMode ? '#827568' : '#a3a3a3' }}>Loading dashboard components...</div>
      ) : viewMode === "calendar" ? (
        <>
            <CalendarView 
            tasks={projects.flatMap(p => 
                (p.tasks || []).map(t => ({
                ...t,
                projectTitle: p.title, 
                suggested_date: t.suggested_date || p.due_date 
                }))
            )} 
            assignments={projects} 
            isLightMode={isLightMode} 
            />
            {renderTaskList()}
        </>
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => {
             const totalTasks = project.tasks?.length || 0;
             const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
             const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
             
             const displayDate = formatDashboardDate(project.due_date);
             const displayTitle = toTitleCase(project.title);
             const isDemo = project.id === "demo";

             return (
              <div key={project.id} style={styles.card} onClick={() => navigate(`/assignments/${project.id}`)}>
                <div style={styles.cardHeader}>
                  <span style={styles.dateBadge}>Due {displayDate}</span>
                  {isDemo ? (
                    <span style={styles.demoBadge}>Interactive Demo</span>
                  ) : (
                    <button style={styles.deleteInlineBtn} onClick={(e) => { e.stopPropagation(); setProjectToDelete(project.id); }}>
                      ✕
                    </button>
                  )}
                </div>
                <h3 style={styles.cardTitle}>{displayTitle}</h3>
                
                <div style={styles.progressRow}>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${progress}%` }}></div>
                  </div>
                  <span style={styles.progressText}>{progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const getStyles = (isLight) => ({
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, system-ui, sans-serif', color: isLight ? '#3b3228' : '#fff' },
  headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  headerTitle: { fontSize: '28px', margin: '0 0 8px 0', fontWeight: '700' },
  subText: { fontSize: '15px', color: isLight ? '#827568' : '#a3a3a3', margin: 0 },
  headerActions: { display: 'flex', gap: '12px' },
  viewToggleBtn: { backgroundColor: 'transparent', color: '#6366f1', border: '1px solid #6366f1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  themeToggleBtn: { backgroundColor: 'transparent', color: isLight ? '#5a4d3f' : '#a3a3a3', border: `1px solid ${isLight ? '#d6c8b3' : '#232326'}`, padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  addBtn: { backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { backgroundColor: isLight ? '#f4ecd8' : '#141416', border: `1px solid ${isLight ? '#e3d8c3' : '#232326'}`, borderRadius: '12px', padding: '24px', cursor: 'pointer', position: 'relative', transition: 'transform 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  dateBadge: { backgroundColor: isLight ? '#eadecc' : '#272533', color: isLight ? '#6366f1' : '#a78bfa', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px' },
  demoBadge: { backgroundColor: '#fef08a', color: '#854d0e', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  deleteInlineBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', padding: '4px' },
  cardTitle: { fontSize: '18px', margin: '0 0 24px 0', fontWeight: '600', lineHeight: '1.4' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  progressBarBg: { flex: 1, height: '6px', backgroundColor: isLight ? '#e3d8c3' : '#26262b', borderRadius: '3px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: '3px' },
  progressText: { fontSize: '13px', color: isLight ? '#827568' : '#a3a3a3', fontWeight: '600' },
  calendarCard: { backgroundColor: isLight ? '#f4ecd8' : '#1e1e1e', border: `1px solid ${isLight ? '#e3d8c3' : '#2d2d2d'}`, borderRadius: '14px', padding: '28px' },
  calendarTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  monthTitle: { fontSize: '18px', fontWeight: '600' },
  monthArrow: { backgroundColor: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: isLight ? '#827568' : '#a3a3a3' },
  calendarWeekHeader: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '12px', fontWeight: '600', color: isLight ? '#827568' : '#888' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' },
  calendarCell: { height: '90px', backgroundColor: isLight ? '#fdf6e3' : '#26262b', border: `1px solid ${isLight ? '#e3d8c3' : '#3a3a3a'}`, borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  cellDayNumber: { fontSize: '13px', fontWeight: '600', color: isLight ? '#3b3228' : '#a3a3a3' },
  indicatorContainer: { display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'flex-end', height: '100%', justifyContent: 'flex-start' },
  dotHitbox: { padding: '4px', cursor: 'pointer', display: 'inline-flex' },
  colorDot: { width: '10px', height: '10px', borderRadius: '50%' },
  legendRow: { display: 'flex', gap: '24px', marginTop: '24px', fontSize: '14px', justifyContent: 'flex-start', alignItems: 'center' },
  legendTitle: { fontSize: '13px', fontWeight: '600', color: isLight ? '#827568' : '#a3a3a3', marginRight: '8px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', color: isLight ? '#5a4d3f' : '#a3a3a3', fontWeight: '500' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%' },
  taskListSection: { marginTop: '32px' },
  taskListHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' },
  taskListHeading: { fontSize: '20px', fontWeight: '700', margin: 0 },
  taskListSubtitle: { fontSize: '13px', color: isLight ? '#827568' : '#737373' },
  taskListStack: { display: 'flex', flexDirection: 'column', gap: '16px' },
  taskCard: { backgroundColor: isLight ? '#f4ecd8' : '#1e1e1e', border: `1px solid ${isLight ? '#e3d8c3' : '#2d2d2d'}`, borderRadius: '14px', padding: '24px' },
  taskCardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  taskCardTitle: { fontSize: '17px', fontWeight: '700', margin: 0 },
  taskCardDate: { fontSize: '13px', color: isLight ? '#827568' : '#a3a3a3' },
  taskCardProgressRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  taskCardProgressBg: { flex: 1, height: '6px', backgroundColor: isLight ? '#e3d8c3' : '#333', borderRadius: '3px', overflow: 'hidden' },
  taskCardProgressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: '3px' },
  taskCardProgressLabel: { fontSize: '13px', color: isLight ? '#827568' : '#a3a3a3', fontWeight: '600' },
  taskCardList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  taskCardItem: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  taskCardCheckbox: { width: '16px', height: '16px', cursor: 'pointer' },
  taskCardItemText: { fontSize: '14px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: isLight ? '#fff' : '#1e1e1e', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', border: `1px solid ${isLight ? '#e5e7eb' : '#333'}`, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  cancelBtn: { backgroundColor: 'transparent', color: isLight ? '#3b3228' : '#fff', border: `1px solid ${isLight ? '#d1d5db' : '#4b5563'}`, padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  confirmDeleteBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
});