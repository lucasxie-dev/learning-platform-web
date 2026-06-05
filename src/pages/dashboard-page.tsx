import { useQuery } from '@tanstack/react-query'
import {
  BarChart3Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileTextIcon,
  GraduationCapIcon,
  ImageIcon,
  MoreVerticalIcon,
  PlayIcon,
  UploadCloudIcon,
  UserPlusIcon,
  UsersIcon,
  VideoIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { getCurrentUser } from '@/features/auth/auth-api'
import { getDashboard } from '@/features/dashboard/dashboard-api'
import type {
  DashboardActivity,
  DashboardCourse,
  DashboardLearning,
  DashboardMedia,
} from '@/features/dashboard/types'
import { createFileAccessUrl } from '@/features/files/file-api'
import { WorkspaceLayout } from '@/components/layout/workspace-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function DashboardPage() {
  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })

  const user = currentUserQuery.data
  const displayName = user?.displayName || user?.username || 'User'
  const roles = user?.roles ?? []
  const permissions = user?.permissions ?? []
  const isAdmin = roles.includes('ADMIN')
  const isTeacher = roles.includes('TEACHER')
  const canManageCourses =
    isAdmin ||
    isTeacher ||
    permissions.some((permission) => permission.startsWith('course:'))
  const canLearn = roles.includes('STUDENT')
  const manageLabel = isAdmin
    ? 'Courses'
    : isTeacher
      ? 'My Courses'
      : 'Courses'

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const dashboard = dashboardQuery.data
  const summary = dashboard?.summary
  const featuredCourses = dashboard?.recentCourses ?? []
  const recentLearning = dashboard?.recentLearning ?? []
  const recentMedia = dashboard?.recentMedia ?? []
  const lessonPreview = dashboard?.lessonPreview
  const recentActivities = dashboard?.recentActivities ?? []

  return (
    <WorkspaceLayout
      user={user}
      title="Learning Platform"
      description="Manage courses and track learning progress"
      activeItem="dashboard"
      canManageCourses={canManageCourses}
      canLearn={canLearn}
      manageLabel={manageLabel}
      lessonsHref="/courses"
      progressHref={recentLearning[0] ? `/learn/courses/${recentLearning[0].courseId}` : '/me/courses'}
    >
      <div className="grid gap-5 2xl:grid-cols-[1fr_320px]">
            <div className="grid gap-5">
              <section className="grid gap-5 lg:grid-cols-[1.5fr_repeat(4,minmax(140px,1fr))]">
                <WelcomeCard displayName={displayName} />
                <MetricCard icon={<BookOpenIcon />} label="Courses" tone="blue" value={summary?.totalCourses ?? 0} delta={`${summary?.publishedCourses ?? 0} published`} />
                <MetricCard icon={<FileTextIcon />} label="Lessons" tone="purple" value={summary?.totalLessons ?? 0} delta={`${summary?.draftCourses ?? 0} draft courses`} />
                <MetricCard icon={<UsersIcon />} label="Enrollments" tone="green" value={summary?.totalEnrollments ?? 0} delta={`${summary?.totalMediaAssets ?? 0} media assets`} />
                <MetricCard icon={<BarChart3Icon />} label="Avg Completion" tone="orange" value={`${Math.round((summary?.averageCompletionRate ?? 0) * 100)}%`} delta={`${summary?.archivedCourses ?? 0} archived courses`} />
              </section>

              <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <Panel title="Recent Courses" actionLabel="View all courses" actionTo={canManageCourses ? '/courses' : '/learn/courses'}>
                  {featuredCourses.length ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {featuredCourses.map((course) => (
                        <CourseCard key={course.id} course={course} canManage={canManageCourses} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No courses available yet." />
                  )}
                </Panel>

                <Panel title="Lesson Media">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{lessonPreview?.lessonTitle ?? 'No lesson preview yet'}</h3>
                      <p className="mt-1 text-sm text-slate-500">{lessonPreview?.courseTitle ?? 'Upload media to enrich lessons'}</p>
                    </div>
                    <div className="h-16 w-28 overflow-hidden rounded-xl bg-slate-100">
                      <img className="h-full w-full object-cover" src="/images/login.jpg" alt="Lesson media" />
                    </div>
                  </div>
                  {recentMedia.length ? (
                    <div className="grid gap-3">
                      {recentMedia.slice(0, 3).map((media) => (
                        <MediaRow key={media.id} media={media} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No media assets uploaded yet." />
                  )}
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4">
                    <div className="flex items-center gap-3">
                      <UploadCloudIcon className="size-6 text-blue-600" />
                      <div>
                        <div className="text-sm font-bold">Upload new media</div>
                        <div className="text-xs text-slate-500">Drag & drop or click to upload</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Upload</Button>
                  </div>
                </Panel>
              </section>

              <section className="grid gap-5 xl:grid-cols-[0.85fr_1.6fr]">
                <Panel title="My Learning" actionLabel="View all" actionTo="/me/courses">
                  {recentLearning.length ? (
                    <div className="grid gap-5">
                      {recentLearning.map((course) => (
                        <LearningRow key={course.enrollmentId} course={course} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text={canLearn ? 'No enrolled courses yet.' : 'Student learning data is not available for this role.'} />
                  )}
                </Panel>

                <Panel title="Lesson Preview">
                  {lessonPreview ? (
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <h3 className="font-bold">{lessonPreview.lessonTitle}</h3>
                        <p className="mt-1 text-sm text-slate-500">{lessonPreview.courseTitle}</p>
                        <div className="mt-4 overflow-hidden rounded-2xl border bg-slate-950">
                          <div className="relative aspect-video">
                            <img className="h-full w-full object-cover opacity-70" src="/images/login.jpg" alt="Lesson preview" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Link className="flex size-16 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-xl" to={`/learn/lessons/${lessonPreview.lessonId}`}>
                                <PlayIcon className="ml-1 size-8 fill-current" />
                              </Link>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-white px-4 py-3 text-sm text-slate-600">
                            <span>▶</span>
                            <span>{formatDuration(lessonPreview.durationSeconds)}</span>
                            <span>1x</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Badge className="rounded-md px-1.5">CC</Badge>
                            Lesson assets
                          </div>
                          <MoreVerticalIcon className="size-5 text-slate-400" />
                        </div>
                        <div className="grid gap-4 text-sm">
                          <SubtitleLine time="Audio" text={lessonPreview.audioFileId ? `File #${lessonPreview.audioFileId}` : 'No audio bound'} active={Boolean(lessonPreview.audioFileId)} />
                          <SubtitleLine time="Video" text={lessonPreview.videoFileId ? `File #${lessonPreview.videoFileId}` : 'No video bound'} active={Boolean(lessonPreview.videoFileId)} />
                          <SubtitleLine time="Subtitle" text={lessonPreview.subtitleFileId ? `File #${lessonPreview.subtitleFileId}` : 'No subtitle bound'} active={Boolean(lessonPreview.subtitleFileId)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState text="No lesson preview available yet." />
                  )}
                </Panel>
              </section>
            </div>

            <Panel title="Recent Activity" actionLabel="View all">
              {recentActivities.length ? (
                <div className="grid gap-1">
                  {recentActivities.map((activity) => (
                    <ActivityItem key={`${activity.type}-${activity.occurredAt}-${activity.description}`} activity={activity} />
                  ))}
                </div>
              ) : (
                <EmptyState text="No recent activity yet." />
              )}
              <Button className="mt-8 w-full rounded-xl" variant="outline">
                View all activity
              </Button>
            </Panel>
      </div>
    </WorkspaceLayout>
  )
}

function WelcomeCard({ displayName }: { displayName: string }) {
  return (
    <Card className="relative min-h-[170px] overflow-hidden rounded-3xl border-slate-200/80 bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-8 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:col-span-1">
      <div className="relative z-10 max-w-sm">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {displayName} 👋</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Here&apos;s what&apos;s happening with your platform today.
        </p>
      </div>
      <img
        className="absolute bottom-0 right-2 hidden h-40 w-56 object-cover opacity-95 md:block"
        src="/images/login.jpg"
        alt=""
      />
      <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-r from-transparent to-blue-50/80" />
    </Card>
  )
}

function MetricCard({
  icon,
  label,
  tone,
  value,
  delta,
}: {
  icon: React.ReactNode
  label: string
  tone: 'blue' | 'purple' | 'green' | 'orange'
  value: number | string
  delta: string
}) {
  const toneClass = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-violet-100 text-violet-600',
    green: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
  }[tone]

  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white p-7 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className={`mb-7 flex size-14 items-center justify-center rounded-2xl ${toneClass}`}>
        <span className="[&>svg]:size-7">{icon}</span>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-slate-600">{label}</div>
      <div className="mt-4 text-sm text-emerald-600">↑ {delta}</div>
    </Card>
  )
}

function Panel({
  title,
  actionLabel,
  actionTo,
  children,
}: {
  title: string
  actionLabel?: string
  actionTo?: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        {actionLabel ? (
          actionTo ? (
            <Link className="text-sm font-medium text-blue-600 hover:text-blue-700" to={actionTo}>
              {actionLabel}
            </Link>
          ) : (
            <button className="text-sm font-medium text-blue-600">{actionLabel}</button>
          )
        ) : null}
      </div>
      {children}
    </Card>
  )
}

function CourseCard({
  course,
  canManage,
}: {
  course: DashboardCourse
  canManage: boolean
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="relative">
        <CourseCover fileId={course.coverFileId} title={course.title} />
        <Badge className={`absolute right-3 top-3 rounded-lg ${getStatusClass(course.status)}`}>
          {toTitleCase(course.status)}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-bold">{course.title}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
          {course.subtitle ?? 'Build essential skills with structured lessons.'}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FileTextIcon className="size-3.5" />
            {course.lessonCount} Lessons
          </span>
          <span className="flex items-center gap-1">
            <UsersIcon className="size-3.5" />
            {course.enrollmentCount} Enrollments
          </span>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button className="h-9 flex-1 rounded-xl" variant="outline" asChild>
            <Link to={canManage ? `/courses/${course.id}/lessons` : `/learn/courses/${course.id}`}>
              {canManage ? 'Edit' : 'Open'}
            </Link>
          </Button>
          <Button className="h-9 flex-1 rounded-xl" asChild>
            <Link to={canManage ? `/courses/${course.id}/lessons` : `/learn/courses/${course.id}`}>
              View
            </Link>
          </Button>
          <Button className="size-9 rounded-xl" variant="ghost">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function CourseCover({ fileId, title }: { fileId: number | null; title: string }) {
  const coverUrlQuery = useQuery({
    queryKey: ['file-access-url', fileId],
    queryFn: () => createFileAccessUrl(Number(fileId)),
    enabled: Boolean(fileId),
    staleTime: 60_000,
  })

  if (!coverUrlQuery.data?.url) {
    return (
      <div className="flex aspect-[4/2.35] items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 text-slate-400">
        <ImageIcon className="size-8" />
      </div>
    )
  }

  return (
    <img
      alt={title}
      className="aspect-[4/2.35] w-full object-cover"
      src={coverUrlQuery.data.url}
    />
  )
}

function MediaRow({ media }: { media: DashboardMedia }) {
  const { icon, toneClass } = getMediaMeta(media.assetType)

  return (
    <div className="flex items-center gap-3 rounded-2xl border p-3">
      <div className={`flex size-11 items-center justify-center rounded-xl ${toneClass}`}>
        <span className="[&>svg]:size-5">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{media.originalName}</div>
        <div className="text-xs text-slate-500">{toTitleCase(media.assetType.replaceAll('_', ' '))} · {formatBytes(media.sizeBytes)}</div>
      </div>
      <span className="text-xs text-emerald-600">✓ Ready</span>
      <Button className="h-8 rounded-lg" variant="outline" size="sm">Preview</Button>
      <Button className="h-8 rounded-lg" variant="outline" size="sm">Replace</Button>
      <MoreVerticalIcon className="size-4 text-slate-400" />
    </div>
  )
}

function LearningRow({ course }: { course: DashboardLearning }) {
  const progress = Math.round(course.completionRate * 100)

  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
        <CourseCover fileId={course.coverFileId} title={course.title} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 font-bold">{course.title}</h3>
        <p className="mt-1 text-sm text-slate-500">Continue learning</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <span className="w-10 text-sm font-bold">{progress}%</span>
        </div>
      </div>
      <Button className="rounded-xl" asChild>
        <Link to={`/learn/courses/${course.courseId}`}>Continue</Link>
      </Button>
    </div>
  )
}

function SubtitleLine({
  time,
  text,
  active,
}: {
  time: string
  text: string
  active?: boolean
}) {
  return (
    <div className="grid grid-cols-[52px_1fr] gap-3">
      <span className="text-slate-400">{time}</span>
      <span className={`rounded-xl px-4 py-3 leading-6 ${active ? 'bg-blue-50' : ''}`}>
        {text}
      </span>
    </div>
  )
}

function ActivityItem({ activity }: { activity: DashboardActivity }) {
  const { icon, toneClass } = getActivityMeta(activity.type)

  return (
    <div className="flex gap-4 border-b py-4 last:border-0">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
        <span className="[&>svg]:size-5">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold">{activity.title}</h3>
          <span className="shrink-0 text-xs text-slate-400">{formatRelativeTime(activity.occurredAt)}</span>
        </div>
        <p className="mt-1 text-sm leading-5 text-slate-500">{activity.description}</p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}

function getMediaMeta(assetType: DashboardMedia['assetType']) {
  if (assetType === 'LESSON_VIDEO') {
    return {
      icon: <VideoIcon />,
      toneClass: 'bg-blue-100 text-blue-600',
    }
  }

  if (assetType === 'LESSON_AUDIO') {
    return {
      icon: <BookOpenIcon />,
      toneClass: 'bg-violet-100 text-violet-600',
    }
  }

  if (assetType === 'SUBTITLE') {
    return {
      icon: <FileTextIcon />,
      toneClass: 'bg-orange-100 text-orange-600',
    }
  }

  return {
    icon: <ImageIcon />,
    toneClass: 'bg-emerald-100 text-emerald-600',
  }
}

function getActivityMeta(type: DashboardActivity['type']) {
  if (type === 'ENROLLMENT') {
    return {
      icon: <UserPlusIcon />,
      toneClass: 'bg-blue-100 text-blue-600',
    }
  }

  if (type === 'LESSON_COMPLETED') {
    return {
      icon: <GraduationCapIcon />,
      toneClass: 'bg-violet-100 text-violet-600',
    }
  }

  if (type === 'MEDIA') {
    return {
      icon: <UploadCloudIcon />,
      toneClass: 'bg-orange-100 text-orange-600',
    }
  }

  if (type === 'PROGRESS') {
    return {
      icon: <Clock3Icon />,
      toneClass: 'bg-emerald-100 text-emerald-600',
    }
  }

  return {
    icon: <CheckCircle2Icon />,
    toneClass: 'bg-emerald-100 text-emerald-600',
  }
}

function formatDuration(durationSeconds: number | null) {
  if (!durationSeconds) {
    return 'Duration not set'
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`
  }

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  return `${Math.floor(diffHours / 24)}d ago`
}

function getStatusClass(status: string) {
  if (status === 'PUBLISHED') {
    return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
  }

  if (status === 'ARCHIVED') {
    return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
  }

  return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
