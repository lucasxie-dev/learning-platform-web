import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileTextIcon,
  GraduationCapIcon,
  ImageIcon,
  UploadCloudIcon,
  UserPlusIcon,
  UsersIcon,
  VideoIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { getCurrentUser } from '@/features/auth/auth-api'
import { getDashboard } from '@/features/dashboard/dashboard-api'
import type {
  DashboardActivity,
  DashboardCourse,
  DashboardLearning,
  DashboardMedia,
} from '@/features/dashboard/types'
import { createFileAccessUrl } from '@/features/files/file-api'
import { enrollCourse, listMyCourses } from '@/features/learning/learning-api'
import { getApiErrorMessage } from '@/lib/api'
import { WorkspaceLayout } from '@/components/layout/workspace-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function DashboardPage() {
  const queryClient = useQueryClient()

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

  const myCoursesQuery = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => listMyCourses(0, 100),
    enabled: canLearn,
  })

  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      toast.success('Course enrolled')
      void queryClient.invalidateQueries({ queryKey: ['my-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const dashboard = dashboardQuery.data
  const summary = dashboard?.summary
  const featuredCourses = dashboard?.recentCourses ?? []
  const recentLearning = dashboard?.recentLearning ?? []
  const recentMedia = dashboard?.recentMedia ?? []
  const lessonPreview = dashboard?.lessonPreview
  const recentActivities = dashboard?.recentActivities ?? []
  const enrolledCourseIds = new Set(
    (myCoursesQuery.data?.items ?? recentLearning).map((course) => course.courseId),
  )
  const isStudentDashboard = canLearn && !canManageCourses
  const displayCourses = isStudentDashboard
    ? featuredCourses.filter((course) => !enrolledCourseIds.has(course.id))
    : featuredCourses
  const coursesPanelTitle = isStudentDashboard ? 'Explore Courses' : 'Recent Courses'
  const coursesPanelActionLabel = isStudentDashboard ? 'Browse catalog' : 'View all courses'
  const coursesPanelEmptyText = isStudentDashboard
    ? 'No available courses to explore right now.'
    : 'No courses available yet.'
  const dashboardGridClass = canManageCourses
    ? 'grid gap-5 2xl:grid-cols-[1fr_320px]'
    : 'grid gap-5'

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
    >
      <div className={dashboardGridClass}>
            <div className="grid gap-5">
              <section className="grid gap-5 lg:grid-cols-[1.5fr_repeat(4,minmax(140px,1fr))]">
                <WelcomeCard displayName={displayName} />
                <MetricCard icon={<BookOpenIcon />} label="Courses" tone="blue" value={summary?.totalCourses ?? 0} delta={`${summary?.publishedCourses ?? 0} published`} />
                <MetricCard icon={<FileTextIcon />} label="Lessons" tone="purple" value={summary?.totalLessons ?? 0} delta={`${summary?.draftCourses ?? 0} draft courses`} />
                <MetricCard icon={<UsersIcon />} label="Enrollments" tone="green" value={summary?.totalEnrollments ?? 0} delta={`${summary?.totalMediaAssets ?? 0} media assets`} />
                <MetricCard icon={<BarChart3Icon />} label="Avg Completion" tone="orange" value={`${Math.round((summary?.averageCompletionRate ?? 0) * 100)}%`} delta={`${summary?.archivedCourses ?? 0} archived courses`} />
              </section>

              {canLearn && !canManageCourses ? (
                <>
                  <section className="grid gap-5">
                    <Panel title="My Learning" actionLabel="View all" actionTo="/me/courses">
                      {recentLearning.length ? (
                        <div className="grid gap-5">
                          {recentLearning.map((course) => (
                            <LearningRow key={course.enrollmentId} course={course} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState text="No enrolled courses yet." />
                      )}
                    </Panel>
                  </section>

                  <section className="grid gap-5">
                    <Panel title={coursesPanelTitle} actionLabel={coursesPanelActionLabel} actionTo="/learn/courses">
                      {displayCourses.length ? (
                        <div className="grid gap-4 md:grid-cols-3">
                          {displayCourses.map((course) => (
                            <CourseCard
                              key={course.id}
                              course={course}
                              canManage={canManageCourses}
                              canLearn={canLearn}
                              isEnrolled={enrolledCourseIds.has(course.id)}
                              isEnrolling={enrollMutation.isPending}
                              showStatusBadge={canManageCourses}
                              onEnroll={() => enrollMutation.mutate(course.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState text={coursesPanelEmptyText} />
                      )}
                    </Panel>
                  </section>
                </>
              ) : (
                <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <Panel
                    title={coursesPanelTitle}
                    actionLabel={coursesPanelActionLabel}
                    actionTo={canManageCourses ? '/courses' : '/learn/courses'}
                    className="xl:h-[460px] xl:overflow-hidden"
                  >
                    {displayCourses.length ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        {displayCourses.slice(0, 3).map((course) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            canManage={canManageCourses}
                            canLearn={canLearn}
                            isEnrolled={enrolledCourseIds.has(course.id)}
                            isEnrolling={enrollMutation.isPending}
                            showStatusBadge={canManageCourses}
                            onEnroll={() => enrollMutation.mutate(course.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text={coursesPanelEmptyText} />
                    )}
                  </Panel>

                  <Panel title="Lesson Media" className="xl:h-[460px] xl:overflow-hidden">
                    <div className="mb-5 flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold">{lessonPreview?.lessonTitle ?? 'No lesson preview yet'}</h3>
                        <p className="mt-1 text-sm text-slate-500">{lessonPreview?.courseTitle ?? 'Recent lesson media will appear here'}</p>
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
                  </Panel>
                </section>
              )}

              {canManageCourses ? (
                <section className="grid gap-5">
                  <Panel title="Lesson Assets">
                  {lessonPreview ? (
                    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                          <FileTextIcon className="size-6" />
                        </div>
                        <h3 className="mt-5 text-lg font-bold text-slate-950">{lessonPreview.lessonTitle}</h3>
                        <p className="mt-1 text-sm text-slate-500">{lessonPreview.courseTitle}</p>
                        <div className="mt-5 grid gap-3 text-sm">
                          <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                            <span className="text-slate-500">Duration</span>
                            <span className="font-semibold text-slate-950">{formatDuration(lessonPreview.durationSeconds)}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                            <span className="text-slate-500">Lesson ID</span>
                            <span className="font-semibold text-slate-950">#{lessonPreview.lessonId}</span>
                          </div>
                        </div>
                        <Button className="mt-5 rounded-xl" variant="outline" asChild>
                          <Link to={`/courses/${lessonPreview.courseId}/lessons`}>Manage lesson</Link>
                        </Button>
                      </div>

                      <div className="grid content-start gap-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                          <Badge className="rounded-md px-1.5">CC</Badge>
                          Bound assets
                        </div>
                        <AssetStatusRow label="Audio" fileId={lessonPreview.audioFileId} />
                        <AssetStatusRow label="Video" fileId={lessonPreview.videoFileId} />
                        <AssetStatusRow label="Subtitle" fileId={lessonPreview.subtitleFileId} />
                      </div>
                    </div>
                  ) : (
                    <EmptyState text="No lesson preview available yet." />
                  )}
                  </Panel>
                </section>
              ) : null}
            </div>

            {canManageCourses ? (
              <Panel title="Recent Activity" className="2xl:h-[520px] 2xl:overflow-hidden">
              {recentActivities.length ? (
                <div className="grid gap-2">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <ActivityItem key={`${activity.type}-${activity.occurredAt}-${activity.description}`} activity={activity} />
                  ))}
                </div>
              ) : (
                <EmptyState text="No recent activity yet." />
              )}
              </Panel>
            ) : null}
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
  className = '',
  children,
}: {
  title: string
  actionLabel?: string
  actionTo?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={`rounded-3xl border-slate-200/80 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] ${className}`}>
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
  canLearn,
  isEnrolled,
  isEnrolling,
  showStatusBadge,
  onEnroll,
}: {
  course: DashboardCourse
  canManage: boolean
  canLearn: boolean
  isEnrolled: boolean
  isEnrolling: boolean
  showStatusBadge: boolean
  onEnroll: () => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="relative">
        <CourseCover fileId={course.coverFileId} title={course.title} />
        {showStatusBadge ? (
          <Badge className={`absolute right-3 top-3 rounded-lg ${getStatusClass(course.status)}`}>
            {toTitleCase(course.status)}
          </Badge>
        ) : null}
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
        <div className="mt-5">
          {canManage ? (
            <Button className="h-9 w-full rounded-xl" asChild>
              <Link to={`/courses/${course.id}/lessons`}>Manage</Link>
            </Button>
          ) : canLearn && !isEnrolled ? (
            <Button
              className="h-9 w-full rounded-xl"
              disabled={isEnrolling}
              variant="outline"
              onClick={onEnroll}
            >
              <UserPlusIcon />
              Enroll
            </Button>
          ) : (
            <Button className="h-9 w-full rounded-xl" asChild>
              <Link to={`/learn/courses/${course.id}`}>Open</Link>
            </Button>
          )}
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
    <div className="grid gap-3 rounded-2xl border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <span className="[&>svg]:size-5">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{media.originalName}</div>
          <div className="truncate text-xs text-slate-500">{toTitleCase(media.assetType.replaceAll('_', ' '))} · {formatBytes(media.sizeBytes)}</div>
        </div>
        <span className="shrink-0 text-xs text-emerald-600">✓ Ready</span>
      </div>
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

function AssetStatusRow({ label, fileId }: { label: string; fileId: number | null }) {
  const isBound = Boolean(fileId)

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-bold text-slate-950">{label}</div>
        <div className="mt-1 text-xs text-slate-500">{isBound ? `File #${fileId}` : 'Not bound'}</div>
      </div>
      <Badge
        className={
          isBound
            ? 'rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-50'
            : 'rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-100'
        }
      >
        {isBound ? 'Ready' : 'Missing'}
      </Badge>
    </div>
  )
}

function ActivityItem({ activity }: { activity: DashboardActivity }) {
  const { icon, toneClass } = getActivityMeta(activity.type)

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
        <span className="[&>svg]:size-4">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-sm font-bold">{activity.title}</h3>
          <span className="shrink-0 text-xs text-slate-400">{formatRelativeTime(activity.occurredAt)}</span>
        </div>
        <p className="mt-1 truncate text-sm text-slate-500">{activity.description}</p>
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
