import { subscriptions } from '../../subscription'

import type { Command } from '../../types'

const command: Command = {
  name: 'leave',
  description: 'Leave the voice channel',
  async execute(interaction) {
    const subscription = subscriptions.get(interaction.guild!.id)

    if (subscription) {
      subscription.voiceConnection.destroy()
      subscriptions.delete(interaction.guildId!)
      await interaction.reply('Bye!')
    } else {
      await interaction.reply('Nothing is playing on this server.')
    }
  },
}

export default command
