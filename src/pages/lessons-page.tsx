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
import { WorkspaceLayout } from '@/components/layout/workspace-layout'
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
  const roles = user?.roles ?? []
  const permissions = user?.permissions ?? []
  const isAdmin = roles.includes('ADMIN')
  const isTeacher = roles.includes('TEACHER')
  const canLearn = roles.includes('STUDENT')
  const canManageCourses =
    isAdmin ||
    isTeacher ||
    permissions.some((permission) => permission.startsWith('course:'))
  const manageLabel = isAdmin
    ? 'Courses'
    : isTeacher
      ? 'My Courses'
      : 'Courses'
  const canManageLessons = useMemo(() => {
    return (
      roles.includes('ADMIN') ||
      (roles.includes('TEACHER') && course?.ownerId === user?.id) ||
      permissions.some((permission) => ['course:update', 'course:publish', 'course:delete'].includes(permission))
    )
  }, [course?.ownerId, permissions, roles, user?.id])
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
    <WorkspaceLayout
      user={user}
      title={course?.title ? `Lessons · ${course.title}` : 'Course lessons'}
      description="Manage lesson order, draft state, media, and publication workflow."
      activeItem="lessons"
      canManageCourses={canManageCourses}
      canLearn={canLearn}
      manageLabel={manageLabel}
      lessonsHref={Number.isFinite(courseId) ? `/courses/${courseId}/lessons` : '/courses'}
    >
      <div className="grid gap-5">
        <div>
          <Button className="rounded-xl" variant="ghost" size="sm" asChild>
            <Link to="/courses">
              <ArrowLeftIcon />
              Courses
            </Link>
          </Button>
        </div>

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="gap-4 md:grid md:grid-cols-[1fr_auto] md:items-center">
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
                className="rounded-xl"
                variant="outline"
                disabled={!Object.keys(draftOrders).length || reorderMutation.isPending}
                onClick={() => reorderMutation.mutate()}
              >
                <SaveIcon />
                Save order
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-5">
            {canCreateLessons ? (
              <div className="flex justify-end">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl">
                      <PlusIcon />
                      New lesson
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-5xl">
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
              </div>
            ) : null}
            {lessonsQuery.isLoading ? (
              <div className="rounded-2xl border bg-slate-50 p-6 text-sm text-slate-500">
                Loading lessons...
              </div>
            ) : lessonsQuery.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-background p-6 text-sm text-destructive">
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
              <div className="rounded-2xl border bg-slate-50 p-6 text-sm text-slate-500">
                No lessons found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editingLesson)} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent className="sm:max-w-5xl">
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
    </WorkspaceLayout>
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
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-24 font-semibold text-slate-600">Order</TableHead>
            <TableHead className="font-semibold text-slate-600">Lesson</TableHead>
            <TableHead className="font-semibold text-slate-600">Status</TableHead>
            <TableHead className="font-semibold text-slate-600">Duration</TableHead>
            <TableHead className="font-semibold text-slate-600">Updated</TableHead>
            {canManageLessons ? <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((lesson) => (
            <TableRow key={lesson.id} className="hover:bg-blue-50/40">
              <TableCell className="py-4">
                {canManageLessons ? (
                  <div className="flex items-center gap-2">
                    <GripVerticalIcon className="size-4 text-slate-400" />
                    <Input
                      className="h-9 w-16 rounded-xl border-slate-200 bg-slate-50 text-center shadow-none"
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
              <TableCell className="whitespace-normal py-4">
                <div className="font-semibold text-slate-950">{lesson.title}</div>
                <div className="mt-1 text-xs text-slate-500">#{lesson.id}</div>
              </TableCell>
              <TableCell>
                <StatusBadge status={lesson.status} />
              </TableCell>
              <TableCell className="text-slate-600">{formatDuration(lesson.durationSeconds)}</TableCell>
              <TableCell className="text-slate-600">{formatDate(lesson.updatedAt)}</TableCell>
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
    </div>
  )
}

function StatusBadge({ status }: { status: LessonStatus }) {
  if (status === 'PUBLISHED') {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>
  }

  if (status === 'ARCHIVED') {
    return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Archived</Badge>
  }

  return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Draft</Badge>
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
