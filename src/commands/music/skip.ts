import { subscriptions } from '../../music'

import type { Command } from '../../types'

const command: Command = {
  name: 'skip',
  description: 'Skip to the next song in the queue',
  async execute(interaction) {
    const subscription = subscriptions.get(interaction.guild!.id)

    if (subscription) {
      // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
      // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
      // will be loaded and played.
      subscription.audioPlayer.stop()
      await interaction.reply('Skipped song!')
    } else {
      await interaction.reply('Nothing is playing on this server.')
    }
  },
}

export default command
