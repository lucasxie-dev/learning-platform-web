import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, CheckCircle2Icon, ClockIcon, SaveIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { getCourse } from '@/features/courses/course-api'
import { createFileAccessUrl } from '@/features/files/file-api'
import { getLesson } from '@/features/lessons/lesson-api'
import type { Lesson } from '@/features/lessons/types'
import {
  completeLesson,
  getMyCourseProgress,
  updateLessonProgress,
} from '@/features/learning/learning-api'
import type { LessonProgressItem } from '@/features/learning/types'
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

export function LearnCoursePage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const courseId = Number(params.courseId)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [progressInput, setProgressInput] = useState('')

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

  const selectedProgress = useMemo(() => {
    const lessons = progressQuery.data?.lessons ?? []
    return lessons.find((lesson) => lesson.lessonId === selectedLessonId) ?? lessons[0] ?? null
  }, [progressQuery.data?.lessons, selectedLessonId])

  const lessonQuery = useQuery({
    queryKey: ['lesson', selectedProgress?.lessonId],
    queryFn: () => getLesson(Number(selectedProgress?.lessonId)),
    enabled: Boolean(selectedProgress?.lessonId),
  })

  const audioUrlQuery = useSignedMediaUrl(lessonQuery.data?.audioFileId)
  const videoUrlQuery = useSignedMediaUrl(lessonQuery.data?.videoFileId)
  const subtitleUrlQuery = useSignedMediaUrl(lessonQuery.data?.subtitleFileId)

  const updateProgressMutation = useMutation({
    mutationFn: ({ lessonId, seconds }: { lessonId: number; seconds: number }) =>
      updateLessonProgress(lessonId, seconds),
    onSuccess: () => {
      toast.success('Progress saved')
      setProgressInput('')
      void queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const completeMutation = useMutation({
    mutationFn: completeLesson,
    onSuccess: () => {
      toast.success('Lesson completed')
      void queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const progress = progressQuery.data
  const lessons = progress?.lessons ?? []
  const course = courseQuery.data
  const lesson = lessonQuery.data

  function saveProgress() {
    if (!selectedProgress) {
      return
    }

    updateProgressMutation.mutate({
      lessonId: selectedProgress.lessonId,
      seconds: Number(progressInput || selectedProgress.progressSeconds),
    })
  }

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/me/courses">
                <ArrowLeftIcon />
                My courses
              </Link>
            </Button>
            <h1 className="mt-1 text-lg font-semibold">{course?.title ?? 'Learning'}</h1>
            <p className="text-sm text-muted-foreground">
              {progress ? `${progress.completedLessons}/${progress.totalLessons} lessons completed` : 'Course progress'}
            </p>
          </div>
          {progress ? (
            <Badge>{Math.round(progress.completionRate * 100)}%</Badge>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>Published lessons in this course.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {progressQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading progress...</p>
            ) : progressQuery.isError ? (
              <p className="text-sm text-destructive">Unable to load progress.</p>
            ) : lessons.length ? (
              lessons.map((lessonItem) => (
                <Link
                  key={lessonItem.lessonId}
                  className="grid gap-1 rounded-lg border bg-background p-3 text-left text-sm transition-colors hover:bg-muted/50"
                  to={`/learn/lessons/${lessonItem.lessonId}`}
                  onMouseEnter={() => setSelectedLessonId(lessonItem.lessonId)}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{lessonItem.title}</span>
                    {lessonItem.completed ? <CheckCircle2Icon className="size-4 text-primary" /> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(lessonItem.progressSeconds)} / {formatDuration(lessonItem.durationSeconds)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No published lessons.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedProgress?.title ?? 'Select a lesson'}</CardTitle>
            <CardDescription>Play media and update your learning progress.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {lessonQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading lesson...</p>
            ) : selectedProgress && lesson ? (
              <LessonPlayer
                lesson={lesson}
                progress={selectedProgress}
                audioUrl={audioUrlQuery.data?.url}
                videoUrl={videoUrlQuery.data?.url}
                subtitleUrl={subtitleUrlQuery.data?.url}
                progressInput={progressInput}
                setProgressInput={setProgressInput}
                onSaveProgress={saveProgress}
                onComplete={() => completeMutation.mutate(selectedProgress.lessonId)}
                isSaving={updateProgressMutation.isPending}
                isCompleting={completeMutation.isPending}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Choose a lesson from the list.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function LessonPlayer({
  lesson,
  progress,
  audioUrl,
  videoUrl,
  subtitleUrl,
  progressInput,
  setProgressInput,
  onSaveProgress,
  onComplete,
  isSaving,
  isCompleting,
}: {
  lesson: Lesson
  progress: LessonProgressItem
  audioUrl?: string
  videoUrl?: string
  subtitleUrl?: string
  progressInput: string
  setProgressInput: (value: string) => void
  onSaveProgress: () => void
  onComplete: () => void
  isSaving: boolean
  isCompleting: boolean
}) {
  return (
    <div className="grid gap-4">
      {lesson.description ? (
        <p className="text-sm text-muted-foreground">{lesson.description}</p>
      ) : null}
      {videoUrl ? (
        <video className="max-h-96 w-full rounded-lg border bg-black" controls src={videoUrl}>
          {subtitleUrl ? <track kind="subtitles" src={subtitleUrl} /> : null}
        </video>
      ) : null}
      {audioUrl ? <audio className="w-full" controls src={audioUrl} /> : null}
      {subtitleUrl ? (
        <Button variant="outline" asChild>
          <a href={subtitleUrl} target="_blank" rel="noreferrer">
            Open subtitle
          </a>
        </Button>
      ) : null}
      {!audioUrl && !videoUrl && !subtitleUrl ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          No media files are attached to this lesson.
        </div>
      ) : null}
      <div className="grid gap-3 rounded-lg border bg-background p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ClockIcon className="size-4" />
          Progress
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${progressPercent(progress)}%` }}
          />
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <Input
            min={0}
            max={progress.durationSeconds ?? undefined}
            placeholder={progress.progressSeconds.toString()}
            type="number"
            value={progressInput}
            onChange={(event) => setProgressInput(event.target.value)}
          />
          <Button variant="outline" disabled={isSaving} onClick={onSaveProgress}>
            <SaveIcon />
            Save seconds
          </Button>
          <Button disabled={isCompleting || progress.completed} onClick={onComplete}>
            <CheckCircle2Icon />
            {progress.completed ? 'Completed' : 'Mark complete'}
          </Button>
        </div>
      </div>
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
