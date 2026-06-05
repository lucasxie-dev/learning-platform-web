import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, CheckCircle2Icon, ClockIcon, SaveIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { getCourse } from '@/features/courses/course-api'
import { createFileAccessUrl } from '@/features/files/file-api'
import { getLesson } from '@/features/lessons/lesson-api'
import { MarkdownPreview } from '@/features/lessons/markdown-preview'
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

export function LearnLessonPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const lessonId = Number(params.lessonId)
  const [progressInput, setProgressInput] = useState('')

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

  const currentProgress = useMemo(() => {
    const lessons = progressQuery.data?.lessons ?? []

    return lessons.find((lesson) => lesson.lessonId === lessonId) ?? null
  }, [lessonId, progressQuery.data?.lessons])

  const audioUrlQuery = useSignedMediaUrl(lessonQuery.data?.audioFileId)
  const videoUrlQuery = useSignedMediaUrl(lessonQuery.data?.videoFileId)
  const subtitleUrlQuery = useSignedMediaUrl(lessonQuery.data?.subtitleFileId)

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, seconds }: { id: number; seconds: number }) =>
      updateLessonProgress(id, seconds),
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

  const lesson = lessonQuery.data
  const course = courseQuery.data
  const lessons = progressQuery.data?.lessons ?? []

  function saveProgress() {
    if (!currentProgress) {
      return
    }

    updateProgressMutation.mutate({
      id: currentProgress.lessonId,
      seconds: Number(progressInput || currentProgress.progressSeconds),
    })
  }

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={courseId ? `/learn/courses/${courseId}` : '/me/courses'}>
                <ArrowLeftIcon />
                Course
              </Link>
            </Button>
            <h1 className="mt-1 text-lg font-semibold">{lesson?.title ?? 'Lesson player'}</h1>
            <p className="text-sm text-muted-foreground">{course?.title ?? 'Learning lesson'}</p>
          </div>
          {currentProgress?.completed ? <Badge>Completed</Badge> : <Badge variant="outline">In progress</Badge>}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>{lesson?.title ?? 'Loading lesson...'}</CardTitle>
            <CardDescription>
              Play audio or video, open subtitles, and update learning progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {lessonQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading lesson...</p>
            ) : lesson && currentProgress ? (
              <>
                <MarkdownPreview markdown={lesson.contentMarkdown ?? lesson.description} />
                {videoUrlQuery.data?.url ? (
                  <video
                    className="max-h-[520px] w-full rounded-lg border bg-black"
                    controls
                    src={videoUrlQuery.data.url}
                  >
                    {subtitleUrlQuery.data?.url ? (
                      <track kind="subtitles" src={subtitleUrlQuery.data.url} />
                    ) : null}
                  </video>
                ) : null}
                {audioUrlQuery.data?.url ? (
                  <audio className="w-full" controls src={audioUrlQuery.data.url} />
                ) : null}
                {subtitleUrlQuery.data?.url ? (
                  <Button variant="outline" asChild>
                    <a href={subtitleUrlQuery.data.url} target="_blank" rel="noreferrer">
                      Open subtitle
                    </a>
                  </Button>
                ) : null}
                {!audioUrlQuery.data?.url && !videoUrlQuery.data?.url && !subtitleUrlQuery.data?.url ? (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    No media files are attached to this lesson.
                  </div>
                ) : null}
                <ProgressEditor
                  progress={currentProgress}
                  progressInput={progressInput}
                  setProgressInput={setProgressInput}
                  isSaving={updateProgressMutation.isPending}
                  isCompleting={completeMutation.isPending}
                  onComplete={() => completeMutation.mutate(currentProgress.lessonId)}
                  onSaveProgress={saveProgress}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enroll in this course before opening the lesson player.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course lessons</CardTitle>
            <CardDescription>Jump between published lessons.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {lessons.length ? (
              lessons.map((lessonItem) => (
                <Button
                  key={lessonItem.lessonId}
                  variant={lessonItem.lessonId === lessonId ? 'secondary' : 'outline'}
                  className="justify-start"
                  asChild
                >
                  <Link to={`/learn/lessons/${lessonItem.lessonId}`}>
                    {lessonItem.completed ? <CheckCircle2Icon /> : <ClockIcon />}
                    {lessonItem.title}
                  </Link>
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No lesson progress loaded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function ProgressEditor({
  progress,
  progressInput,
  setProgressInput,
  isSaving,
  isCompleting,
  onSaveProgress,
  onComplete,
}: {
  progress: LessonProgressItem
  progressInput: string
  setProgressInput: (value: string) => void
  isSaving: boolean
  isCompleting: boolean
  onSaveProgress: () => void
  onComplete: () => void
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ClockIcon className="size-4" />
        Progress
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${progressPercent(progress)}%` }} />
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
