// components/header.tsx
'use client'

import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/user-menu'
import { GuestMenu } from '@/components/guest-menu'
// **FIX**: We import `useAuth` to get the current user's state directly within this component.
import { useAuth } from '@/context/AuthContext'
import type { User } from 'firebase/auth'

// **FIX**: The HeaderProps no longer requires a 'user' prop, as it gets it from the context.
interface HeaderProps extends React.ComponentProps<'header'> {}

export function Header({ className }: HeaderProps) {
  const { user } = useAuth() // Get the user from our global Auth Context.

  return (
    <header
      className={cn(
        'flex h-16 w-full items-center justify-between bg-background px-4',
        className
      )}
    >
      <div className="flex items-center">
        <h1 className="font-bold text-xl">Syrup</h1>
      </div>
      {/* Conditionally render the UserMenu or GuestMenu based on the auth state. */}
      <div>{user ? <UserMenu user={user as User} /> : <GuestMenu />}</div>
    </header>
  )
}