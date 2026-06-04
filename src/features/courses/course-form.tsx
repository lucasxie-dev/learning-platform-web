import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Course, CoursePayload } from '@/features/courses/types'

export function CourseForm({
  course,
  isSubmitting,
  onSubmit,
}: {
  course?: Course | null
  isSubmitting: boolean
  onSubmit: (payload: CoursePayload) => void
}) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    setTitle(course?.title ?? '')
    setSubtitle(course?.subtitle ?? '')
    setDescription(course?.description ?? '')
  }, [course])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
    })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="course-title">
          Title
        </label>
        <Input
          id="course-title"
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="course-subtitle">
          Subtitle
        </label>
        <Input
          id="course-subtitle"
          maxLength={300}
          value={subtitle}
          onChange={(event) => setSubtitle(event.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="course-description">
          Description
        </label>
        <textarea
          id="course-description"
          className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          maxLength={10000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : course ? 'Save changes' : 'Create course'}
        </Button>
      </DialogFooter>
    </form>
  )
}
