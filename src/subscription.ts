import { Snowflake } from 'discord.js'
import { MusicSubscription } from './music/subscriptions'

export const subscriptions = new Map<Snowflake, MusicSubscription>()
