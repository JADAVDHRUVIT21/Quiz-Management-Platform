import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "import.meta.env.VITE_API_URL";

function ManageQuestions() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [questions, setQuestions] = useState([]);

  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    marks: 1,
  });

  const getToken = () => localStorage.getItem("access_token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  });

  // Load quizzes
  const loadQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/quizzes/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load quizzes."
        );
      }

      setQuizzes(data || []);
    } catch (err) {
      setError(err.message || "Unable to load quizzes.");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Load questions for selected quiz
  const loadQuestions = async (quizId) => {
    if (!quizId) {
      setQuestions([]);
      return;
    }

    try {
      setLoadingQuestions(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/questions/quiz/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load questions."
        );
      }

      setQuestions(data || []);
    } catch (err) {
      setError(err.message || "Unable to load questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleQuizChange = async (event) => {
    const quizId = event.target.value;

    setSelectedQuiz(quizId);
    setSuccess("");
    setError("");

    await loadQuestions(quizId);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      marks: 1,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedQuiz) {
      setError("Please select a quiz first.");
      return;
    }

    if (!form.question_text.trim()) {
      setError("Question text is required.");
      return;
    }

    if (!form.option_a.trim()) {
      setError("Option A is required.");
      return;
    }

    if (!form.option_b.trim()) {
      setError("Option B is required.");
      return;
    }

    if (!form.option_c.trim()) {
      setError("Option C is required.");
      return;
    }

    if (!form.option_d.trim()) {
      setError("Option D is required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/questions/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          quiz_id: Number(selectedQuiz),
          question_text: form.question_text.trim(),
          option_a: form.option_a.trim(),
          option_b: form.option_b.trim(),
          option_c: form.option_c.trim(),
          option_d: form.option_d.trim(),
          correct_answer: form.correct_answer,
          marks: Number(form.marks),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        throw new Error(
          data?.detail || "Unable to create question."
        );
      }

      setSuccess("Question added successfully.");

      resetForm();

      await loadQuestions(selectedQuiz);
    } catch (err) {
      setError(
        err.message || "Unable to create question."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              QuizMaster
            </h1>

            <p className="text-xs text-slate-500">
              Admin Panel
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Question Management
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Manage Questions
          </h2>

          <p className="mt-2 text-slate-500">
            Select a quiz and add questions that students will answer.
          </p>
        </div>

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

        {/* Quiz Selection */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select Quiz
          </label>

          {loadingQuizzes ? (
            <p className="text-sm text-slate-500">
              Loading quizzes...
            </p>
          ) : (
            <select
              value={selectedQuiz}
              onChange={handleQuizChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select a quiz
              </option>

              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedQuiz && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Add Question */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">
                Add Question
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add a multiple-choice question to the selected quiz.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Question
                  </label>

                  <textarea
                    name="question_text"
                    value={form.question_text}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter question"
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {["a", "b", "c", "d"].map((letter) => (
                  <div key={letter}>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Option {letter.toUpperCase()}
                    </label>

                    <input
                      type="text"
                      name={`option_${letter}`}
                      value={form[`option_${letter}`]}
                      onChange={handleChange}
                      placeholder={`Enter option ${letter.toUpperCase()}`}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ))}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Correct Answer
                  </label>

                  <select
                    name="correct_answer"
                    value={form.correct_answer}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Marks
                  </label>

                  <input
                    type="number"
                    name="marks"
                    min="1"
                    value={form.marks}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Add Question
                </button>
              </form>
            </div>

            {/* Existing Questions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">
                Existing Questions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Questions already added to this quiz.
              </p>

              {loadingQuestions ? (
                <div className="mt-6 text-center text-sm text-slate-500">
                  Loading questions...
                </div>
              ) : questions.length === 0 ? (
                <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center">
                  <p className="font-semibold text-slate-700">
                    No questions yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Add the first question using the form.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-sm font-bold text-slate-900">
                        Question {index + 1}
                      </p>

                      <p className="mt-2 text-sm text-slate-700">
                        {question.question_text}
                      </p>

                      <div className="mt-3 grid gap-2 text-sm">
                        <p>A. {question.option_a}</p>
                        <p>B. {question.option_b}</p>
                        <p>C. {question.option_c}</p>
                        <p>D. {question.option_d}</p>
                      </div>

                      <div className="mt-3 flex gap-4 text-xs font-semibold">
                        <span className="text-green-600">
                          Correct: {question.correct_answer}
                        </span>

                        <span className="text-slate-500">
                          Marks: {question.marks}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ManageQuestions;