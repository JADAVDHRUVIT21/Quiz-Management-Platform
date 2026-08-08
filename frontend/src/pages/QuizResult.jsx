import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getQuizResult,
  getQuizReview,
  downloadCertificate,
} from "../services/api";

import { celebratePass } from "../components/ConfettiPass";


function QuizResult() {
  const {
    quizId,
    attemptId,
  } = useParams();

  const navigate = useNavigate();

  const [result, setResult] =
    useState(null);

  const [review, setReview] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [certificateLoading, setCertificateLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Keeps track of which attempt already
   * showed the confetti animation.
   *
   * This prevents the animation from
   * restarting because of React re-renders.
   */
  const celebratedAttemptRef =
    useRef(null);


  /* =========================
     LOAD RESULT
  ========================= */

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        setError("");

        const [
          resultData,
          reviewData,
        ] = await Promise.all([
          getQuizResult(
            Number(attemptId)
          ),

          getQuizReview(
            Number(attemptId)
          ),
        ]);

        setResult(resultData);
        setReview(reviewData);

      } catch (err) {
        console.error(
          "Result loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load quiz result."
        );

      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      loadResult();
    }

  }, [attemptId]);


  /* =========================
     PASS CONFETTI
  ========================= */

  useEffect(() => {
    if (!result) {
      return;
    }

    const passed =
      String(result?.result || "")
        .toUpperCase() === "PASS";

    if (!passed) {
      return;
    }

    /*
     * Only celebrate once for this attempt.
     */
    if (
      celebratedAttemptRef.current ===
      String(attemptId)
    ) {
      return;
    }

    celebratedAttemptRef.current =
      String(attemptId);

    celebratePass();

  }, [result, attemptId]);


  /* =========================
     DOWNLOAD CERTIFICATE
  ========================= */

  const handleDownloadCertificate =
    async () => {
      try {
        setCertificateLoading(true);
        setError("");

        await downloadCertificate(
          Number(attemptId)
        );

      } catch (err) {
        console.error(
          "Certificate download error:",
          err
        );

        setError(
          err.message ||
            "Unable to download certificate."
        );

      } finally {
        setCertificateLoading(false);
      }
    };


  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">

        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">

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


        <main className="mx-auto max-w-5xl px-6 py-16 text-center">

          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-5 text-slate-500">
            Calculating your result...
          </p>

        </main>

      </div>
    );
  }


  /* =========================
     ERROR
  ========================= */

  if (error && !result) {
    return (
      <div className="min-h-screen bg-slate-50">

        <nav className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">

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


            <button
              onClick={() =>
                navigate("/dashboard")
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </button>

          </div>

        </nav>


        <main className="mx-auto max-w-5xl px-6 py-16">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">

            <h2 className="text-xl font-bold text-red-700">
              Unable to load result
            </h2>

            <p className="mt-3 text-red-600">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>

          </div>

        </main>

      </div>
    );
  }


  /* =========================
     PASS / FAIL
  ========================= */

  const passed =
    String(result?.result || "")
      .toUpperCase() === "PASS";


  /* =========================
     MAIN UI
  ========================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =========================
          HEADER
      ========================= */}

      <nav className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">

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


          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Dashboard
          </button>

        </div>

      </nav>


      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* =========================
            RESULT HERO
        ========================= */}

        <section
          className={`relative overflow-hidden rounded-3xl border bg-white px-6 py-12 text-center shadow-sm sm:px-10 ${
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
                  ? "bg-blue-50 animate-bounce"
                  : "bg-slate-100"
              }`}
            >
              {passed
                ? "🎉"
                : "📚"}
            </div>


            <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Quiz Completed
            </p>


            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
              {passed
                ? "Congratulations!"
                : "Quiz Completed!"}
            </h2>


            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">

              {passed
                ? "Excellent work! You successfully passed the quiz."
                : "Great effort! Review your answers below and keep improving."}

            </p>


            <h3 className="mt-5 text-xl font-bold text-slate-800">
              {result?.quiz_title}
            </h3>

          </div>

        </section>


        {/* =========================
            SCORE CARDS
        ========================= */}

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


        {/* =========================
            STATUS + CERTIFICATE
        ========================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                    passed
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {passed
                    ? "✓"
                    : "!"}
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
                    {result?.result}
                  </p>

                </div>

              </div>


              <p className="mt-4 text-sm text-slate-500">

                Passing percentage:{" "}

                <span className="font-semibold text-slate-700">
                  Required percentage configured by quiz
                </span>

              </p>

            </div>


            {passed && (
              <button
                onClick={
                  handleDownloadCertificate
                }
                disabled={
                  certificateLoading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {certificateLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    Preparing Certificate...
                  </>
                ) : (
                  <>
                    🏆 Download Certificate
                  </>
                )}

              </button>
            )}

          </div>

        </section>


        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* =========================
            QUESTION REVIEW
        ========================= */}

        <section className="mt-8">

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-slate-900">
              Review Your Answers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              See which answers were correct and which ones need improvement.
            </p>

          </div>


          <div className="space-y-5">

            {review?.questions?.length > 0 ? (
              review.questions.map(
                (question, index) => {

                  const status =
                    String(
                      question.status || ""
                    ).toLowerCase();

                  const isCorrect =
                    status === "correct";

                  const isIncorrect =
                    status === "incorrect";


                  return (
                    <article
                      key={
                        question.question_id ??
                        index
                      }
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                        isCorrect
                          ? "border-green-200"
                          : isIncorrect
                          ? "border-red-200"
                          : "border-slate-200"
                      }`}
                    >

                      <div className="p-6">

                        {/* QUESTION HEADER */}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

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


                            <div>

                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Question {index + 1}
                              </p>

                              <h3 className="mt-1 text-lg font-bold leading-7 text-slate-900">
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


                        {/* OPTIONS */}

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">

                          {[
                            {
                              key: "A",
                              value:
                                question.option_a,
                            },

                            {
                              key: "B",
                              value:
                                question.option_b,
                            },

                            {
                              key: "C",
                              value:
                                question.option_c,
                            },

                            {
                              key: "D",
                              value:
                                question.option_d,
                            },

                          ].map(
                            (option) => {

                              const selected =
                                String(
                                  question.selected_answer ||
                                  ""
                                ).toUpperCase() ===
                                option.key;


                              const correct =
                                String(
                                  question.correct_answer ||
                                  ""
                                ).toUpperCase() ===
                                option.key;


                              return (
                                <div
                                  key={
                                    option.key
                                  }
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


                                    <div className="flex-1">

                                      <p className="text-sm font-medium text-slate-800">
                                        {option.value}
                                      </p>


                                      <div className="mt-1 flex flex-wrap gap-2">

                                        {correct && (
                                          <span className="text-xs font-bold text-green-700">
                                            Correct answer
                                          </span>
                                        )}


                                        {selected &&
                                          !correct && (
                                            <span className="text-xs font-bold text-red-700">
                                              Your answer
                                            </span>
                                          )}

                                      </div>

                                    </div>

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>


                        {/* ANSWER SUMMARY */}

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
                              {question.correct_answer ||
                                "—"}
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
                }
              )
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">

                <p className="text-slate-500">
                  No question review is available for this attempt.
                </p>

              </div>
            )}

          </div>

        </section>


        {/* =========================
            BOTTOM BUTTONS
        ========================= */}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 pb-10 sm:flex-row">

          <button
            onClick={() =>
              navigate("/quizzes")
            }
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Take Another Quiz
          </button>


          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>

        </div>

      </main>

    </div>
  );
}


/* =========================
   STAT CARD
========================= */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
        {icon}
      </div>


      <div>

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