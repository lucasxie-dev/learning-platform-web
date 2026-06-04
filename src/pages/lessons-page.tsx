import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArchiveIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  EditIcon,
  GripVerticalIcon,
  ListOrderedIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { getCurrentUser } from '@/features/auth/auth-api'
import { getCourse } from '@/features/courses/course-api'
import { LessonForm } from '@/features/lessons/lesson-form'
import {
  archiveLesson,
  createLesson,
  deleteLesson,
  getLesson,
  listLessonsByCourse,
  publishLesson,
  reorderLessons,
  updateLesson,
} from '@/features/lessons/lesson-api'
import type {
  Lesson,
  LessonListItem,
  LessonPayload,
  LessonStatus,
} from '@/features/lessons/types'
import {
  bindLessonAudio,
  bindLessonSubtitle,
  bindLessonVideo,
  unbindLessonAudio,
  unbindLessonSubtitle,
  unbindLessonVideo,
  uploadFile,
} from '@/features/files/file-api'
import { FileAssetCard } from '@/features/files/file-asset-card'
import { FileUploadField } from '@/features/files/file-upload-field'
import type { FileAssetType } from '@/features/files/types'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function LessonsPage() {
  const queryClient = useQueryClient()
  const params = useParams()
  const courseId = Number(params.courseId)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [mediaLesson, setMediaLesson] = useState<LessonListItem | null>(null)
  const [draftOrders, setDraftOrders] = useState<Record<number, string>>({})

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

  const lessonsQuery = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => listLessonsByCourse(courseId),
    enabled: Number.isFinite(courseId),
  })

  const mediaLessonDetailQuery = useQuery({
    queryKey: ['lesson', mediaLesson?.id],
    queryFn: () => getLesson(Number(mediaLesson?.id)),
    enabled: Boolean(mediaLesson),
  })

  const user = currentUserQuery.data
  const course = courseQuery.data
  const lessons = lessonsQuery.data ?? []
  const canManageLessons = useMemo(() => {
    const roles = user?.roles ?? []
    const permissions = user?.permissions ?? []

    return (
      roles.includes('ADMIN') ||
      (roles.includes('TEACHER') && course?.ownerId === user?.id) ||
      permissions.some((permission) => ['course:update', 'course:publish', 'course:delete'].includes(permission))
    )
  }, [course?.ownerId, user])
  const canCreateLessons = canManageLessons && course?.status !== 'ARCHIVED'
  const canBindLessonMedia = canManageLessons && course?.status !== 'ARCHIVED'

  const createMutation = useMutation({
    mutationFn: (payload: LessonPayload) => createLesson(courseId, payload),
    onSuccess: () => {
      toast.success('Lesson created')
      setIsCreateOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const getLessonMutation = useMutation({
    mutationFn: getLesson,
    onSuccess: (lesson) => setEditingLesson(lesson),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LessonPayload }) =>
      updateLesson(id, payload),
    onSuccess: () => {
      toast.success('Lesson updated')
      setEditingLesson(null)
      void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const publishMutation = useMutation({
    mutationFn: publishLesson,
    onSuccess: () => {
      toast.success('Lesson published')
      void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const archiveMutation = useMutation({
    mutationFn: archiveLesson,
    onSuccess: () => {
      toast.success('Lesson archived')
      void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      toast.success('Lesson deleted')
      void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const reorderMutation = useMutation({
    mutationFn: () =>
      reorderLessons(
        courseId,
        lessons.map((lesson) => ({
          lessonId: lesson.id,
          sortOrder: Number(draftOrders[lesson.id] ?? lesson.sortOrder),
        })),
      ),
    onSuccess: () => {
      toast.success('Lesson order saved')
      setDraftOrders({})
      void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const uploadLessonMediaMutation = useMutation({
    mutationFn: async ({ file, assetType }: { file: File; assetType: FileAssetType }) => {
      if (!mediaLesson) {
        throw new Error('Lesson is required before binding media')
      }

      const uploadedFile = await uploadFile(file, assetType)

      if (assetType === 'LESSON_AUDIO') {
        await bindLessonAudio(mediaLesson.id, uploadedFile.id)
      } else if (assetType === 'LESSON_VIDEO') {
        await bindLessonVideo(mediaLesson.id, uploadedFile.id)
      } else if (assetType === 'SUBTITLE') {
        await bindLessonSubtitle(mediaLesson.id, uploadedFile.id)
      }

      return uploadedFile
    },
    onSuccess: () => {
      toast.success('Lesson media uploaded')
      void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
      void queryClient.invalidateQueries({ queryKey: ['lesson', mediaLesson?.id] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  function handleOrderChange(lessonId: number, value: string) {
    setDraftOrders((current) => ({ ...current, [lessonId]: value }))
  }

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <div className="mb-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/courses">
                  <ArrowLeftIcon />
                  Courses
                </Link>
              </Button>
            </div>
            <h1 className="text-lg font-semibold">{course?.title ?? 'Course lessons'}</h1>
            <p className="text-sm text-muted-foreground">
              Manage lesson order, draft state, and publication workflow.
            </p>
          </div>
          {canCreateLessons ? (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon />
                  New lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create lesson</DialogTitle>
                  <DialogDescription>
                    New lessons start as drafts. Publishing requires the course to be published.
                  </DialogDescription>
                </DialogHeader>
                <LessonForm
                  isSubmitting={createMutation.isPending}
                  onSubmit={(payload) => createMutation.mutate(payload)}
                />
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        <Card>
          <CardHeader className="gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListOrderedIcon className="size-4" />
                Lessons
              </CardTitle>
              <CardDescription>
                Lessons are loaded from the selected course and sorted by sort order.
              </CardDescription>
            </div>
            {canManageLessons ? (
              <Button
                variant="outline"
                disabled={!Object.keys(draftOrders).length || reorderMutation.isPending}
                onClick={() => reorderMutation.mutate()}
              >
                <SaveIcon />
                Save order
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {lessonsQuery.isLoading ? (
              <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
                Loading lessons...
              </div>
            ) : lessonsQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-background p-6 text-sm text-destructive">
                Unable to load lessons.
              </div>
            ) : lessons.length ? (
              <LessonsTable
                lessons={lessons}
                canManageLessons={canManageLessons}
                canBindLessonMedia={canBindLessonMedia}
                draftOrders={draftOrders}
                onOrderChange={handleOrderChange}
                onEdit={(lessonId) => getLessonMutation.mutate(lessonId)}
                onUploadMedia={(lesson) => setMediaLesson(lesson)}
                onPublish={(lessonId) => publishMutation.mutate(lessonId)}
                onArchive={(lessonId) => archiveMutation.mutate(lessonId)}
                onDelete={(lessonId) => deleteMutation.mutate(lessonId)}
              />
            ) : (
              <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
                No lessons found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editingLesson)} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit lesson</DialogTitle>
            <DialogDescription>
              Published lessons cannot be edited by the backend.
            </DialogDescription>
          </DialogHeader>
          <LessonForm
            lesson={editingLesson}
            isSubmitting={updateMutation.isPending}
            onSubmit={(payload) => {
              if (editingLesson) {
                updateMutation.mutate({ id: editingLesson.id, payload })
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(mediaLesson)} onOpenChange={(open) => !open && setMediaLesson(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload lesson media</DialogTitle>
            <DialogDescription>
              Upload and bind media files for {mediaLesson?.title ?? 'this lesson'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3">
              <FileAssetCard
                fileId={mediaLessonDetailQuery.data?.audioFileId}
                label="Current audio"
                onUnbind={() => {
                  if (!mediaLesson) {
                    return
                  }

                  return unbindLessonAudio(mediaLesson.id)
                }}
                onDeleted={() => {
                  void queryClient.invalidateQueries({ queryKey: ['lesson', mediaLesson?.id] })
                  void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
                }}
              />
              <FileAssetCard
                fileId={mediaLessonDetailQuery.data?.videoFileId}
                label="Current video"
                onUnbind={() => {
                  if (!mediaLesson) {
                    return
                  }

                  return unbindLessonVideo(mediaLesson.id)
                }}
                onDeleted={() => {
                  void queryClient.invalidateQueries({ queryKey: ['lesson', mediaLesson?.id] })
                  void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
                }}
              />
              <FileAssetCard
                fileId={mediaLessonDetailQuery.data?.subtitleFileId}
                label="Current subtitle"
                onUnbind={() => {
                  if (!mediaLesson) {
                    return
                  }

                  return unbindLessonSubtitle(mediaLesson.id)
                }}
                onDeleted={() => {
                  void queryClient.invalidateQueries({ queryKey: ['lesson', mediaLesson?.id] })
                  void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
                }}
              />
            </div>
            <FileUploadField
              label="Audio"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4"
              assetType="LESSON_AUDIO"
              isUploading={uploadLessonMediaMutation.isPending}
              onUpload={(file, assetType) =>
                uploadLessonMediaMutation.mutateAsync({ file, assetType })
              }
            />
            <FileUploadField
              label="Video"
              accept="video/mp4,video/quicktime,video/webm"
              assetType="LESSON_VIDEO"
              isUploading={uploadLessonMediaMutation.isPending}
              onUpload={(file, assetType) =>
                uploadLessonMediaMutation.mutateAsync({ file, assetType })
              }
            />
            <FileUploadField
              label="Subtitle"
              accept=".vtt,.srt,text/vtt,application/x-subrip,text/plain"
              assetType="SUBTITLE"
              isUploading={uploadLessonMediaMutation.isPending}
              onUpload={(file, assetType) =>
                uploadLessonMediaMutation.mutateAsync({ file, assetType })
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function LessonsTable({
  lessons,
  canManageLessons,
  canBindLessonMedia,
  draftOrders,
  onOrderChange,
  onEdit,
  onUploadMedia,
  onPublish,
  onArchive,
  onDelete,
}: {
  lessons: LessonListItem[]
  canManageLessons: boolean
  canBindLessonMedia: boolean
  draftOrders: Record<number, string>
  onOrderChange: (lessonId: number, value: string) => void
  onEdit: (lessonId: number) => void
  onUploadMedia: (lesson: LessonListItem) => void
  onPublish: (lessonId: number) => void
  onArchive: (lessonId: number) => void
  onDelete: (lessonId: number) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Order</TableHead>
          <TableHead>Lesson</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Updated</TableHead>
          {canManageLessons ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {lessons.map((lesson) => (
          <TableRow key={lesson.id}>
            <TableCell>
              {canManageLessons ? (
                <div className="flex items-center gap-2">
                  <GripVerticalIcon className="size-4 text-muted-foreground" />
                  <Input
                    className="w-16"
                    min={0}
                    type="number"
                    value={draftOrders[lesson.id] ?? lesson.sortOrder}
                    onChange={(event) => onOrderChange(lesson.id, event.target.value)}
                  />
                </div>
              ) : (
                lesson.sortOrder
              )}
            </TableCell>
            <TableCell className="whitespace-normal">
              <div className="font-medium">{lesson.title}</div>
              <div className="text-xs text-muted-foreground">#{lesson.id}</div>
            </TableCell>
            <TableCell>
              <StatusBadge status={lesson.status} />
            </TableCell>
            <TableCell>{formatDuration(lesson.durationSeconds)}</TableCell>
            <TableCell>{formatDate(lesson.updatedAt)}</TableCell>
            {canManageLessons ? (
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!canBindLessonMedia}
                    onClick={() => onUploadMedia(lesson)}
                    title="Upload media"
                  >
                    <UploadIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={lesson.status === 'PUBLISHED'}
                    onClick={() => onEdit(lesson.id)}
                    title="Edit"
                  >
                    <EditIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={lesson.status === 'PUBLISHED'}
                    onClick={() => onPublish(lesson.id)}
                    title="Publish"
                  >
                    <CheckCircle2Icon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={lesson.status !== 'PUBLISHED'}
                    onClick={() => onArchive(lesson.id)}
                    title="Archive"
                  >
                    <ArchiveIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(lesson.id)}
                    title="Delete"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function StatusBadge({ status }: { status: LessonStatus }) {
  if (status === 'PUBLISHED') {
    return <Badge>Published</Badge>
  }

  if (status === 'ARCHIVED') {
    return <Badge variant="secondary">Archived</Badge>
  }

  return <Badge variant="outline">Draft</Badge>
}

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return 'Not set'
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
