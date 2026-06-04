import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FileAssetType, FileUploadResponse } from '@/features/files/types'

export function FileUploadField({
  label,
  accept,
  assetType,
  isUploading,
  onUpload,
}: {
  label: string
  accept: string
  assetType: FileAssetType
  isUploading: boolean
  onUpload: (file: File, assetType: FileAssetType) => Promise<FileUploadResponse | void>
}) {
  const [file, setFile] = useState<File | null>(null)

  async function handleUpload() {
    if (!file) {
      return
    }

    await onUpload(file, assetType)
    setFile(null)
  }

  return (
    <div className="grid gap-2 rounded-lg border bg-background p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{assetType}</div>
      </div>
      <Input
        accept={accept}
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">
          {file?.name ?? 'No file selected'}
        </span>
        <Button
          type="button"
          size="sm"
          disabled={!file || isUploading}
          onClick={handleUpload}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  )
}
