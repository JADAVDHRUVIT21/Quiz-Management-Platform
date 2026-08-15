import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentSettings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [notifications, setNotifications] = useState(true);
  const [quizReminders, setQuizReminders] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const storedUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    setUser(storedUser);
    setFullName(storedUser.full_name || "");
    setEmail(storedUser.email || "");

    const savedNotifications = localStorage.getItem(
      "student_notifications"
    );

    const savedQuizReminders = localStorage.getItem(
      "student_quiz_reminders"
    );

    if (savedNotifications !== null) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        setNotifications(true);
      }
    }

    if (savedQuizReminders !== null) {
      try {
        setQuizReminders(JSON.parse(savedQuizReminders));
      } catch {
        setQuizReminders(true);
      }
    }
  }, [navigate]);

  const handleProfileSave = (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!fullName.trim()) {
      setMessage("Full name is required.");
      setMessageType("error");
      return;
    }

    const updatedUser = {
      ...user,
      full_name: fullName.trim(),
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);

    setMessage("Profile updated successfully.");
    setMessageType("success");
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setMessage("Please fill all password fields.");
      setMessageType("error");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage(
        "New password must contain at least 6 characters."
      );
      setMessageType("error");
      return;
    }

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setMessage("New passwords do not match.");
      setMessageType("error");
      return;
    }

    setMessage(
      "Password validation completed successfully."
    );
    setMessageType("success");

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handlePreferencesSave = () => {
    localStorage.setItem(
      "student_notifications",
      JSON.stringify(notifications)
    );

    localStorage.setItem(
      "student_quiz_reminders",
      JSON.stringify(quizReminders)
    );

    setMessage("Preferences saved successfully.");
    setMessageType("success");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">

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
                Student Settings
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Back to Dashboard
          </button>

        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Account Management
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Student Settings
          </h2>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage your profile, password and account preferences.
          </p>

        </div>

        {message && (
          <div
            className={`mb-6 rounded-xl border px-5 py-4 text-sm font-medium ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                👤
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Profile Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Update your basic account information.
                </p>
              </div>

            </div>

            <form
              onSubmit={handleProfileSave}
              className="mt-6 space-y-5"
            >

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Email address cannot be changed here.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Save Profile
              </button>

            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                🔐
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Change Password
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Keep your QuizMaster account secure.
                </p>
              </div>

            </div>

            <form
              onSubmit={handlePasswordChange}
              className="mt-6 space-y-5"
            >

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Current Password
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  New Password
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm New Password
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Confirm new password"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">

                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) =>
                    setShowPassword(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                Show password

              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Change Password
              </button>

            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                🔔
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Notifications
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Control how QuizMaster keeps you informed.
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-5">

              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">

                <div>
                  <p className="font-semibold text-slate-900">
                    Notifications
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Receive important platform notifications.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNotifications(!notifications)
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    notifications
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      notifications
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">

                <div>
                  <p className="font-semibold text-slate-900">
                    Quiz Reminders
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Receive reminders about available quizzes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setQuizReminders(!quizReminders)
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    quizReminders
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      quizReminders
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

              <button
                type="button"
                onClick={handlePreferencesSave}
                className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Save Preferences
              </button>

            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-2xl">
                🏆
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Quiz Activity
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Quickly access your quiz performance.
                </p>
              </div>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <button
                type="button"
                onClick={() => navigate("/results")}
                className="rounded-xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-2xl">
                  📊
                </p>

                <p className="mt-3 font-bold text-slate-900">
                  My Results
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  View your quiz scores and performance.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/certificates")
                }
                className="rounded-xl border border-slate-200 p-5 text-left transition hover:border-yellow-300 hover:bg-yellow-50"
              >
                <p className="text-2xl">
                  🏆
                </p>

                <p className="mt-3 font-bold text-slate-900">
                  Certificates
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  View and download your certificates.
                </p>
              </button>

            </div>
          </section>

        </div>

        <section className="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Account
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Sign out from your QuizMaster account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Logout
            </button>

          </div>

        </section>

      </main>
    </div>
  );
}

export default StudentSettings;