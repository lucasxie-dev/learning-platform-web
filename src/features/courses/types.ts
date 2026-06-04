export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type PageResponse<T> = {
  items: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

export type CourseListItem = {
  id: number
  title: string
  subtitle: string | null
  coverFileId: number | null
  ownerId: number
  status: CourseStatus
  publishedAt: string | null
  createdAt: string
}

export type Course = CourseListItem & {
  description: string | null
  updatedAt: string
}

export type CoursePayload = {
  title: string
  subtitle?: string
  description?: string
}

export type CourseFilters = {
  keyword?: string
  status?: CourseStatus | 'ALL'
  page: number
  size: number
}
