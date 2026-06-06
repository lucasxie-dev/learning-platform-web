import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  ImageIcon,
  LayoutGridIcon,
  LogOutIcon,
  PlayIcon,
  SearchIcon,
  UserPlusIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { getCurrentUser } from '@/features/auth/auth-api'
import { useAuth } from '@/features/auth/auth-context'
import { listCourses } from '@/features/courses/course-api'
import type { CourseListItem } from '@/features/courses/types'
import { createFileAccessUrl } from '@/features/files/file-api'
import { enrollCourse, listMyCourses } from '@/features/learning/learning-api'
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
import { Input } from '@/components/ui/input'

const pageSize = 9
type CatalogFilter = 'ALL' | 'ENROLLED' | 'AVAILABLE'

export function LearnCoursesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('ALL')
  const [page, setPage] = useState(0)

  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })

  const coursesQuery = useQuery({
    queryKey: ['learn-courses', { keyword, page }],
    queryFn: () => listCourses({ keyword, status: 'PUBLISHED', page, size: pageSize }),
  })

  const myCoursesQuery = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => listMyCourses(0, 100),
  })

  const enrolledCourseIds = useMemo(() => {
    const myCourses = myCoursesQuery.data?.items ?? []

    return new Set(myCourses.map((course) => course.courseId))
  }, [myCoursesQuery.data?.items])

  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      toast.success('Course enrolled')
      void queryClient.invalidateQueries({ queryKey: ['my-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['learn-courses'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(0)
    void coursesQuery.refetch()
  }

  function handleClearFilters() {
    setKeyword('')
    setCatalogFilter('ALL')
    setPage(0)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const courses = coursesQuery.data?.items ?? []
  const visibleCourses = courses.filter((course) => {
    if (catalogFilter === 'ENROLLED') {
      return enrolledCourseIds.has(course.id)
    }

    if (catalogFilter === 'AVAILABLE') {
      return !enrolledCourseIds.has(course.id)
    }

    return true
  })
  const totalPages = coursesQuery.data?.totalPages ?? 0
  const displayName =
    currentUserQuery.data?.displayName ||
    currentUserQuery.data?.username ||
    'Learner'
  const initials = displayName.slice(0, 2).toUpperCase()
  const hasFilters = Boolean(keyword) || catalogFilter !== 'ALL'
  const roles = currentUserQuery.data?.roles ?? []
  const permissions = currentUserQuery.data?.permissions ?? []
  const canViewCourseStatus =
    roles.includes('ADMIN') ||
    roles.includes('TEACHER') ||
    permissions.some((permission) => permission.startsWith('course:'))

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
            <Link className="border-b-2 border-blue-600 px-2 py-5 text-blue-600" to="/learn/courses">
              Learn
            </Link>
            <Link className="px-2 py-5 hover:text-blue-600" to="/me/courses">
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
        <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-[#f5f8ff] to-[#eef4ff] px-8 py-10 shadow-[0_18px_48px_rgba(15,23,42,0.05)] lg:px-16">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Explore <span className="text-blue-600">Courses</span>
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Discover published courses across languages and skills. Find the perfect course and
              start learning today.
            </p>
          </div>
          <div className="absolute bottom-0 right-6 hidden h-full w-[48%] items-end justify-end lg:flex">
            <div className="mb-8 mr-24 flex size-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl">
              <GraduationCapIcon className="size-8" />
            </div>
            <img
              className="absolute bottom-0 right-20 h-56 w-72 object-cover opacity-95"
              src="/images/login.jpg"
              alt=""
            />
            <div className="absolute right-5 top-10 w-44 rounded-2xl bg-white p-4 shadow-[0_18px_48px_rgba(37,99,235,0.14)] ring-1 ring-slate-200">
              <div className="text-xs font-bold text-slate-950">Your Progress</div>
              <div className="mt-4 h-12 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50" />
              <div className="mt-2 text-right text-sm font-bold text-emerald-600">+34%</div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Refine your search</h2>
              <button className="text-xs font-semibold text-blue-600" type="button" onClick={handleClearFilters}>
                Clear all
              </button>
            </div>

            <form className="mt-6 grid gap-3" onSubmit={handleSearchSubmit}>
              <label className="text-sm font-bold text-slate-700" htmlFor="course-search">
                Search
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="course-search"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-none"
                  placeholder="Search courses..."
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
              <Button className="rounded-xl" type="submit" variant="outline">
                Search
              </Button>
            </form>

            <div className="mt-7 grid gap-3">
              <div className="text-sm font-bold text-slate-700">Catalog</div>
              <FilterOption
                active={catalogFilter === 'ALL'}
                label="All Courses"
                value={courses.length}
                onClick={() => setCatalogFilter('ALL')}
              />
              <FilterOption
                active={catalogFilter === 'ENROLLED'}
                label="Enrolled"
                value={courses.filter((course) => enrolledCourseIds.has(course.id)).length}
                onClick={() => setCatalogFilter('ENROLLED')}
              />
              <FilterOption
                active={catalogFilter === 'AVAILABLE'}
                label="Available"
                value={courses.filter((course) => !enrolledCourseIds.has(course.id)).length}
                onClick={() => setCatalogFilter('AVAILABLE')}
              />
            </div>

          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <Chip active={catalogFilter === 'ALL'} icon={<LayoutGridIcon />} onClick={() => setCatalogFilter('ALL')}>
                  All Courses
                </Chip>
                <Chip active={catalogFilter === 'ENROLLED'} icon={<CheckIcon />} onClick={() => setCatalogFilter('ENROLLED')}>
                  Enrolled
                </Chip>
                <Chip active={catalogFilter === 'AVAILABLE'} icon={<UserPlusIcon />} onClick={() => setCatalogFilter('AVAILABLE')}>
                  Available
                </Chip>
              </div>
              <div className="text-sm font-medium text-slate-500">
                {coursesQuery.data?.total ?? 0} courses found
              </div>
            </div>

            {coursesQuery.isLoading ? (
              <CoursesLoading />
            ) : coursesQuery.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-background p-6 text-sm text-destructive">
                Unable to load course catalog.
              </div>
            ) : visibleCourses.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleCourses.map((course) => (
                  <CourseCatalogCard
                    key={course.id}
                    course={course}
                    isEnrolled={enrolledCourseIds.has(course.id)}
                    isEnrolling={enrollMutation.isPending}
                    showStatusBadge={canViewCourseStatus}
                    onEnroll={() => enrollMutation.mutate(course.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-slate-50 p-6 text-sm text-slate-500">
                <div className="font-semibold text-slate-700">No published courses found.</div>
                <div className="mt-1">
                  {hasFilters ? 'Try adjusting your filters.' : 'Published courses will appear here.'}
                </div>
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              onPrevious={() => setPage((current) => Math.max(current - 1, 0))}
              onNext={() => setPage((current) => current + 1)}
            />
          </section>
        </div>
      </div>
    </main>
  )
}

function CourseCatalogCard({
  course,
  isEnrolled,
  isEnrolling,
  showStatusBadge,
  onEnroll,
}: {
  course: CourseListItem
  isEnrolled: boolean
  isEnrolling: boolean
  showStatusBadge: boolean
  onEnroll: () => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(37,99,235,0.12)]">
      <div className="relative">
        <CourseCover fileId={course.coverFileId} title={course.title} />
        {showStatusBadge ? (
          <Badge className="absolute left-4 top-4 rounded-lg bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-50">
            Published
          </Badge>
        ) : null}
        <Badge className="absolute right-4 top-4 rounded-lg bg-white/90 px-3 py-1 text-slate-600 ring-1 ring-slate-200 hover:bg-white">
          Course
        </Badge>
      </div>
      <div className="grid gap-4 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-bold text-slate-950">{course.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
            {course.subtitle ?? 'Build practical skills with structured lessons.'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <BookOpenIcon className="size-3.5" />
            Course #{course.id}
          </span>
          {course.publishedAt ? <span>{formatDate(course.publishedAt)}</span> : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          {isEnrolled ? (
            <Badge className="rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50">
              Enrolled
            </Badge>
          ) : (
            <Badge className="rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-100">
              Available
            </Badge>
          )}

          {isEnrolled ? (
            <Button className="h-10 min-w-28 rounded-xl bg-blue-600 hover:bg-blue-700" asChild>
              <Link to={`/learn/courses/${course.id}`}>
                <PlayIcon />
                Continue
              </Link>
            </Button>
          ) : (
            <Button
              className="h-10 min-w-28 rounded-xl"
              disabled={isEnrolling}
              variant="outline"
              onClick={onEnroll}
            >
              <UserPlusIcon />
              Enroll
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
      <div className="flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 text-slate-300">
        <ImageIcon className="size-10" />
      </div>
    )
  }

  return (
    <img
      alt={title}
      className="aspect-[16/7] w-full object-cover"
      src={coverUrlQuery.data.url}
    />
  )
}

function Chip({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-[0_10px_24px_rgba(37,99,235,0.08)]'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:text-blue-600'
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="[&>svg]:size-4">{icon}</span>
      {children}
    </button>
  )
}

function FilterOption({
  active,
  label,
  value,
  onClick,
}: {
  active: boolean
  label: string
  value: number
  onClick: () => void
}) {
  return (
    <button
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
        active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        <span className={`size-4 rounded border ${active ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`} />
        {label}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
        {value}
      </span>
    </button>
  )
}

function CoursesLoading() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="aspect-[16/7] animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-4 h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-3 h-4 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="mt-7 flex items-center justify-center gap-2">
      <Button
        className="size-10 rounded-xl"
        disabled={page === 0}
        size="icon"
        variant="outline"
        onClick={onPrevious}
      >
        <ChevronLeftIcon />
      </Button>
      <div className="flex items-center gap-2 text-sm">
        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
          {page + 1}
        </span>
        <span className="text-slate-400">/</span>
        <span className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
          {Math.max(totalPages, 1)}
        </span>
      </div>
      <Button
        className="size-10 rounded-xl"
        disabled={page + 1 >= totalPages}
        size="icon"
        variant="outline"
        onClick={onNext}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}
