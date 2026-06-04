export type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type LessonListItem = {
  id: number
  courseId: number
  title: string
  sortOrder: number
  status: LessonStatus
  durationSeconds: number | null
  createdAt: string
  updatedAt: string
}

export type Lesson = LessonListItem & {
  description: string | null
  audioFileId: number | null
  videoFileId: number | null
  subtitleFileId: number | null
}

export type LessonPayload = {
  title: string
  description?: string
  sortOrder?: number
}

export type LessonOrderItem = {
  lessonId: number
  sortOrder: number
}
