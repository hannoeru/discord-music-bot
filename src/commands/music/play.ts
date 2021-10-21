import { GuildMember, MessageEmbed } from 'discord.js'
import {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
} from '@discordjs/voice'

import { MusicSubscription } from '../../music/subscriptions'
import { Track } from '../../music/track'
import { subscriptions } from '../../subscription'

import { logger } from '../../logger'
import type { Command } from '../../types'

const command: Command = {
  name: 'play',
  description: 'Play a song from youtube',
  options: [
    {
      name: 'url',
      description: 'Youtube URL',
      type: 'STRING',
      required: true,
    },
  ],
  async execute(interaction) {
    await interaction.deferReply()

    // Extract the video URL from the command
    const url = interaction.options.getString('url')

    if (!url) {
      await interaction.editReply('Missing Youtube URL.')
      return
    }

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
      await interaction.editReply('Failed to join voice channel within 20 seconds, please try again later!')
      return
    }

    try {
      // Attempt to create a Track from the user's video URL
      const track = await Track.from(url, {
        onStart() {
          interaction
            .followUp({ content: 'Now playing!', ephemeral: true })
            .catch(logger.warn)
        },
        onFinish() {
          interaction
            .followUp({ content: 'Now finished!', ephemeral: true })
            .catch(logger.warn)
        },
        onError(error: any) {
          logger.warn(error)
          interaction
            .followUp({ content: `Error: ${error.message}`, ephemeral: true })
            .catch(logger.warn)
        },
      })
      // Enqueue the track and reply a success message to the user
      subscription.enqueue(track)
      const youtubeEmbed = new MessageEmbed()
        .setTitle(track.info.title)
        .setURL(track.info.video_url)
        .setThumbnail(track.info.thumbnails[0].url)
        .setFooter(`${interaction.user.tag} added this song`, interaction.user.avatarURL() || '')

      await interaction.editReply({
        content: `Queue added: **${track.info.title}**`,
        embeds: [youtubeEmbed],
      })
    } catch (error) {
      logger.error(`Failed to play track: ${error}`)
      await interaction.editReply('Failed to play track, please try again later!')
    }
  },
}

export default command
