import pino from 'pino'

let logger: pino.Logger

export function initLogger(level: string = 'info'): pino.Logger {
  logger = pino({
    level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  })
  return logger
}

export function getLogger(): pino.Logger {
  if (!logger) return initLogger()
  return logger
}
