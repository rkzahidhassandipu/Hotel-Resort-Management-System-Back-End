import dotenv from 'dotenv';
dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Missing env variable: ${key}`);
  return value;
};

export const config = {
  env: getEnv('NODE_ENV', 'development'),
  port: parseInt(getEnv('PORT', '5000')),
  apiPrefix: getEnv('API_PREFIX', '/api/v1'),
  isDev: getEnv('NODE_ENV', 'development') === 'development',
  isProd: getEnv('NODE_ENV', 'development') === 'production',

  db: {
    url: getEnv('DATABASE_URL'),
  },

  jwt: {
    accessSecret: getEnv('JWT_ACCESS_SECRET'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    emailVerifySecret: getEnv('JWT_EMAIL_VERIFY_SECRET'),
    resetPasswordSecret: getEnv('JWT_RESET_PASSWORD_SECRET'),
  },

  bcrypt: {
    saltRounds: parseInt(getEnv('BCRYPT_SALT_ROUNDS', '12')),
  },

  cloudinary: {
    cloudName: getEnv('CLOUDINARY_CLOUD_NAME', 'placeholder'),
    apiKey: getEnv('CLOUDINARY_API_KEY', 'placeholder'),
    apiSecret: getEnv('CLOUDINARY_API_SECRET', 'placeholder'),
  },

  smtp: {
    host: getEnv('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(getEnv('SMTP_PORT', '587')),
    secure: getEnv('SMTP_SECURE', 'false') === 'true',
    user: getEnv('SMTP_USER', ''),
    pass: getEnv('SMTP_PASS', ''),
    fromName: getEnv('SMTP_FROM_NAME', 'Hotel Management'),
    fromEmail: getEnv('SMTP_FROM_EMAIL', 'noreply@hotel.com'),
  },

  frontend: {
    url: getEnv('FRONTEND_URL', 'http://localhost:3000'),
  },

  rateLimit: {
    windowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000')),
    max: parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS', '100')),
  },

  pagination: {
    defaultPageSize: parseInt(getEnv('DEFAULT_PAGE_SIZE', '10')),
    maxPageSize: parseInt(getEnv('MAX_PAGE_SIZE', '100')),
  },

  stripe: {
    secretKey: getEnv('STRIPE_SECRET_KEY', 'placeholder'),
    webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET', 'placeholder'),
  },

  twoFactor: {
    appName: getEnv('TWO_FACTOR_APP_NAME', 'HotelManagement'),
  },
};
