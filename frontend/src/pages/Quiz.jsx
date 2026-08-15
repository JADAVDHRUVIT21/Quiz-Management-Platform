import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getQuestionsByQuiz,
  getQuizzes,
  startQuizAttempt,
  submitAnswer,
  submitQuizAttempt,
} from "../services/api";

import { celebratePass } from "../components/ConfettiPass";

function Quiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});

  const [timeLeft, setTimeLeft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];

  const answeredCount = Object.keys(answers).length;

  const progress = useMemo(() => {
    if (!questions.length) {
      return 0;
    }

    return Math.round(
      ((currentIndex + 1) / questions.length) * 100
    );
  }, [currentIndex, questions.length]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) {
      return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // LOAD QUIZ
  
  useEffect(() => {
    let cancelled = false;

    async function loadQuiz() {
      try {
        setLoading(true);
        setError("");

        const [quizList, questionList] = await Promise.all([
          getQuizzes(),
          getQuestionsByQuiz(Number(quizId)),
        ]);

        if (cancelled) {
          return;
        }

        const selectedQuiz = quizList.find(
          (item) => Number(item.id) === Number(quizId)
        );

        if (!selectedQuiz) {
          throw new Error("Quiz not found");
        }

        if (!questionList || questionList.length === 0) {
          throw new Error(
            "This quiz does not have any questions yet."
          );
        }

        setQuiz(selectedQuiz);
        setQuestions(questionList);

        // Start a new quiz attempt
        const attemptData = await startQuizAttempt(
          Number(quizId)
        );

        if (cancelled) {
          return;
        }

        if (!attemptData || !attemptData.id) {
          throw new Error(
            "Unable to create quiz attempt."
          );
        }

        setAttempt(attemptData);

        const durationSeconds =
          Number(selectedQuiz.duration) * 60;

        setTimeLeft(durationSeconds);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Quiz loading error:", err);

        setError(
          err?.message || "Unable to load quiz"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (quizId) {
      loadQuiz();
    }

    return () => {
      cancelled = true;
    };
  }, [quizId]);

  // TIMER
  
  useEffect(() => {
    if (
      timeLeft === null ||
      loading ||
      !attempt?.id
    ) {
      return;
    }

    if (timeLeft <= 0) {
      async function autoSubmit() {
        try {
          setSaving(true);
          setError("");

          const result = await submitQuizAttempt(
            attempt.id
          );

          // Celebrate only if the quiz was passed
          if (
            result &&
            String(result.result).toUpperCase() === "PASS"
          ) {
            celebratePass();
          }

          navigate(
            `/quiz/${quizId}/result/${attempt.id}`
          );
        } catch (err) {
          console.error(
            "Automatic submission error:",
            err
          );

          setError(
            err?.message ||
              "Unable to submit quiz automatically"
          );
        } finally {
          setSaving(false);
        }
      }

      autoSubmit();

      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous === null) {
          return null;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    timeLeft,
    loading,
    attempt,
    navigate,
    quizId,
  ]);

  // SELECT ANSWER
  
  const handleSelectAnswer = (answer) => {
    if (saving || !currentQuestion) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: answer,
    }));
  };

  // SAVE CURRENT ANSWER
  
  const saveCurrentAnswer = async () => {
    if (!currentQuestion || !attempt?.id) {
      return true;
    }

    const selectedAnswer =
      answers[currentQuestion.id];

    // No answer selected
    if (!selectedAnswer) {
      return true;
    }

    // Already submitted
    if (
      submittedAnswers[currentQuestion.id] ===
      selectedAnswer
    ) {
      return true;
    }

    try {
      setSaving(true);

      await submitAnswer(
        attempt.id,
        currentQuestion.id,
        selectedAnswer
      );

      setSubmittedAnswers((previous) => ({
        ...previous,
        [currentQuestion.id]: selectedAnswer,
      }));

      return true;
    } catch (err) {
      console.error(
        "Answer submission error:",
        err
      );

      setError(
        err?.message ||
          "Unable to save your answer"
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  // SUBMIT QUIZ
  
  const finishQuiz = async () => {
    try {
      setSaving(true);
      setError("");

      if (!attempt?.id) {
        throw new Error(
          "Quiz attempt not found"
        );
      }

      const result = await submitQuizAttempt(
        attempt.id
      );

      console.log(
        "Quiz submission result:",
        result
      );

      // CONFETTI ONLY WHEN USER PASSES      

      if (
        result &&
        String(result.result).toUpperCase() === "PASS"
      ) {
        celebratePass();
      }

      navigate(
        `/quiz/${quizId}/result/${attempt.id}`
      );
    } catch (err) {
      console.error(
        "Quiz submission error:",
        err
      );

      setError(
        err?.message ||
          "Unable to submit quiz"
      );
    } finally {
      setSaving(false);
    }
  };

// NEXT  

  const handleNext = async () => {
    if (saving) {
      return;
    }

    setError("");

    const saved = await saveCurrentAnswer();

    if (!saved) {
      return;
    }

    // Go to next question
    if (
      currentIndex <
      questions.length - 1
    ) {
      setCurrentIndex(
        (previous) => previous + 1
      );

      return;
    }

    // Last question -> submit quiz
    await finishQuiz();
  };

// PREVIOUS  

  const handlePrevious = () => {
    if (
      saving ||
      currentIndex === 0
    ) {
      return;
    }

    setError("");

    setCurrentIndex(
      (previous) => previous - 1
    );
  };
  
// QUESTION NAVIGATION

  const handleQuestionNavigation = async (
    index
  ) => {
    if (
      saving ||
      index === currentIndex
    ) {
      return;
    }

    setError("");

    const saved =
      await saveCurrentAnswer();

    if (!saved) {
      return;
    }

    setCurrentIndex(index);
  };
  
// EXIT
  
  const handleExit = () => {
    const confirmed = window.confirm(
      "Are you sure you want to exit this quiz? Your current attempt may remain incomplete."
    );

    if (confirmed) {
      navigate("/dashboard");
    }
  };
  
// LOADING SCREEN  

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
            <div>
              <h1 className="font-bold text-slate-900">
                QuizMaster
              </h1>

              <p className="text-xs text-slate-500">
                Quiz in Progress
              </p>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

            <p className="mt-4 text-slate-500">
              Loading quiz...
            </p>
          </div>
        </main>
      </div>
    );
  }

// ERROR SCREEN
  
  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="font-bold text-slate-900">
                QuizMaster
              </h1>

              <p className="text-xs text-slate-500">
                Quiz
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/dashboard")
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Dashboard
            </button>
          </div>
        </nav>

        <main className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-xl font-bold text-red-700">
              Unable to load quiz
            </h2>

            <p className="mt-2 text-red-600">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // QUIZ SCREEN
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-bold text-slate-900">
              QuizMaster
            </h1>

            <p className="text-xs text-slate-500">
              Quiz in Progress
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* TIMER */}

            <div
              className={`rounded-lg px-4 py-2 text-center ${
                timeLeft <= 60
                  ? "bg-red-50 text-red-600"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <p className="text-xs font-medium">
                Time Remaining
              </p>

              <p className="text-lg font-bold tabular-nums">
                {formatTime(timeLeft)}
              </p>
            </div>

            {/* EXIT */}

            <button
              onClick={handleExit}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Exit Quiz
            </button>
          </div>
        </div>
      </nav>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ===================================================
            QUIZ HEADER
        =================================================== */}

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {quiz?.title}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {quiz?.description}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-medium text-slate-500">
                {answeredCount} of{" "}
                {questions.length} answered
              </p>

              <p className="mt-1 text-sm font-semibold text-blue-600">
                {progress}% Complete
              </p>
            </div>
          </div>

          {/* PROGRESS BAR */}

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* =================================================
              QUESTION SIDEBAR
          ================================================= */}

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                Questions
              </h3>

              <span className="text-xs text-slate-500">
                {questions.length}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {questions.map(
                (question, index) => {
                  const isCurrent =
                    index === currentIndex;

                  const isAnswered =
                    Boolean(
                      answers[question.id]
                    );

                  return (
                    <button
                      key={question.id}
                      onClick={() =>
                        handleQuestionNavigation(
                          index
                        )
                      }
                      disabled={saving}
                      className={`flex h-11 w-full items-center justify-center rounded-lg border text-sm font-semibold transition ${
                        isCurrent
                          ? "border-blue-600 bg-blue-600 text-white"
                          : isAnswered
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                }
              )}
            </div>

            {/* LEGEND */}

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-blue-600"></span>
                Current
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-green-100 ring-1 ring-green-300"></span>
                Answered
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-slate-100 ring-1 ring-slate-200"></span>
                Not answered
              </div>
            </div>
          </aside>

          {/* =================================================
              QUESTION
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Question{" "}
                  {currentIndex + 1} of{" "}
                  {questions.length}
                </p>

                <h3 className="mt-4 text-2xl font-bold leading-relaxed text-slate-900">
                  {currentQuestion.question_text}
                </h3>
              </div>

              <div className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                {currentQuestion.marks}{" "}
                {currentQuestion.marks === 1
                  ? "mark"
                  : "marks"}
              </div>
            </div>

            {/* OPTIONS */}

            <div className="mt-8 space-y-3">
              {[
                {
                  key: "A",
                  value:
                    currentQuestion.option_a,
                },
                {
                  key: "B",
                  value:
                    currentQuestion.option_b,
                },
                {
                  key: "C",
                  value:
                    currentQuestion.option_c,
                },
                {
                  key: "D",
                  value:
                    currentQuestion.option_d,
                },
              ].map((option) => {
                const selected =
                  answers[
                    currentQuestion.id
                  ] === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() =>
                      handleSelectAnswer(
                        option.key
                      )
                    }
                    disabled={saving}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {option.key}
                    </span>

                    <span className="text-base font-medium text-slate-800">
                      {option.value}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* =================================================
                NAVIGATION BUTTONS
            ================================================= */}

            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                onClick={handlePrevious}
                disabled={
                  currentIndex === 0 ||
                  saving
                }
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : currentIndex ===
                    questions.length - 1
                  ? "Submit Quiz"
                  : "Next"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Quiz;