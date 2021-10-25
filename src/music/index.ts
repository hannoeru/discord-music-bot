import { GuildMember, CommandInteraction } from 'discord.js'
import { joinVoiceChannel } from '@discordjs/voice'

import { MusicSubscription, subscriptions } from './subscriptions'

export async function createOrGetSubscription(interaction: CommandInteraction) {
  let subscription = subscriptions.get(interaction.guildId!)

  // If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
  // and create a subscription.
  if (
    !subscription
      && interaction.member instanceof GuildMember
      && interaction.member.voice.channel
  ) {
    const channel = interaction.member.voice.channel
    const voiceConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator as any,
    })

    subscription = new MusicSubscription(voiceConnection)
    subscriptions.set(interaction.guildId!, subscription)
  }

  return subscription
}

export * from './subscriptions'
export * from './track'
