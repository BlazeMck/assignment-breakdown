import React, { useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addDays, addMonths, subMonths, isSameMonth, isSameDay 
} from 'date-fns';

const getDotColor = (p) => {
  const val = Number(p);
  if (val === 3) return '#6366f1'; // High
  if (val === 2) return '#f59e0b'; // Medium
  return '#10b981'; // Low
};

const getLabel = (p) => {
  const val = Number(p);
  if (val === 3) return 'High';
  if (val === 2) return 'Medium';
  return 'Low';
};

export default function CalendarView({ tasks, assignments, isLightMode }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const tasksByDate = {};
  (tasks || []).forEach(t => {
    if (t.suggested_date) {
      const dateKey = t.suggested_date.split('T')[0];
      if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
      tasksByDate[dateKey].push(t);
    }
  });

  const duesByDate = {};
  (assignments || []).forEach(a => {
    if (a.due_date) {
      const dateKey = a.due_date.split('T')[0];
      if (!duesByDate[dateKey]) duesByDate[dateKey] = [];
      duesByDate[dateKey].push({ title: a.title, due_date: a.due_date });
    }
  });

  const renderHeader = () => (
    <div style={styles.headerRow(isLightMode)}>
      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.arrowBtn(isLightMode)}>←</button>
      <span style={styles.monthTitle(isLightMode)}>📅 {format(currentMonth, 'MMMM yyyy')}</span>
      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.arrowBtn(isLightMode)}>→</button>
    </div>
  );

  const renderDays = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <div style={styles.weekRow}>
        {days.map(d => <div key={d} style={styles.dayHeader(isLightMode)}>{d}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayTasks = tasksByDate[dateKey] || [];
        const dayDues = duesByDate[dateKey] || [];
        const isToday = isSameDay(day, new Date());
        
        days.push(
          <div key={dateKey} style={styles.cell(isLightMode, isToday)}>
            <span style={styles.dateNumber(isLightMode, isSameMonth(day, monthStart), isToday)}>
              {format(day, 'd')}
            </span>
            
            <div style={styles.bottomRowContainer}>
              <div style={styles.dotContainer}>
                {dayTasks.map((task, idx) => (
                  <div key={idx} className="dot-wrapper" style={styles.dotWrapper}>
                    <div style={{ ...styles.dot, backgroundColor: getDotColor(task.priority) }}></div>
                    <div className="tooltip-box" style={styles.tooltipBox(isLightMode)}>
                      <span style={styles.tooltipProject}>{task.projectTitle || 'Assignment'}</span>
                      <span><strong style={{ color: getDotColor(task.priority) }}>{getLabel(task.priority)}</strong> · {task.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              {dayDues.length > 0 && (
                <div className="due-icon-wrapper" style={styles.dueIconWrapper}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                    <line x1="4" y1="22" x2="4" y2="15"></line>
                  </svg>
                  <div className="tooltip-box" style={styles.tooltipBox(isLightMode, true)}>
                    <div style={styles.tooltipHeading}>Due on this day:</div>
                    {dayDues.slice(0, 5).map((assignment, idx) => (
                      <div key={idx} style={styles.tooltipListItem}>
                        {idx + 1}. {assignment.title}
                      </div>
                    ))}
                    {dayDues.length > 5 && (
                      <div style={styles.tooltipMore}>+ {dayDues.length - 5} more assignments</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={day} style={styles.weekRow}>{days}</div>);
      days = [];
    }
    return rows;
  };

  return (
    <div style={styles.calendarWrapper(isLightMode)}>
      <style>
        {`
          .dot-wrapper:hover .tooltip-box, .due-icon-wrapper:hover .tooltip-box {
            visibility: visible !important;
            opacity: 1 !important;
          }
        `}
      </style>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      <div style={styles.legendRow}>
        <span style={styles.legendTitle(isLightMode)}>Task Priority:</span>
        <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#6366f1'}}></div> High</div>
        <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#f59e0b'}}></div> Medium</div>
        <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#10b981'}}></div> Low</div>
        <div style={{...styles.legendItem, marginLeft: '12px'}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
          Due Date
        </div>
      </div>
    </div>
  );
}

const styles = {
  calendarWrapper: (isLight) => ({
    backgroundColor: isLight ? '#f4ecd8' : '#1e1e1e',
    border: `1px solid ${isLight ? '#e3d8c3' : '#2d2d2d'}`,
    borderRadius: '14px',
    padding: '24px',
    fontFamily: 'Inter, system-ui, sans-serif',
  }),
  headerRow: (isLight) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'
  }),
  arrowBtn: (isLight) => ({
    backgroundColor: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: isLight ? '#827568' : '#a3a3a3', fontWeight: 'bold'
  }),
  monthTitle: (isLight) => ({
    fontSize: '18px', fontWeight: '600', color: isLight ? '#3b3228' : '#fff'
  }),
  weekRow: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
  },
  dayHeader: (isLight) => ({
    textAlign: 'center', padding: '8px 0', fontSize: '12px', fontWeight: '600', color: isLight ? '#827568' : '#888'
  }),
  cell: (isLight, isToday) => ({
    minHeight: '90px',
    backgroundColor: isToday ? (isLight ? '#eadecc' : '#312e81') : (isLight ? '#fdf6e3' : '#26262b'),
    border: `1px solid ${isLight ? '#e3d8c3' : '#3a3a3a'}`,
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'visible'
  }),
  dateNumber: (isLight, isCurrentMonth, isToday) => ({
    fontSize: '12px', 
    fontWeight: isToday ? '800' : '600', 
    color: isToday ? (isLight ? '#6366f1' : '#a5b4fc') : (isCurrentMonth ? (isLight ? '#3b3228' : '#e5e7eb') : (isLight ? '#c4b8a6' : '#525252')), 
    marginBottom: '2px'
  }),
  bottomRowContainer: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '6px',
    width: '100%',
    position: 'relative',
    overflow: 'visible'
  },
  dotContainer: {
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '4px', 
    flex: 1,
    justifyContent: 'flex-start'
  },
  dotWrapper: {
    position: 'relative', display: 'inline-flex', cursor: 'pointer'
  },
  dot: {
    width: '10px', height: '10px', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  dueIconWrapper: {
    position: 'relative',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    overflow: 'visible'
  },
  tooltipBox: (isLight, isDue = false) => ({
    visibility: 'hidden', opacity: 0, transition: 'opacity 0.2s ease',
    position: 'absolute', 
    bottom: '120%', 
    left: '50%', transform: 'translateX(-50%)',
    backgroundColor: isLight ? '#fff' : '#141416', color: isLight ? '#3b3228' : '#fff',
    padding: '10px 14px', borderRadius: '8px', fontSize: '12px', width: '200px',
    border: `1px solid ${isLight ? '#d6c8b3' : '#444'}`, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 50, textAlign: 'left', pointerEvents: 'none',
    display: 'flex', flexDirection: 'column', gap: '4px'
  }),
  tooltipProject: {
    fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.7, marginBottom: '2px'
  },
  tooltipHeading: {
    fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', borderBottom: `1px solid rgba(150,150,150,0.3)`, paddingBottom: '4px'
  },
  tooltipListItem: {
    fontSize: '13px', lineHeight: '1.5', padding: '6px 0', borderBottom: '1px solid rgba(150,150,150,0.2)' 
  },
  tooltipMore: {
    fontSize: '11px', opacity: 0.7, marginTop: '4px', fontStyle: 'italic'
  },
  legendRow: {
    display: 'flex', gap: '16px', marginTop: '20px', fontSize: '12px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap'
  },
  legendTitle: (isLight) => ({
    color: isLight ? '#827568' : '#a3a3a3', fontWeight: '600'
  }),
  legendItem: {
    display: 'flex', alignItems: 'center', gap: '6px', color: '#827568', fontWeight: '500'
  },
  legendDot: {
    width: '8px', height: '8px', borderRadius: '50%'
  }
};