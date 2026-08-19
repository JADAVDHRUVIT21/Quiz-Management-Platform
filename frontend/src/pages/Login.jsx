import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = (() => {
  const configuredUrl = import.meta.env.VITE_API_URL;

  if (configuredUrl) {
    return `${configuredUrl.replace(/\/$/, "")}/api/v1`;
  }

  return "import.meta.env.VITE_API_URL";
})();

function Login() {
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState("student");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleModeChange = (mode) => {
    setLoginMode(mode);
    setError("");

    setForm({
      email: "",
      password: "",
    });
  };

  const getErrorMessage = (data) => {
    if (!data) {
      return "Login failed. Please check your email and password.";
    }

    if (Array.isArray(data.detail)) {
      return data.detail
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
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    return "Login failed. Please check your email and password.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      /*
       * FastAPI OAuth2PasswordRequestForm requires:
       * username
       * password
       *
       * The user's email is sent as username.
       */
      const loginBody = new URLSearchParams();

      loginBody.append("username", email);
      loginBody.append("password", password);

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: loginBody.toString(),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      /*
       * Support different backend response formats.
       */
      const token =
        data?.access_token ||
        data?.token ||
        data?.data?.access_token ||
        data?.data?.token;

      if (!token) {
        throw new Error(
          "Login succeeded, but the server did not return an access token."
        );
      }

      /*
       * First try to get user from login response.
       */
      let user =
        data?.user ||
        data?.data?.user ||
        null;

      /*
       * If user is not returned by login,
       * try /auth/me.
       */
      if (!user) {
        try {
          const meResponse = await fetch(
            `${API_BASE_URL}/auth/me`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

          if (meResponse.ok) {
            user = await meResponse.json();
          }
        } catch (meError) {
          console.warn(
            "Unable to load current user:",
            meError
          );
        }
      }

      /*
       * Some backends return user directly in data.
       */
      if (
        !user &&
        data?.data &&
        typeof data.data === "object"
      ) {
        if (
          data.data.email ||
          data.data.full_name ||
          data.data.role
        ) {
          user = data.data;
        }
      }

      /*
       * If backend did not return user information,
       * try reading the JWT payload.
       */
      if (!user) {
        try {
          const tokenParts = token.split(".");

          if (tokenParts.length === 3) {
            const base64Payload =
              tokenParts[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            const payload = JSON.parse(
              decodeURIComponent(
                atob(base64Payload)
                  .split("")
                  .map(
                    (char) =>
                      `%${(
                        "00" +
                        char.charCodeAt(0).toString(16)
                      ).slice(-2)}`
                  )
                  .join("")
              )
            );

            user = {
              id:
                payload.user_id ||
                payload.id ||
                payload.sub,
              email:
                payload.email ||
                payload.sub ||
                email,
              full_name:
                payload.full_name ||
                payload.name ||
                email.split("@")[0],
              role:
                payload.role ||
                "student",
            };
          }
        } catch (tokenError) {
          console.warn(
            "Unable to read token:",
            tokenError
          );
        }
      }

      /*
       * We need the role.
       */
      if (!user) {
        throw new Error(
          "Login succeeded, but user information could not be determined."
        );
      }

      const actualRole = String(
        user?.role || "student"
      ).toLowerCase();

      /*
       * Prevent student/admin mode mismatch.
       */
      if (
        loginMode === "admin" &&
        actualRole !== "admin"
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        throw new Error(
          "This account is not an administrator account. Please select Login as Student."
        );
      }

      if (
        loginMode === "student" &&
        actualRole === "admin"
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        throw new Error(
          "This is an administrator account. Please select Login as Admin."
        );
      }

      /*
       * Save authentication.
       */
      localStorage.setItem(
        "access_token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      /*
       * IMPORTANT:
       * Navigate to the route that actually exists
       * in your App.jsx.
       *
       * Admin -> /dashboard
       * Student -> /dashboard
       *
       * Your Dashboard component detects the role
       * and displays the correct panel.
       */
      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err?.message ||
          "Unable to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">

        <div className="w-full">

          {/* Logo */}
          <div className="mb-7 text-center sm:mb-8">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-extrabold text-white shadow-lg">
              Q
            </div>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Login to your QuizMaster account
            </p>

          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8">

            {/* Login Mode */}
            <div className="mb-6">

              <p className="mb-3 text-sm font-semibold text-slate-700">
                Login as
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleModeChange("student")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    loginMode === "student"
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Login as Student
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleModeChange("admin")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    loginMode === "admin"
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Login as Admin
                </button>

              </div>
            </div>

            {/* Selected Mode */}
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

              <p className="text-sm font-semibold text-blue-800">
                {loginMode === "admin"
                  ? "Administrator Login"
                  : "Student Login"}
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                {loginMode === "admin"
                  ? "Use an administrator account to manage quizzes and questions."
                  : "Use your student account to attend quizzes and view your results."}
              </p>

            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                <p className="text-sm font-medium leading-5 text-red-700">
                  {error}
                </p>

              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={
                    loginMode === "admin"
                      ? "admin@example.com"
                      : "student@example.com"
                  }
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />

              </div>

              {/* Password */}
              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />

              </div>

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Logging in..."
                  : loginMode === "admin"
                    ? "Login as Admin"
                    : "Login as Student"}
              </button>

            </form>

            {/* Register */}
            <div className="mt-7 border-t border-slate-100 pt-6 text-center">

              <p className="text-sm text-slate-500">
                Don't have an account?{" "}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    navigate("/register")
                  }
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                >
                  Register
                </button>
              </p>

            </div>

          </div>

          {/* Bottom Navigation */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-5">

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setLoginMode("student");
              }}
              className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              Student Login
            </button>

            <span className="hidden text-slate-300 sm:inline">
              |
            </span>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setLoginMode("admin");
              }}
              className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              Admin Login
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;