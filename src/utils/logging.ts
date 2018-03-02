// configure logger
import * as winston from "winston";

let config = winston.config;

export let logger = new (winston.Logger)
    ({
        exitOnError : false,
        transports : [
            new (winston.transports.Console)({
                timestamp: function() {
                    return new Date().toISOString().replace('T', ' ').substr(0, 19);
                },
                formatter : function (options) {
                    // - Return string will be passed to logger.
                    // - Optionally, use options.colorize(options.level, <string>) to
                    //   colorize output based on the log level.
                    return options.timestamp() + ' ' +
                        config.colorize(options.level, options.level.toUpperCase()) + ' ' +
                        (options.message ? options.message : '') +
                        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
                }
            }),
            new (winston.transports.File)({
                filename: 'dist/data/logs/errors.log',
                name: 'error-file',
                level: 'error',
                timestamp: function() {
                    return new Date().toISOString().replace('T', ' ').substr(0, 19);
                },
                formatter : function (options) {
                    // - Return string will be passed to logger.
                    // - Optionally, use options.colorize(options.level, <string>) to
                    //   colorize output based on the log level.
                    return options.timestamp() + ' ' +
                        config.colorize(options.level, options.level.toUpperCase()) + ' ' +
                        (options.message ? options.message : '') +
                        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
                }

            }),
            new (winston.transports.File)({
                filename: 'dist/data/logs/info.log',
                name: 'info-file',
                level: 'info',
                timestamp: function() {
                    return new Date().toISOString().replace('T', ' ').substr(0, 19);
                },
                formatter : function (options) {
                    // - Return string will be passed to logger.
                    // - Optionally, use options.colorize(options.level, <string>) to
                    //   colorize output based on the log level.
                    return options.timestamp() + ' ' +
                        config.colorize(options.level, options.level.toUpperCase()) + ' ' +
                        (options.message ? options.message : '') +
                        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
                }
            }),
            new (winston.transports.File)({
                filename: 'dist/data/logs/debug.log',
                name: 'debug-file',
                level: 'debug',
                timestamp: function() {
                    return new Date().toISOString().replace('T', ' ').substr(0, 19);
                },
                formatter : function (options) {
                    // - Return string will be passed to logger.
                    // - Optionally, use options.colorize(options.level, <string>) to
                    //   colorize output based on the log level.
                    return options.timestamp() + ' ' +
                        config.colorize(options.level, options.level.toUpperCase()) + ' ' +
                        (options.message ? options.message : '') +
                        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
                }
            })
        ]
    });