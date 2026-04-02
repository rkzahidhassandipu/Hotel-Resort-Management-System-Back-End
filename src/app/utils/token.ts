import crypto from 'crypto';

export const generateSecureToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateNumericOTP = (digits = 6): string => {
  const max = Math.pow(10, digits);
  const min = Math.pow(10, digits - 1);
  return (Math.floor(Math.random() * (max - min)) + min).toString();
};
