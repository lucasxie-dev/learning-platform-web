import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, BarChart3Icon, UsersIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { getCourse } from '@/features/courses/course-api'
import { listCourseEnrollments } from '@/features/learning/learning-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function CourseEnrollmentsPage() {
  const params = useParams()
  const courseId = Number(params.courseId)
  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  })
  const enrollmentsQuery = useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: () => listCourseEnrollments(courseId, 0, 100),
    enabled: Number.isFinite(courseId),
  })

  const enrollments = enrollmentsQuery.data?.items ?? []

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/courses">
              <ArrowLeftIcon />
              Courses
            </Link>
          </Button>
          <h1 className="mt-1 text-lg font-semibold">{courseQuery.data?.title ?? 'Course enrollments'}</h1>
          <p className="text-sm text-muted-foreground">Students enrolled in this course.</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              Enrollments
            </CardTitle>
            <CardDescription>Total {enrollmentsQuery.data?.total ?? 0} students</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading enrollments...</p>
            ) : enrollmentsQuery.isError ? (
              <p className="text-sm text-destructive">Unable to load enrollments.</p>
            ) : enrollments.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>#{enrollment.userId}</TableCell>
                      <TableCell>{enrollment.courseTitle}</TableCell>
                      <TableCell>
                        <Badge>{enrollment.courseStatus}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" asChild title="View progress">
                          <Link to={`/courses/${courseId}/users/${enrollment.userId}/progress`}>
                            <BarChart3Icon />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No enrollments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}
