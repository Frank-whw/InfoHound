import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';

interface CacheEntry {
  content: string;
  expiresAt: number;
}

export class ContentCache {
  private cacheDir: string;

  constructor(cacheDir: string = './data/cache') {
    this.cacheDir = cacheDir;
    fs.ensureDirSync(this.cacheDir);
  }

  private getCacheKey(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  private getCachePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  async get(key: string): Promise<string | null> {
    try {
      const cachePath = this.getCachePath(this.getCacheKey(key));

      if (!(await fs.pathExists(cachePath))) {
        return null;
      }

      const entry: CacheEntry = await fs.readJson(cachePath);

      if (Date.now() > entry.expiresAt) {
        await fs.remove(cachePath);
        return null;
      }

      return entry.content;
    } catch {
      return null;
    }
  }

  async set(key: string, content: string, ttlHours: number = 24): Promise<void> {
    const cachePath = this.getCachePath(this.getCacheKey(key));
    const entry: CacheEntry = {
      content,
      expiresAt: Date.now() + ttlHours * 60 * 60 * 1000,
    };
    await fs.writeJson(cachePath, entry);
  }

  async getOrFetch(
    key: string,
    fetcher: () => Promise<string>,
    ttlHours: number = 24
  ): Promise<string> {
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    const content = await fetcher();
    await this.set(key, content, ttlHours);
    return content;
  }
}
