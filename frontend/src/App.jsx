import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import QuizList from "./pages/QuizList";
import QuizResult from "./pages/QuizResult";
import Results from "./pages/Result";
import Certificate from "./pages/Certificate";
import CreateQuiz from "./pages/admin/CreateQuiz";
import ManageQuestions from "./pages/admin/ManageQuestions";
import Register from "./pages/Register";
import ManageQuizzes from "./pages/admin/ManageQuizzes";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const role = user?.role?.toLowerCase();

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  if (!user) {
    return null;
  }

  const isAdmin = role === "admin";

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
                Quiz Management Platform
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user.full_name || "User"}
              </p>

              <p className="text-xs capitalize text-slate-500">
                {role || "student"}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
            {isAdmin ? "Admin Dashboard" : "Student Dashboard"}
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome to QuizMaster
          </h2>

          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            Hello, {user.full_name || "User"}
          </p>
        </div>

        {isAdmin ? (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              icon="📊"
              title="Manage Quizzes"
              description="Create, update and delete quizzes."
              button="Manage Quizzes"
              primary
              onClick={() => navigate("/admin/quizzes")}
            />

            <DashboardCard
              icon="❓"
              title="Manage Questions"
              description="Add, edit and remove questions from quizzes."
              button="Manage Questions"
              onClick={() => navigate("/admin/questions")}
            />

            <DashboardCard
              icon="👨‍🎓"
              title="Students"
              description="View and manage registered students."
              button="View Students"
              onClick={() => navigate("/admin/students")}
            />

            <DashboardCard
              icon="📊"
              title="Quiz Results"
              description="Monitor student attempts and quiz performance."
              button="View Results"
              onClick={() => navigate("/admin/results")}
            />

            <DashboardCard
              icon="➕"
              title="Create Quiz"
              description="Create a new quiz and configure its settings."
              button="Create Quiz"
              primary
              onClick={() => navigate("/admin/quizzes/create")}
            />

            <DashboardCard
              icon="⚙️"
              title="Admin Settings"
              description="Manage your administrator account and platform settings."
              button="Settings"
              onClick={() => navigate("/admin/settings")}
            />
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              icon="📝"
              title="Available Quizzes"
              description="View available quizzes and start your test."
              button="View Quizzes"
              primary
              onClick={() => navigate("/quizzes")}
            />

            <DashboardCard
              icon="📊"
              title="My Results"
              description="View your quiz scores and performance."
              button="View Results"
              primary
              onClick={() => navigate("/results")}
            />

            <DashboardCard
              icon="🏆"
              title="Certificates"
              description="View and download certificates for passed quizzes."
              button="View Certificates"
              primary
              onClick={() => navigate("/certificates")}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  description,
  button,
  primary = false,
  onClick,
}) {
  return (
    <div className="flex min-h-[250px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-auto pt-7">
        <button
          type="button"
          onClick={onClick}
          className={
            primary
              ? "w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
              : "w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          }
        >
          {button}
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("access_token");

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const role = user?.role?.toLowerCase();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/quizzes/create"
          element={
            <AdminRoute>
              <CreateQuiz />
            </AdminRoute>
          }
        />

        <Route
          path="/quizzes"
          element={
            <ProtectedRoute>
              <QuizList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz/:quizId/result/:attemptId"
          element={
            <ProtectedRoute>
              <QuizResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results/:attemptId"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />

        <Route
          path="/certificates"
          element={
            <ProtectedRoute>
              <Certificate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
        <Route
          path="/admin/questions"
          element={
            <AdminRoute>
              <ManageQuestions />
            </AdminRoute>
          }
        />
        <Route
          path="/register"
          element={<Register />}
        />  
      <Route
          path="/admin/quizzes"
          element={
            <AdminRoute>
              <ManageQuizzes />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;