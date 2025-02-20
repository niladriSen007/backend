import Redis from "ioredis";

declare global {
  namespace Express {
    interface Request {
      ip?: string;
      user?: {
        id: string;
        [key: string]: any;
      };
      redisClient?: Redis;
    }
  }
}