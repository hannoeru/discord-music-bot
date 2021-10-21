import Pino from 'pino'

export const logger = Pino({
  name: 'music-bot',
  transport: {
    target: 'pino-pretty',
    options: {
      ignore: 'hostname',
    },
  },
})
