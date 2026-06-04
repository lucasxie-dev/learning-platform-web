import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, CheckCircle2Icon, ClockIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { getCourse } from '@/features/courses/course-api'
import { getUserCourseProgress } from '@/features/learning/learning-api'
import type { LessonProgressItem } from '@/features/learning/types'
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

export function UserCourseProgressPage() {
  const params = useParams()
  const courseId = Number(params.courseId)
  const userId = Number(params.userId)

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  })

  const progressQuery = useQuery({
    queryKey: ['user-course-progress', courseId, userId],
    queryFn: () => getUserCourseProgress(courseId, userId),
    enabled: Number.isFinite(courseId) && Number.isFinite(userId),
  })

  const progress = progressQuery.data

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/courses/${courseId}/enrollments`}>
                <ArrowLeftIcon />
                Enrollments
              </Link>
            </Button>
            <h1 className="mt-1 text-lg font-semibold">
              User #{userId} progress
            </h1>
            <p className="text-sm text-muted-foreground">
              {courseQuery.data?.title ?? 'Course learning progress'}
            </p>
          </div>
          {progress ? <Badge>{Math.round(progress.completionRate * 100)}%</Badge> : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total lessons" value={progress?.totalLessons ?? 0} />
          <SummaryCard label="Completed" value={progress?.completedLessons ?? 0} />
          <SummaryCard label="Completion" value={`${Math.round((progress?.completionRate ?? 0) * 100)}%`} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lesson progress</CardTitle>
            <CardDescription>
              Teacher/Admin view of a student's progress in this course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {progressQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading progress...</p>
            ) : progressQuery.isError ? (
              <p className="text-sm text-destructive">Unable to load progress.</p>
            ) : progress?.lessons.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progress.lessons.map((lesson) => (
                    <ProgressRow key={lesson.lessonId} lesson={lesson} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No lesson progress found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function ProgressRow({ lesson }: { lesson: LessonProgressItem }) {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{lesson.title}</div>
        <div className="text-xs text-muted-foreground">Sort order {lesson.sortOrder}</div>
      </TableCell>
      <TableCell>
        {formatDuration(lesson.progressSeconds)} / {formatDuration(lesson.durationSeconds)}
      </TableCell>
      <TableCell>
        {lesson.completed ? (
          <Badge>
            <CheckCircle2Icon className="size-3" />
            Completed
          </Badge>
        ) : (
          <Badge variant="outline">
            <ClockIcon className="size-3" />
            In progress
          </Badge>
        )}
      </TableCell>
      <TableCell>{lesson.updatedAt ? formatDate(lesson.updatedAt) : '—'}</TableCell>
    </TableRow>
  )
}

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return '0:00'
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
