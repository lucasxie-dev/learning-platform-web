import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Lesson, LessonPayload } from '@/features/lessons/types'

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
  const [sortOrder, setSortOrder] = useState('')

  useEffect(() => {
    setTitle(lesson?.title ?? '')
    setDescription(lesson?.description ?? '')
    setSortOrder(lesson?.sortOrder.toString() ?? '')
  }, [lesson])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      sortOrder: sortOrder === '' ? undefined : Number(sortOrder),
    })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
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
          Description
        </label>
        <textarea
          id="lesson-description"
          className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          maxLength={10000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : lesson ? 'Save changes' : 'Create lesson'}
        </Button>
      </DialogFooter>
    </form>
  )
}
