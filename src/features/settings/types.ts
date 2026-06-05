import type { CurrentUser } from '@/features/auth/types'

export type ProfileSettings = CurrentUser

export type SystemSettings = {
  applicationName: string
  environment: string
  apiVersion: string
  swaggerUrl: string
  openApiUrl: string
  backendRepository: string
  frontendRepository: string
}

export type MediaStorageSettings = {
  storageProvider: string
  maxFileSizeMb: number
  signedAccessEnabled: boolean
  signedUrlExpirationMinutes: number
  databaseStorageForDemo: boolean
  productionRecommendation: string
}

export type SettingsOverviewResponse = {
  profile: ProfileSettings
  system: SystemSettings
  mediaStorage: MediaStorageSettings
}
