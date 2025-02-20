import { config } from 'dotenv';
config();

const SERVER_PORT = process.env.SERVER_PORT ?? 5000;
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
const REDIS_URI = process.env.REDIS_URI ?? 'redis://localhost:6379';

export  const server_config = {
  SERVER_PORT,
  NODE_ENV,
  REDIS_URI
}