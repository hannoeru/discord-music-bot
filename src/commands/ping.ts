import type { Command } from '../types'

const command: Command = {
  name: 'ping',
  description: 'Ping!',
  async execute(interaction) {
    return interaction.reply('Pong.')
  },
}

export default command
