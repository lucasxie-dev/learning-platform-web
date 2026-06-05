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

export type FileAssetListItem = {
  id: number
  originalName: string
  url?: string | null
  contentType: string
  sizeBytes: number
  assetType: FileAssetType
  storageProvider: StorageProvider
  ownerId: number
  relatedType?: string | null
  relatedId?: number | null
  bound: boolean
  checksum?: string | null
  createdAt: string
  updatedAt: string
  bindingLabel?: string | null
  bindingTargetType?: string | null
  bindingTargetTitle?: string | null
}

export type FileAssetsQuery = {
  keyword?: string
  assetType?: string
  storageProvider?: string
  relatedType?: string
  relatedId?: number
  bound?: boolean
  page?: number
  size?: number
}

export type FileAccessUrlResponse = {
  url: string
  expiresAt: string
}
