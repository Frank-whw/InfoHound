import * as fs from 'fs-extra';
import * as path from 'path';
import { SourceConfig } from '../types';

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

export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  return key;
}
