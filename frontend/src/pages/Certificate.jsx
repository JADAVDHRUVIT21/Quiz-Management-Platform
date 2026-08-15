import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Certificate() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

  // LOAD ALL PASSED CERTIFICATES
  
  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/v1/certificates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(response.data);
    } catch (err) {
      console.error(
        "Certificate loading error:",
        err
      );

      if (err?.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      const message =
        err?.response?.data?.detail ||
        "Unable to load certificates.";

      setError(
        typeof message === "string"
          ? message
          : "Unable to load certificates."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  // DOWNLOAD CERTIFICATE FOR ANY PASSED ATTEMPT
  
  const handleDownloadCertificate = async (
    certificate
  ) => {
    const attemptId =
      certificate?.attempt_id;

    if (!attemptId) {
      setError(
        "Certificate attempt information is missing."
      );
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    if (downloadingId !== null) {
      return;
    }

    try {
      setError("");
      setDownloadingId(attemptId);

      const response =
        await axios.get(
          `${API_URL}/api/v1/certificates/${attemptId}/download`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            responseType: "blob",
          }
        );

      if (response.status !== 200) {
        throw new Error(
          `Certificate download failed with status ${response.status}`
        );
      }

      // CREATE PDF BLOB
      
      const contentType =
        response.headers["content-type"] ||
        "application/pdf";

      const blob = new Blob(
        [response.data],
        {
          type: contentType,
        }
      );
      
      // CREATE DOWNLOAD LINK
      
      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      const quizTitle =
        certificate?.quiz?.title ||
        "quiz";

      const safeQuizTitle =
        quizTitle
          .replace(/[^a-z0-9]/gi, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "");

      link.download =
        `certificate_${safeQuizTitle}_${attemptId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Certificate download error:",
        err
      );

      // AXIOS BLOB ERROR HANDLING
      
      let backendMessage = "";

      if (
        err?.response?.data instanceof Blob
      ) {
        try {
          const text =
            await err.response.data.text();

          if (text) {
            const parsed =
              JSON.parse(text);

            if (
              typeof parsed?.detail ===
              "string"
            ) {
              backendMessage =
                parsed.detail;
            } else if (
              parsed?.detail?.reason
            ) {
              backendMessage =
                parsed.detail.reason;
            } else if (
              parsed?.detail?.message
            ) {
              backendMessage =
                parsed.detail.message;
            }
          }
        } catch {
          backendMessage = "";
        }
      }
      
      // 401
      
      if (
        err?.response?.status === 401
      ) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }
      
      // 403
      
      if (
        err?.response?.status === 403
      ) {
        setError(
          backendMessage ||
            "Certificate is available only for passed quizzes."
        );

        return;
      }
      
      // 404
    
      if (
        err?.response?.status === 404
      ) {
        setError(
          backendMessage ||
            "Certificate could not be found for this quiz attempt."
        );

        return;
      }

      setError(
        backendMessage ||
          "Unable to download certificate. Please try again."
      );
    } finally {
      setDownloadingId(null);
    }
  };
  
  // LOADING
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                Q
              </div>

              <div>
                <h1 className="font-bold text-slate-900">
                  QuizMaster
                </h1>

                <p className="text-xs text-slate-500">
                  My Certificates
                </p>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-5 text-sm text-slate-500">
              Loading your certificates...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ERROR
  
  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                Q
              </div>

              <div>
                <h1 className="font-bold text-slate-900">
                  QuizMaster
                </h1>

                <p className="text-xs text-slate-500">
                  My Certificates
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </button>
          </div>
        </nav>

        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <div className="text-4xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-xl font-bold text-red-700">
              Unable to load certificates
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadCertificates}
              className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const certificates =
    data?.certificates || [];

  // PAGE
  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}
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
                My Certificates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:py-2.5"
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
            Achievement Center
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Your Certificates
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Every quiz you pass is eligible for
            a certificate. You can download
            each certificate separately.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* NO CERTIFICATES */}
        {certificates.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">
              🏆
            </div>

            <h3 className="mt-6 text-2xl font-bold text-slate-900">
              No Certificates Yet
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Pass a quiz to unlock your
              certificate.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/quizzes")
              }
              className="mt-7 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Browse Quizzes
            </button>
          </div>
        ) : (
          /* CERTIFICATE GRID */
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map(
              (certificate) => {
                const quizId =
                  certificate?.quiz?.id;

                const attemptId =
                  certificate?.attempt_id;

                const isDownloading =
                  downloadingId ===
                  attemptId;

                return (
                  <div
                    key={attemptId}
                    className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
                  >
                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                        🏆
                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        PASSED
                      </span>
                    </div>

                    {/* CONTENT */}
                    <div className="mt-6 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Certificate
                      </p>

                      <h3 className="mt-2 text-xl font-extrabold leading-7 text-slate-900">
                        {certificate?.quiz
                          ?.title ||
                          "Quiz Certificate"}
                      </h3>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Score
                          </p>

                          <p className="mt-1 text-lg font-extrabold text-slate-900">
                            {
                              certificate
                                ?.result
                                ?.score
                            }
                            /
                            {
                              certificate
                                ?.result
                                ?.total_marks
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Percentage
                          </p>

                          <p className="mt-1 text-lg font-extrabold text-green-600">
                            {
                              certificate
                                ?.result
                                ?.percentage
                            }
                            %
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        Passing percentage:{" "}
                        <span className="font-semibold text-slate-700">
                          {
                            certificate
                              ?.result
                              ?.passing_percentage
                          }
                          %
                        </span>
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Passed on{" "}
                        <span className="font-semibold text-slate-700">
                          {certificate?.date ||
                            "—"}
                        </span>
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Attempt ID:{" "}
                        {attemptId}
                      </p>
                    </div>

                    {/* BUTTONS */}
                    <div className="mt-7 space-y-3">
                      {/* DOWNLOAD */}
                      <button
                        type="button"
                        disabled={
                          isDownloading
                        }
                        onClick={() =>
                          handleDownloadCertificate(
                            certificate
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDownloading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                            Downloading...
                          </>
                        ) : (
                          <>
                            📥 Download
                            Certificate
                          </>
                        )}
                      </button>

                      {/* VIEW RESULT */}
                      {quizId &&
                        attemptId && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/quiz/${quizId}/result/${attemptId}`
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            View Result
                          </button>
                        )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Certificate;