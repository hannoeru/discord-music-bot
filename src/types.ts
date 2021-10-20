import { CommandInteraction, ChatInputApplicationCommandData } from 'discord.js'

export interface Command extends ChatInputApplicationCommandData {
  execute: (message: CommandInteraction) => void | Promise<void>
}
