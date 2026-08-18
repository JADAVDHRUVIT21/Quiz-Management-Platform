import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllQuizResultAdmin } from "../../services/api";

function QuizResultAdmin() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllQuizResultAdmin();

      const data =
        response?.results ||
        response?.data?.results ||
        response?.data ||
        response ||
        [];

      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Quiz results loading error:", err);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to load quiz results."
      );
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPercentage = (result) => {
    if (
      result?.percentage !== null &&
      result?.percentage !== undefined &&
      result?.percentage !== ""
    ) {
      const percentage = Number(result.percentage);

      if (!Number.isNaN(percentage)) {
        return percentage.toFixed(2);
      }
    }

    const score = Number(
      result?.score ??
      result?.marks_obtained ??
      result?.obtained_marks ??
      0
    );

    const totalMarks = Number(
      result?.total_marks ??
      result?.max_marks ??
      result?.quiz_total_marks ??
      result?.quiz?.total_marks ??
      0
    );

    if (totalMarks > 0) {
      return ((score / totalMarks) * 100).toFixed(2);
    }

    return "0.00";
  };

  const getStatus = (result) => {
    const status = String(
      result?.result ||
      result?.status ||
      ""
    ).toUpperCase();

    if (
      status === "PASS" ||
      status === "PASSED"
    ) {
      return "PASS";
    }

    if (
      status === "FAIL" ||
      status === "FAILED"
    ) {
      return "FAIL";
    }

    if (
      status === "IN_PROGRESS" ||
      status === "STARTED" ||
      status === "ONGOING"
    ) {
      return "IN_PROGRESS";
    }

    return "COMPLETED";
  };

  const getStudentName = (result) => {
    return (
      result?.student_name ||
      result?.full_name ||
      result?.student?.full_name ||
      result?.user?.full_name ||
      result?.user_name ||
      "Unknown Student"
    );
  };

  const getStudentEmail = (result) => {
    return (
      result?.email ||
      result?.student?.email ||
      result?.user?.email ||
      "No email"
    );
  };

  const getQuizTitle = (result) => {
    return (
      result?.quiz_title ||
      result?.quiz_name ||
      result?.quiz?.title ||
      result?.quiz?.name ||
      "Unknown Quiz"
    );
  };

  const getScore = (result) => {
    const score =
      result?.score ??
      result?.marks_obtained ??
      result?.obtained_marks ??
      0;

    const total =
      result?.total_marks ??
      result?.max_marks ??
      result?.quiz_total_marks ??
      result?.quiz?.total_marks ??
      0;

    return `${score} / ${total}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                Q
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-slate-900">
                  QuizMaster
                </h1>

                <p className="text-sm text-slate-500">
                  Admin Panel
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={goToDashboard}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
            </button>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading quiz results...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                Q
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-slate-900">
                  QuizMaster
                </h1>

                <p className="text-sm text-slate-500">
                  Admin Panel
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={goToDashboard}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
            </button>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-xl font-bold text-red-700">
              Unable to load quiz results
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={loadResults}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={goToDashboard}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const totalResults = results.length;

  const passed = results.filter(
    (item) => getStatus(item) === "PASS"
  ).length;

  const failed = results.filter(
    (item) => getStatus(item) === "FAIL"
  ).length;

  const inProgress = results.filter(
    (item) => getStatus(item) === "IN_PROGRESS"
  ).length;

  const completed = results.filter(
    (item) =>
      getStatus(item) === "PASS" ||
      getStatus(item) === "FAIL" ||
      getStatus(item) === "COMPLETED"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              Q
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-900">
                QuizMaster
              </h1>

              <p className="text-sm text-slate-500">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={goToDashboard}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Assessment Management
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Quiz Results
          </h2>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Monitor student attempts and quiz performance.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Results
            </p>

            <p className="mt-2 text-3xl font-extrabold text-blue-600">
              {totalResults}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-extrabold text-purple-600">
              {completed}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Passed
            </p>

            <p className="mt-2 text-3xl font-extrabold text-green-600">
              {passed}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Failed
            </p>

            <p className="mt-2 text-3xl font-extrabold text-red-600">
              {failed}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-extrabold text-yellow-600">
              {inProgress}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h3 className="text-xl font-extrabold text-slate-900">
              Student Quiz Results
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              All quiz attempts submitted by students.
            </p>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                📊
              </div>

              <h4 className="mt-5 text-lg font-bold text-slate-900">
                No quiz results
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                No student quiz attempts are available yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Student
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Quiz
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Score
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Percentage
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((result, index) => {
                    const status = getStatus(result);

                    const resultKey =
                      result?.attempt_id ??
                      result?.id ??
                      `${result?.student_id}-${result?.quiz_id}-${index}`;

                    return (
                      <tr
                        key={resultKey}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                              {getStudentName(result)
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {getStudentName(result)}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {getStudentEmail(result)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {getQuizTitle(result)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Attempt #
                            {result?.attempt_id ??
                              result?.id ??
                              "N/A"}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {getScore(result)}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {getPercentage(result)}%
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          {status === "PASS" ? (
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                              PASS
                            </span>
                          ) : status === "FAIL" ? (
                            <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                              FAIL
                            </span>
                          ) : status === "IN_PROGRESS" ? (
                            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                              IN PROGRESS
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                              COMPLETED
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                          {formatDate(
                            result?.created_at ??
                            result?.submitted_at ??
                            result?.completed_at
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default QuizResultAdmin;