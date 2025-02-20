import { errorResponse } from './utils/error-response';
import express, { NextFunction, Request, Response } from 'express';
import { config } from './config';
import { apiRouter } from './routes';
import helmet from 'helmet';
import cors from 'cors';
import { RateLimiterRedis } from "rate-limiter-flexible"
import Redis from "ioredis";
import { StatusCodes } from 'http-status-codes';
import { rateLimit } from 'express-rate-limit';
import { RedisReply, RedisStore } from "rate-limit-redis"
import { errorHandler } from './middlewares/error-middleware';
import { middlewares } from './middlewares';

const { server_config } = config;
const { SERVER_PORT, REDIS_URI } = server_config;
const app = express();
const redisClient = new Redis(REDIS_URI);


app.use(helmet());
app.use(cors({
  origin: '*'
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  config.logger.info(`Received ${req.method} request to ${req.url}`);
  config.logger.info(`Request body, ${req.body}`);
  next();
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1
})

app.use((req: Request, res: Response, next: NextFunction) => {
  rateLimiter.consume(req?.ip || "")
    .then(() => {
      next()
    })
    .catch(() => {
      config.logger.error(`Too many requests from IP: ${req?.ip}`)
      errorResponse.message = "Too many requests"
      errorResponse.error.message = "Too many requests"
      errorResponse.error.status = StatusCodes.TOO_MANY_REQUESTS
      res.status(StatusCodes.TOO_MANY_REQUESTS).json(errorResponse)
    })
})



const sensitiveRoutesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    config.logger.error(`Too many requests from IP so rate limit exceeded from Express rate limiter: ${req?.ip}`)
    errorResponse.message = "Too many requests"
    errorResponse.error.message = "Too many requests"
    errorResponse.error.status = StatusCodes.TOO_MANY_REQUESTS
    res.status(StatusCodes.TOO_MANY_REQUESTS).json(errorResponse)
  },
  store: new RedisStore({
    sendCommand: async (...args: [command: string, ...args: string[]]): Promise<RedisReply> => {
      const result = await redisClient.call(...args);
      return result as RedisReply;
    },
    prefix: 'rate-limit:'
  }),
})


app.use("/api/v1/", sensitiveRoutesLimiter);
app.use(middlewares?.errorHandler)
app.use("/api", apiRouter);



app.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});

process.on('unhandledRejection', (err) => {
  config.logger.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  config.logger.error(err);
  process.exit(1);
});


process.on('SIGINT', () => {
  config.logger.info('SIGINT signal received.');
  process.exit(0);
});