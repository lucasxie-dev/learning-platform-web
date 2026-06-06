import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ClockIcon,
  FileTextIcon,
  LogOutIcon,
  PlayIcon,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { getCurrentUser } from '@/features/auth/auth-api'
import { useAuth } from '@/features/auth/auth-context'
import { getCourse } from '@/features/courses/course-api'
import { createFileAccessUrl } from '@/features/files/file-api'
import { getLesson } from '@/features/lessons/lesson-api'
import { MarkdownPreview } from '@/features/lessons/markdown-preview'
import {
  completeLesson,
  getMyCourseProgress,
} from '@/features/learning/learning-api'
import type { LessonProgressItem } from '@/features/learning/types'
import { getApiErrorMessage } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LearnLessonPage() {
  const params = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuth()
  const lessonId = Number(params.lessonId)

  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })

  const lessonQuery = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId),
    enabled: Number.isFinite(lessonId),
  })

  const courseId = lessonQuery.data?.courseId
  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(Number(courseId)),
    enabled: Boolean(courseId),
  })

  const progressQuery = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => getMyCourseProgress(Number(courseId)),
    enabled: Boolean(courseId),
  })

  const lesson = lessonQuery.data
  const course = courseQuery.data
  const lessons = progressQuery.data?.lessons ?? []
  const currentProgress = useMemo(() => {
    return lessons.find((item) => item.lessonId === lessonId) ?? null
  }, [lessonId, lessons])
  const currentIndex = lessons.findIndex((item) => item.lessonId === lessonId)
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] ?? null : null
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const lessonPercent = currentProgress ? progressPercent(currentProgress) : 0

  const audioUrlQuery = useSignedMediaUrl(lesson?.audioFileId)
  const videoUrlQuery = useSignedMediaUrl(lesson?.videoFileId)
  const subtitleUrlQuery = useSignedMediaUrl(lesson?.subtitleFileId)

  const completeMutation = useMutation({
    mutationFn: completeLesson,
    onSuccess: () => {
      toast.success('Lesson completed')
      void queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const user = currentUserQuery.data
  const displayName = user?.displayName || user?.username || 'Learner'
  const initials = displayName.slice(0, 2).toUpperCase()
  const courseHref = courseId ? `/learn/courses/${courseId}` : '/me/courses'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-svh bg-[#f8fbff] text-slate-950">
      <header className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-[1480px] items-center gap-6 px-5 py-5">
          <Link className="flex items-center gap-3 pr-8 lg:border-r lg:border-slate-200" to="/dashboard">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]">
              <BookOpenIcon className="size-6" />
            </div>
            <span className="hidden text-xl font-bold tracking-tight sm:block">Learning Platform</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link className="px-2 py-5 hover:text-blue-600" to="/learn/courses">
              Learn
            </Link>
            <Link className="border-b-2 border-blue-600 px-2 py-5 text-blue-600" to="/me/courses">
              My Courses
            </Link>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-auto flex h-11 items-center gap-2 rounded-2xl bg-slate-50 px-2.5 ring-1 ring-slate-200 transition hover:bg-slate-100">
                <Avatar>
                  {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={displayName} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">{displayName}</span>
                <ChevronDownIcon className="size-4 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem className="cursor-pointer gap-2 px-3 py-2" onClick={handleLogout}>
                <LogOutIcon className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] gap-5 px-5 py-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Button className="mt-0.5 size-10 shrink-0 rounded-xl" variant="outline" size="icon" asChild>
                <Link to={courseHref} title="Back to course">
                  <ArrowLeftIcon />
                </Link>
              </Button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    {lesson?.title ?? 'Lesson'}
                  </h1>
                  {currentProgress?.completed ? (
                    <Badge className="rounded-lg bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-50">
                      Completed
                    </Badge>
                  ) : (
                    <Badge className="rounded-lg bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50">
                      In progress
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500">{course?.title ?? 'Learning lesson'}</p>
              </div>
            </div>

            <Button
              className="self-start rounded-xl lg:self-center"
              disabled={!currentProgress || currentProgress.completed || completeMutation.isPending}
              onClick={() => currentProgress ? completeMutation.mutate(currentProgress.lessonId) : undefined}
            >
              <CheckCircle2Icon />
              {currentProgress?.completed ? 'Completed' : 'Mark complete'}
            </Button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="grid gap-5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              {lessonQuery.isLoading ? (
                <div className="grid gap-4 p-5">
                  <div className="aspect-video animate-pulse rounded-2xl bg-slate-100" />
                  <div className="h-5 w-1/2 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                </div>
              ) : lesson && currentProgress ? (
                <div className="grid gap-5 p-5">
                  {videoUrlQuery.data?.url ? (
                    <video
                      className="max-h-[620px] w-full rounded-2xl border bg-black"
                      controls
                      src={videoUrlQuery.data.url}
                    >
                      {subtitleUrlQuery.data?.url ? (
                        <track kind="subtitles" src={subtitleUrlQuery.data.url} />
                      ) : null}
                    </video>
                  ) : null}

                  {audioUrlQuery.data?.url ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <audio className="w-full" controls src={audioUrlQuery.data.url} />
                    </div>
                  ) : null}

                  {!videoUrlQuery.data?.url && !audioUrlQuery.data?.url ? (
                    <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed bg-slate-50 text-sm text-slate-500">
                      No media files are attached to this lesson.
                    </div>
                  ) : null}

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Lesson progress</span>
                      <span className="text-blue-600">{lessonPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${lessonPercent}%` }} />
                    </div>
                  </div>

                  {subtitleUrlQuery.data?.url ? (
                    <Button className="w-fit rounded-xl" variant="outline" asChild>
                      <a href={subtitleUrlQuery.data.url} target="_blank" rel="noreferrer">
                        <FileTextIcon />
                        Open subtitle
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Enroll in this course before opening the lesson.
                </div>
              )}
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <h2 className="font-bold text-slate-950">Lesson notes</h2>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                {lesson ? (
                  <MarkdownPreview markdown={lesson.contentMarkdown ?? lesson.description} />
                ) : (
                  <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                )}
              </div>
            </section>
          </section>

          <aside className="grid content-start gap-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-950">Course lessons</h2>
                  <p className="mt-1 text-sm text-slate-500">Continue another lesson.</p>
                </div>
                <Badge className="rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-100">
                  {lessons.length}
                </Badge>
              </div>

              {progressQuery.isLoading ? (
                <LessonsLoading />
              ) : lessons.length ? (
                <div className="grid gap-2">
                  {lessons.map((lessonItem, index) => (
                    <LessonNavItem
                      key={lessonItem.lessonId}
                      lesson={lessonItem}
                      index={index}
                      active={lessonItem.lessonId === lessonId}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
                  No lesson progress loaded.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 shadow-[0_18px_48px_rgba(37,99,235,0.06)]">
              <h2 className="font-bold text-blue-700">Up Next</h2>
              <div className="mt-4 grid gap-2">
                <Button className="justify-start rounded-xl" variant="outline" disabled={!previousLesson} asChild={Boolean(previousLesson)}>
                  {previousLesson ? (
                    <Link to={`/learn/lessons/${previousLesson.lessonId}`}>Previous lesson</Link>
                  ) : (
                    <span>Previous lesson</span>
                  )}
                </Button>
                <Button className="justify-start rounded-xl" disabled={!nextLesson} asChild={Boolean(nextLesson)}>
                  {nextLesson ? (
                    <Link to={`/learn/lessons/${nextLesson.lessonId}`}>
                      <PlayIcon />
                      Next lesson
                    </Link>
                  ) : (
                    <span>Next lesson</span>
                  )}
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

function LessonNavItem({
  lesson,
  index,
  active,
}: {
  lesson: LessonProgressItem
  index: number
  active: boolean
}) {
  const percent = progressPercent(lesson)

  return (
    <Link
      className={`grid gap-3 rounded-2xl border p-3 transition ${
        active
          ? 'border-blue-200 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
      }`}
      to={`/learn/lessons/${lesson.lessonId}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${lesson.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
          {lesson.completed ? <CheckCircle2Icon className="size-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-bold text-slate-950">{lesson.title}</div>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <ClockIcon className="size-3.5" />
            {formatDuration(lesson.progressSeconds)} / {formatDuration(lesson.durationSeconds)}
          </div>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
    </Link>
  )
}

function LessonsLoading() {
  return (
    <div className="grid gap-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-3 h-1.5 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function useSignedMediaUrl(fileId: number | null | undefined) {
  return useQuery({
    queryKey: ['file-access-url', fileId],
    queryFn: () => createFileAccessUrl(Number(fileId)),
    enabled: Boolean(fileId),
    staleTime: 60_000,
  })
}

function progressPercent(progress: LessonProgressItem) {
  if (!progress.durationSeconds) {
    return progress.completed ? 100 : 0
  }

  return Math.min(100, Math.round((progress.progressSeconds / progress.durationSeconds) * 100))
}

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
