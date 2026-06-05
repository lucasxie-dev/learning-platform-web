import { api, type ApiResponse } from '@/lib/api'
import type { SettingsOverviewResponse } from '@/features/settings/types'

export async function getSettingsOverview() {
  const response = await api.get<ApiResponse<SettingsOverviewResponse>>(
    '/api/v1/settings/overview',
  )

  return response.data.data
}
