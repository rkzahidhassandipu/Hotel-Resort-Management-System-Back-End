import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const logDir = path.join(process.cwd(), 'logs');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const fileTransport = (level: string) =>
  new DailyRotateFile({
    dirname: logDir,
    filename: `${level}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level,
  });

const consoleTransport = new winston.transports.Console({
  format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat,
  ),
  transports: isVercel
    ? [consoleTransport]
    : [fileTransport('error'), fileTransport('info'), consoleTransport],

  ...(isVercel ? {} : {
    exceptionHandlers: [fileTransport('exceptions')],
    rejectionHandlers: [fileTransport('rejections')],
  }),
});
