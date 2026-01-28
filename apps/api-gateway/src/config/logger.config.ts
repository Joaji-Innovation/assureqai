/**
 * Winston Logger Configuration
 * Structured logging with different transports
 */
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const WinstonLoggerConfig = WinstonModule.forRoot({
  transports: [
    // Console transport - always on
    new winston.transports.Console({
      level: isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        isProduction
          ? winston.format.json() // JSON in production for log aggregators
          : nestWinstonModuleUtilities.format.nestLike('AssureQai', {
              colors: true,
              prettyPrint: true,
            }),
      ),
    }),

    // File transport for errors - production only
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

/**
 * Custom log format for structured logging
 */
export const logFormat = winston.format.printf(
  ({ level, message, timestamp, context, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]`;
    if (context) msg += ` [${context}]`;
    msg += ` ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  },
);
