import path from 'path';

import { WinstonGraylog } from '@pskzcompany/winston-graylog';
import { createLogger, transports, format } from 'winston';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as Transport from 'winston-transport';

import { Settings } from '../config';

const logFormat = format.printf(({ timestamp, level, label, message }) => {
  return `[${timestamp}] ${level} [${label}]: ${message}`;
});

const consoleFormat = format.combine(format.colorize(), logFormat);

const fileFormatter = format.combine(format.json());

const buildTransports = (): Transport[] | Transport => {
  const trxs: Transport[] | Transport = [
    new transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      level: 'debug',
    }),
    new transports.File({
      filename: `errors.log`,
      level: 'error',
      dirname: `${Settings.DataFolder}/logs`,
      handleExceptions: true,
      format: fileFormatter,
      // 5MB
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new transports.File({
      filename: `warnings.log`,
      level: 'warn',
      dirname: `${Settings.DataFolder}/logs`,
      handleExceptions: true,
      format: fileFormatter,
      // 5MB
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new transports.File({
      filename: `info.log`,
      level: 'info',
      dirname: `${Settings.DataFolder}/logs`,
      handleExceptions: true,
      format: fileFormatter,
      // 5MB
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new transports.File({
      filename: `debug.log`,
      level: 'debug',
      dirname: `${Settings.DataFolder}/logs`,
      handleExceptions: true,
      format: fileFormatter,
      // 5MB
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ];

  if (Settings.GraylogEnabled) {
    trxs.push(
      new WinstonGraylog({
        format: fileFormatter,
        level: 'debug',
        graylog: Settings.GraylogHost,
        handleExceptions: true,
        defaultMeta: {
          release: Settings.AppVersion,
        },
      })
    );
  }

  return trxs;
};

// configure logger
export const Logger = createLogger({
  exitOnError: false,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain,@typescript-eslint/no-non-null-assertion
    format.label({ label: path.basename(require.main?.filename!) }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    format.printf(({ timestamp, level, label, message }) => {
      return `[${timestamp}] ${level} [${label}]: ${message}`;
    })
  ),
  transports: buildTransports(),
});
