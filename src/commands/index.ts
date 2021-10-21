import { Client, Collection } from 'discord.js'
import { Command } from '../types'
import { logger } from '../logger'
import ping from './ping'
import user from './user'
import join from './music/join'
import leave from './music/leave'
import play from './music/play'
import pause from './music/pause'
import resume from './music/resume'
import queue from './music/queue'
import skip from './music/skip'

export const commands = new Collection<string, Command>()

export async function registerCommands(client: Client<true>) {
  commands.set(ping.name, ping)
  commands.set(user.name, user)
  commands.set(join.name, join)
  commands.set(play.name, play)
  commands.set(skip.name, skip)
  commands.set(leave.name, leave)
  commands.set(pause.name, pause)
  commands.set(resume.name, resume)
  commands.set(queue.name, queue)

  logger.info(`Commands list:\n${[...commands.values()].map((command) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { execute, ...cmd } = command
    return `${cmd.name} - ${cmd.description}`
  }).join('\n')}`)

  // Send commands set to discord
  await client.application.commands.set([...commands.values()].map((command) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { execute, ...cmd } = command
    return cmd
  }))

  logger.info('Commands registered!')
}
