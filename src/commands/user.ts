import type { Command } from '../types'

const command: Command = {
  name: 'user',
  description: 'Get user info.',
  async execute(interaction) {
    await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`)
  },
}

export default command
