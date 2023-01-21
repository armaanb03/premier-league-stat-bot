## Premier League Stat Bot
Discord bot which outputs various stats and information about the English Premier League. Data is in a MongoDB database, and is obtained from https://www.fbref.com/en/comps/9/Premier-League-Stats via web scraping.

## Commands:
The commands of this bot give access to information about current premier league teams, and additionally every premier league player.

### /team
This command returns general information about a Premier League team's current season. This includes an image of the club's badge, the manager, goals, goals against, xG, xGA, and the team's next match.

Fields:
team (the name of the team)

### /squad
This command simply outputs the list of all players registered to this team in the Premier League in the current season with their general position, along with the club's badge.

Fields:
team (the name of the team)

### /player
This command returns a player's general info including date of birth, position, club, preferred foot, and nationality.

Fields: 
player (the name of the player)
team (the team of the player)

### /playerreport
This command returns a comprehensive statistical report of the inputted player. The stats displayed depend on whether the player is an outfield player or goalkeeper. There are up to 18 stats for a player, and along with the per 90 minute value of the statistic, there is a percentile relative to other player's in Europe in the player's main position.

Fields:
player (the name of the player)
team (the team of the player)

### /statleader
This command outputs the top 10 statistical leaders in a desired stat in the Premier League. Available stats include: goals, assists, clean sheets, assists per 90, progressive passes, and more.

Fields:
stat (the stat for which a leaderboard is desired)

## Additional Info: 
Majority of common names for teams are accepted as input. For players, exact name is required. All input is not case-sensitive.
