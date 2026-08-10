import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizzes, updateQuiz, deleteQuiz } from "../../services/api";

function ManageQuizzes() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getQuizzes();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Manage quizzes error:", err);
      setError(err?.message || "Unable to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const openEdit = (quiz) => {
    setError("");
    setMessage("");

    setEditingQuiz({
      id: quiz.id,
      title: quiz.title || "",
      description: quiz.description || "",
      duration: quiz.duration ?? 30,
      total_marks: quiz.total_marks ?? 0,
      passing_percentage: quiz.passing_percentage ?? 50,
      is_active: quiz.is_active ?? true,
    });
  };

  const closeEdit = () => {
    if (!saving) {
      setEditingQuiz(null);
    }
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;

    setEditingQuiz((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingQuiz) return;

    setError("");
    setMessage("");

    const title = editingQuiz.title.trim();
    const description = editingQuiz.description.trim();

    if (!title) {
      setError("Quiz title is required.");
      return;
    }

    const duration = Number(editingQuiz.duration);
    const totalMarks = Number(editingQuiz.total_marks);
    const passingPercentage = Number(editingQuiz.passing_percentage);

    if (!Number.isFinite(duration) || duration <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }

    if (!Number.isFinite(totalMarks) || totalMarks < 0) {
      setError("Total marks cannot be negative.");
      return;
    }

    if (
      !Number.isFinite(passingPercentage) ||
      passingPercentage < 0 ||
      passingPercentage > 100
    ) {
      setError("Passing percentage must be between 0 and 100.");
      return;
    }

    try {
      setSaving(true);

      const updated = await updateQuiz(editingQuiz.id, {
        title,
        description: description || null,
        duration,
        total_marks: totalMarks,
        passing_percentage: passingPercentage,
        is_active: Boolean(editingQuiz.is_active),
      });

      setQuizzes((previous) =>
        previous.map((quiz) =>
          quiz.id === editingQuiz.id ? updated : quiz
        )
      );

      setEditingQuiz(null);
      setMessage("Quiz updated successfully.");
    } catch (err) {
      console.error("Quiz update error:", err);
      setError(err?.message || "Unable to update quiz.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quiz) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${quiz.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(quiz.id);
      setError("");
      setMessage("");

      await deleteQuiz(quiz.id);

      setQuizzes((previous) =>
        previous.filter((item) => item.id !== quiz.id)
      );

      setMessage("Quiz deleted successfully.");
    } catch (err) {
      console.error("Quiz delete error:", err);
      setError(err?.message || "Unable to delete quiz.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              QuizMaster
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Admin Panel
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Quiz Management
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl">
              Manage Quizzes
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create, edit, activate, deactivate, and delete quizzes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/quizzes/create")}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            Create New Quiz
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-slate-500">
              Loading quizzes...
            </p>
          </div>
        )}

        {!loading && quizzes.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <h3 className="text-xl font-bold text-slate-900">
              No quizzes found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create your first quiz to get started.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/quizzes/create")}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:w-auto"
            >
              Create Quiz
            </button>
          </div>
        )}

        {!loading && quizzes.length > 0 && (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Quiz #{quiz.id}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-extrabold text-slate-900 sm:text-xl">
                      {quiz.title}
                    </h3>
                  </div>

                  <span
                    className={
                      quiz.is_active
                        ? "shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700"
                        : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500"
                    }
                  >
                    {quiz.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">
                  {quiz.description ||
                    "No description provided for this quiz."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Duration
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {quiz.duration} min
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Total Marks
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {quiz.total_marks}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Passing Percentage
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {quiz.passing_percentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => openEdit(quiz)}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    Edit Quiz
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(quiz)}
                    disabled={deletingId === quiz.id}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === quiz.id
                      ? "Deleting..."
                      : "Delete Quiz"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {editingQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-6 sm:py-10">
          <div className="mx-auto flex min-h-full items-start justify-center">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                    Quiz Management
                  </p>

                  <h3 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                    Edit Quiz
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={saving}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Close
                </button>
              </div>

              <form
                onSubmit={handleUpdate}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="edit-title"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Quiz Title
                  </label>

                  <input
                    id="edit-title"
                    name="title"
                    type="text"
                    value={editingQuiz.title}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-description"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="edit-description"
                    name="description"
                    rows={4}
                    value={editingQuiz.description}
                    onChange={handleEditChange}
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="edit-duration"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Duration
                    </label>

                    <input
                      id="edit-duration"
                      name="duration"
                      type="number"
                      min="1"
                      value={editingQuiz.duration}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-total-marks"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Total Marks
                    </label>

                    <input
                      id="edit-total-marks"
                      name="total_marks"
                      type="number"
                      min="0"
                      value={editingQuiz.total_marks}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-passing"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Passing %
                    </label>

                    <input
                      id="edit-passing"
                      name="passing_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={editingQuiz.passing_percentage}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={editingQuiz.is_active}
                    onChange={handleEditChange}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Active Quiz
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Active quizzes are available to students.
                    </p>
                  </div>
                </label>

                <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageQuizzes;