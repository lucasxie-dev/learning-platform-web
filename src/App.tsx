import { Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/features/auth/require-auth'
import { CourseEnrollmentsPage } from '@/pages/course-enrollments-page'
import { CoursesPage } from '@/pages/courses-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { LearnCoursePage } from '@/pages/learn-course-page'
import { LearnCoursesPage } from '@/pages/learn-courses-page'
import { LearnLessonPage } from '@/pages/learn-lesson-page'
import { LessonsPage } from '@/pages/lessons-page'
import { LoginPage } from '@/pages/login-page'
import { MyCoursesPage } from '@/pages/my-courses-page'
import { RegisterPage } from '@/pages/register-page'
import { UserCourseProgressPage } from '@/pages/user-course-progress-page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/courses"
        element={
          <RequireAuth>
            <CoursesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/courses/:courseId/lessons"
        element={
          <RequireAuth>
            <LessonsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/courses/:courseId/enrollments"
        element={
          <RequireAuth>
            <CourseEnrollmentsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/courses/:courseId/users/:userId/progress"
        element={
          <RequireAuth>
            <UserCourseProgressPage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/courses"
        element={
          <RequireAuth>
            <MyCoursesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/learn/courses"
        element={
          <RequireAuth>
            <LearnCoursesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/learn/courses/:courseId"
        element={
          <RequireAuth>
            <LearnCoursePage />
          </RequireAuth>
        }
      />
      <Route
        path="/learn/lessons/:lessonId"
        element={
          <RequireAuth>
            <LearnLessonPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
