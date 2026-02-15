import * as fs from 'fs-extra';
import * as path from 'path';
import { SourceConfig } from '../types';
import { AIConfig } from '../ai/ai-service';

interface AppConfig {
  sources: SourceConfig[];
  settings: {
    maxArticlesPerSource: number;
    maxArticlesPerDay: number;
    retentionDays: number;
    categories: string[];
  };
}

export async function loadConfig(): Promise<AppConfig> {
  const configPath = path.join(process.cwd(), 'config', 'sources.json');
  const content = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(content) as AppConfig;
}

export function getAIConfig(): AIConfig {
  // Provider type (default: anthropic)
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIConfig['provider'];

  // API Key
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    // Fallback to legacy ANTHROPIC_API_KEY for backward compatibility
    const legacyKey = process.env.ANTHROPIC_API_KEY;
    if (legacyKey) {
      return {
        provider: 'anthropic',
        apiKey: legacyKey,
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 2000,
        temperature: 0.3,
      };
    }
    throw new Error('AI_API_KEY environment variable is required');
  }

  // Base URL (optional)
  const baseURL = process.env.AI_BASE_URL;

  // Model (provider-specific defaults)
  const model = process.env.AI_MODEL || getDefaultModel(provider);

  // Max tokens (default: 2000)
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '2000', 10);

  // Temperature (default: 0.3)
  const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.3');

  return {
    provider,
    apiKey,
    baseURL,
    model,
    maxTokens,
    temperature,
  };
}

function getDefaultModel(provider: AIConfig['provider']): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    case 'openai':
      return 'gpt-4';
    case 'openrouter':
      return 'anthropic/claude-3.5-sonnet';
    case 'deepseek':
      return 'deepseek-chat';
    case 'custom':
      return 'gpt-3.5-turbo';
    default:
      return 'claude-3-5-sonnet-20241022';
  }
}

// Legacy function for backward compatibility
export function getAnthropicApiKey(): string {
  return getAIConfig().apiKey;
}
