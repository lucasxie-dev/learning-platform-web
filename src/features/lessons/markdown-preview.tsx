import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

import { createFileAccessUrl } from '@/features/files/file-api'

export function MarkdownPreview({ markdown }: { markdown: string | null | undefined }) {
  const fileIds = useMemo(() => extractFileIds(markdown ?? ''), [markdown])
  const urlQueries = useQueries({
    queries: fileIds.map((fileId) => ({
      queryKey: ['file-access-url', fileId],
      queryFn: () => createFileAccessUrl(fileId),
      staleTime: 60_000,
    })),
  })
  const fileUrls = new Map<number, string>()

  fileIds.forEach((fileId, index) => {
    const url = urlQueries[index]?.data?.url

    if (url) {
      fileUrls.set(fileId, url)
    }
  })

  const html = renderMarkdown(markdown ?? '', fileUrls)

  if (!markdown?.trim()) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        No Markdown content yet.
      </div>
    )
  }

  return (
    <div
      className="space-y-3 rounded-lg border bg-background p-4 text-sm leading-7 [&_a]:text-primary [&_a]:underline [&_audio]:w-full [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_img]:rounded-lg [&_img]:border [&_img]:max-h-96 [&_img]:object-contain [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_video]:max-h-96 [&_video]:w-full [&_video]:rounded-lg [&_video]:border"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function extractFileIds(markdown: string) {
  return Array.from(markdown.matchAll(/file:(\d+)/g))
    .map((match) => Number(match[1]))
    .filter((fileId, index, values) => Number.isFinite(fileId) && values.indexOf(fileId) === index)
}

function renderMarkdown(markdown: string, fileUrls: Map<number, string>) {
  const placeholders = new Map<string, string>()
  let placeholderIndex = 0

  function addPlaceholder(html: string) {
    const key = `@@LP_MD_${placeholderIndex++}@@`
    placeholders.set(key, html)
    return key
  }

  let source = markdown
    .replace(/<audio\s+controls\s+src=["']file:(\d+)["']\s*><\/audio>/gi, (_, fileId: string) => {
      const url = fileUrls.get(Number(fileId))
      if (!url) {
        return addPlaceholder(`<div class="rounded-lg border bg-muted/30 p-3 text-muted-foreground">Loading audio file:${escapeHtml(fileId)}...</div>`)
      }

      return addPlaceholder(`<audio controls src="${escapeAttribute(url)}"></audio>`)
    })
    .replace(/<video\s+controls\s+src=["']file:(\d+)["']\s*><\/video>/gi, (_, fileId: string) => {
      const url = fileUrls.get(Number(fileId))
      if (!url) {
        return addPlaceholder(`<div class="rounded-lg border bg-muted/30 p-3 text-muted-foreground">Loading video file:${escapeHtml(fileId)}...</div>`)
      }

      return addPlaceholder(`<video controls src="${escapeAttribute(url)}"></video>`)
    })
    .replace(/!\[([^\]]*)]\(file:(\d+)\)/g, (_, alt: string, fileId: string) => {
      const url = fileUrls.get(Number(fileId))
      if (!url) {
        return addPlaceholder(`<div class="rounded-lg border bg-muted/30 p-3 text-muted-foreground">Loading image file:${escapeHtml(fileId)}...</div>`)
      }

      return addPlaceholder(`<img alt="${escapeAttribute(alt)}" src="${escapeAttribute(url)}" />`)
    })
    .replace(/\[([^\]]+)]\(file:(\d+)\)/g, (_, text: string, fileId: string) => {
      const url = fileUrls.get(Number(fileId))
      if (!url) {
        return addPlaceholder(`<span class="text-muted-foreground">Loading file:${escapeHtml(fileId)}...</span>`)
      }

      return addPlaceholder(`<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`)
    })

  source = escapeHtml(source)

  const blocks = source.split(/\n{2,}/).map((block) => renderBlock(block))
  let html = blocks.join('\n')

  placeholders.forEach((value, key) => {
    html = html.replaceAll(key, value)
  })

  return html
}

function renderBlock(block: string) {
  const lines = block.split('\n')
  const firstLine = lines[0] ?? ''

  if (firstLine.startsWith('# ')) {
    return `<h1>${renderInline(firstLine.slice(2))}</h1>`
  }

  if (firstLine.startsWith('## ')) {
    return `<h2>${renderInline(firstLine.slice(3))}</h2>`
  }

  if (firstLine.startsWith('### ')) {
    return `<h3>${renderInline(firstLine.slice(4))}</h3>`
  }

  if (lines.every((line) => line.startsWith('- '))) {
    return `<ul>${lines.map((line) => `<li>${renderInline(line.slice(2))}</li>`).join('')}</ul>`
  }

  if (lines.every((line) => line.startsWith('&gt; '))) {
    return `<blockquote>${lines.map((line) => renderInline(line.slice(5))).join('<br />')}</blockquote>`
  }

  return `<p>${lines.map((line) => renderInline(line)).join('<br />')}</p>`
}

function renderInline(value: string) {
  return value
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttribute(value: string) {
  return escapeHtml(value)
}
