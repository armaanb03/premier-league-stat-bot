const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const mongoClient = new MongoClient(process.env.MONGO_URI);

client.once('ready', () => {
  console.log('Ready');
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  console.log(commandName)

  if (commandName === 'squad') {
      const teamName = interaction.options.getString('team');
      const returnSquad = await TeamSquad(teamName);
      const teamInfo = await TeamInfo(teamName);

      if (returnSquad[0].length != 0 && returnSquad[1] != undefined) {
        var squadString = ''
        returnSquad[0].forEach((player) => {
          squadString += player + '\n'
        });

        const squadEmbed = new EmbedBuilder().setTitle(returnSquad[1]).setColor(0x7151ce).setThumbnail(teamInfo['Badge'])
        .addFields(
          {name: 'Squad', value: squadString}
        );

        await interaction.reply (
          {embeds: [squadEmbed]}
        );
      } else {
        await interaction.reply(
          "Team does not exist"
        );
      }
  }

  if (commandName === "team") {
    const teamName = interaction.options.getString("team");
    const teamInfo = await TeamInfo(teamName);

    if (Object.keys(teamInfo).length != 0) {
      const teamEmbed = new EmbedBuilder().setTitle(teamInfo['Name']).setColor(0x7151ce).setThumbnail(teamInfo['Badge'])
      .addFields (
        { name: 'Manager', value: teamInfo['Manager'], inline: true },
        { name: 'Record', value: teamInfo['Record'], inline: true },
        { name: 'Standing', value: teamInfo['Standing'], inline: true },
        { name: 'Points', value: teamInfo['Points'], inline: true},
        { name: 'Home Record', value: teamInfo['Home Record'], inline: true },
        { name: 'Away Record', value: teamInfo['Away Record'], inline: true },
        { name: 'Goals', value: teamInfo['Goals'], inline: true },
        { name: 'Goals Against', value: teamInfo['Goals Against'], inline: true },
        { name: 'xG', value: teamInfo['xG'], inline: true },
        { name: 'xGA', value: teamInfo['xGA'], inline: true },
        { name: 'Next Match', value: teamInfo['Next Match'], inline: true }
      );
      await interaction.reply(
        {embeds : [teamEmbed]}
      );
    } else {
      await interaction.reply(
        "Team does not exist"
      );
    }
  }

  if (commandName === "statleader") {
    const statName = interaction.options.getString('stat');
    const statInfo = await StatInfo(statName);

    if (statInfo[0] != null && statInfo[1] != undefined) {
      var boardString = '';
      statInfo[0].forEach((player) => {
        boardString += player + '\n'
      })

      const boardEmbed = new EmbedBuilder().setTitle(await titleCase(statName)).setColor(0x7151ce).setThumbnail(statInfo[1])
      .addFields(
        { name: 'Leaders', value: boardString }
      );

      await interaction.reply(
        {embeds : [boardEmbed]}
      );
    } else {
      await interaction.reply(
        "Stat does not have a leaderboard"
      );
    }
  }

  if (commandName === "player") {
    const playerName = interaction.options.getString('player');
    const teamName = interaction.options.getString('team');
    const playerGenInfo = await PlayerInfo(playerName, teamName);

    if (playerGenInfo != undefined) {
      const playerEmbed = new EmbedBuilder().setTitle(playerGenInfo['Name']).setColor(0x7151ce).setThumbnail(playerGenInfo['Image'])
      .addFields (
        { name: 'Club', value: playerGenInfo['Club'], inline: true }, 
        { name: 'Country', value: playerGenInfo['Country'], inline: true },
        { name: 'Position', value: playerGenInfo['Position'], inline: true },
        { name: 'Preferred Foot', value: playerGenInfo['Footed'], inline: true },
        { name: 'Date of Birth', value: playerGenInfo['Birth Date'], inline: true }
      );
      await interaction.reply(
        {embeds: [playerEmbed]}
      );
    } else {
      await interaction.reply(
        "This player does not exist!"
      );
    }
  }

  if (commandName === "playerreport"){
    const playerName = interaction.options.getString('player');
    const teamName = interaction.options.getString('team');
    const playerGenInfo = await PlayerInfo(playerName, teamName);

    if (playerGenInfo != undefined && playerGenInfo['Position'] === "GK") {
      const statArray = await PlayerReportHandlerGK(playerGenInfo['Scouting Report']);

      if (statArray != undefined) {
        const playerEmbed = new EmbedBuilder().setTitle(playerGenInfo['Name']).setColor(0x7151ce).setThumbnail(playerGenInfo['Image'])
        .addFields (
          { name: 'PSxG-GA', value: statArray[0], inline: true },
          { name: 'Goals Against', value: statArray[1], inline: true },
          { name: 'Save %', value: statArray[2], inline: true },
          { name: 'PSxG/SoT', value: statArray[3], inline: true },
          { name: 'Clean Sheet %', value: statArray[4], inline: true },
          { name: 'Touches', value: statArray[5], inline: true },
          { name: 'Launch %', value: statArray[6], inline: true },
          { name: 'Goal Kicks', value: statArray[7], inline: true },
          { name: 'Avg. Length of Goal Kicks', value: statArray[8], inline: true },
          { name: 'Crosses Stopped %', value: statArray[9], inline: true },
          { name: 'Def. Actions Outside Box', value: statArray[10], inline: true },
          { name: 'Avg. Distance of Defensive Actions', value: statArray[11], inline: true }
        )
        .setFooter({ text: 'Per90 Scouting Report [Stat Value (Percentile)]' });
        await interaction.reply(
          {embeds: [playerEmbed]}
        );
      } else {
        await interaction.reply(
          "This player does not exist!"
        );
      }
    } else if (playerGenInfo != undefined) {
      const statArray = await PlayerReportHandlerOutfield(playerGenInfo['Scouting Report']);
      
      if (statArray != undefined) {
        const playerEmbed = new EmbedBuilder().setTitle(playerGenInfo['Name']).setColor(0x7151ce).setThumbnail(playerGenInfo['Image'])
        .addFields (
          { name: 'Non-Penalty Goals', value: statArray[0], inline: true },
          { name: 'Non-Penalty xG', value: statArray[1], inline: true },
          { name: 'Shots Total', value: statArray[2], inline: true },
          { name: 'Assists', value: statArray[3], inline: true },
          { name: 'xA', value: statArray[4], inline: true },
          { name: 'npxG + xA', value: statArray[5], inline: true },
          { name: 'Shot Creating Actions', value: statArray[6], inline: true },
          { name: 'Passes Attempted', value: statArray[7], inline: true },
          { name: 'Pass Completion %', value: statArray[8], inline: true },
          { name: 'Progressive Passes', value: statArray[9], inline: true },
          { name: 'Dribbles Completed', value: statArray[10], inline: true },
          { name: 'Touches (Att Pen)', value: statArray[11], inline: true },
          { name: 'Progressive Passes Rec.', value: statArray[12], inline: true },
          { name: 'Tackles', value: statArray[13], inline: true },
          { name: 'Interceptions', value: statArray[14], inline: true },
          { name: 'Blocks', value: statArray[15], inline: true },
          { name: 'Clearances', value: statArray[16], inline: true },
          { name: 'Aerials Won', value: statArray[17], inline: true }
        )
        .setFooter({ text: 'Per90 Scouting Report [Stat Value (Percentile)]' });
        await interaction.reply(
          {embeds: [playerEmbed]}
        );
    } else {
        await interaction.reply(
          "This player does not exist!"
        );
    }
    }
  }
})

client.login(process.env.TOKEN);

async function TeamSquad(teamInput) {
  try {
      const teamDict = TeamNameHandler();
      const team = teamDict[teamInput.toLowerCase()];
      const lowerInput = team.replace(/\s+/g,'').toLowerCase();  

      await mongoClient.connect();
      const Team = mongoClient.db(team.replace(/\s+/g,''));

      var Players = await Team.collection(lowerInput + '_players').find().toArray();

      var Squad = [];

      Players.forEach((player) => {
              Squad.push(player['Name'] + ' ● ' + player['Position'])
          })
          return[Squad, team];
  } catch (error) {
      console.log("Error - Squad Output")
  } finally {
      await mongoClient.close()
  }
}

async function PlayerInfo(playerInput, teamInput) {
  try {
      const player = await titleCase(playerInput);
      const team = await titleCase(teamInput);
      const lowerInput = team.replace(/\s+/g, '').toLowerCase();

      await mongoClient.connect();
      const Team = mongoClient.db(team.replace(/\s+/g,''));

      var Player = await Team.collection(lowerInput + '_players').find({'Name': player}).toArray();

      var doc = Player[0]['Scouting Report']

      return Player[0];
  } catch (error) {
      console.log("Error - Player Info Output")
  } finally {
      await mongoClient.close()
  }
}

async function TeamInfo(teamInput) {
  try {
    const teamDict = TeamNameHandler();
    const team = teamDict[teamInput.toLowerCase()];

    await mongoClient.connect();
    const Team = mongoClient.db(team.replace(/\s+/g,''));

    var Img = await Team.collection('general_stats').find().toArray();

    var dict = {}
    
    Img.forEach((result) => {
        dict = result
    })

    return dict;
  } catch (error) {
    console.log("Error - Squad Output");
  } finally {
    await mongoClient.close()
  }
}

async function StatInfo(statInput) {
  try {
    const statInputFormatted = statInput.replace(/\s+/g, '').toLowerCase();
    const convertDict = await StatInputConvertDict();
    var input = convertDict[statInputFormatted];

    await mongoClient.connect();
    const LeaderBase = mongoClient.db('StatLeaders')
    var leaders = await LeaderBase.collection(input).find().toArray();

    var leaderboard = [leaders[0]["Leaders"], leaders[0]["Leader Image"]]

    return leaderboard;
  } catch (error) {
    console.log("Error - Stat Leader Output");
  } finally {
    await mongoClient.close()
  }
}

async function StatInputConvertDict() {
  try {
    await mongoClient.connect();
    const Stats = await mongoClient.db('StatConversion').collection('stats').find().toArray();
    var dict = {};

    Stats.forEach((result) => {
        dict = result
    })

    return dict;
  } catch (error) {
    console.log("Error - Stat Input Checker")
  } finally {
    await mongoClient.close()
  }
}

async function PlayerReportHandlerGK(reportDoc) {
  try {
    const valueArray = [reportDoc['PSxG-GA'], reportDoc['Goals Against'], reportDoc['Save Percentage'], reportDoc['PSxG/SoT'], reportDoc['Clean Sheet Percentage'],
    reportDoc['Touches'], reportDoc['Launch %'], reportDoc['Goal Kicks'], reportDoc['Avg. Length of Goal Kicks'], reportDoc['Crosses Stopped %'], 
    reportDoc['Def. Actions Outside Pen. Area'], reportDoc['Avg. Distance of Def. Actions']]

    return valueArray;
  } catch (error) {
    console.log("Error - Handling GK Scouting Report")
  }
}

async function PlayerReportHandlerOutfield(reportDoc) {
  try {
    const valueArray = [reportDoc['Non-Penalty Goals'], reportDoc['Non-Penalty xG'], reportDoc['Shots Total'], reportDoc['Assists'], reportDoc['xAG'], 
    reportDoc['npxG + xAG'], reportDoc['Shot-Creating Actions'], reportDoc['Passes Attempted'], reportDoc['Pass Completion %'], reportDoc['Progressive Passes'],
    reportDoc['Dribbles Completed'], reportDoc['Touches (Att Pen)'], reportDoc['Progressive Passes Rec'], reportDoc['Tackles'], reportDoc['Interceptions'],
    reportDoc['Blocks'], reportDoc['Clearances'], reportDoc['Aerials won']]

    return valueArray;
  } catch (error) {
    console.log("Error - Handling Outfield Scouting Report")
  }
}

function TeamNameHandler() {
  const nameConverter = {'arsenal': 'Arsenal', 'manchester city': 'Manchester City', 'newcastle': 'Newcastle Utd', 'newcastle united': 'Newcastle Utd',
  'newcastle utd': 'Newcastle Utd', 'man united': 'Manchester Utd', 'man utd': 'Manchester Utd', 'united': 'Manchester Utd', 'manchester united': 'Manchester Utd',
  'spurs': 'Tottenham', 'tottenham': 'Tottenham', 'tottenham hotspur': 'Tottenham', 'liverpool': 'Liverpool', 'brentford': 'Brentford', 'fulham': 'Fulham', 
  'chelsea': 'Chelsea', 'brighton': 'Brighton', 'crystal palace': 'Crystal Palace', 'palace': 'Crystal Palace', 'aston villa': 'Aston Villa', 'villa': 'Aston Villa',
  'leicester': 'Leicester City', 'leicester city': 'Leicester City', 'leeds': 'Leeds United', 'leeds united': 'Leeds United', 'leeds utd': 'Leeds United',
  'bournemouth': 'Bournemouth', 'everton': 'Everton', 'west ham': 'West Ham', 'forest': 'Nott\'ham Forest', 'nottingham forest': 'Nott\'ham Forest',
  'nott\'ham forest': 'Nott\'ham Forest', 'wolves': 'Wolves', 'wolverhampton wanderers': 'Wolves', 'southampton': 'Southampton'};

  return nameConverter;
}

function capitalize(str) {
  if(str.length == 0) return str;
  return str[0].toUpperCase() + str.substr(1);
}

function titleCase(str) {
  return str.split(' ').map(capitalize).join(' ');
}
