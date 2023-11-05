import { createHmac } from 'crypto';
import { json } from './utils';

const { HASH_SECRET } = process.env;

const SECRET = HASH_SECRET || "294S@t>9w";

export function hashId(data: Record<string,any>, length: number = 8): string {
  const hash = createHmac('sha256', SECRET)
    .update(json(data))
    .digest('base64url');
  return hash.substring(0, length);
}


export function withId<T extends Record<string,any>>(data: T): T & { id: string } {
  return {
    ...data,
    id: hashId(data),
  }
}
