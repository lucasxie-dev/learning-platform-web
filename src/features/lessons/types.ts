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
  contentMarkdown: string | null
  audioFileId: number | null
  videoFileId: number | null
  subtitleFileId: number | null
}

export type LessonPayload = {
  title: string
  description?: string
  contentMarkdown?: string
  sortOrder?: number
}

export type LessonOrderItem = {
  lessonId: number
  sortOrder: number
}

export type GlobalLessonListItem = {
  id: number
  courseId: number
  courseTitle: string
  title: string
  description?: string | null
  sortOrder: number
  status: LessonStatus
  audioFileId?: number | null
  videoFileId?: number | null
  subtitleFileId?: number | null
  hasAudio: boolean
  hasVideo: boolean
  hasSubtitle: boolean
  durationSeconds?: number | null
  ownerId: number
  createdAt: string
  updatedAt: string
}

export type GlobalLessonsQuery = {
  keyword?: string
  courseId?: number
  status?: string
  hasAudio?: boolean
  hasVideo?: boolean
  hasSubtitle?: boolean
  page?: number
  size?: number
}
