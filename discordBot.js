const { Client, GatewayIntentBits, } = require('discord.js');
require('dotenv').config()
let client;

if (process.env.DISCORD) {
  client = new Client({ 
    intents: [GatewayIntentBits.Guilds]
  });

  client.login(process.env.DISCORD_TOKEN);

  client.once('ready', () => {
    console.log('Discord bot is ready!');
  });
}

function sendMessage(msg) {

  if (!process.env.DISCORD) {
    return
  }

  const channel = client.channels.cache.get('1355236534827094208');
  if (channel) {
    channel.send(msg);
  } else {
    console.log('Could not find the specified channel');
  }
}

module.exports = {
  sendMessage,
}

