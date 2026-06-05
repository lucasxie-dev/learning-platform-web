import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, ImageIcon, MusicIcon, VideoIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { uploadFile } from '@/features/files/file-api'
import type { FileAssetType } from '@/features/files/types'
import { MarkdownPreview } from '@/features/lessons/markdown-preview'
import type { Lesson, LessonPayload } from '@/features/lessons/types'
import { getApiErrorMessage } from '@/lib/api'

type FormStep = 'details' | 'content'

export function LessonForm({
  lesson,
  isSubmitting,
  onSubmit,
}: {
  lesson?: Lesson | null
  isSubmitting: boolean
  onSubmit: (payload: LessonPayload) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentMarkdown, setContentMarkdown] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [step, setStep] = useState<FormStep>('details')
  const [uploadingType, setUploadingType] = useState<FileAssetType | null>(null)
  const editorScrollRef = useRef<HTMLTextAreaElement | null>(null)
  const previewScrollRef = useRef<HTMLDivElement | null>(null)
  const isSyncingScrollRef = useRef(false)
  const scrollSyncFrameRef = useRef<number | null>(null)

  useEffect(() => {
    setTitle(lesson?.title ?? '')
    setDescription(lesson?.description ?? '')
    setContentMarkdown(lesson?.contentMarkdown ?? '')
    setSortOrder(lesson?.sortOrder.toString() ?? '')
    setStep('details')
  }, [lesson])

  useEffect(() => {
    return () => {
      if (scrollSyncFrameRef.current) {
        window.cancelAnimationFrame(scrollSyncFrameRef.current)
      }
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      contentMarkdown: contentMarkdown.trim() || undefined,
      sortOrder: sortOrder === '' ? undefined : Number(sortOrder),
    })
  }

  async function handleInlineFileUpload(file: File | undefined, assetType: FileAssetType) {
    if (!file) {
      return
    }

    setUploadingType(assetType)

    try {
      const uploadedFile = await uploadFile(file, assetType)
      const markdown = toMarkdownSnippet(uploadedFile.id, uploadedFile.originalName, assetType)
      insertMarkdownAtCursor(markdown)
      toast.success('File uploaded and inserted')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setUploadingType(null)
    }
  }

  function insertMarkdownAtCursor(markdown: string) {
    const editor = editorScrollRef.current

    if (!editor) {
      setContentMarkdown((current) => `${current}${current.trim() ? '\n\n' : ''}${markdown}\n`)
      return
    }

    const current = contentMarkdown
    const selectionStart = editor.selectionStart
    const selectionEnd = editor.selectionEnd
    const before = current.slice(0, selectionStart)
    const after = current.slice(selectionEnd)
    const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
    const suffix = after && !after.startsWith('\n') ? '\n\n' : '\n'
    const inserted = `${prefix}${markdown}${suffix}`
    const nextCursorPosition = before.length + inserted.length

    setContentMarkdown(`${before}${inserted}${after}`)

    window.requestAnimationFrame(() => {
      editor.focus()
      editor.setSelectionRange(nextCursorPosition, nextCursorPosition)
    })
  }

  function syncScroll(source: 'editor' | 'preview') {
    if (isSyncingScrollRef.current) {
      return
    }

    const fromElement = source === 'editor' ? editorScrollRef.current : previewScrollRef.current
    const toElement = source === 'editor' ? previewScrollRef.current : editorScrollRef.current

    if (!fromElement || !toElement) {
      return
    }

    if (scrollSyncFrameRef.current) {
      window.cancelAnimationFrame(scrollSyncFrameRef.current)
    }

    scrollSyncFrameRef.current = window.requestAnimationFrame(() => {
      scrollSyncFrameRef.current = null
      const fromMaxScroll = Math.max(0, fromElement.scrollHeight - fromElement.clientHeight)
      const toMaxScroll = Math.max(0, toElement.scrollHeight - toElement.clientHeight)
      const ratio = fromMaxScroll > 0 ? fromElement.scrollTop / fromMaxScroll : 0

      isSyncingScrollRef.current = true
      toElement.scrollTop = ratio * toMaxScroll
      window.requestAnimationFrame(() => {
        isSyncingScrollRef.current = false
      })
    })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 rounded-lg bg-muted p-1 text-sm">
        <StepButton
          isActive={step === 'details'}
          label="1. Details"
          onClick={() => setStep('details')}
        />
        <StepButton
          isActive={step === 'content'}
          label="2. Markdown content"
          onClick={() => setStep('content')}
        />
      </div>

      {step === 'details' ? (
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="lesson-title">
              Title
            </label>
            <Input
              id="lesson-title"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="lesson-sort-order">
              Sort order
            </label>
            <Input
              id="lesson-sort-order"
              min={0}
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="lesson-description">
              Short description
            </label>
            <textarea
              id="lesson-description"
              className="min-h-40 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              maxLength={10000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-sm font-medium" htmlFor="lesson-content-markdown">
                Markdown content
              </label>
              <p className="text-xs text-muted-foreground">
                Use file:id references. Uploaded files are inserted automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <InlineUploadButton
                accept="image/jpeg,image/png,image/webp,image/gif"
                assetType="ATTACHMENT"
                disabled={Boolean(uploadingType)}
                icon={<ImageIcon />}
                label={uploadingType === 'ATTACHMENT' ? 'Uploading...' : 'Image'}
                onUpload={handleInlineFileUpload}
              />
              <InlineUploadButton
                accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4"
                assetType="LESSON_AUDIO"
                disabled={Boolean(uploadingType)}
                icon={<MusicIcon />}
                label={uploadingType === 'LESSON_AUDIO' ? 'Uploading...' : 'Audio'}
                onUpload={handleInlineFileUpload}
              />
              <InlineUploadButton
                accept="video/mp4,video/quicktime,video/webm"
                assetType="LESSON_VIDEO"
                disabled={Boolean(uploadingType)}
                icon={<VideoIcon />}
                label={uploadingType === 'LESSON_VIDEO' ? 'Uploading...' : 'Video'}
                onUpload={handleInlineFileUpload}
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <textarea
              ref={editorScrollRef}
              id="lesson-content-markdown"
              className="h-[520px] max-h-[60vh] w-full resize-none overflow-y-auto rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              maxLength={100000}
              placeholder={'# Lesson content\n\nWrite Markdown here.\n\n![image](file:12)\n\n<audio controls src="file:15"></audio>'}
              value={contentMarkdown}
              onChange={(event) => setContentMarkdown(event.target.value)}
              onScroll={() => syncScroll('editor')}
            />
            <div
              ref={previewScrollRef}
              className="h-[520px] max-h-[60vh] overflow-y-auto rounded-lg"
              onScroll={() => syncScroll('preview')}
            >
              <MarkdownPreview markdown={contentMarkdown} />
            </div>
          </div>
        </div>
      )}

      <DialogFooter>
        {step === 'content' ? (
          <Button
            type="button"
            variant="outline"
            onClick={(event) => {
              event.preventDefault()
              setStep('details')
            }}
          >
            <ArrowLeftIcon />
            Back
          </Button>
        ) : null}
        {step === 'details' ? (
          <Button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              setStep('content')
            }}
          >
            Next
            <ArrowRightIcon />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : lesson ? 'Save changes' : 'Create lesson'}
          </Button>
        )}
      </DialogFooter>
    </form>
  )
}

function StepButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function InlineUploadButton({
  accept,
  assetType,
  disabled,
  icon,
  label,
  onUpload,
}: {
  accept: string
  assetType: FileAssetType
  disabled: boolean
  icon: ReactNode
  label: string
  onUpload: (file: File | undefined, assetType: FileAssetType) => void
}) {
  return (
    <Button variant="outline" size="sm" disabled={disabled} asChild>
      <label>
        {icon}
        {label}
        <input
          className="sr-only"
          type="file"
          accept={accept}
          onChange={(event) => {
            onUpload(event.target.files?.[0], assetType)
            event.target.value = ''
          }}
        />
      </label>
    </Button>
  )
}

function toMarkdownSnippet(fileId: number, originalName: string, assetType: FileAssetType) {
  if (assetType === 'LESSON_AUDIO') {
    return `<audio controls src="file:${fileId}"></audio>`
  }

  if (assetType === 'LESSON_VIDEO') {
    return `<video controls src="file:${fileId}"></video>`
  }

  return `![${originalName}](file:${fileId})`
}
