import type { CourseStatus, PageResponse } from '@/features/courses/types'

export type Enrollment = {
  id: number
  userId: number
  courseId: number
  enrolledAt: string
  courseTitle: string
  courseStatus: CourseStatus
}

export type MyCourse = {
  enrollmentId: number
  courseId: number
  title: string
  subtitle: string | null
  coverFileId: number | null
  status: CourseStatus
  enrolledAt: string
  totalLessons: number
  completedLessons: number
  completionRate: number
  lastStudiedAt: string | null
}

export type LessonProgressItem = {
  lessonId: number
  title: string
  sortOrder: number
  durationSeconds: number | null
  progressSeconds: number
  completed: boolean
  completedAt: string | null
  updatedAt: string | null
}

export type CourseProgress = {
  courseId: number
  userId: number
  totalLessons: number
  completedLessons: number
  completionRate: number
  lessons: LessonProgressItem[]
}

export type LessonProgress = {
  id: number
  userId: number
  courseId: number
  lessonId: number
  progressSeconds: number
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type MyCoursesPage = PageResponse<MyCourse>
export type EnrollmentsPage = PageResponse<Enrollment>
