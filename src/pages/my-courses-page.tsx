import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, BookOpenCheckIcon, ImageIcon, PlayIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { createFileAccessUrl } from '@/features/files/file-api'
import { listMyCourses } from '@/features/learning/learning-api'
import type { MyCourse } from '@/features/learning/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function MyCoursesPage() {
  const myCoursesQuery = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => listMyCourses(0, 50),
  })

  const courses = myCoursesQuery.data?.items ?? []

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
            <h1 className="mt-1 text-lg font-semibold">My courses</h1>
            <p className="text-sm text-muted-foreground">Continue enrolled courses and track progress.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/learn/courses">Browse courses</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        {myCoursesQuery.isLoading ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            Loading enrolled courses...
          </div>
        ) : myCoursesQuery.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-background p-6 text-sm text-destructive">
            Unable to load enrolled courses.
          </div>
        ) : courses.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.enrollmentId} className="overflow-hidden">
                <CourseCover course={course} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpenCheckIcon className="size-4" />
                    {course.title}
                  </CardTitle>
                  <CardDescription>{course.subtitle ?? 'No subtitle'}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Enrolled</Badge>
                    <Badge variant="secondary">
                      {Math.round(course.completionRate * 100)}%
                    </Badge>
                    <Badge variant="outline">
                      {course.completedLessons}/{course.totalLessons} completed
                    </Badge>
                    {course.lastStudiedAt ? (
                      <Badge variant="secondary">Last studied {formatDate(course.lastStudiedAt)}</Badge>
                    ) : null}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.round(course.completionRate * 100)}%` }}
                    />
                  </div>
                  <Button asChild>
                    <Link to={`/learn/courses/${course.courseId}`}>
                      <PlayIcon />
                      Continue
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            No enrolled courses yet.
          </div>
        )}
      </div>
    </main>
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
      <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
        <ImageIcon className="size-8" />
      </div>
    )
  }

  return (
    <img
      alt={course.title}
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
