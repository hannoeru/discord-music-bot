import { subscriptions } from '../../music'

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

    if (!volume || volume < 0 || volume > 100)
      return interaction.reply('Please enter a volume number from 1 - 100')

    if (subscription) {
      subscription.setVolume(volume)

      await interaction.reply({ content: `Volume setted to ${volume}` })
    } else {
      await interaction.reply('Nothing is playing on this server!')
    }
  },
}

export default command
