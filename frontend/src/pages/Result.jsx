import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyAttempts,
  getQuizResult,
} from "../services/api";

function Results() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        const attempts = await getMyAttempts();

        if (!attempts || attempts.length === 0) {
          setResults([]);
          return;
        }

        const completedResults = await Promise.all(
          attempts.map(async (attempt) => {
            try {
              const result = await getQuizResult(
                attempt.id
              );

              return {
                ...result,
                created_at: attempt.created_at,
              };
            } catch (err) {
              console.error(
                `Unable to load result for attempt ${attempt.id}:`,
                err
              );

              return null;
            }
          })
        );

        setResults(
          completedResults.filter(
            (result) => result !== null
          )
        );
      } catch (err) {
        console.error(
          "Results loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load your quiz results."
        );
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">

        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-20 max-w-7xl items-center px-6">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                Q
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  QuizMaster
                </h1>

                <p className="text-sm text-slate-500">
                  Quiz Management Platform
                </p>
              </div>

            </div>

          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-12">

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-slate-500">
              Loading your results...
            </p>

          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <nav className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              Q
            </div>

            <div>

              <h1 className="text-xl font-bold text-slate-900">
                QuizMaster
              </h1>

              <p className="text-sm text-slate-500">
                Quiz Management Platform
              </p>

            </div>

          </div>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Dashboard
          </button>

        </div>

      </nav>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-8">

          <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
            My Results
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-slate-900">
            Quiz Results
          </h2>

          <p className="mt-3 text-lg text-slate-500">
            View your completed quizzes and performance.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* NO RESULTS */}

        {!error &&
          results.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                📊
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                No quiz results yet
              </h3>

              <p className="mt-2 text-slate-500">
                Complete a quiz to see your result here.
              </p>

              <button
                onClick={() =>
                  navigate("/quizzes")
                }
                className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                View Quizzes
              </button>

            </div>
          )}

        {/* RESULTS TABLE */}

        {results.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Quiz
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Score
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Percentage
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {results.map((result) => {

                    const passed =
                      result.result === "PASS";

                    return (
                      <tr
                        key={result.attempt_id}
                        className="transition hover:bg-slate-50"
                      >

                        {/* QUIZ */}

                        <td className="px-6 py-5">

                          <p className="font-semibold text-slate-900">
                            {result.quiz_title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Attempt #
                            {result.attempt_id}
                          </p>

                        </td>

                        {/* SCORE */}

                        <td className="px-6 py-5">

                          <p className="font-semibold text-slate-900">
                            {result.score} /{" "}
                            {result.total_marks}
                          </p>

                        </td>

                        {/* PERCENTAGE */}

                        <td className="px-6 py-5">

                          <p className="font-semibold text-slate-900">
                            {result.percentage}%
                          </p>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              passed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {passed
                              ? "PASS"
                              : "FAIL"}
                          </span>

                        </td>

                        {/* DATE */}

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {formatDate(
                            result.created_at
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5 text-right">

                          <button
                            onClick={() =>
                              navigate(
                                `/quiz/${result.quiz_id}/result/${result.attempt_id}`
                              )
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            View Result
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}

export default Results;