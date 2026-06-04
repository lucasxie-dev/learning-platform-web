import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DownloadIcon, ExternalLinkIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createFileAccessUrl, deleteFile, getFile } from '@/features/files/file-api'
import { getApiErrorMessage } from '@/lib/api'

export function FileAssetCard({
  fileId,
  label,
  onUnbind,
  onDeleted,
}: {
  fileId: number | null | undefined
  label: string
  onUnbind?: () => Promise<void> | void
  onDeleted?: () => void
}) {
  const queryClient = useQueryClient()
  const fileQuery = useQuery({
    queryKey: ['file', fileId],
    queryFn: () => getFile(Number(fileId)),
    enabled: Boolean(fileId),
  })
  const accessUrlQuery = useQuery({
    queryKey: ['file-access-url', fileId],
    queryFn: () => createFileAccessUrl(Number(fileId)),
    enabled: Boolean(fileId),
    staleTime: 60_000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (nextFileId: number) => {
      await onUnbind?.()
      await deleteFile(nextFileId)
    },
    onSuccess: () => {
      toast.success('File deleted')
      void queryClient.invalidateQueries({ queryKey: ['file', fileId] })
      void queryClient.invalidateQueries({ queryKey: ['file-access-url', fileId] })
      onDeleted?.()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  if (!fileId) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        No {label.toLowerCase()} file bound.
      </div>
    )
  }

  if (fileQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        Loading {label.toLowerCase()} file...
      </div>
    )
  }

  if (fileQuery.isError || !fileQuery.data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-muted/30 p-3 text-sm text-destructive">
        Unable to load {label.toLowerCase()} file.
      </div>
    )
  }

  const file = fileQuery.data
  const contentUrl = accessUrlQuery.data?.url

  return (
    <div className="grid gap-3 rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="truncate text-sm">{file.originalName}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge variant="outline">{file.assetType}</Badge>
            <Badge variant="secondary">{formatBytes(file.sizeBytes)}</Badge>
            <Badge variant="outline">{file.storageProvider}</Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate(file.id)}
          title="Delete file"
        >
          <Trash2Icon />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={contentUrl ?? '#'} target="_blank" rel="noreferrer">
            <ExternalLinkIcon />
            Open
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={contentUrl ?? '#'} download>
            <DownloadIcon />
            Download
          </a>
        </Button>
      </div>
      {!contentUrl ? (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          Creating signed preview URL...
        </div>
      ) : null}
      {contentUrl && file.contentType.startsWith('image/') ? (
        <img
          alt={file.originalName}
          className="max-h-48 rounded-lg border object-cover"
          src={contentUrl}
        />
      ) : null}
      {contentUrl && file.contentType.startsWith('audio/') ? (
        <audio className="w-full" controls src={contentUrl} />
      ) : null}
      {contentUrl && file.contentType.startsWith('video/') ? (
        <video className="max-h-64 w-full rounded-lg border bg-black" controls src={contentUrl} />
      ) : null}
      {contentUrl && isSubtitle(file.contentType) ? (
        <Button variant="outline" size="sm" asChild>
          <a href={contentUrl} target="_blank" rel="noreferrer">
            Preview subtitle
          </a>
        </Button>
      ) : null}
    </div>
  )
}

function isSubtitle(contentType: string) {
  return ['text/vtt', 'application/x-subrip', 'text/plain'].includes(contentType)
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`
}
