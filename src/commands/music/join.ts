import { GuildMember } from 'discord.js'

import { joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } from '@discordjs/voice'
import { subscriptions } from '../../subscription'
import { MusicSubscription } from '../../music/subscriptions'

import type { Command } from '../../types'

const command: Command = {
  name: 'join',
  description: 'Join bot to your voice channel.',
  async execute(interaction) {
    await interaction.deferReply()

    let subscription = subscriptions.get(interaction.guildId!)

    // If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
    // and create a subscription.
    if (
      !subscription
      && interaction.member instanceof GuildMember
      && interaction.member.voice.channel
    ) {
      const channel = interaction.member.voice.channel
      const voiceConnection = getVoiceConnection(channel.guild.id, channel.id)
        || joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator as any,
          group: channel.id,
        })
      subscription = new MusicSubscription(voiceConnection)
      subscriptions.set(interaction.guildId!, subscription)
    }

    // If there is no subscription, tell the user they need to join a channel.
    if (!subscription) {
      await interaction.editReply('Join a voice channel and then try that again!')
      return
    }

    // Make sure the connection is ready before processing the user's request
    try {
      await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3)
    } catch (error) {
      console.warn(error)
      return interaction.reply('Failed to join voice channel within 20 seconds, please try again later!')
    }

    await interaction.editReply('Done')
  },
}

export default command
