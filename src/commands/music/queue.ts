import { AudioResource, AudioPlayerStatus } from '@discordjs/voice'
import { subscriptions } from '../../subscription'
import { Track } from '../../music/track'

import type { Command } from '../../types'

const command: Command = {
  name: 'queue',
  description: 'List the music queue',
  async execute(interaction) {
    const subscription = subscriptions.get(interaction.guild!.id)

    if (subscription) {
      const current
        = subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
          ? 'Nothing is playing!'
          : `Playing **${(subscription.audioPlayer.state.resource as AudioResource<Track>).metadata.title}**`

      const queue = subscription.queue
        .slice(0, 5)
        .map((track, index) => `${index + 1}) ${track.title}`)
        .join('\n')

      await interaction.reply(`${current}\n\n${queue}`)
    } else {
      await interaction.reply('Nothing is playing on this server.')
    }
  },
}

export default command
