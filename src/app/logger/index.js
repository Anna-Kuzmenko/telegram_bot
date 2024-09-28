import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => (`${timestamp} ${level}: ${message}`));

const logger = createLogger({
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console({ level: 'error' }),
        new transports.Console({ level: 'debug' }),
        new transports.File({
            filename: path.join(process.cwd(), 'logs/error.log'),
            level: 'error',
            json: true,
        }),
        new transports.File({
            filename: path.join(process.cwd(), 'logs/info.log'),
            level: 'info',
            json: true,
        })
    ],
    handleExceptions: true,
    colorize: true,
    exitOnError: false
});

logger.stream = {
    write: (message, encoding) => {
        logger.info(message);
    },
};

export default logger;
