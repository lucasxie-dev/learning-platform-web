import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ImageIcon,
  LogOutIcon,
  PlayIcon,
  SparklesIcon,
  TrophyIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { getCurrentUser } from '@/features/auth/auth-api'
import { useAuth } from '@/features/auth/auth-context'
import { createFileAccessUrl } from '@/features/files/file-api'
import { listMyCourses } from '@/features/learning/learning-api'
import type { MyCourse } from '@/features/learning/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MyCoursesPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })
  const myCoursesQuery = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => listMyCourses(0, 50),
  })

  const courses = myCoursesQuery.data?.items ?? []
  const stats = useMemo(() => getLearningStats(courses), [courses])
  const displayName =
    currentUserQuery.data?.displayName ||
    currentUserQuery.data?.username ||
    'Learner'
  const initials = displayName.slice(0, 2).toUpperCase()

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
                  {currentUserQuery.data?.avatarUrl ? (
                    <AvatarImage src={currentUserQuery.data.avatarUrl} alt={displayName} />
                  ) : null}
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
        <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-[#f5f8ff] to-[#eef4ff] px-8 py-8 shadow-[0_18px_48px_rgba(15,23,42,0.05)] lg:px-10">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              My <span className="text-blue-600">Courses</span>
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Continue enrolled courses, track lesson completion, and jump back into your latest
              learning flow.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3 lg:max-w-3xl">
            <HeroStat icon={<BookOpenCheckIcon />} label="Enrolled" value={stats.totalCourses} />
            <HeroStat icon={<TrophyIcon />} label="Completed lessons" value={stats.completedLessons} />
            <HeroStat icon={<SparklesIcon />} label="Average progress" value={`${stats.averageProgress}%`} />
          </div>
        </section>

        {myCoursesQuery.isLoading ? (
          <CoursesLoading />
        ) : myCoursesQuery.isError ? (
          <div className="rounded-3xl border border-destructive/30 bg-white p-6 text-sm text-destructive shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            Unable to load enrolled courses.
          </div>
        ) : courses.length ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <MyCourseCard key={course.enrollmentId} course={course} />
              ))}
          </section>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  )
}

function MyCourseCard({ course }: { course: MyCourse }) {
  const progress = Math.round(course.completionRate * 100)

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_52px_rgba(37,99,235,0.12)]">
      <div className="relative">
        <CourseCover course={course} />
        <Badge className="absolute left-4 top-4 rounded-lg bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50">
          Enrolled
        </Badge>
        <div className="absolute bottom-4 right-4 rounded-xl bg-white/95 px-3 py-2 text-sm font-bold text-slate-950 shadow-lg ring-1 ring-slate-200">
          {progress}%
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div>
          <h2 className="line-clamp-1 text-xl font-bold tracking-tight text-slate-950">{course.title}</h2>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
            {course.subtitle ?? 'Continue your learning path and complete the next lesson.'}
          </p>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">Course progress</span>
            <span className="font-bold text-slate-950">
              {course.completedLessons}/{course.totalLessons} lessons
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-100">
            Enrolled {formatDate(course.enrolledAt)}
          </Badge>
          {course.lastStudiedAt ? (
            <Badge className="rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-50">
              Last studied {formatDate(course.lastStudiedAt)}
            </Badge>
          ) : (
            <Badge className="rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100 hover:bg-amber-50">
              Not started
            </Badge>
          )}
        </div>

        <Button className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700" asChild>
          <Link to={`/learn/courses/${course.courseId}`}>
            <PlayIcon />
            Continue learning
          </Link>
        </Button>
      </div>
    </div>
  )
}

function CourseCover({ course }: { course: MyCourse }) {
  const coverUrlQuery = useQuery({
    queryKey: ['file-access-url', course.coverFileId],
    queryFn: () => createFileAccessUrl(Number(course.coverFileId)),
    enabled: Boolean(course.coverFileId),
    staleTime: 60_000,
  })

  if (!coverUrlQuery.data?.url) {
    return (
      <div className="flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 text-slate-300">
        <ImageIcon className="size-10" />
      </div>
    )
  }

  return (
    <img
      alt={course.title}
      className="aspect-[16/8] w-full object-cover"
      src={coverUrlQuery.data.url}
    />
  )
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <span className="[&>svg]:size-5">{icon}</span>
        </div>
        <div>
          <div className="text-xl font-bold text-slate-950">{value}</div>
          <div className="text-xs font-medium text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

function CoursesLoading() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="aspect-[16/8] animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-5 h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-3 h-4 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <BookOpenCheckIcon className="size-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-slate-950">No enrolled courses yet.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Browse the published catalog and enroll in a course to start tracking your progress here.
      </p>
      <Button className="mt-6 rounded-xl" asChild>
        <Link to="/learn/courses">Explore courses</Link>
      </Button>
    </div>
  )
}

function getLearningStats(courses: MyCourse[]) {
  const totalCourses = courses.length
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0)
  const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0)
  const averageProgress = totalCourses
    ? Math.round(
        courses.reduce((sum, course) => sum + course.completionRate, 0) / totalCourses * 100,
      )
    : 0

  return {
    totalCourses,
    totalLessons,
    completedLessons,
    averageProgress,
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}
