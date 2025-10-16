// app/search/page.tsx
import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'

export default function SearchPage() {
  const id = nanoid()
  return <Chat id={id} />
}