import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  EditIcon,
  EyeIcon,
  FileAudioIcon,
  FileTextIcon,
  FilmIcon,
  ListOrderedIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { getCurrentUser } from '@/features/auth/auth-api'
import { listGlobalLessons } from '@/features/lessons/lesson-api'
import type { GlobalLessonListItem, LessonStatus } from '@/features/lessons/types'
import { WorkspaceLayout } from '@/components/layout/workspace-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const pageSize = 20
type MediaFilter = 'ALL' | 'HAS_AUDIO' | 'MISSING_AUDIO' | 'HAS_VIDEO' | 'MISSING_VIDEO' | 'HAS_SUBTITLE' | 'MISSING_SUBTITLE'

export function GlobalLessonsPage() {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<LessonStatus | 'ALL'>('ALL')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL')
  const [page, setPage] = useState(0)

  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })
  const user = currentUserQuery.data
  const navigation = useWorkspaceNavigation(user)

  const lessonsQuery = useQuery({
    queryKey: ['lessons', 'global', { keyword, status, mediaFilter, page }],
    queryFn: () =>
      listGlobalLessons({
        keyword,
        status: status === 'ALL' ? undefined : status,
        ...getMediaQuery(mediaFilter),
        page,
        size: pageSize,
      }),
    enabled: navigation.canManageCourses,
  })

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(0)
    void lessonsQuery.refetch()
  }

  function handleClearFilters() {
    setKeyword('')
    setStatus('ALL')
    setMediaFilter('ALL')
    setPage(0)
  }

  const lessons = lessonsQuery.data?.items ?? []
  const totalPages = lessonsQuery.data?.totalPages ?? 0
  const hasFilters = Boolean(keyword) || status !== 'ALL' || mediaFilter !== 'ALL'

  return (
    <WorkspaceLayout
      user={user}
      title="Lessons"
      description="Manage lessons across your courses."
      activeItem="lessons"
      canManageCourses={navigation.canManageCourses}
      canLearn={navigation.canLearn}
      manageLabel={navigation.manageLabel}
      progressHref="/me/courses"
    >
      {!navigation.canManageCourses ? (
        <ForbiddenState />
      ) : (
        <div className="grid gap-5">
          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <CardHeader className="gap-4 md:grid md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListOrderedIcon className="size-4" />
                  Lessons
                </CardTitle>
                <CardDescription>
                  Review lesson status, media readiness, and course ownership from one place.
                </CardDescription>
              </div>
              <Button className="rounded-xl" variant="outline" asChild>
                <Link to="/courses">Select a course to add lessons</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-5">
              <form className="grid gap-3 xl:grid-cols-[1fr_180px_220px_auto_auto]" onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 shadow-none"
                    placeholder="Search lessons"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                </div>
                <select
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus-visible:border-blue-300 focus-visible:ring-3 focus-visible:ring-blue-100"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as LessonStatus | 'ALL')
                    setPage(0)
                  }}
                >
                  <option value="ALL">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <select
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus-visible:border-blue-300 focus-visible:ring-3 focus-visible:ring-blue-100"
                  value={mediaFilter}
                  onChange={(event) => {
                    setMediaFilter(event.target.value as MediaFilter)
                    setPage(0)
                  }}
                >
                  <option value="ALL">All media states</option>
                  <option value="HAS_AUDIO">Has audio</option>
                  <option value="MISSING_AUDIO">Missing audio</option>
                  <option value="HAS_VIDEO">Has video</option>
                  <option value="MISSING_VIDEO">Missing video</option>
                  <option value="HAS_SUBTITLE">Has subtitle</option>
                  <option value="MISSING_SUBTITLE">Missing subtitle</option>
                </select>
                <Button className="h-11 rounded-xl" type="submit" variant="outline">
                  <SlidersHorizontalIcon />
                  Apply
                </Button>
                <Button className="h-11 rounded-xl" type="button" variant="ghost" onClick={handleClearFilters}>
                  <RotateCcwIcon />
                  Clear
                </Button>
              </form>

              {lessonsQuery.isLoading ? (
                <TableLoading label="Loading lessons..." />
              ) : lessonsQuery.isError ? (
                <ErrorState message="Unable to load lessons." onRetry={() => void lessonsQuery.refetch()} />
              ) : lessons.length ? (
                <LessonsTable lessons={lessons} />
              ) : (
                <EmptyState
                  title="No lessons found."
                  description={hasFilters ? 'Try adjusting your filters.' : 'Create a course first, then add lessons.'}
                />
              )}

              <PaginationFooter
                total={lessonsQuery.data?.total ?? 0}
                label="lessons"
                page={page}
                totalPages={totalPages}
                onPrevious={() => setPage((current) => Math.max(current - 1, 0))}
                onNext={() => setPage((current) => current + 1)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </WorkspaceLayout>
  )
}

function LessonsTable({ lessons }: { lessons: GlobalLessonListItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-600">Lesson</TableHead>
            <TableHead className="font-semibold text-slate-600">Course</TableHead>
            <TableHead className="font-semibold text-slate-600">Status</TableHead>
            <TableHead className="font-semibold text-slate-600">Media</TableHead>
            <TableHead className="font-semibold text-slate-600">Duration</TableHead>
            <TableHead className="font-semibold text-slate-600">Updated</TableHead>
            <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((lesson) => (
            <TableRow key={lesson.id} className="hover:bg-blue-50/40">
              <TableCell className="max-w-[360px] whitespace-normal py-4">
                <div className="font-semibold text-slate-950">{lesson.title}</div>
                {lesson.description ? (
                  <div className="mt-1 line-clamp-2 text-sm text-slate-500">{lesson.description}</div>
                ) : null}
                <div className="mt-1 text-xs text-slate-400">#{lesson.id} · Order {lesson.sortOrder}</div>
              </TableCell>
              <TableCell className="whitespace-normal text-slate-600">
                <Link className="font-medium text-blue-600 hover:text-blue-700" to={`/courses/${lesson.courseId}/lessons`}>
                  {lesson.courseTitle}
                </Link>
                <div className="mt-1 text-xs text-slate-400">Course #{lesson.courseId}</div>
              </TableCell>
              <TableCell>
                <StatusBadge status={lesson.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  <MediaBadge icon={<FileAudioIcon />} label="Audio" active={lesson.hasAudio} />
                  <MediaBadge icon={<FilmIcon />} label="Video" active={lesson.hasVideo} />
                  <MediaBadge icon={<FileTextIcon />} label="Subtitle" active={lesson.hasSubtitle} />
                </div>
              </TableCell>
              <TableCell className="text-slate-600">{formatDuration(lesson.durationSeconds)}</TableCell>
              <TableCell className="text-slate-600">{formatDate(lesson.updatedAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" asChild title="Edit lesson">
                    <Link to={`/courses/${lesson.courseId}/lessons`}>
                      <EditIcon />
                    </Link>
                  </Button>
                  {lesson.status === 'PUBLISHED' ? (
                    <Button variant="ghost" size="icon-sm" asChild title="Preview lesson">
                      <Link to={`/learn/lessons/${lesson.id}`}>
                        <EyeIcon />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon-sm" disabled title="Preview available after publishing">
                      <EyeIcon />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" asChild title="Manage media">
                    <Link to={`/courses/${lesson.courseId}/lessons`}>
                      <FileAudioIcon />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function useWorkspaceNavigation(user: { roles: string[]; permissions: string[] } | undefined) {
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

function getMediaQuery(mediaFilter: MediaFilter) {
  if (mediaFilter === 'HAS_AUDIO') return { hasAudio: true }
  if (mediaFilter === 'MISSING_AUDIO') return { hasAudio: false }
  if (mediaFilter === 'HAS_VIDEO') return { hasVideo: true }
  if (mediaFilter === 'MISSING_VIDEO') return { hasVideo: false }
  if (mediaFilter === 'HAS_SUBTITLE') return { hasSubtitle: true }
  if (mediaFilter === 'MISSING_SUBTITLE') return { hasSubtitle: false }

  return {}
}

function StatusBadge({ status }: { status: LessonStatus }) {
  if (status === 'PUBLISHED') {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>
  }

  if (status === 'ARCHIVED') {
    return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Archived</Badge>
  }

  return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Draft</Badge>
}

function MediaBadge({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Badge
      className={`gap-1 rounded-lg ${
        active
          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
          : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'
      }`}
    >
      {icon}
      {active ? label : `No ${label.toLowerCase()}`}
    </Badge>
  )
}

function TableLoading({ label }: { label: string }) {
  return (
    <div className="grid gap-3 rounded-2xl border bg-slate-50 p-6">
      <div className="text-sm text-slate-500">{label}</div>
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-12 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-background p-6 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <Button className="rounded-xl" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-6 text-sm text-slate-500">
      <div className="font-semibold text-slate-700">{title}</div>
      <div className="mt-1">{description}</div>
    </div>
  )
}

function ForbiddenState() {
  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="font-bold text-slate-950">Lessons are available to admins and teachers.</div>
      <p className="mt-1 text-sm text-slate-500">Your account can continue learning from the course catalog.</p>
    </Card>
  )
}

function PaginationFooter({
  total,
  label,
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  total: number
  label: string
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>Total {total} {label}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 0} onClick={onPrevious}>
          Previous
        </Button>
        <span>Page {page + 1} / {Math.max(totalPages, 1)}</span>
        <Button variant="outline" size="sm" className="rounded-xl" disabled={page + 1 >= totalPages} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  )
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) {
    return '—'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}
