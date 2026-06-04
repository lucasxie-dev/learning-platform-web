import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ImageIcon,
  PlayIcon,
  SearchIcon,
  UserPlusIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { listCourses } from '@/features/courses/course-api'
import type { CourseListItem } from '@/features/courses/types'
import { createFileAccessUrl } from '@/features/files/file-api'
import { enrollCourse, listMyCourses } from '@/features/learning/learning-api'
import { getApiErrorMessage } from '@/lib/api'
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

const pageSize = 12

export function LearnCoursesPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)

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

  const courses = coursesQuery.data?.items ?? []
  const totalPages = coursesQuery.data?.totalPages ?? 0

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeftIcon />
                Dashboard
              </Link>
            </Button>
            <h1 className="mt-1 text-lg font-semibold">Course catalog</h1>
            <p className="text-sm text-muted-foreground">
              Browse published courses and enroll to start learning.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/me/courses">My courses</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenIcon className="size-4" />
              Published courses
            </CardTitle>
            <CardDescription>
              Only published courses are shown in the student catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form className="grid gap-2 md:grid-cols-[1fr_auto]" onSubmit={handleSearchSubmit}>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search published courses"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            {coursesQuery.isLoading ? (
              <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
                Loading published courses...
              </div>
            ) : coursesQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-background p-6 text-sm text-destructive">
                Unable to load course catalog.
              </div>
            ) : courses.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <CourseCatalogCard
                    key={course.id}
                    course={course}
                    isEnrolled={enrolledCourseIds.has(course.id)}
                    isEnrolling={enrollMutation.isPending}
                    onEnroll={() => enrollMutation.mutate(course.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
                No published courses found.
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total {coursesQuery.data?.total ?? 0} courses</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(current - 1, 0))}
                >
                  Previous
                </Button>
                <span>
                  Page {page + 1} / {Math.max(totalPages, 1)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function CourseCatalogCard({
  course,
  isEnrolled,
  isEnrolling,
  onEnroll,
}: {
  course: CourseListItem
  isEnrolled: boolean
  isEnrolling: boolean
  onEnroll: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <CourseCover fileId={course.coverFileId} title={course.title} />
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
        <CardDescription>{course.subtitle ?? 'No subtitle'}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {isEnrolled ? <Badge>Enrolled</Badge> : <Badge variant="outline">Available</Badge>}
          {course.publishedAt ? (
            <Badge variant="outline">Published {formatDate(course.publishedAt)}</Badge>
          ) : null}
        </div>
        {isEnrolled ? (
          <Button asChild>
            <Link to={`/learn/courses/${course.id}`}>
              <PlayIcon />
              Enter learning
            </Link>
          </Button>
        ) : (
          <Button disabled={isEnrolling} onClick={onEnroll}>
            <UserPlusIcon />
            Enroll
          </Button>
        )}
      </CardContent>
    </Card>
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
      <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
        <ImageIcon className="size-8" />
      </div>
    )
  }

  return (
    <img
      alt={title}
      className="aspect-video w-full object-cover"
      src={coverUrlQuery.data.url}
    />
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}
