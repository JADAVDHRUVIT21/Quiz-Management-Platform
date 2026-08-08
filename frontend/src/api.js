const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function apiRequest(
  endpoint,
  options = {}
) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    let errorMessage = "Something went wrong";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (errorData.detail) {
        errorMessage = JSON.stringify(errorData.detail);
      }
    } catch {
      errorMessage = response.statusText;
    }

    throw new Error(errorMessage);
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/pdf")) {
    return response.blob();
  }

  return response.json();
}