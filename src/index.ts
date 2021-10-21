import { Client, Intents } from 'discord.js'
import config from '../config'
import { commands, registerCommands } from './commands'
import { logger } from './logger'

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
})

client.on('ready', async(client) => {
  logger.info(`Logged in as ${client.user.tag}!`)

  await registerCommands(client)
})

client.on('interactionCreate', async(interaction) => {
  if (!interaction.isCommand()) return

  const command = commands.get(interaction.commandName)

  if (!command) return

  if (!interaction.guild)
    return interaction.reply('Please join the server and try again!')

  try {
    await command.execute(interaction)
  } catch (error) {
    logger.error(error)
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
  }
})

client.on('error', (e) => {
  logger.error(`Client error: ${e}`)
})

client.login(config.TOKEN)
