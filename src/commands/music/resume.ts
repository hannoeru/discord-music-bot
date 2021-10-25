import { subscriptions } from '../../music'

import type { Command } from '../../types'

const command: Command = {
  name: 'resume',
  description: 'Resume playback of the current song',
  async execute(interaction) {
    const subscription = subscriptions.get(interaction.guild!.id)

    if (subscription) {
      subscription.audioPlayer.unpause()
      await interaction.reply({ content: 'Unpaused!', ephemeral: true })
    } else {
      await interaction.reply('Nothing is playing on this server!')
    }
  },
}

export default command
