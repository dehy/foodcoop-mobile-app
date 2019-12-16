'use strict';

export default class AppLogger {
    static loggers: { [id: string]: AppLogger } = {};
    static defaultId = 'AppLogger';

    id = AppLogger.defaultId;

    static getLogger = (loggerId?: string): AppLogger => {
        if (!loggerId) {
            loggerId = AppLogger.defaultId;
        }
        if (AppLogger.loggers[loggerId]) {
            return AppLogger.loggers[loggerId];
        }
        const newLogger = new AppLogger(loggerId);
        AppLogger.loggers[newLogger.id] = newLogger;
        return newLogger;
    };

    formatLog = (log: string): string => {
        return `[${this.id}] ${log}`;
    };

    constructor(id: string) {
        this.id = id;
    }

    debug = (log: string): void => {
        console.debug(this.formatLog(log));
    };

    info = (log: string): void => {
        console.info(this.formatLog(log));
    };

    warn = (log: string): void => {
        console.warn(this.formatLog(log));
    };

    error = (log: string): void => {
        console.error(this.formatLog(log));
    };
}
