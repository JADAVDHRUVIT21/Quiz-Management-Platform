const API_BASE_URL =
  "http://127.0.0.1:8000/api/v1";


function getToken() {
  return localStorage.getItem("access_token");
}


async function handleResponse(response) {
  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    }

    let message = "Request failed";

    if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item?.msg) {
            const location =
              Array.isArray(item.loc)
                ? item.loc.join(".")
                : "";

            return location
              ? `${location}: ${item.msg}`
              : item.msg;
          }

          return JSON.stringify(item);
        })
        .join(", ");
    } else if (
      typeof data?.detail === "string"
    ) {
      message = data.detail;
    } else if (
      typeof data?.message === "string"
    ) {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}


/* =========================
   AUTH
========================= */

export async function loginUser(
  email,
  password
) {
  const formData =
    new URLSearchParams();

  formData.append(
    "username",
    email
  );

  formData.append(
    "password",
    password
  );

  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: formData,
    }
  );

  return handleResponse(response);
}


export async function registerUser(
  fullName,
  email,
  password
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
      }),
    }
  );

  return handleResponse(response);
}


/* =========================
   QUIZZES
========================= */

export async function getQuizzes() {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/quizzes/`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}


export async function getQuestionsByQuiz(
  quizId
) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/questions/quiz/${quizId}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}


export async function getQuestions(
  quizId
) {
  return getQuestionsByQuiz(
    quizId
  );
}


/* =========================
   QUIZ ATTEMPTS
========================= */

export async function startQuiz(
  quizId
) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/attempts/`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },
      body: JSON.stringify({
        quiz_id: Number(quizId),
      }),
    }
  );

  return handleResponse(response);
}


export async function startQuizAttempt(
  quizId
) {
  return startQuiz(quizId);
}


export async function submitQuiz(
  attemptId
) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/attempts/${attemptId}/submit`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}


export async function submitQuizAttempt(
  attemptId
) {
  return submitQuiz(attemptId);
}


/* =========================
   ANSWERS
========================= */

export async function submitAnswer(
  attemptId,
  questionId,
  selectedAnswer
) {
  const token = getToken();

  const body = {
    attempt_id:
      Number(attemptId),

    question_id:
      Number(questionId),

    selected_answer:
      String(selectedAnswer)
        .trim()
        .toUpperCase(),
  };

  const response = await fetch(
    `${API_BASE_URL}/answers/`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  return handleResponse(response);
}


/* =========================
   RESULTS
========================= */

export async function getQuizResult(
  attemptId
) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/results/${attemptId}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}


export async function getQuizReview(
  attemptId
) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/results/${attemptId}/review`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}


export async function getMyAttempts() {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/attempts/`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}


export async function getResult(
  attemptId
) {
  return getQuizResult(attemptId);
}


/* =========================
   CERTIFICATE
========================= */

export async function getCertificate(
  attemptId
) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/certificate/${attemptId}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
}


export async function downloadCertificate(
  attemptId
) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}/certificate/${attemptId}/download`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message =
      "Unable to download certificate.";

    try {
      const data =
        await response.json();

      if (
        typeof data?.detail ===
        "string"
      ) {
        message = data.detail;
      } else if (
        data?.detail?.message
      ) {
        message =
          data.detail.message;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  const blob =
    await response.blob();

  const url =
    window.URL.createObjectURL(
      blob
    );

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `quiz_certificate_${attemptId}.pdf`;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  window.URL.revokeObjectURL(
    url
  );
}