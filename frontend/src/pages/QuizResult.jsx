import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getQuizResult, getQuizReview } from "../services/api";
import { celebratePass } from "../components/ConfettiPass";

function QuizResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [downloadState, setDownloadState] = useState({
    open: false,
    progress: 0,
    status: "downloading",
    fileName: "",
  });

  const celebratedAttemptRef = useRef(null);
  const abortControllerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const cancelRef = useRef(false);

  const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        setError("");

        const id = Number(attemptId);

        if (!Number.isFinite(id)) {
          throw new Error("Invalid quiz attempt ID.");
        }

        const [resultData, reviewData] = await Promise.all([
          getQuizResult(id),
          getQuizReview(id),
        ]);

        setResult(resultData);
        setReview(reviewData);
      } catch (err) {
        console.error("Result loading error:", err);

        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load quiz result."
        );
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      loadResult();
    } else {
      setLoading(false);
      setError("Invalid quiz attempt.");
    }
  }, [attemptId]);

  const passed =
    result?.percentage != null &&
    result?.passing_percentage != null
      ? Number(result.percentage) >= Number(result.passing_percentage)
      : String(result?.result || "").toUpperCase() === "PASS";

  useEffect(() => {
    if (!result || !passed) {
      return;
    }

    if (celebratedAttemptRef.current === String(attemptId)) {
      return;
    }

    celebratedAttemptRef.current = String(attemptId);
    celebratePass();
  }, [result, passed, attemptId]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const resetDownloadState = () => {
    setDownloadState({
      open: false,
      progress: 0,
      status: "downloading",
      fileName: "",
    });
  };

  const closeDownloadAlert = () => {
    if (downloadState.status === "completed") {
      resetDownloadState();
      return;
    }

    cancelRef.current = true;

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setDownloadState((previous) => ({
      ...previous,
      open: false,
      status: "cancelled",
    }));
  };

  const handleDownloadCertificate = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError(
        "Your login session has expired. Please login again."
      );

      navigate("/login", {
        replace: true,
      });

      return;
    }

    if (!attemptId) {
      setError("Invalid quiz attempt.");
      return;
    }

    if (!result) {
      setError("Quiz result is not available.");
      return;
    }

    const resultPercentage = Number(result?.percentage);
    const requiredPercentage = Number(result?.passing_percentage);

    const attemptPassed =
      Number.isFinite(resultPercentage) &&
      Number.isFinite(requiredPercentage)
        ? resultPercentage >= requiredPercentage
        : String(result?.result || "").toUpperCase() === "PASS";

    if (!attemptPassed) {
      setError(
        `Certificate is available only after passing the quiz. Your score is ${Number.isFinite(resultPercentage) ? resultPercentage : 0}% and ${Number.isFinite(requiredPercentage) ? requiredPercentage : 0}% is required.`
      );
      return;
    }

    if (downloadState.open) {
      return;
    }

    cancelRef.current = false;

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    abortControllerRef.current = new AbortController();

    const fileName = `certificate_${attemptId}.pdf`;

    setDownloadState({
      open: true,
      progress: 0,
      status: "downloading",
      fileName,
    });

    let simulatedProgress = 0;

    progressTimerRef.current = setInterval(() => {
      if (cancelRef.current) {
        return;
      }

      simulatedProgress = Math.min(
        simulatedProgress + Math.random() * 7,
        90
      );

      setDownloadState((previous) => ({
        ...previous,
        progress: Math.round(
          Math.max(previous.progress, simulatedProgress)
        ),
      }));
    }, 250);

    try {
      const response = await axios.get(
        `${API_URL}/api/v1/certificates/${attemptId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
          signal: abortControllerRef.current.signal,
          onDownloadProgress: (event) => {
            if (event.lengthComputable && event.total > 0) {
              const percent = Math.min(
                100,
                Math.round((event.loaded / event.total) * 100)
              );

              setDownloadState((previous) => ({
                ...previous,
                progress: Math.max(
                  previous.progress,
                  percent
                ),
              }));
            }
          },
        }
      );

      if (cancelRef.current) {
        return;
      }

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      if (response.status !== 200) {
        throw new Error(
          `Certificate download failed with status ${response.status}`
        );
      }

      setDownloadState((previous) => ({
        ...previous,
        progress: 100,
        status: "completed",
      }));

      await new Promise((resolve) =>
        setTimeout(resolve, 600)
      );

      if (cancelRef.current) {
        return;
      }

      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setTimeout(() => {
        resetDownloadState();
      }, 1200);
    } catch (err) {
      if (
        err?.code === "ERR_CANCELED" ||
        err?.name === "CanceledError" ||
        cancelRef.current
      ) {
        return;
      }

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      console.error("Certificate download error:", err);

      let backendMessage = "";

      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();

          if (text) {
            const parsed = JSON.parse(text);

            if (typeof parsed?.detail === "string") {
              backendMessage = parsed.detail;
            } else if (parsed?.detail?.reason) {
              backendMessage = parsed.detail.reason;
            } else if (parsed?.detail?.message) {
              backendMessage = parsed.detail.message;
            }
          }
        } catch {
          backendMessage = "";
        }
      }

      if (err?.response?.status === 401) {
        setError(
          "Your login session has expired. Please login again."
        );

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });
      } else if (err?.response?.status === 403) {
        setError(
          backendMessage ||
            "Certificate is not available for this quiz attempt."
        );
      } else if (err?.response?.status === 404) {
        setError(
          backendMessage ||
            "Certificate could not be found."
        );
      } else {
        setError(
          backendMessage ||
            "Unable to download certificate."
        );
      }

      setDownloadState({
        open: true,
        progress: 0,
        status: "error",
        fileName: "Certificate",
      });

      setTimeout(() => {
        resetDownloadState();
      }, 2500);
    } finally {
      abortControllerRef.current = null;

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 max-w-6xl items-center px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                Q
              </div>

              <div>
                <h1 className="font-bold text-slate-900">
                  QuizMaster
                </h1>

                <p className="text-xs text-slate-500">
                  Quiz Result
                </p>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-5 text-slate-500">
              Calculating your result...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                Q
              </div>

              <div className="min-w-0">
                <h1 className="font-bold text-slate-900">
                  QuizMaster
                </h1>

                <p className="text-xs text-slate-500">
                  Quiz Result
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </button>
          </div>
        </nav>

        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-red-700">
              Unable to load result
            </h2>

            <p className="mt-3 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {downloadState.open && (
        <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0">
                <svg
                  className="h-12 w-12 -rotate-90"
                  viewBox="0 0 48 48"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-slate-200"
                  />

                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="125.66"
                    strokeDashoffset={
                      125.66 -
                      (125.66 * downloadState.progress) / 100
                    }
                    className={
                      downloadState.status === "error"
                        ? "text-red-500"
                        : downloadState.status === "completed"
                        ? "text-green-500"
                        : "text-blue-600"
                    }
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                  {downloadState.status === "completed"
                    ? "✓"
                    : downloadState.status === "error"
                    ? "!"
                    : `${downloadState.progress}%`}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {downloadState.status === "completed"
                    ? "Download complete"
                    : downloadState.status === "error"
                    ? "Download failed"
                    : "Downloading certificate"}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {downloadState.fileName || "Certificate"}
                </p>
              </div>

              {downloadState.status === "downloading" && (
                <button
                  type="button"
                  onClick={closeDownloadAlert}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}

              {(downloadState.status === "error" ||
                downloadState.status === "completed") && (
                <button
                  type="button"
                  onClick={resetDownloadState}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              )}
            </div>

            {downloadState.status === "downloading" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-200"
                  style={{
                    width: `${downloadState.progress}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              Q
            </div>

            <div className="min-w-0">
              <h1 className="truncate font-bold text-slate-900">
                QuizMaster
              </h1>

              <p className="text-xs text-slate-500">
                Quiz Result
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:py-2.5"
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section
          className={`relative overflow-hidden rounded-3xl border bg-white px-5 py-12 text-center shadow-sm sm:px-10 sm:py-16 ${
            passed
              ? "border-green-200"
              : "border-slate-200"
          }`}
        >
          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue-100 opacity-50 blur-3xl" />

          <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-green-100 opacity-50 blur-3xl" />

          <div className="relative">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl ${
                passed
                  ? "animate-bounce bg-blue-50"
                  : "bg-slate-100"
              }`}
            >
              {passed ? "🎉" : "📚"}
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Quiz Completed
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {passed ? "Congratulations!" : "Quiz Completed!"}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 sm:text-lg">
              {passed
                ? "Excellent work! You successfully passed the quiz."
                : "Great effort! Review your answers below and keep improving."}
            </p>

            <h3 className="mt-5 text-lg font-bold text-slate-800 sm:text-xl">
              {result?.quiz_title || "Quiz"}
            </h3>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="🏆"
            label="Your Score"
            value={`${result?.score ?? 0}/${result?.total_marks ?? 0}`}
          />

          <StatCard
            icon="📈"
            label="Percentage"
            value={`${result?.percentage ?? 0}%`}
          />

          <StatCard
            icon="✅"
            label="Correct"
            value={result?.correct_answers ?? 0}
          />

          <StatCard
            icon="❌"
            label="Incorrect"
            value={result?.incorrect_answers ?? 0}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${
                    passed
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {passed ? "✓" : "!"}
                </span>

                <div>
                  <p className="text-sm text-slate-500">
                    Final Result
                  </p>

                  <p
                    className={`text-2xl font-extrabold ${
                      passed
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {passed ? "PASS" : "FAIL"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Passing percentage:{" "}
                <span className="font-semibold text-slate-700">
                  {result?.passing_percentage ??
                    "Configured by quiz"}
                  {result?.passing_percentage != null
                    ? "%"
                    : ""}
                </span>
              </p>
            </div>

            {passed && (
              <button
                type="button"
                onClick={handleDownloadCertificate}
                disabled={downloadState.open}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                🏆 Download Certificate
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Review Your Answers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              See which answers were correct and which ones need
              improvement.
            </p>
          </div>

          <div className="space-y-5">
            {review?.questions?.length > 0 ? (
              review.questions.map((question, index) => {
                const status = String(
                  question.status || ""
                ).toLowerCase();

                const isCorrect = status === "correct";
                const isIncorrect = status === "incorrect";

                const options = [
                  {
                    key: "A",
                    value: question.option_a,
                  },
                  {
                    key: "B",
                    value: question.option_b,
                  },
                  {
                    key: "C",
                    value: question.option_c,
                  },
                  {
                    key: "D",
                    value: question.option_d,
                  },
                ];

                return (
                  <article
                    key={question.question_id ?? index}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                      isCorrect
                        ? "border-green-200"
                        : isIncorrect
                        ? "border-red-200"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              isCorrect
                                ? "bg-green-100 text-green-700"
                                : isIncorrect
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Question {index + 1}
                            </p>

                            <h3 className="mt-1 text-base font-bold leading-7 text-slate-900 sm:text-lg">
                              {question.question_text}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`self-start rounded-full px-3 py-1 text-xs font-bold ${
                            isCorrect
                              ? "bg-green-100 text-green-700"
                              : isIncorrect
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isCorrect
                            ? "✓ Correct"
                            : isIncorrect
                            ? "✕ Incorrect"
                            : "— Unanswered"}
                        </span>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {options.map((option) => {
                          const selected =
                            String(
                              question.selected_answer || ""
                            ).toUpperCase() === option.key;

                          const correct =
                            String(
                              question.correct_answer || ""
                            ).toUpperCase() === option.key;

                          return (
                            <div
                              key={option.key}
                              className={`rounded-xl border p-4 ${
                                correct
                                  ? "border-green-300 bg-green-50"
                                  : selected
                                  ? "border-red-300 bg-red-50"
                                  : "border-slate-200 bg-slate-50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                    correct
                                      ? "bg-green-600 text-white"
                                      : selected
                                      ? "bg-red-600 text-white"
                                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                                  }`}
                                >
                                  {option.key}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-800">
                                    {option.value || "—"}
                                  </p>

                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {correct && (
                                      <span className="text-xs font-bold text-green-700">
                                        Correct answer
                                      </span>
                                    )}

                                    {selected && !correct && (
                                      <span className="text-xs font-bold text-red-700">
                                        Your answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
                        <span className="text-slate-500">
                          Your answer:{" "}
                          <strong
                            className={
                              isCorrect
                                ? "text-green-600"
                                : isIncorrect
                                ? "text-red-600"
                                : "text-slate-500"
                            }
                          >
                            {question.selected_answer ||
                              "Not answered"}
                          </strong>
                        </span>

                        <span className="text-slate-500">
                          Correct answer:{" "}
                          <strong className="text-green-600">
                            {question.correct_answer || "—"}
                          </strong>
                        </span>

                        <span className="text-slate-500">
                          Marks:{" "}
                          <strong className="text-slate-700">
                            {question.marks ?? 0}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-slate-500">
                  No question review is available for this attempt.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 pb-10 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/quizzes")}
            className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            Take Another Quiz
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:w-auto"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-2xl font-extrabold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

export default QuizResult;