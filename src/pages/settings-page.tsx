import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheckIcon,
  Code2Icon,
  DatabaseIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  RefreshCcwIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/auth-context'
import type { CurrentUser } from '@/features/auth/types'
import { getSettingsOverview } from '@/features/settings/settings-api'
import type {
  MediaStorageSettings,
  ProfileSettings,
  SystemSettings,
} from '@/features/settings/types'
import { WorkspaceLayout } from '@/components/layout/workspace-layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const settingsQueryOptions = {
  queryKey: ['settings', 'overview'],
  queryFn: getSettingsOverview,
  staleTime: 5 * 60 * 1000,
  retry: false,
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const settingsQuery = useQuery(settingsQueryOptions)
  const overview = settingsQuery.data
  const profile = overview?.profile
  const navigation = useWorkspaceNavigation(profile)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <WorkspaceLayout
      user={profile}
      title="Settings"
      description="Manage your profile, preferences, and project configuration overview."
      activeItem="settings"
      canManageCourses={navigation.canManageCourses}
      canLearn={navigation.canLearn}
      manageLabel={navigation.manageLabel}
      lessonsHref="/courses"
    >
      {settingsQuery.isLoading ? (
        <SettingsLoading />
      ) : settingsQuery.isError ? (
        <SettingsError onRetry={() => void settingsQuery.refetch()} />
      ) : overview ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
          <div className="grid gap-5">
            <ProfileCard profile={overview.profile} />
            <AccountSecurityCard email={overview.profile.email} onLogout={handleLogout} />
            <AppearanceCard />
          </div>
          <div className="grid gap-5 content-start">
            <MediaStorageCard mediaStorage={overview.mediaStorage} />
            <DeveloperInfoCard system={overview.system} />
          </div>
        </div>
      ) : (
        <Card className="rounded-3xl border-slate-200/80 bg-white p-6 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          Settings overview is unavailable.
        </Card>
      )}
    </WorkspaceLayout>
  )
}

function ProfileCard({ profile }: { profile: ProfileSettings }) {
  const displayName = profile.displayName || profile.username || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <SettingsCard
      icon={<UserIcon />}
      title="Profile"
      description="Your account identity and access scope."
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar className="size-16">
          {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">{displayName}</h2>
            <StatusBadge status={profile.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem label="Username" value={`@${profile.username}`} />
            <InfoItem label="User ID" value={`#${profile.id}`} />
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Profile editing coming soon.
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <BadgeGroup label="Roles" values={profile.roles} tone="blue" />
        <BadgeGroup label="Permissions" values={profile.permissions} tone="slate" />
      </div>
    </SettingsCard>
  )
}

function AccountSecurityCard({
  email,
  onLogout,
}: {
  email: string
  onLogout: () => void
}) {
  return (
    <SettingsCard
      icon={<ShieldCheckIcon />}
      title="Account & Security"
      description="Current authentication status for this session."
    >
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <InfoItem icon={<KeyRoundIcon />} label="Authentication" value="JWT" />
        <InfoItem icon={<BadgeCheckIcon />} label="Session" value="Active" />
        <InfoItem className="sm:col-span-2" label="Signed in as" value={email} />
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-950">End current session</div>
          <p className="mt-1 text-sm text-slate-500">
            Sign out from this browser and return to the login page.
          </p>
        </div>
        <Button className="rounded-xl" variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </SettingsCard>
  )
}

function AppearanceCard() {
  return (
    <SettingsCard
      icon={<SettingsIcon />}
      title="Appearance"
      description="Theme controls for the web console."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {['Light', 'Dark', 'System'].map((theme) => (
          <button
            key={theme}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-400"
            disabled
            type="button"
          >
            {theme}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Theme switching is coming soon. The theme package and CSS variables are present, but a
        provider is not configured yet.
      </p>
    </SettingsCard>
  )
}

function MediaStorageCard({
  mediaStorage,
}: {
  mediaStorage: MediaStorageSettings
}) {
  return (
    <SettingsCard
      icon={<DatabaseIcon />}
      title="Media & Storage"
      description="How course media is stored and accessed."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoItem
          label="Storage Provider"
          value={<StorageProviderBadge provider={mediaStorage.storageProvider} />}
        />
        <InfoItem label="Max Upload Size" value={`${mediaStorage.maxFileSizeMb} MB`} />
        <InfoItem label="Signed Media Access" value={formatBoolean(mediaStorage.signedAccessEnabled)} />
        <InfoItem
          label="Signed URL Expiration"
          value={`${mediaStorage.signedUrlExpirationMinutes} minutes`}
        />
        <InfoItem
          label="Database Storage For Demo"
          value={formatBoolean(mediaStorage.databaseStorageForDemo)}
        />
      </div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-600">
        Database storage is used by default for local demo and small files. Use MinIO or S3 for
        production-like media delivery.
      </div>
      {mediaStorage.productionRecommendation ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {mediaStorage.productionRecommendation}
        </div>
      ) : null}
    </SettingsCard>
  )
}

function DeveloperInfoCard({ system }: { system: SystemSettings }) {
  return (
    <SettingsCard
      icon={<Code2Icon />}
      title="Developer Info"
      description="Backend and repository references."
    >
      <div className="grid gap-3 text-sm">
        <InfoItem label="Application" value={system.applicationName} />
        <InfoItem label="Environment" value={<EnvironmentBadge environment={system.environment} />} />
        <InfoItem label="API Version" value={system.apiVersion} />
        <DeveloperLink label="Swagger UI" value={system.swaggerUrl} />
        <DeveloperLink label="OpenAPI JSON" value={system.openApiUrl} />
        <DeveloperLink label="Backend Repository" value={system.backendRepository} />
        <DeveloperLink label="Frontend Repository" value={system.frontendRepository} />
      </div>
    </SettingsCard>
  )
}

function SettingsLoading() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
      {[0, 1, 2, 3, 4].map((item) => (
        <Card
          key={item}
          className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
        >
          <div className="h-5 w-36 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 grid gap-3">
            <div className="h-4 rounded-full bg-slate-100" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function SettingsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="rounded-3xl border-destructive/30 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-950">Unable to load settings overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Check that the backend settings API is available for this account.
          </p>
        </div>
        <Button className="rounded-xl" variant="outline" onClick={onRetry}>
          <RefreshCcwIcon />
          Retry
        </Button>
      </div>
    </Card>
  )
}

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <CardHeader className="gap-4 md:grid md:grid-cols-[auto_1fr] md:items-start">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <span className="[&>svg]:size-5">{icon}</span>
        </div>
        <div>
          <CardTitle className="text-base font-bold text-slate-950">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
  )
}

function InfoItem({
  icon,
  label,
  value,
  className,
}: {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className ?? ''}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
        {icon ? <span className="[&>svg]:size-3.5">{icon}</span> : null}
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function BadgeGroup({
  label,
  values,
  tone,
}: {
  label: string
  values: string[]
  tone: 'blue' | 'slate'
}) {
  const badgeClass =
    tone === 'blue'
      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase text-slate-400">{label}</div>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} className={`h-7 rounded-lg ${badgeClass}`}>
              {value}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No {label.toLowerCase()} assigned.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE'

  return (
    <Badge
      className={`h-7 rounded-lg ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
      }`}
    >
      {toTitleCase(status)}
    </Badge>
  )
}

function StorageProviderBadge({ provider }: { provider: string }) {
  const providerClass = {
    DATABASE: 'bg-blue-50 text-blue-700 ring-blue-100',
    MINIO: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    S3: 'bg-orange-50 text-orange-700 ring-orange-100',
    LOCAL: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[provider] ?? 'bg-slate-100 text-slate-700 ring-slate-200'

  return (
    <Badge className={`h-7 rounded-lg ring-1 ${providerClass}`}>
      {provider}
    </Badge>
  )
}

function EnvironmentBadge({ environment }: { environment: string }) {
  return (
    <Badge className="h-7 rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100">
      {environment}
    </Badge>
  )
}

function DeveloperLink({ label, value }: { label: string; value: string }) {
  const href = getSafeExternalHref(value)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
      {href ? (
        <a
          className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-blue-600 hover:text-blue-700"
          href={href}
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>{value}</span>
          <ExternalLinkIcon className="size-3.5 shrink-0" />
        </a>
      ) : (
        <div className="mt-2 break-all text-sm font-semibold text-slate-950">{value}</div>
      )}
    </div>
  )
}

function useWorkspaceNavigation(user: CurrentUser | undefined) {
  return useMemo(() => {
    const roles = user?.roles ?? []
    const permissions = user?.permissions ?? []
    const isAdmin = roles.includes('ADMIN')
    const isTeacher = roles.includes('TEACHER')
    const canManageCourses =
      isAdmin ||
      isTeacher ||
      permissions.some((permission) => permission.startsWith('course:'))
    const canLearn = roles.includes('STUDENT')
    const manageLabel = isAdmin ? 'Courses' : isTeacher ? 'My Courses' : 'Courses'

    return { canManageCourses, canLearn, manageLabel }
  }, [user])
}

function getSafeExternalHref(value: string) {
  if (!value) {
    return undefined
  }

  if (value.startsWith('https://') || value.startsWith('http://')) {
    return value
  }

  if (!value.startsWith('/')) {
    return undefined
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (!apiBaseUrl) {
    return undefined
  }

  try {
    return new URL(value, apiBaseUrl).toString()
  } catch {
    return undefined
  }
}

function formatBoolean(value: boolean) {
  return value ? 'Enabled' : 'Disabled'
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
