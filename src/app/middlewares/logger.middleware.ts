import morgan from 'morgan';
import { logger } from '../utils/logger';
import { config } from '../config/env';

const stream = {
  write: (message: string) => logger.info(message.trim()),
};

export const requestLogger = morgan(
  config.isDev ? 'dev' : ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream },
);
