import { api, type ApiResponse } from '@/lib/api'
import type {
  CourseProgress,
  Enrollment,
  EnrollmentsPage,
  LessonProgress,
  MyCoursesPage,
} from '@/features/learning/types'

export async function enrollCourse(courseId: number) {
  const response = await api.post<ApiResponse<Enrollment>>(
    `/api/v1/courses/${courseId}/enroll`,
  )

  return response.data.data
}

export async function listMyCourses(page = 0, size = 20) {
  const response = await api.get<ApiResponse<MyCoursesPage>>('/api/v1/me/courses', {
    params: { page, size },
  })

  return response.data.data
}

export async function listCourseEnrollments(courseId: number, page = 0, size = 20) {
  const response = await api.get<ApiResponse<EnrollmentsPage>>(
    `/api/v1/courses/${courseId}/enrollments`,
    {
      params: { page, size },
    },
  )

  return response.data.data
}

export async function getMyCourseProgress(courseId: number) {
  const response = await api.get<ApiResponse<CourseProgress>>(
    `/api/v1/courses/${courseId}/progress`,
  )

  return response.data.data
}

export async function getUserCourseProgress(courseId: number, userId: number) {
  const response = await api.get<ApiResponse<CourseProgress>>(
    `/api/v1/courses/${courseId}/users/${userId}/progress`,
  )

  return response.data.data
}

export async function updateLessonProgress(lessonId: number, progressSeconds: number) {
  const response = await api.put<ApiResponse<LessonProgress>>(
    `/api/v1/lessons/${lessonId}/progress`,
    { progressSeconds },
  )

  return response.data.data
}

export async function completeLesson(lessonId: number) {
  const response = await api.post<ApiResponse<LessonProgress>>(
    `/api/v1/lessons/${lessonId}/complete`,
  )

  return response.data.data
}
