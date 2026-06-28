import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBreakdown, getUserBreakdowns } from "../api/assignments";

const EMPTY_FORM = {
  title: "",
  details: "",
  dueDate: "",
};

export default function SubmitAssignment() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [existingProjects, setExistingProjects] = useState([]); // Added state for limit checking

  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'light' : true;
  });

  useEffect(() => {
    document.body.style.backgroundColor = isLightMode ? '#fdf6e3' : '#0a0a0a';
    document.body.style.transition = 'background-color 0.3s ease';
  }, [isLightMode]);

  // Fetch existing assignments on mount to enforce the 5-assignment limit
  useEffect(() => {
    const fetchProjects = async () => {
      const activeUid = user?.uuid;
      if (activeUid) {
        try {
          const data = await getUserBreakdowns(activeUid);
          setExistingProjects(data || []);
        } catch (err) {
          console.error("Could not fetch assignments for limit check", err);
        }
      }
    };
    fetchProjects();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "A title is required.";
    if (!form.details.trim()) next.details = "Assignment details are required.";
    if (!form.dueDate) next.dueDate = "A due date is required.";
    
    // Limit check: Prevent more than 5 assignments on the same due date
    if (form.dueDate && existingProjects.length > 0) {
      const sameDayAssignments = existingProjects.filter(p => p.due_date && p.due_date.startsWith(form.dueDate));
      if (sameDayAssignments.length >= 5) {
        next.dueDate = "Limit reached: You cannot have more than 5 assignments due on the same day.";
      }
    }

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const activeUid = user?.uuid;

    if (!activeUid) {
      setSubmitError("You must be logged in to submit an assignment.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
        await createBreakdown({
            user_id: activeUid,
            raw_text: form.details,
            due_date: form.dueDate,
            title: form.title
        });
        navigate("/");
    } catch (err) {
        setSubmitError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const styles = getStyles(isLightMode);

  return (
    <div style={styles.container}>
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>

      <div style={styles.headerContainer}>
        <div>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            ← Back to dashboard
          </button>
          <h2 style={styles.headerTitle}>Project • Submit Assignment</h2>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.themeToggleBtn} onClick={() => {
            const newMode = !isLightMode;
            setIsLightMode(newMode);
            localStorage.setItem('theme', newMode ? 'light' : 'dark');
          }} type="button">
            {isLightMode ? '☾ Dark' : '☀ Light'}
          </button>
        </div>
      </div>

      <div style={styles.panelCard}>
        <h3 style={styles.sectionHeading}>NEW ASSIGNMENT</h3>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Assignment Title <span style={styles.asterisk}>*</span></label>
            <input type="text" name="title" placeholder="e.g. History Term Paper" style={{ ...styles.input, borderColor: errors.title ? '#ef4444' : (isLightMode ? '#d6c8b3' : '#26262b') }} value={form.title} onChange={handleChange} disabled={isSubmitting} />
            {errors.title && <span style={styles.errorText}>{errors.title}</span>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Description & Requirements <span style={styles.asterisk}>*</span></label>
            <textarea name="details" placeholder="Paste your professor's prompt..." style={{ ...styles.textarea, borderColor: errors.details ? '#ef4444' : (isLightMode ? '#d6c8b3' : '#26262b') }} value={form.details} onChange={handleChange} disabled={isSubmitting} />
            {errors.details && <span style={styles.errorText}>{errors.details}</span>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Due Date <span style={styles.asterisk}>*</span></label>
            <input type="date" name="dueDate" style={{ ...styles.input, borderColor: errors.dueDate ? '#ef4444' : (isLightMode ? '#d6c8b3' : '#26262b') }} value={form.dueDate} onChange={handleChange} disabled={isSubmitting} />
            {errors.dueDate && <span style={styles.errorText}>{errors.dueDate}</span>}
          </div>

          {submitError && <div style={styles.errorBanner}>{submitError}</div>}

          <div style={styles.submitRow}>
            <button type="button" style={styles.cancelButton} onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</button>
            <button type="submit" style={{...styles.submitButton, opacity: isSubmitting ? 0.7 : 1}} disabled={isSubmitting}>
              {isSubmitting ? (
                 <div style={styles.buttonLoader}><div style={styles.miniSpinner}></div> Breaking down...</div>
              ) : 'Submit & Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const getStyles = (isLight) => ({
  container: { maxWidth: '720px', margin: '0 auto', padding: '40px 20px', backgroundColor: isLight ? '#fdf6e3' : '#0a0a0a', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: isLight ? '#3b3228' : '#fff', transition: 'all 0.3s ease' },
  headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${isLight ? '#e3d8c3' : '#1f1f1f'}`, paddingBottom: '16px', marginBottom: '28px' },
  backButton: { backgroundColor: isLight ? '#eadecc' : '#272533', color: '#6366f1', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', marginBottom: '12px' },
  headerTitle: { fontSize: '22px', margin: 0, fontWeight: '700' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  themeToggleBtn: { backgroundColor: 'transparent', color: isLight ? '#5a4d3f' : '#a3a3a3', border: `1px solid ${isLight ? '#d6c8b3' : '#232326'}`, padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  panelCard: { backgroundColor: isLight ? '#f4ecd8' : '#141416', border: `1px solid ${isLight ? '#e3d8c3' : '#232326'}`, borderRadius: '14px', padding: '32px' },
  sectionHeading: { fontSize: '13px', color: isLight ? '#827568' : '#737373', fontWeight: '700', letterSpacing: '0.05em', margin: '0 0 24px 0' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', color: isLight ? '#5a4d3f' : '#a3a3a3', fontWeight: '600', textTransform: 'uppercase' },
  asterisk: { color: '#ef4444' },
  input: { backgroundColor: isLight ? '#fdf6e3' : '#0a0a0a', color: isLight ? '#3b3228' : '#fff', padding: '14px 16px', borderRadius: '8px', fontSize: '15px', outline: 'none', border: '1px solid transparent' },
  textarea: { backgroundColor: isLight ? '#fdf6e3' : '#0a0a0a', color: isLight ? '#3b3228' : '#fff', padding: '14px 16px', borderRadius: '8px', fontSize: '15px', outline: 'none', minHeight: '140px', resize: 'vertical', border: '1px solid transparent' },
  errorText: { fontSize: '13px', color: '#ef4444', marginTop: '4px' },
  errorBanner: { backgroundColor: '#451a1a', border: '1px solid #7f1d1d', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' },
  submitRow: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' },
  cancelButton: { backgroundColor: 'transparent', color: isLight ? '#5a4d3f' : '#a3a3a3', border: `1px solid ${isLight ? '#d6c8b3' : '#232326'}`, padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  submitButton: { backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center' },
  buttonLoader: { display: 'flex', alignItems: 'center', gap: '8px' },
  miniSpinner: { width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }
});