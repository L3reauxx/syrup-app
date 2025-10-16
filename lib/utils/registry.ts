// lib/utils/registry.ts

// **CORRECTION**: The import is now from '@ai-sdk/core'
import { experimental_createProviderRegistry as createProviderRegistry } from '@ai-sdk/core'
import { OpenAI } from '@ai-sdk/openai'
import { Google } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

export const providerRegistry = createProviderRegistry({
  openai: OpenAI,
  google: Google,
  azure: createAzure()
})