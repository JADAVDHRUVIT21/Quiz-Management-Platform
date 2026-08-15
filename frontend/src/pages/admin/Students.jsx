import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents } from "../../services/api";

function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStudents();

      const studentList = Array.isArray(data?.students)
        ? data.students
        : [];

      setStudents(studentList);

      setTotalStudents(
        Number(data?.total_students) ||
          studentList.length
      );
    } catch (err) {
      console.error(
        "Students loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const activeStudents = students.filter(
    (student) => student.is_active
  ).length;

  const inactiveStudents = students.filter(
    (student) => !student.is_active
  ).length;

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(
      date
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openStudent = (studentId) => {
    navigate(
      `/admin/students/${studentId}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-extrabold text-white">
              Q
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-slate-900 sm:text-xl">
                QuizMaster
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Student Management
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Students
              </h2>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                View all registered students in your QuizMaster platform.
              </p>
            </div>

            <button
              type="button"
              onClick={loadStudents}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading
                ? "Refreshing..."
                : "Refresh Students"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total Students
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {totalStudents}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                👨‍🎓
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Active Students
                </p>

                <p className="mt-2 text-3xl font-extrabold text-green-600">
                  {activeStudents}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                ✓
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Inactive Students
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-500">
                  {inactiveStudents}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                ○
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading students...
            </p>
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
              👨‍🎓
            </div>

            <h3 className="mt-5 text-xl font-extrabold text-slate-900">
              No students found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              No student accounts have been registered yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h3 className="text-lg font-extrabold text-slate-900">
                Registered Students
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {totalStudents} student
                {totalStudents !== 1
                  ? "s"
                  : ""}{" "}
                registered
              </p>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      ID
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Student
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Email
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Role
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Registered
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map(
                    (student, index) => (
                      <tr
                        key={student.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-700">
                          #{index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              openStudent(
                                student.id
                              )
                            }
                            className="flex items-center gap-3 text-left"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
                              {(student.full_name ||
                                "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <span className="font-semibold text-blue-700 hover:underline">
                              {student.full_name ||
                                "Unknown Student"}
                            </span>
                          </button>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {student.email}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                            {student.role ||
                              "student"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={
                              student.is_active
                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
                            }
                          >
                            {student.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {formatDate(
                            student.created_at
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openStudent(
                                student.id
                              )
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {students.map(
                (student, index) => (
                  <div
                    key={student.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          openStudent(
                            student.id
                          )
                        }
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
                          {(student.full_name ||
                            "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate font-bold text-blue-700">
                            {student.full_name ||
                              "Unknown Student"}
                          </h4>

                          <p className="mt-1 break-all text-sm text-slate-500">
                            {student.email}
                          </p>
                        </div>
                      </button>

                      <span
                        className={
                          student.is_active
                            ? "shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700"
                            : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500"
                        }
                      >
                        {student.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium text-slate-500">
                          Student ID
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          #{index + 1}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium text-slate-500">
                          Role
                        </p>

                        <p className="mt-1 text-sm font-bold capitalize text-slate-900">
                          {student.role ||
                            "student"}
                        </p>
                      </div>

                      <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium text-slate-500">
                          Registered
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatDate(
                            student.created_at
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openStudent(
                            student.id
                          )
                        }
                        className="col-span-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                      >
                        View Student Details
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Students;