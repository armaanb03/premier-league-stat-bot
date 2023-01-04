const { REST, SlashCommandBuilder, Routes } = require('discord.js');
require('dotenv').config()

const commands = [
    new SlashCommandBuilder().setName('team').setDescription('Returns current information about a PL team')
        .addStringOption(option =>
            option.setName('team')
            .setDescription('Return information about this PL team')
            .setRequired(true)),
    new SlashCommandBuilder().setName('player').setDescription('Returns a summary/general information about a PL player')
        .addStringOption(option =>
            option.setName('player')
            .setDescription('Return info about this PL player')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('team')
            .setDescription('Team of the desired player')
            .setRequired(true)),
    new SlashCommandBuilder().setName('playerreport').setDescription('Returns a per90 statistical report about a PL player')
        .addStringOption(option =>
            option.setName('player')
            .setDescription('Returns a scouting report about this PL player')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('team')
            .setDescription('Team of the desired player')
            .setRequired(true)),
    new SlashCommandBuilder().setName('squad').setDescription('Returns the squad of a PL team')
        .addStringOption(option =>
            option.setName('team')
            .setDescription('Return squad information about this PL team')
            .setRequired(true)),
    new SlashCommandBuilder().setName('statleader').setDescription('Returns the leaders in a specified stat')
        .addStringOption(option =>
            option.setName('stat')
            .setDescription('Return the league leaders in this statistic')
            .setRequired(true))
]

    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
//Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID); 
rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
    .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
    .catch(console.error)
