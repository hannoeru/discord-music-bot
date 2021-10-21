import { AudioPlayerStatus } from '@discordjs/voice'
import { subscriptions } from '../../subscription'

import type { Command } from '../../types'

const command: Command = {
  name: 'volume',
  description: 'Change music volume',
  options: [
    {
      name: 'volume',
      description: 'volume from 1 to 100',
      type: 'NUMBER',
      required: true,
    },
  ],
  async execute(interaction) {
    const subscription = subscriptions.get(interaction.guild!.id)
    const volume = interaction.options.getNumber('volume')

    if (!volume)
      return interaction.reply('Please enter a number for volume')

    if (subscription) {
      if (subscription.audioPlayer.state.status === AudioPlayerStatus.Playing)
        subscription.audioPlayer.state.resource.volume?.setVolume(volume / 100)

      await interaction.reply({ content: `Volume setted to ${volume}` })
    } else {
      await interaction.reply('Nothing is playing on this server!')
    }
  },
}

export default command
