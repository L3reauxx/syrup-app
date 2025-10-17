// lib/utils/registry.ts

// **FIX**: The import is now correctly from '@ai-sdk/core', which is the central package for the AI SDK.
import { experimental_createProviderRegistry as createProviderRegistry } from '@ai-sdk/core'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

export const providerRegistry = createProviderRegistry({
  openai: openai,
  google: google,
  azure: createAzure()
})