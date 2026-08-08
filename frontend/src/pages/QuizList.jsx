import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizzes } from "../services/api";

function QuizList() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getQuizzes();

      setQuizzes(data);
    } catch (err) {
      console.error("Quiz loading error:", err);
      setError(err.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleStartQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              Q
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                QuizMaster
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Quiz Management Platform
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Available Quizzes
          </h2>

          <p className="mt-2 text-slate-500">
            Choose a quiz and test your knowledge.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading quizzes...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="font-semibold text-red-700">
              Unable to load quizzes
            </h3>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadQuizzes}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No quizzes available
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              There are currently no active quizzes.
            </p>
          </div>
        )}

        {!loading && !error && quizzes.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes
              .filter((quiz) => quiz.is_active)
              .map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl">
                    📝
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {quiz.title}
                  </h3>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                    {quiz.description ||
                      "Test your knowledge with this quiz."}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Duration
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {quiz.duration} min
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Total Marks
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {quiz.total_marks}
                      </p>
                    </div>

                    <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Passing Percentage
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {quiz.passing_percentage}%
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                  >
                    Start Quiz
                  </button>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizList;