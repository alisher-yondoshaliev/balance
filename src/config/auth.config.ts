import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  accessTokenTtlSeconds: Number(
    process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ?? 2_592_000,
  ),
}));
