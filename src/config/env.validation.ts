type EnvRecord = Record<string, unknown>;

export function validateEnv(config: EnvRecord): EnvRecord {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];

  const missingVars = requiredVars.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  return config;
}
