export type FileAssetType =
  | 'AVATAR'
  | 'COURSE_COVER'
  | 'LESSON_AUDIO'
  | 'LESSON_VIDEO'
  | 'SUBTITLE'
  | 'ATTACHMENT'

export type StorageProvider = 'DATABASE' | 'LOCAL' | 'MINIO' | 'S3'

export type FileUploadResponse = {
  id: number
  originalName: string
  url: string
  contentType: string
  sizeBytes: number
  assetType: FileAssetType
  storageProvider: StorageProvider
  checksum: string
  createdAt: string
}

export type FileAsset = FileUploadResponse & {
  ownerId: number
  relatedType: string | null
  relatedId: number | null
  updatedAt: string
}

export type FileAccessUrlResponse = {
  url: string
  expiresAt: string
}
