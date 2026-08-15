const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "http://127.0.0.1:8000/api/v1";

function getToken() {
  return localStorage.getItem("access_token");
}

function authHeaders() {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function handleResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  }

  if (!response.ok) {
    let data = null;

    try {
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch {
      data = null;
    }

    let message = "Request failed";

    if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item?.msg) {
            const location = Array.isArray(item.loc)
              ? item.loc.join(".")
              : "";

            return location
              ? `${location}: ${item.msg}`
              : item.msg;
          }

          return JSON.stringify(item);
        })
        .join(", ");
    } else if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (
      data?.detail &&
      typeof data.detail === "object"
    ) {
      message =
        data.detail.message ||
        data.detail.reason ||
        "Request failed";
    } else if (typeof data?.message === "string") {
      message = data.message;
    } else if (
      typeof data === "string" &&
      data.trim()
    ) {
      message = data;
    } else if (response.statusText) {
      message = response.statusText;
    }

    const error = new Error(message);
    error.status = response.status;
    error.response = response;

    throw error;
  }

  if (contentType.includes("application/pdf")) {
    return response.blob();
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const isFormData =
    options.body instanceof FormData;

  const headers = {
    ...authHeaders(),
    ...(isFormData
      ? {}
      : {
          "Content-Type": "application/json",
        }),
    ...(options.headers || {}),
  };

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  return handleResponse(response);
}

export async function loginUser(email, password) {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

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
        "Content-Type": "application/json",
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

export async function getQuizzes() {
  const response = await fetch(
    `${API_BASE_URL}/quizzes/`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function createQuiz(quizData) {
  const response = await fetch(
    `${API_BASE_URL}/quizzes/`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: quizData.title,
        description: quizData.description,
        duration: Number(quizData.duration),
        total_marks: Number(quizData.total_marks),
        passing_percentage: Number(
          quizData.passing_percentage
        ),
        is_active:
          quizData.is_active !== undefined
            ? quizData.is_active
            : true,
      }),
    }
  );

  return handleResponse(response);
}

export async function updateQuiz(
  quizId,
  quizData
) {
  const response = await fetch(
    `${API_BASE_URL}/quizzes/${quizId}`,
    {
      method: "PUT",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: quizData.title,
        description: quizData.description,
        duration: Number(quizData.duration),
        total_marks: Number(quizData.total_marks),
        passing_percentage: Number(
          quizData.passing_percentage
        ),
        is_active:
          quizData.is_active !== undefined
            ? quizData.is_active
            : true,
      }),
    }
  );

  return handleResponse(response);
}

export async function deleteQuiz(quizId) {
  const response = await fetch(
    `${API_BASE_URL}/quizzes/${quizId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getStudents() {
  const response = await fetch(
    `${API_BASE_URL}/students/`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getStudentDetails(studentId) {
  const response = await fetch(
    `${API_BASE_URL}/students/${studentId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getStudentAttempts(studentId) {
  const response = await fetch(
    `${API_BASE_URL}/students/${studentId}/attempts`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getQuestionsByQuiz(
  quizId
) {
  const response = await fetch(
    `${API_BASE_URL}/questions/quiz/${quizId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getQuestions(quizId) {
  return getQuestionsByQuiz(quizId);
}

export async function startQuiz(quizId) {
  const response = await fetch(
    `${API_BASE_URL}/attempts/`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
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

export async function submitQuiz(attemptId) {
  const response = await fetch(
    `${API_BASE_URL}/attempts/${attemptId}/submit`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function submitQuizAttempt(
  attemptId
) {
  return submitQuiz(attemptId);
}

export async function getMyAttempts() {
  const response = await fetch(
    `${API_BASE_URL}/attempts/`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function submitAnswer(
  attemptId,
  questionId,
  selectedAnswer
) {
  const body = {
    attempt_id: Number(attemptId),
    question_id: Number(questionId),
    selected_answer: String(selectedAnswer)
      .trim()
      .toUpperCase(),
  };

  const response = await fetch(
    `${API_BASE_URL}/answers/`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  return handleResponse(response);
}

export async function getQuizResult(
  attemptId
) {
  const response = await fetch(
    `${API_BASE_URL}/results/${attemptId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getQuizReview(
  attemptId
) {
  const response = await fetch(
    `${API_BASE_URL}/results/${attemptId}/review`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getResult(attemptId) {
  return getQuizResult(attemptId);
}

export async function getAllQuizResults() {
  const response = await fetch(
    `${API_BASE_URL}/results/`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getCertificates() {
  const response = await fetch(
    `${API_BASE_URL}/certificates`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function getCertificate(
  attemptId
) {
  const response = await fetch(
    `${API_BASE_URL}/certificate/${attemptId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return handleResponse(response);
}

export async function downloadCertificate(
  attemptId
) {
  const response = await fetch(
    `${API_BASE_URL}/certificate/${attemptId}/download`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    let message =
      "Unable to download certificate.";

    try {
      const contentType =
        response.headers.get("content-type") || "";

      if (
        contentType.includes("application/json")
      ) {
        const data = await response.json();

        if (typeof data?.detail === "string") {
          message = data.detail;
        } else if (
          data?.detail &&
          typeof data.detail === "object"
        ) {
          message =
            data.detail.message ||
            data.detail.reason ||
            "Certificate download failed.";
        }
      } else {
        const text = await response.text();

        if (text.trim()) {
          message = text;
        }
      }
    } catch {
      message =
        `Certificate download failed (${response.status}).`;
    }

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    }

    throw new Error(message);
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error(
      "The certificate file is empty."
    );
  }

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `quiz_certificate_${attemptId}.pdf`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);

  return true;
}