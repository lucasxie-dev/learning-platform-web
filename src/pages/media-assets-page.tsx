import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileAudioIcon,
  FileIcon,
  FileTextIcon,
  FilmIcon,
  ImageIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

import { getCurrentUser } from '@/features/auth/auth-api'
import {
  createFileAccessUrl,
  deleteFile,
  listFileAssets,
} from '@/features/files/file-api'
import type {
  FileAssetListItem,
  FileAssetType,
  StorageProvider,
} from '@/features/files/types'
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
import { Input } from '@/components/ui/input'

const pageSize = 20

export function MediaAssetsPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [assetType, setAssetType] = useState<FileAssetType | 'ALL'>('ALL')
  const [storageProvider, setStorageProvider] = useState<StorageProvider | 'ALL'>('ALL')
  const [bound, setBound] = useState<'ALL' | 'BOUND' | 'UNBOUND'>('ALL')
  const [page, setPage] = useState(0)

  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false,
  })
  const user = currentUserQuery.data
  const navigation = useWorkspaceNavigation(user)

  const filesQuery = useQuery({
    queryKey: ['files', { keyword, assetType, storageProvider, bound, page }],
    queryFn: () =>
      listFileAssets({
        keyword,
        assetType: assetType === 'ALL' ? undefined : assetType,
        storageProvider: storageProvider === 'ALL' ? undefined : storageProvider,
        bound: bound === 'ALL' ? undefined : bound === 'BOUND',
        page,
        size: pageSize,
      }),
    enabled: navigation.canManageCourses,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      toast.success('File deleted')
      void queryClient.invalidateQueries({ queryKey: ['files'] })
    },
    onError: (error) => {
      toast.error(
        `${getApiErrorMessage(error)}. This file may still be in use. Unbind it before deleting.`,
      )
    },
  })

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(0)
    void filesQuery.refetch()
  }

  function handleClearFilters() {
    setKeyword('')
    setAssetType('ALL')
    setStorageProvider('ALL')
    setBound('ALL')
    setPage(0)
  }

  function handleDelete(fileId: number) {
    if (window.confirm('Delete this file? This cannot be undone.')) {
      deleteMutation.mutate(fileId)
    }
  }

  const files = filesQuery.data?.items ?? []
  const totalPages = filesQuery.data?.totalPages ?? 0
  const hasFilters = Boolean(keyword) || assetType !== 'ALL' || storageProvider !== 'ALL' || bound !== 'ALL'
  const summary = getPageSummary(files)

  return (
    <WorkspaceLayout
      user={user}
      title="Media Assets"
      description="Manage uploaded files, previews, and course media bindings."
      activeItem="media"
      canManageCourses={navigation.canManageCourses}
      canLearn={navigation.canLearn}
      manageLabel={navigation.manageLabel}
      progressHref="/me/courses"
    >
      {!navigation.canManageCourses ? (
        <ForbiddenState />
      ) : (
        <div className="grid gap-5">
          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <CardHeader className="gap-4 md:grid md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="size-4" />
                  Media Assets
                </CardTitle>
                <CardDescription>
                  Upload media from a course or lesson page. This view is for review and cleanup.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Current page" value={summary.total} />
                <SummaryCard label="Images" value={summary.images} />
                <SummaryCard label="Audio / Video" value={summary.audioVideo} />
                <SummaryCard label="Unbound" value={summary.unbound} />
              </div>

              <form className="grid gap-3 xl:grid-cols-[1fr_180px_180px_150px_auto_auto]" onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 shadow-none"
                    placeholder="Search media assets"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                </div>
                <select className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus-visible:border-blue-300 focus-visible:ring-3 focus-visible:ring-blue-100" value={assetType} onChange={(event) => { setAssetType(event.target.value as FileAssetType | 'ALL'); setPage(0) }}>
                  <option value="ALL">All asset types</option>
                  <option value="COURSE_COVER">COURSE_COVER</option>
                  <option value="LESSON_AUDIO">LESSON_AUDIO</option>
                  <option value="LESSON_VIDEO">LESSON_VIDEO</option>
                  <option value="SUBTITLE">SUBTITLE</option>
                  <option value="ATTACHMENT">ATTACHMENT</option>
                  <option value="AVATAR">AVATAR</option>
                </select>
                <select className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus-visible:border-blue-300 focus-visible:ring-3 focus-visible:ring-blue-100" value={storageProvider} onChange={(event) => { setStorageProvider(event.target.value as StorageProvider | 'ALL'); setPage(0) }}>
                  <option value="ALL">All storage</option>
                  <option value="DATABASE">DATABASE</option>
                  <option value="LOCAL">LOCAL</option>
                  <option value="MINIO">MINIO</option>
                  <option value="S3">S3</option>
                </select>
                <select className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus-visible:border-blue-300 focus-visible:ring-3 focus-visible:ring-blue-100" value={bound} onChange={(event) => { setBound(event.target.value as 'ALL' | 'BOUND' | 'UNBOUND'); setPage(0) }}>
                  <option value="ALL">All bindings</option>
                  <option value="BOUND">Bound</option>
                  <option value="UNBOUND">Unbound</option>
                </select>
                <Button className="h-11 rounded-xl" type="submit" variant="outline">
                  Apply
                </Button>
                <Button className="h-11 rounded-xl" type="button" variant="ghost" onClick={handleClearFilters}>
                  <RotateCcwIcon />
                  Clear
                </Button>
              </form>

              {filesQuery.isLoading ? (
                <CardsLoading />
              ) : filesQuery.isError ? (
                <ErrorState message="Unable to load media assets." onRetry={() => void filesQuery.refetch()} />
              ) : files.length ? (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {files.map((file) => (
                    <MediaAssetCard
                      key={file.id}
                      file={file}
                      isDeleting={deleteMutation.isPending}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No media assets found."
                  description={
                    hasFilters
                      ? 'Try adjusting your filters.'
                      : 'Upload course covers, lesson audio, videos, or subtitles to enrich your learning content.'
                  }
                />
              )}

              <PaginationFooter
                total={filesQuery.data?.total ?? 0}
                label="media assets"
                page={page}
                totalPages={totalPages}
                onPrevious={() => setPage((current) => Math.max(current - 1, 0))}
                onNext={() => setPage((current) => current + 1)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </WorkspaceLayout>
  )
}

function MediaAssetCard({
  file,
  isDeleting,
  onDelete,
}: {
  file: FileAssetListItem
  isDeleting: boolean
  onDelete: (fileId: number) => void
}) {
  const [accessUrl, setAccessUrl] = useState<string | null>(null)
  const accessUrlMutation = useMutation({
    mutationFn: () => createFileAccessUrl(file.id),
    onSuccess: (response) => setAccessUrl(response.url),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  async function ensureAccessUrl() {
    if (accessUrl) {
      return accessUrl
    }

    const response = await accessUrlMutation.mutateAsync()
    return response.url
  }

  async function handleOpen() {
    const url = await ensureAccessUrl()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleDownload() {
    const url = await ensureAccessUrl()
    const link = document.createElement('a')
    link.href = url
    link.download = file.originalName
    link.rel = 'noreferrer noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  async function handleCopy() {
    const url = await ensureAccessUrl()
    await navigator.clipboard.writeText(url)
    toast.success('Signed URL copied')
  }

  const preview = getPreview(file, accessUrl)

  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-slate-50">
        {preview}
      </div>
      <CardContent className="grid gap-4 pt-4">
        <div className="min-w-0">
          <div className="truncate font-bold text-slate-950">{file.originalName}</div>
          <div className="mt-1 truncate text-sm text-slate-500">{file.contentType}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AssetTypeBadge assetType={file.assetType} />
          <StorageBadge provider={file.storageProvider} />
          <Badge className={file.bound ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
            {file.bound ? 'Bound' : 'Unbound'}
          </Badge>
          <Badge variant="outline">{formatBytes(file.sizeBytes)}</Badge>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <div className="font-medium text-slate-950">
            {file.bound ? file.bindingLabel ?? file.bindingTargetTitle ?? 'Bound media' : 'Not bound'}
          </div>
          {file.bound ? (
            <div className="mt-1 text-xs text-slate-500">
              {file.bindingTargetType ?? file.relatedType ?? 'Target'} {file.relatedId ? `#${file.relatedId}` : ''}
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Owner #{file.ownerId}</span>
          <span>{formatDate(file.updatedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-xl" variant="outline" size="sm" disabled={accessUrlMutation.isPending} onClick={handleOpen}>
            <ExternalLinkIcon />
            Open
          </Button>
          <Button className="rounded-xl" variant="outline" size="sm" disabled={accessUrlMutation.isPending} onClick={handleDownload}>
            <DownloadIcon />
            Download
          </Button>
          <Button className="rounded-xl" variant="outline" size="sm" disabled={accessUrlMutation.isPending} onClick={handleCopy}>
            <CopyIcon />
            Copy URL
          </Button>
          <Button className="ml-auto rounded-xl" variant="ghost" size="sm" disabled={isDeleting} onClick={() => onDelete(file.id)}>
            <Trash2Icon />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getPreview(file: FileAssetListItem, accessUrl: string | null) {
  if (accessUrl && file.contentType.startsWith('image/')) {
    return <img alt={file.originalName} className="h-full w-full object-cover" src={accessUrl} />
  }

  if (accessUrl && file.contentType.startsWith('audio/')) {
    return <audio className="w-[85%]" controls src={accessUrl} />
  }

  if (accessUrl && file.contentType.startsWith('video/')) {
    return <video className="h-full w-full bg-black object-contain" controls src={accessUrl} />
  }

  const icon = file.assetType === 'LESSON_AUDIO'
    ? <FileAudioIcon />
    : file.assetType === 'LESSON_VIDEO'
      ? <FilmIcon />
      : file.assetType === 'SUBTITLE'
        ? <FileTextIcon />
        : file.assetType === 'COURSE_COVER' || file.assetType === 'AVATAR'
          ? <ImageIcon />
          : <FileIcon />

  return <span className="text-slate-300 [&>svg]:size-12">{icon}</span>
}

function useWorkspaceNavigation(user: { roles: string[]; permissions: string[] } | undefined) {
  return useMemo(() => {
    const roles = user?.roles ?? []
    const permissions = user?.permissions ?? []
    const isAdmin = roles.includes('ADMIN')
    const isTeacher = roles.includes('TEACHER')
    const canManageCourses =
      isAdmin ||
      isTeacher ||
      permissions.some((permission) => permission.startsWith('course:'))
    const canLearn = roles.includes('STUDENT')
    const manageLabel = isAdmin ? 'Courses' : isTeacher ? 'My Courses' : 'Courses'

    return { canManageCourses, canLearn, manageLabel }
  }, [user])
}

function getPageSummary(files: FileAssetListItem[]) {
  return {
    total: files.length,
    images: files.filter((file) => file.contentType.startsWith('image/')).length,
    audioVideo: files.filter((file) => file.contentType.startsWith('audio/') || file.contentType.startsWith('video/')).length,
    unbound: files.filter((file) => !file.bound).length,
  }
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-2xl font-bold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  )
}

function AssetTypeBadge({ assetType }: { assetType: FileAssetType }) {
  return <Badge className="bg-blue-50 text-blue-700 ring-1 ring-blue-100">{assetType}</Badge>
}

function StorageBadge({ provider }: { provider: StorageProvider }) {
  return <Badge className="bg-violet-50 text-violet-700 ring-1 ring-violet-100">{provider}</Badge>
}

function CardsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Card key={item} className="rounded-3xl border-slate-200/80 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="aspect-video animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-4 h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
        </Card>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-background p-6 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <Button className="rounded-xl" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-6 text-sm text-slate-500">
      <div className="font-semibold text-slate-700">{title}</div>
      <div className="mt-1">{description}</div>
    </div>
  )
}

function ForbiddenState() {
  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="font-bold text-slate-950">Media assets are available to admins and teachers.</div>
      <p className="mt-1 text-sm text-slate-500">Your account can continue learning from the course catalog.</p>
    </Card>
  )
}

function PaginationFooter({
  total,
  label,
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  total: number
  label: string
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>Total {total} {label}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 0} onClick={onPrevious}>
          Previous
        </Button>
        <span>Page {page + 1} / {Math.max(totalPages, 1)}</span>
        <Button variant="outline" size="sm" className="rounded-xl" disabled={page + 1 >= totalPages} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  )
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}
