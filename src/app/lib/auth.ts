import jwt, { SignOptions, JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload } from '../interfaces';

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as SignOptions);
};

export const signRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
};

export const signEmailVerifyToken = (payload: { userId: string; email: string }): string => {
  return jwt.sign(payload, config.jwt.emailVerifySecret, {
    expiresIn: '24h',
  } as SignOptions);
};

export const signResetPasswordToken = (payload: { userId: string; email: string }): string => {
  return jwt.sign(payload, config.jwt.resetPasswordSecret, {
    expiresIn: '1h',
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } & BaseJwtPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string } & BaseJwtPayload;
};

export const verifyEmailToken = (token: string): { userId: string; email: string } & BaseJwtPayload => {
  return jwt.verify(token, config.jwt.emailVerifySecret) as { userId: string; email: string } & BaseJwtPayload;
};

export const verifyResetPasswordToken = (token: string): { userId: string; email: string } & BaseJwtPayload => {
  return jwt.verify(token, config.jwt.resetPasswordSecret) as { userId: string; email: string } & BaseJwtPayload;
};
