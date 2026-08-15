import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStudentDetails } from "../../services/api";

function StudentDetails() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudentDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getStudentDetails(studentId);
      setData(result);
    } catch (err) {
      console.error("Student details loading error:", err);
      setError(err?.message || "Unable to load student details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadStudentDetails();
    }
  }, [studentId]);

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

  const formatPercentage = (percentage) => {
    if (
      percentage === null ||
      percentage === undefined ||
      percentage === "" ||
      Number.isNaN(Number(percentage))
    ) {
      return "0.00%";
    }

    return `${Number(percentage).toFixed(2)}%`;
  };

  const getAttemptStatus = (attempt) => {
    const status = String(attempt?.status || "").toUpperCase();
    const result = String(attempt?.result || "").toUpperCase();

    if (
      status === "IN_PROGRESS" ||
      status === "STARTED" ||
      status === "ONGOING"
    ) {
      return "IN_PROGRESS";
    }

    if (
      result === "PASS" ||
      result === "PASSED" ||
      result === "PASSING"
    ) {
      return "PASS";
    }

    if (
      result === "FAIL" ||
      result === "FAILED"
    ) {
      return "FAIL";
    }

    if (
      status === "COMPLETED" ||
      status === "SUBMITTED" ||
      status === "FINISHED"
    ) {
      const percentage = Number(
        attempt?.percentage ??
          attempt?.score_percentage ??
          attempt?.percentage_score ??
          0
      );

      const passingPercentage = Number(
        attempt?.passing_percentage ??
          attempt?.quiz_passing_percentage ??
          attempt?.passing_percent ??
          attempt?.quiz?.passing_percentage ??
          0
      );

      if (passingPercentage > 0) {
        return percentage >= passingPercentage
          ? "PASS"
          : "FAIL";
      }

      return "COMPLETED";
    }

    if (
      attempt?.submitted_at ||
      attempt?.completed_at ||
      attempt?.submitted === true ||
      attempt?.is_submitted === true
    ) {
      const percentage = Number(
        attempt?.percentage ??
          attempt?.score_percentage ??
          attempt?.percentage_score ??
          0
      );

      const passingPercentage = Number(
        attempt?.passing_percentage ??
          attempt?.quiz_passing_percentage ??
          attempt?.passing_percent ??
          attempt?.quiz?.passing_percentage ??
          0
      );

      if (passingPercentage > 0) {
        return percentage >= passingPercentage
          ? "PASS"
          : "FAIL";
      }

      return "COMPLETED";
    }

    if (
      attempt?.result !== null &&
      attempt?.result !== undefined &&
      attempt?.result !== ""
    ) {
      return result === "PASS" ||
        result === "PASSED"
        ? "PASS"
        : "FAIL";
    }

    return "IN_PROGRESS";
  };

  const normalizeAttempt = (attempt) => {
    const quiz =
      attempt?.quiz ||
      attempt?.quiz_data ||
      {};

    const score =
      attempt?.score ??
      attempt?.marks_obtained ??
      attempt?.obtained_marks ??
      attempt?.total_score ??
      null;

    const totalMarks =
      attempt?.total_marks ??
      attempt?.max_marks ??
      attempt?.quiz_total_marks ??
      quiz?.total_marks ??
      null;

    let percentage =
      attempt?.percentage ??
      attempt?.score_percentage ??
      attempt?.percentage_score ??
      null;

    if (
      (percentage === null ||
        percentage === undefined) &&
      score !== null &&
      totalMarks !== null &&
      Number(totalMarks) > 0
    ) {
      percentage =
        (Number(score) / Number(totalMarks)) * 100;
    }

    const passingPercentage =
      attempt?.passing_percentage ??
      attempt?.quiz_passing_percentage ??
      attempt?.passing_percent ??
      quiz?.passing_percentage ??
      0;

    const status = getAttemptStatus({
      ...attempt,
      score,
      total_marks: totalMarks,
      percentage,
      passing_percentage: passingPercentage,
      quiz,
    });

    let result = attempt?.result;

    if (!result) {
      if (status === "PASS") {
        result = "PASS";
      } else if (status === "FAIL") {
        result = "FAIL";
      }
    }

    return {
      ...attempt,

      attempt_id:
        attempt?.attempt_id ??
        attempt?.id ??
        attempt?.attemptId,

      quiz_id:
        attempt?.quiz_id ??
        attempt?.quizId ??
        quiz?.id ??
        quiz?.quiz_id,

      quiz_title:
        attempt?.quiz_title ??
        attempt?.quiz_name ??
        quiz?.title ??
        quiz?.name ??
        "Unknown Quiz",

      score,
      total_marks: totalMarks,
      percentage,
      passing_percentage: passingPercentage,
      status,
      result,

      created_at:
        attempt?.created_at ??
        attempt?.started_at ??
        attempt?.submitted_at ??
        attempt?.completed_at,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
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
                  Admin Panel
                </p>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading student details...
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
                  Admin Panel
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/students")
              }
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Students
            </button>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-xl font-bold text-red-700">
              Unable to load student
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const student =
    data?.student ||
    data?.user ||
    data?.student_data ||
    null;

  const rawAttempts =
    Array.isArray(data?.attempts)
      ? data.attempts
      : Array.isArray(data?.data?.attempts)
      ? data.data.attempts
      : [];

  const attempts = rawAttempts.map(
    normalizeAttempt
  );

  const completedAttempts = attempts.filter(
    (attempt) =>
      attempt.status === "PASS" ||
      attempt.status === "FAIL" ||
      attempt.status === "COMPLETED"
  );

  const passedAttempts = attempts.filter(
    (attempt) => attempt.status === "PASS"
  );

  const failedAttempts = attempts.filter(
    (attempt) => attempt.status === "FAIL"
  );

  const calculatedAverage =
    completedAttempts.length > 0
      ? completedAttempts.reduce(
          (sum, attempt) =>
            sum +
            Number(attempt.percentage || 0),
          0
        ) / completedAttempts.length
      : 0;

  const statistics = {
    total_attempts: attempts.length,
    total_completed: completedAttempts.length,
    total_passed: passedAttempts.length,
    total_failed: failedAttempts.length,
    average_percentage: calculatedAverage,
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              Q
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                QuizMaster
              </h1>

              <p className="hidden text-sm text-slate-500 sm:block">
                Admin Panel
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/students")
            }
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Back to Students
          </button>

        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">

        {/* Page Heading */}
        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Student Management
          </p>

          <div className="mt-2">

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Student Details
            </h2>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              View student information and quiz performance.
            </p>

          </div>

        </div>

        {/* Student Information */}
        <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl font-extrabold text-blue-700">
              {(
                student?.full_name ||
                student?.name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h3 className="text-2xl font-extrabold text-slate-900">
                    {student?.full_name ||
                      student?.name ||
                      "Unknown Student"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {student?.email ||
                      "No email"}
                  </p>

                </div>

                <span
                  className={
                    student?.is_active !== false
                      ? "w-fit rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700"
                      : "w-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500"
                  }
                >
                  {student?.is_active !== false
                    ? "Active"
                    : "Inactive"}
                </span>

              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student ID
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    #
                    {student?.id ??
                      student?.student_id ??
                      "N/A"}
                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </p>

                  <p className="mt-1 font-bold capitalize text-slate-900">
                    {student?.role ||
                      "student"}
                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registered
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {formatDate(
                      student?.created_at
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Statistics */}
        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Attempts
            </p>

            <p className="mt-2 text-3xl font-extrabold text-blue-600">
              {statistics.total_attempts}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-extrabold text-purple-600">
              {statistics.total_completed}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Passed
            </p>

            <p className="mt-2 text-3xl font-extrabold text-green-600">
              {statistics.total_passed}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Failed
            </p>

            <p className="mt-2 text-3xl font-extrabold text-red-600">
              {statistics.total_failed}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold text-slate-500">
              Average
            </p>

            <p className="mt-2 text-3xl font-extrabold text-orange-600">
              {formatPercentage(
                statistics.average_percentage
              )}
            </p>
          </div>

        </div>

        {/* Quiz Performance */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

            <h3 className="text-xl font-extrabold text-slate-900">
              Quiz Performance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              All quizzes attempted by this student.
            </p>

          </div>

          {attempts.length === 0 ? (

            <div className="p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                📝
              </div>

              <h4 className="mt-5 text-lg font-bold text-slate-900">
                No quiz attempts
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                This student has not attempted any quizzes yet.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-slate-50">

                  <tr>

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

                  {attempts.map(
                    (attempt, index) => {

                      const status =
                        attempt.status;

                      const attemptKey =
                        attempt.attempt_id ??
                        `${attempt.quiz_id}-${index}`;

                      return (
                        <tr
                          key={attemptKey}
                          className="transition hover:bg-slate-50"
                        >

                          {/* Quiz */}
                          <td className="px-6 py-5">

                            <p className="font-semibold text-slate-900">
                              {attempt.quiz_title ||
                                "Unknown Quiz"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Attempt #
                              {attempt.attempt_id ??
                                "N/A"}
                            </p>

                          </td>

                          {/* Score */}
                          <td className="px-6 py-5">

                            {attempt.score !==
                              null &&
                            attempt.score !==
                              undefined &&
                            attempt.total_marks !==
                              null &&
                            attempt.total_marks !==
                              undefined ? (

                              <p className="font-semibold text-slate-900">
                                {attempt.score} /{" "}
                                {attempt.total_marks}
                              </p>

                            ) : (

                              <span className="text-sm text-slate-400">
                                —
                              </span>

                            )}

                          </td>

                          {/* Percentage */}
                          <td className="px-6 py-5">

                            <p className="font-semibold text-slate-900">
                              {formatPercentage(
                                attempt.percentage
                              )}
                            </p>

                          </td>

                          {/* Status */}
                          <td className="px-6 py-5">

                            {status ===
                            "IN_PROGRESS" ? (

                              <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                                IN PROGRESS
                              </span>

                            ) : status ===
                              "COMPLETED" ? (

                              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                COMPLETED
                              </span>

                            ) : (

                              <span
                                className={
                                  status ===
                                  "PASS"
                                    ? "inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                    : "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                                }
                              >
                                {status ===
                                "PASS"
                                  ? "PASS"
                                  : "FAIL"}
                              </span>

                            )}

                          </td>

                          {/* Date */}
                          <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                            {formatDate(
                              attempt.created_at
                            )}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>
    </div>
  );
}

export default StudentDetails;