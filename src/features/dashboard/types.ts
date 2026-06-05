import type { CourseStatus } from '@/features/courses/types'
import type { FileAssetType } from '@/features/files/types'

export type DashboardSummary = {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  archivedCourses: number
  totalLessons: number
  totalEnrollments: number
  totalMediaAssets: number
  averageCompletionRate: number
}

export type DashboardCourse = {
  id: number
  title: string
  subtitle: string | null
  coverFileId: number | null
  ownerId: number
  status: CourseStatus
  publishedAt: string | null
  createdAt: string
  lessonCount: number
  enrollmentCount: number
}

export type DashboardLearning = {
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

export type DashboardMedia = {
  id: number
  originalName: string
  contentType: string
  sizeBytes: number
  assetType: FileAssetType
  storageProvider: string
  createdAt: string
}

export type DashboardLessonPreview = {
  lessonId: number
  courseId: number
  lessonTitle: string
  courseTitle: string
  audioFileId: number | null
  videoFileId: number | null
  subtitleFileId: number | null
  durationSeconds: number | null
}

export type DashboardActivity = {
  type: 'COURSE' | 'ENROLLMENT' | 'LESSON_COMPLETED' | 'MEDIA' | 'PROGRESS'
  title: string
  description: string
  occurredAt: string
}

export type Dashboard = {
  summary: DashboardSummary
  recentCourses: DashboardCourse[]
  recentLearning: DashboardLearning[]
  recentMedia: DashboardMedia[]
  lessonPreview: DashboardLessonPreview | null
  recentActivities: DashboardActivity[]
}
