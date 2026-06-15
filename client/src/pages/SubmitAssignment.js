import { useState } from 'react';
import { breakdownAssignment } from '../api/assignments';
import './SubmitAssignment.css';

const EMPTY_FORM = {
  details: '',
  dueDate: '',
};

function SubmitAssignment({ projectName = 'project name / breadcrumb', onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.details.trim()) {
      nextErrors.details = 'Assignment details are required.';
    }
    if (!form.dueDate) {
      nextErrors.dueDate = 'A due date is required.';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const assignment = {
      rawText: form.details.trim(),
      dueDate: form.dueDate,
    };

    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const breakdown = await breakdownAssignment(assignment);
      setResult(breakdown);
      onSubmit?.(assignment, breakdown);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    setResult(null);
    onCancel?.();
  };

  return (
    <div className="submit-page">
      <header className="submit-page__header">
        <div className="submit-page__heading">
          <h1 className="submit-page__title">Project · Submit Assignment</h1>
          <p className="submit-page__breadcrumb">[ {projectName} ]</p>
        </div>
        <button type="button" className="btn btn--add">
          + Add assignment
        </button>
      </header>

      <main className="submit-page__body">
        <section className="card" aria-labelledby="new-assignment-heading">
          <h2 id="new-assignment-heading" className="card__title">
            New Assignment
          </h2>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="form__field">
              <label className="form__label" htmlFor="details">
                Assignment details<span className="form__required">*</span>
              </label>
              <textarea
                id="details"
                name="details"
                className="form__textarea"
                placeholder="Paste or describe your assignment..."
                rows={5}
                value={form.details}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.details)}
              />
              {errors.details && <p className="form__error">{errors.details}</p>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="dueDate">
                Due date<span className="form__required">*</span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className="form__input"
                value={form.dueDate}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.dueDate)}
              />
              {errors.dueDate && <p className="form__error">{errors.dueDate}</p>}
            </div>

            {submitError && (
              <p className="form__error form__error--banner" role="alert">
                {submitError}
              </p>
            )}

            <div className="form__actions">
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Breaking down…' : 'Submit'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>

          {result && (
            <div className="breakdown" aria-live="polite">
              <h3 className="breakdown__title">{result.title}</h3>
              <ol className="breakdown__list">
                {result.tasks.map((task) => (
                  <li key={task.priority} className="breakdown__item">
                    <span className="breakdown__desc">{task.description}</span>
                    {task.time_estimate && (
                      <span
                        className={`breakdown__effort breakdown__effort--${task.time_estimate.toLowerCase()}`}
                      >
                        {task.time_estimate}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SubmitAssignment;
