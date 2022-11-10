import { createLogger, transports, format } from "winston";

// configure logger
export const Logger = createLogger({
    exitOnError: false,
    transports: [
        new transports.Console({

        }),
        new transports.File({
            filename: 'logs/errors.log',
            level: 'error',
            dirname: 'logs'
        }),
        new transports.File({
            filename: 'logs/warnings.log',
            level: 'warn',
            dirname: 'logs'
        }),
        new transports.File({
            filename: 'logs/info.log',
            level: 'info',
            dirname: 'logs'
        }),
        new transports.File({
            filename: 'logs/debug.log',
            level: 'debug',
            dirname: 'logs'
        }),
    ],
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.prettyPrint(),
        format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    )
});
