import { api, type ApiResponse } from '@/lib/api'
import type {
  Course,
  CourseFilters,
  CourseListItem,
  CoursePayload,
  PageResponse,
} from '@/features/courses/types'

export async function listCourses(filters: CourseFilters) {
  const response = await api.get<ApiResponse<PageResponse<CourseListItem>>>(
    '/api/v1/courses',
    {
      params: {
        keyword: filters.keyword || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        page: filters.page,
        size: filters.size,
      },
    },
  )

  return response.data.data
}

export async function createCourse(payload: CoursePayload) {
  const response = await api.post<ApiResponse<Course>>('/api/v1/courses', payload)

  return response.data.data
}

export async function getCourse(courseId: number) {
  const response = await api.get<ApiResponse<Course>>(`/api/v1/courses/${courseId}`)

  return response.data.data
}

export async function updateCourse(courseId: number, payload: CoursePayload) {
  const response = await api.put<ApiResponse<Course>>(
    `/api/v1/courses/${courseId}`,
    payload,
  )

  return response.data.data
}

export async function publishCourse(courseId: number) {
  const response = await api.post<ApiResponse<Course>>(
    `/api/v1/courses/${courseId}/publish`,
  )

  return response.data.data
}

export async function archiveCourse(courseId: number) {
  const response = await api.post<ApiResponse<Course>>(
    `/api/v1/courses/${courseId}/archive`,
  )

  return response.data.data
}

export async function deleteCourse(courseId: number) {
  await api.delete<ApiResponse<void>>(`/api/v1/courses/${courseId}`)
}
