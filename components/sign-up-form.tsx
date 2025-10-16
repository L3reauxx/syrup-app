// components/sign-up-form.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { IconGitHub, IconGoogle, IconSpinner } from '@/components/ui/icons'
import { PasswordInput } from '@/components/ui/password-input'
import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const SignUpSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, {
        message: 'Password must be at least 8 characters'
      })
      .max(128, {
        message: 'Password must be less than 128 characters'
      }),
    confirmPassword: z.string()
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

export function SignUpForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  async function onSubmit(data: z.infer<typeof SignUpSchema>) {
    startTransition(async () => {
      try {
        await createUserWithEmailAndPassword(auth, data.email, data.password)
        toast.success('Account created successfully!')
        router.push('/dashboard') // Redirect to dashboard after signup
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          toast.error('This email is already registered.')
        } else {
          toast.error('An unexpected error occurred. Please try again.')
        }
      }
    })
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-4 sm:w-[400px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to create an account
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    {...field}
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && (
              <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create account
          </Button>
        </form>
      </Form>

      <p className="px-8 text-center text-sm text-muted-foreground">
        By continuing, you agree to our{' '}
        <Link
          href="/terms"
          className="hover:text-brand underline underline-offset-4"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          className="hover:text-brand underline underline-offset-4"
        >
          Privacy Policy
        </Link>
        .
      </p>
      <div className="relative">
        <Separator />
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" disabled={true}>
          <IconGitHub className="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button variant="outline" disabled={true}>
          <IconGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/auth/login"
          className="hover:text-brand underline underline-offset-4"
        >
          Already have an account? Log in
        </Link>
      </p>
    </div>
  )
}