import { Queue, Worker } from 'bullmq';
import { env } from './env.js';
import { logger } from './logger.js';

export const bullMqConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableReadyCheck: false,
  tls: env.REDIS_TLS ? {} : undefined,
  retryStrategy: (times: number) => {
    if (env.NODE_ENV !== 'production' && times > 3) {
      return null;
    }

    return Math.min(times * 100, 2000);
  },
  connectTimeout: 5000,
};

export function registerQueueErrorHandler(queue: Queue, name: string): Queue {
  queue.on('error', (error: Error) => {
    logger.error(`BullMQ queue error: ${name}`, {
      error: error.message,
    });
  });

  return queue;
}

export function registerWorkerErrorHandler(worker: Worker, name: string): Worker {
  worker.on('error', (error: Error) => {
    logger.error(`BullMQ worker error: ${name}`, {
      error: error.message,
    });
  });

  return worker;
}
