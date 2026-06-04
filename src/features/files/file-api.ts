import { api, type ApiResponse } from '@/lib/api'
import type {
  FileAccessUrlResponse,
  FileAsset,
  FileAssetType,
  FileUploadResponse,
} from '@/features/files/types'

export async function uploadFile(file: File, assetType: FileAssetType) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('assetType', assetType)

  const response = await api.post<ApiResponse<FileUploadResponse>>(
    '/api/v1/files/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data.data
}

export async function getFile(fileId: number) {
  const response = await api.get<ApiResponse<FileAsset>>(`/api/v1/files/${fileId}`)

  return response.data.data
}

export async function createFileAccessUrl(fileId: number) {
  const response = await api.post<ApiResponse<FileAccessUrlResponse>>(
    `/api/v1/files/${fileId}/access-url`,
  )

  return response.data.data
}

export async function deleteFile(fileId: number) {
  await api.delete<ApiResponse<void>>(`/api/v1/files/${fileId}`)
}

export async function bindCourseCover(courseId: number, fileId: number) {
  const response = await api.put<ApiResponse<FileAsset>>(
    `/api/v1/courses/${courseId}/cover`,
    { fileId },
  )

  return response.data.data
}

export async function unbindCourseCover(courseId: number) {
  await api.delete<ApiResponse<void>>(`/api/v1/courses/${courseId}/cover`)
}

export async function bindLessonAudio(lessonId: number, fileId: number) {
  const response = await api.put<ApiResponse<FileAsset>>(
    `/api/v1/lessons/${lessonId}/audio`,
    { fileId },
  )

  return response.data.data
}

export async function unbindLessonAudio(lessonId: number) {
  await api.delete<ApiResponse<void>>(`/api/v1/lessons/${lessonId}/audio`)
}

export async function bindLessonVideo(lessonId: number, fileId: number) {
  const response = await api.put<ApiResponse<FileAsset>>(
    `/api/v1/lessons/${lessonId}/video`,
    { fileId },
  )

  return response.data.data
}

export async function unbindLessonVideo(lessonId: number) {
  await api.delete<ApiResponse<void>>(`/api/v1/lessons/${lessonId}/video`)
}

export async function bindLessonSubtitle(lessonId: number, fileId: number) {
  const response = await api.put<ApiResponse<FileAsset>>(
    `/api/v1/lessons/${lessonId}/subtitle`,
    { fileId },
  )

  return response.data.data
}

export async function unbindLessonSubtitle(lessonId: number) {
  await api.delete<ApiResponse<void>>(`/api/v1/lessons/${lessonId}/subtitle`)
}
