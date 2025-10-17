// lib/utils/registry.ts

// **CORRECTION**: The import is now correctly from '@ai-sdk/core' which we installed.
import { experimental_createProviderRegistry as createProviderRegistry } from '@ai-sdk/core'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

export const providerRegistry = createProviderRegistry({
  openai: openai,
  google: google,
  azure: createAzure()
})