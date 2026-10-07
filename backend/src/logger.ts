import winston from 'winston';

const NODE_ENV = process.env.NODE_ENV || 'development';

// Module-singleton winston logger. Importable from anywhere — no init order
// dance — because the only thing it depends on is process.env.NODE_ENV which
// is set by Node before any user module evaluates.
export const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hushroom-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
