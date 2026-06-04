import { api, type ApiResponse } from '@/lib/api'
import type {
  Lesson,
  LessonListItem,
  LessonOrderItem,
  LessonPayload,
} from '@/features/lessons/types'

export async function listLessonsByCourse(courseId: number) {
  const response = await api.get<ApiResponse<LessonListItem[]>>(
    `/api/v1/courses/${courseId}/lessons`,
  )

  return response.data.data
}

export async function createLesson(courseId: number, payload: LessonPayload) {
  const response = await api.post<ApiResponse<Lesson>>(
    `/api/v1/courses/${courseId}/lessons`,
    payload,
  )

  return response.data.data
}

export async function getLesson(lessonId: number) {
  const response = await api.get<ApiResponse<Lesson>>(`/api/v1/lessons/${lessonId}`)

  return response.data.data
}

export async function updateLesson(lessonId: number, payload: LessonPayload) {
  const response = await api.put<ApiResponse<Lesson>>(
    `/api/v1/lessons/${lessonId}`,
    payload,
  )

  return response.data.data
}

export async function publishLesson(lessonId: number) {
  const response = await api.post<ApiResponse<Lesson>>(
    `/api/v1/lessons/${lessonId}/publish`,
  )

  return response.data.data
}

export async function archiveLesson(lessonId: number) {
  const response = await api.post<ApiResponse<Lesson>>(
    `/api/v1/lessons/${lessonId}/archive`,
  )

  return response.data.data
}

export async function deleteLesson(lessonId: number) {
  await api.delete<ApiResponse<void>>(`/api/v1/lessons/${lessonId}`)
}

export async function reorderLessons(courseId: number, items: LessonOrderItem[]) {
  await api.patch<ApiResponse<void>>(`/api/v1/courses/${courseId}/lessons/reorder`, {
    items,
  })
}
