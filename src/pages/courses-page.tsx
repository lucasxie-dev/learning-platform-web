import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArchiveIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  EditIcon,
  ImageIcon,
  ListOrderedIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import {
  archiveCourse,
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  publishCourse,
  updateCourse,
} from '@/features/courses/course-api'
import { CourseForm } from '@/features/courses/course-form'
import type {
  Course,
  CourseListItem,
  CoursePayload,
  CourseStatus,
} from '@/features/courses/types'
import { getCurrentUser } from '@/features/auth/auth-api'
import { bindCourseCover, unbindCourseCover, uploadFile } from '@/features/files/file-api'
import { FileAssetCard } from '@/features/files/file-asset-card'
import { FileUploadField } from '@/features/files/file-upload-field'
import type { FileAssetType } from '@/features/files/types'
import { enrollCourse, listMyCourses } from '@/features/learning/learning-api'
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

const pageSize = 10

export function CoursesPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<CourseStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [coverCourse, setCoverCourse] = useState<CourseListItem | null>(null)

  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })

  const coursesQuery = useQuery({
    queryKey: ['courses', { keyword, status, page }],
    queryFn: () => listCourses({ keyword, status, page, size: pageSize }),
  })

  const user = currentUserQuery.data
  const roles = user?.roles ?? []
  const isAdmin = roles.includes('ADMIN')
  const isTeacher = roles.includes('TEACHER')
  const canManageCourses = useMemo(() => {
    const permissions = user?.permissions ?? []

    return (
      isAdmin ||
      isTeacher ||
      permissions.some((permission) => permission.startsWith('course:'))
    )
  }, [isAdmin, isTeacher, user])
  const canEnrollCourses = useMemo(() => {
    return roles.includes('STUDENT')
  }, [roles])
  const managementTitle = isAdmin
    ? 'Manage all courses'
    : isTeacher
      ? 'Manage my courses'
      : 'Course management'
  const managementDescription = isAdmin
    ? 'Admin can review and manage every course in the platform.'
    : isTeacher
      ? 'Teacher can manage owned courses and review published courses.'
      : 'Create, publish, archive, and review course records.'

  const myCoursesQuery = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => listMyCourses(0, 100),
    enabled: canEnrollCourses,
  })

  const enrolledCourseIds = useMemo(() => {
    const myCourses = myCoursesQuery.data?.items ?? []

    return new Set(myCourses.map((course) => course.courseId))
  }, [myCoursesQuery.data?.items])

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success('Course created')
      setIsCreateOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CoursePayload }) =>
      updateCourse(id, payload),
    onSuccess: () => {
      toast.success('Course updated')
      setEditingCourse(null)
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const publishMutation = useMutation({
    mutationFn: publishCourse,
    onSuccess: () => {
      toast.success('Course published')
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const archiveMutation = useMutation({
    mutationFn: archiveCourse,
    onSuccess: () => {
      toast.success('Course archived')
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      toast.success('Course deleted')
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const getCourseMutation = useMutation({
    mutationFn: getCourse,
    onSuccess: (course) => setEditingCourse(course),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const uploadCourseCoverMutation = useMutation({
    mutationFn: async ({ file, assetType }: { file: File; assetType: FileAssetType }) => {
      if (!coverCourse) {
        throw new Error('Course is required before binding a cover')
      }

      const uploadedFile = await uploadFile(file, assetType)
      await bindCourseCover(coverCourse.id, uploadedFile.id)
      return uploadedFile
    },
    onSuccess: () => {
      toast.success('Course cover uploaded')
      setCoverCourse(null)
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      toast.success('Course enrolled')
      void queryClient.invalidateQueries({ queryKey: ['my-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
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
    <WorkspaceLayout
      user={user}
      title={managementTitle}
      description={managementDescription}
      activeItem="courses"
      canManageCourses={canManageCourses}
      canLearn={canEnrollCourses}
      manageLabel={isAdmin ? 'Courses' : isTeacher ? 'My Courses' : 'Courses'}
      lessonsHref="/courses"
    >
      <div className="grid gap-5">
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="gap-4 md:grid md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpenIcon className="size-4" />
                {managementTitle}
              </CardTitle>
              <CardDescription>
                {managementDescription}
              </CardDescription>
            </div>
            {canManageCourses ? (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <PlusIcon />
                    New course
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create course</DialogTitle>
                    <DialogDescription>
                      New courses start as drafts and can be published after review.
                    </DialogDescription>
                  </DialogHeader>
                  <CourseForm
                    isSubmitting={createMutation.isPending}
                    onSubmit={(payload) => createMutation.mutate(payload)}
                  />
                </DialogContent>
              </Dialog>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-5">
            <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={handleSearchSubmit}>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 shadow-none"
                  placeholder="Search courses"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus-visible:border-blue-300 focus-visible:ring-3 focus-visible:ring-blue-100"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as CourseStatus | 'ALL')
                  setPage(0)
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <Button className="rounded-xl" type="submit" variant="outline">
                Search
              </Button>
            </form>

            {coursesQuery.isLoading ? (
              <div className="rounded-2xl border bg-slate-50 p-6 text-sm text-slate-500">
                Loading courses...
              </div>
            ) : coursesQuery.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-background p-6 text-sm text-destructive">
                Unable to load courses.
              </div>
            ) : courses.length ? (
              <CoursesTable
                courses={courses}
                canManageCourses={canManageCourses}
                canEnrollCourses={canEnrollCourses}
                enrolledCourseIds={enrolledCourseIds}
                onEdit={(course) => getCourseMutation.mutate(course.id)}
                onUploadCover={(course) => setCoverCourse(course)}
                onPublish={(courseId) => publishMutation.mutate(courseId)}
                onArchive={(courseId) => archiveMutation.mutate(courseId)}
                onDelete={(courseId) => deleteMutation.mutate(courseId)}
                onEnroll={(courseId) => enrollMutation.mutate(courseId)}
              />
            ) : (
              <div className="rounded-2xl border bg-slate-50 p-6 text-sm text-slate-500">
                No courses found.
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                Total {coursesQuery.data?.total ?? 0} courses
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
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
                  className="rounded-xl"
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

      <Dialog open={Boolean(editingCourse)} onOpenChange={(open) => !open && setEditingCourse(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>
              Published courses cannot be edited by the backend.
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            course={editingCourse}
            isSubmitting={updateMutation.isPending}
            onSubmit={(payload) => {
              if (editingCourse) {
                updateMutation.mutate({ id: editingCourse.id, payload })
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(coverCourse)} onOpenChange={(open) => !open && setCoverCourse(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload course cover</DialogTitle>
            <DialogDescription>
              Upload a JPEG, PNG, or WebP image and bind it to this course.
            </DialogDescription>
          </DialogHeader>
          <FileUploadField
            label={coverCourse?.title ?? 'Course cover'}
            accept="image/jpeg,image/png,image/webp"
            assetType="COURSE_COVER"
            isUploading={uploadCourseCoverMutation.isPending}
            onUpload={(file, assetType) =>
              uploadCourseCoverMutation.mutateAsync({ file, assetType })
            }
          />
          <FileAssetCard
            fileId={coverCourse?.coverFileId}
            label="Current cover"
            onUnbind={() => {
              if (!coverCourse) {
                return
              }

              return unbindCourseCover(coverCourse.id)
            }}
            onDeleted={() => {
              setCoverCourse(null)
              void queryClient.invalidateQueries({ queryKey: ['courses'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}

function CoursesTable({
  courses,
  canManageCourses,
  canEnrollCourses,
  enrolledCourseIds,
  onEdit,
  onUploadCover,
  onPublish,
  onArchive,
  onDelete,
  onEnroll,
}: {
  courses: CourseListItem[]
  canManageCourses: boolean
  canEnrollCourses: boolean
  enrolledCourseIds: Set<number>
  onEdit: (course: CourseListItem) => void
  onUploadCover: (course: CourseListItem) => void
  onPublish: (courseId: number) => void
  onArchive: (courseId: number) => void
  onDelete: (courseId: number) => void
  onEnroll: (courseId: number) => void
}) {
  const hasActions = canManageCourses || canEnrollCourses

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-600">Course</TableHead>
            <TableHead className="font-semibold text-slate-600">Status</TableHead>
            <TableHead className="font-semibold text-slate-600">Created</TableHead>
            <TableHead className="font-semibold text-slate-600">Owner</TableHead>
            {hasActions ? <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} className="hover:bg-blue-50/40">
              <TableCell className="whitespace-normal py-4">
                <div className="font-semibold text-slate-950">{course.title}</div>
                {course.subtitle ? (
                  <div className="mt-1 text-sm text-slate-500">{course.subtitle}</div>
                ) : null}
              </TableCell>
              <TableCell>
                <StatusBadge status={course.status} />
              </TableCell>
              <TableCell className="text-slate-600">{formatDate(course.createdAt)}</TableCell>
              <TableCell className="text-slate-600">#{course.ownerId}</TableCell>
              {hasActions ? (
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {canEnrollCourses && course.status === 'PUBLISHED' ? (
                      enrolledCourseIds.has(course.id) ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                          title="Enter learning"
                        >
                          <Link to={`/learn/courses/${course.id}`}>
                            <PlayIcon />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEnroll(course.id)}
                          title="Enroll"
                        >
                          <UserPlusIcon />
                        </Button>
                      )
                    ) : null}
                    {canManageCourses ? (
                      <>
                        {course.status !== 'ARCHIVED' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              asChild
                              title="Lessons"
                            >
                              <Link to={`/courses/${course.id}/lessons`}>
                                <ListOrderedIcon />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onUploadCover(course)}
                              title="Upload cover"
                            >
                              <ImageIcon />
                            </Button>
                          </>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                          title="Enrollments"
                        >
                          <Link to={`/courses/${course.id}/enrollments`}>
                            <UsersIcon />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={course.status === 'PUBLISHED'}
                          onClick={() => onEdit(course)}
                          title="Edit"
                        >
                          <EditIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={course.status === 'PUBLISHED'}
                          onClick={() => onPublish(course.id)}
                          title="Publish"
                        >
                          <CheckCircle2Icon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={course.status !== 'PUBLISHED'}
                          onClick={() => onArchive(course.id)}
                          title="Archive"
                        >
                          <ArchiveIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDelete(course.id)}
                          title="Delete"
                        >
                          <Trash2Icon />
                        </Button>
                      </>
                    ) : null}
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

function StatusBadge({ status }: { status: CourseStatus }) {
  if (status === 'PUBLISHED') {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>
  }

  if (status === 'ARCHIVED') {
    return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Archived</Badge>
  }

  return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Draft</Badge>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}
