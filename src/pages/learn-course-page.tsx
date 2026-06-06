import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  BookOpenCheckIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ClockIcon,
  ImageIcon,
  LogOutIcon,
  PlayIcon,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { getCurrentUser } from '@/features/auth/auth-api'
import { useAuth } from '@/features/auth/auth-context'
import { getCourse } from '@/features/courses/course-api'
import { createFileAccessUrl } from '@/features/files/file-api'
import { getMyCourseProgress } from '@/features/learning/learning-api'
import type { LessonProgressItem } from '@/features/learning/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LearnCoursePage() {
  const params = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const courseId = Number(params.courseId)

  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  })

  const progressQuery = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => getMyCourseProgress(courseId),
    enabled: Number.isFinite(courseId),
  })

  const user = currentUserQuery.data
  const course = courseQuery.data
  const progress = progressQuery.data
  const lessons = progress?.lessons ?? []
  const displayName = user?.displayName || user?.username || 'Learner'
  const initials = displayName.slice(0, 2).toUpperCase()
  const completionPercent = Math.round((progress?.completionRate ?? 0) * 100)
  const nextLesson = lessons.find((lesson) => !lesson.completed) ?? lessons[0] ?? null

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
        <Button className="w-fit rounded-xl" variant="ghost" asChild>
          <Link to="/me/courses">
            <ArrowLeftIcon />
            My Courses
          </Link>
        </Button>

        <section className="grid overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)] lg:grid-cols-[380px_1fr]">
          <CourseCover fileId={course?.coverFileId ?? null} title={course?.title ?? 'Course'} />
          <div className="grid content-between gap-8 p-6 lg:p-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                {course?.title ?? 'Course'}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {course?.description || course?.subtitle || 'Continue the lessons in this course and track your progress.'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <CourseStat
                icon={<BookOpenCheckIcon />}
                label="Lessons"
                value={progress ? `${progress.completedLessons}/${progress.totalLessons}` : '-'}
              />
              <CourseStat icon={<CheckCircle2Icon />} label="Completion" value={`${completionPercent}%`} />
              <CourseStat
                icon={<ClockIcon />}
                label="Next"
                value={nextLesson ? formatDuration(nextLesson.durationSeconds) : '-'}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-medium">
                <span>Course progress</span>
                <span className="text-blue-600">{completionPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-950">Lessons</h2>
              <p className="mt-1 text-sm text-slate-500">Open a lesson to continue learning.</p>
            </div>
            {nextLesson ? (
              <Button className="rounded-xl" asChild>
                <Link to={`/learn/lessons/${nextLesson.lessonId}`}>
                  <PlayIcon />
                  Continue
                </Link>
              </Button>
            ) : null}
          </div>

          {progressQuery.isLoading ? (
            <LessonsLoading />
          ) : progressQuery.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-background p-6 text-sm text-destructive">
              Unable to load lessons.
            </div>
          ) : lessons.length ? (
            <div className="grid gap-3">
              {lessons.map((lesson, index) => (
                <LessonRow key={lesson.lessonId} lesson={lesson} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
              No lessons available yet.
            </div>
          )}
        </section>
      </div>
    </main>
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
      <div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 text-slate-300">
        <ImageIcon className="size-12" />
      </div>
    )
  }

  return <img className="h-full min-h-64 w-full object-cover" src={coverUrlQuery.data.url} alt={title} />
}

function CourseStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <span className="[&>svg]:size-5">{icon}</span>
      </div>
      <div>
        <div className="text-lg font-bold text-slate-950">{value}</div>
        <div className="text-xs font-medium text-slate-500">{label}</div>
      </div>
    </div>
  )
}

function LessonRow({ lesson, index }: { lesson: LessonProgressItem; index: number }) {
  const percent = progressPercent(lesson)

  return (
    <Link
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40 md:grid-cols-[auto_1fr_auto]"
      to={`/learn/lessons/${lesson.lessonId}`}
    >
      <div className={`flex size-11 items-center justify-center rounded-xl ${lesson.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
        {lesson.completed ? <CheckCircle2Icon className="size-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-950">{lesson.title}</h3>
          {lesson.completed ? (
            <Badge className="rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-50">
              Completed
            </Badge>
          ) : null}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
          </div>
          <span className="w-10 text-right text-xs font-bold text-slate-500">{percent}%</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-500">
        <ClockIcon className="size-4" />
        {formatDuration(lesson.progressSeconds)} / {formatDuration(lesson.durationSeconds)}
      </div>
    </Link>
  )
}

function LessonsLoading() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-5 w-1/2 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-2 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
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
