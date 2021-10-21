import { subscriptions } from '../../subscription'

import type { Command } from '../../types'

const command: Command = {
  name: 'clear',
  description: 'Clear song queue',
  async execute(interaction) {
    const subscription = subscriptions.get(interaction.guild!.id)

    if (subscription) {
      subscription.clearQueue()
      await interaction.reply({ content: 'Queue cleared!', ephemeral: true })
    } else {
      await interaction.reply('Nothing is playing on this server!')
    }
  },
}

export default command
