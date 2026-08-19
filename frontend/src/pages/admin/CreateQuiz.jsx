import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "http://127.0.0.1:8000/api/v1";

function CreateQuiz() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    total_marks: "",
    passing_percentage: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      setError(
        "Admin login session has expired. Please login again."
      );
      navigate("/login");
      return;
    }

    if (!form.title.trim()) {
      setError("Quiz title is required.");
      return;
    }

    const duration = Number(form.duration);

    const totalMarks = Number(form.total_marks);

    const passingPercentage = Number(
      form.passing_percentage
    );

    // Validate duration
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("Duration must be greater than 0 minutes.");
      return;
    }

    // Validate total marks
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
      setError("Total marks must be greater than 0.");
      return;
    }

    // Validate passing percentage
    if (
      !Number.isFinite(passingPercentage) ||
      passingPercentage < 0 ||
      passingPercentage > 100
    ) {
      setError(
        "Passing percentage must be between 0 and 100."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/quizzes/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            duration: duration,
            total_marks: totalMarks,
            passing_percentage: passingPercentage,
            is_active: true,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error(
            data?.detail ||
            "You do not have admin permission."
          );
        }

        if (Array.isArray(data?.detail)) {
          const message = data.detail
            .map((item) => {
              if (typeof item === "string") {
                return item;
              }

              if (item?.msg) {
                const location = Array.isArray(item.loc)
                  ? item.loc.join(".")
                  : "";

                return location
                  ? `${location}: ${item.msg}`
                  : item.msg;
              }

              return JSON.stringify(item);
            })
            .join(", ");

          throw new Error(message);
        }

        throw new Error(
          data?.detail ||
          data?.message ||
          "Unable to create quiz."
        );
      }

      setSuccess("Quiz created successfully.");

      setForm({
        title: "",
        description: "",
        duration: 30,
        total_marks: 100,
        passing_percentage: 50,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(
        err?.message || "Unable to create quiz."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              Q
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                QuizMaster
              </h1>

              <p className="text-xs text-slate-500">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Admin
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Quiz Management
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
            Create New Quiz
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create a quiz that will be available to users
            after questions are added.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Quiz Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter quiz title"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter quiz description"
                rows={5}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="duration"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Duration
              </label>

              <div className="relative">
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  step="1"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  minutes
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="total_marks"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Total Marks
              </label>

              <div className="relative">
                <input
                  id="total_marks"
                  name="total_marks"
                  type="number"
                  min="1"
                  step="1"
                  value={form.total_marks}
                  onChange={handleChange}
                  placeholder="Enter total marks"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  marks
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="passing_percentage"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Passing Percentage
              </label>

              <div className="relative">
                <input
                  id="passing_percentage"
                  name="passing_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.passing_percentage}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  %
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">
                Next step
              </p>

              <p className="mt-1 text-sm text-blue-700">
                After creating the quiz, we will add questions
                and answers to it.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating..."
                  : "Create Quiz"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateQuiz;