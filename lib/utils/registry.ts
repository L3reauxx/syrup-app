// lib/utils/registry.ts

// **CORRECTION**: The import is now correctly from 'ai/react', which is provided
// by the '@ai-sdk/react' package you already have installed.
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai/react'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

export const providerRegistry = createProviderRegistry({
  openai: openai,
  google: google,
  azure: createAzure()
})