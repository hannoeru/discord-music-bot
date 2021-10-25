import { subscriptions } from '../../music'

import type { Command } from '../../types'

const command: Command = {
  name: 'pause',
  description: 'Pauses the song that is currently playing',
  async execute(interaction) {
    const subscription = subscriptions.get(interaction.guild!.id)

    if (subscription) {
      subscription.audioPlayer.pause()
      await interaction.reply({ content: 'Paused!', ephemeral: true })
    } else {
      await interaction.reply('Not playing in this server!')
    }
  },
}

export default command
