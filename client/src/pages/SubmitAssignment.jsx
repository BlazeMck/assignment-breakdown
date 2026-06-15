import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createBreakdown } from "../api/assignments";
import Button from "../components/Button";

const EMPTY_FORM = {
  details: "",
  dueDate: "",
};

// time_estimate is stored as an integer (1 = Low, 2 = Medium, 3 = High).
const EFFORT = {
  1: { label: "Low", className: "text-green-700 bg-green-100 border-green-200" },
  2: { label: "Medium", className: "text-amber-700 bg-amber-100 border-amber-200" },
  3: { label: "High", className: "text-red-700 bg-red-100 border-red-200" },
};

export default function SubmitAssignment() {
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.details.trim()) {
      next.details = "Assignment details are required.";
    }
    if (!form.dueDate) {
      next.dueDate = "A due date is required.";
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setSubmitError("You must be logged in to submit an assignment.");
      return;
    }

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const data = await createBreakdown({
        user_id: user.uuid,
        raw_text: form.details.trim(),
        due_date: form.dueDate,
      });
      setResult(data);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <header className="flex items-start justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Project · Submit Assignment
          </h1>
          <p className="mt-1 text-sm text-gray-500">[ project name / breadcrumb ]</p>
        </div>
      </header>

      <main className="mt-8">
        <section className="max-w-2xl rounded-xl border border-slate-100 bg-white p-8 shadow-md">
          <h2 className="mb-6 text-xl font-bold text-slate-900">New Assignment</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label htmlFor="details" className="mb-2 block text-sm text-slate-700">
                Assignment details<span className="text-gray-400">*</span>
              </label>
              <textarea
                id="details"
                name="details"
                rows={5}
                placeholder="Paste or describe your assignment..."
                value={form.details}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full resize-y rounded-md border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 ${
                  errors.details ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.details && (
                <span className="mt-1 text-sm text-red-500">{errors.details}</span>
              )}
            </div>

            <div>
              <label htmlFor="dueDate" className="mb-2 block text-sm text-slate-700">
                Due date<span className="text-gray-400">*</span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-md border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 ${
                  errors.dueDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.dueDate && (
                <span className="mt-1 text-sm text-red-500">{errors.dueDate}</span>
              )}
            </div>

            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-100 p-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Breaking down…" : "Submit"}
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 !bg-white !text-slate-700 border border-gray-300 hover:!bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </form>

          {result && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {result.assignment.title}
              </h3>
              <ol className="space-y-3">
                {result.tasks.map((task) => (
                  <li
                    key={task.id ?? task.priority}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="text-slate-700">
                      {task.priority}. {task.description}
                    </span>
                    {EFFORT[task.time_estimate] && (
                      <span
                        className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${EFFORT[task.time_estimate].className}`}
                      >
                        {EFFORT[task.time_estimate].label}
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
