// License: https://github.com/discordjs/voice/blob/f1869a9af5a44ec9a4f52c2dd282352b1521427d/LICENSE

import { promisify } from 'util'
import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice'

import config from '../../config'
import { logger } from '../logger'
import { Track } from './track'

import type { Snowflake } from 'discord.js'

const wait = promisify(setTimeout)

// eslint-disable-next-line no-use-before-define
export const subscriptions = new Map<Snowflake, MusicSubscription>()

/**
 * A MusicSubscription exists for each active VoiceConnection. Each subscription has its own audio player and queue,
 * and it also attaches logic to the audio player and voice connection for error handling and reconnection logic.
 */
export class MusicSubscription {
  public readonly voiceConnection: VoiceConnection
  public readonly audioPlayer: AudioPlayer
  public queue: Track[]
  public queueLock = false
  public readyLock = false
  public volume: number

  public constructor(voiceConnection: VoiceConnection) {
    this.voiceConnection = voiceConnection
    this.audioPlayer = createAudioPlayer()
    this.queue = []
    this.volume = config.DEFAULT_VOLUME

    this.voiceConnection.on('error', (e) => {
      logger.warn(`VoiceConnection Error: ${e}`)
    })

    this.voiceConnection.on('stateChange', async(_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          /*
            If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
            but there is a chance the connection will recover itself if the reason of the disconnect was due to
            switching voice channels. This is also the same code for the bot being kicked from the voice channel,
            so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
            the voice connection.
          */
          try {
            await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000)
            // Probably moved voice channel
          } catch {
            this.voiceConnection.destroy()
            logger.warn(`VoiceConnection Disconnected: ${this.voiceConnection.joinConfig.channelId}`)
            // Probably removed from voice channel
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          /*
            The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
          */
          await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000)
          this.voiceConnection.rejoin()
        } else {
          /*
            The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
          */
          this.voiceConnection.destroy()
          logger.info(`VoiceConnection Disconnected: ${this.voiceConnection.joinConfig.channelId}`)
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        /*
          Once destroyed, stop the subscription
        */
        this.stop()
        logger.info(`VoiceConnection Destroyed: ${this.voiceConnection.joinConfig.channelId}`)
        subscriptions.delete(this.voiceConnection.joinConfig.guildId)
      } else if (
        !this.readyLock
        && (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
      ) {
        /*
          In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
          before destroying the voice connection. This stops the voice connection permanently existing in one of these
          states.
        */
        this.readyLock = true
        try {
          await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000)
        } catch (error) {
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy()
          logger.warn(`Failed to join voice channel: ${error}`)
        } finally {
          this.readyLock = false
        }

        logger.info(`VoiceConnection Connected: ${this.voiceConnection.joinConfig.channelId}`)
      }
    })

    // Configure audio player
    this.audioPlayer.on('stateChange', (oldState, newState) => {
      if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
        // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
        // The queue is then processed to start playing the next track, if one is available.
        (oldState.resource as AudioResource<Track>).metadata.onFinish()
        this.processQueue()
      } else if (newState.status === AudioPlayerStatus.Playing) {
        // If the Playing state has been entered, then a new track has started playback.
        (newState.resource as AudioResource<Track>).metadata.onStart()
      }
    })

    this.audioPlayer.on('error', error => (error.resource as AudioResource<Track>).metadata.onError(error))

    voiceConnection.subscribe(this.audioPlayer)
  }

  /**
   * Adds a new Track to the queue.
   *
   * @param track The track to add to the queue
   */
  public enqueue(track: Track) {
    this.queue.push(track)
    logger.info(`Queue added: ${track.title}`)
    this.processQueue()
  }

  /**
   * Stops audio playback and empties the queue
   */
  public stop() {
    this.queueLock = true
    this.queue = []
    this.audioPlayer.stop(true)
  }

  /**
   * Empties the queue
   */
  public clearQueue() {
    this.queue = []
  }

  /**
   * Set player volume
   */
  public setVolume(volume: number) {
    this.volume = volume
    // Set default volume to 90%
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing)
      this.audioPlayer.state.resource.volume?.setVolume(volume / 100)
  }

  /**
   * Attempts to play a Track from the queue
   */
  private async processQueue(): Promise<void> {
    // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
    if (this.queueLock || this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0)
      return

    // Lock the queue to guarantee safe access
    this.queueLock = true

    // Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
    const nextTrack = this.queue.shift()!
    try {
      // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
      const resource = await nextTrack.createAudioResource()
      // Set default volume to 90%
      resource.volume?.setVolume(this.volume / 100)
      this.audioPlayer.play(resource)
      this.queueLock = false
    } catch (error) {
      // If an error occurred, try the next item of the queue instead
      nextTrack.onError(error as Error)
      this.queueLock = false
      return this.processQueue()
    }
  }
}
