export interface RedisClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, mode?: string, ttl?: number): Promise<boolean>;
}