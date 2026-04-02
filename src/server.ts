import app from './app';
import { config } from './app/config/env';
import { connectDB, disconnectDB } from './app/lib/prisma';
import { logger } from './app/utils/logger';

const startServer = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info('─────────────────────────────────────────');
    logger.info('🏨  Hotel & Resort Management API');
    logger.info(`🌍  Environment : ${config.env}`);
    logger.info(`🚀  Server      : http://localhost:${config.port}`);
    logger.info(`📡  API Base    : http://localhost:${config.port}${config.apiPrefix}`);
    logger.info('─────────────────────────────────────────');
  });


};

startServer();
