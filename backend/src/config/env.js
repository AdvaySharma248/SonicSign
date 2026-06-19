require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/sonicsign'),
  JWT_ACCESS_SECRET: z.string().default('change-me-access-secret'),
  JWT_REFRESH_SECRET: z.string().default('change-me-refresh-secret'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  REFRESH_COOKIE_NAME: z.string().default('sonicsign_refresh'),
  UPLOAD_DIR: z.string().default('src/uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(10 * 1024 * 1024),
  SIGNING_LINK_TTL_HOURS: z.coerce.number().default(72),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().default('SonicSign'),
  SMTP_FROM_EMAIL: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
});

const parsedEnv = envSchema.parse({
  ...process.env,
  MONGO_URI:
    process.env.MONGO_URI ||
    (process.env.DATABASE_URL?.startsWith('mongodb') ? process.env.DATABASE_URL : undefined),
});

const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,
  frontendUrl: parsedEnv.FRONTEND_URL,
  mongoUri: parsedEnv.MONGO_URI,
  accessTokenSecret: parsedEnv.JWT_ACCESS_SECRET,
  refreshTokenSecret: parsedEnv.JWT_REFRESH_SECRET,
  accessTokenTtl: parsedEnv.JWT_ACCESS_TTL,
  refreshTokenTtl: parsedEnv.JWT_REFRESH_TTL,
  refreshCookieName: parsedEnv.REFRESH_COOKIE_NAME,
  uploadDir: parsedEnv.UPLOAD_DIR,
  maxUploadBytes: parsedEnv.MAX_UPLOAD_BYTES,
  signingLinkTtlHours: parsedEnv.SIGNING_LINK_TTL_HOURS,
  smtpHost: parsedEnv.SMTP_HOST,
  smtpPort: parsedEnv.SMTP_PORT,
  smtpSecure: parsedEnv.SMTP_SECURE,
  smtpUser: parsedEnv.SMTP_USER,
  smtpPass: parsedEnv.SMTP_PASS,
  smtpFromName: parsedEnv.SMTP_FROM_NAME,
  smtpFromEmail: parsedEnv.SMTP_FROM_EMAIL,
  firebaseProjectId: parsedEnv.FIREBASE_PROJECT_ID,
  firebasePrivateKey: parsedEnv.FIREBASE_PRIVATE_KEY,
  firebaseClientEmail: parsedEnv.FIREBASE_CLIENT_EMAIL,
};

module.exports = { env };
