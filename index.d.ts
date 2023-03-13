export {}
import { RedisClientType } from 'redis';

declare module 'node-laravel-session' {
  export function getSessionKey(laravelSession: string, laravelKey: string): string
  export async function getSessionFromRedis(laravelSessionKey: string, redisConnection: RedisClientType, sessionPrefix: string): string
}