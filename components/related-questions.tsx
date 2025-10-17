// components/related-questions.tsx
'use client'

import { memo } from 'react'
// **FIX**: This special hook must be imported from the 'ai/rsc' sub-path, which is
// provided by the 'ai' package. This resolves the "Cannot find module" error.
import { useStreamableValue } from 'ai/rsc'
import { IconPlus } from '@/components/ui/icons'

const RelatedQuestion = ({
  question,
  onClick
}: {
  question: string
  onClick: () => void
}) => (
  <button
    key={question}
    className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-left text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
    onClick={onClick}
  >
    <IconPlus /> {question}
  </button>
)

const RelatedQuestions = ({
  relatedQuestions: relatedQuestionsStream,
  onSelect
}: {
  relatedQuestions: any
  onSelect: (question: string) => void
}) => {
  const [data] = useStreamableValue(relatedQuestionsStream)
  const relatedQuestions = data as string[]

  if (!relatedQuestions || relatedQuestions.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {relatedQuestions.map(question => (
        <RelatedQuestion
          key={question}
          question={question}
          onClick={() => onSelect(question)}
        />
      ))}
    </div>
  )
}

export default memo(RelatedQuestions)