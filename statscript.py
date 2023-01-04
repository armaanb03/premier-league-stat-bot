from bs4 import BeautifulSoup
import requests
import os
import pymongo
import time
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

client = pymongo.MongoClient(os.getenv('MONGO_URI'))

time.sleep(2.1)
fbref = requests.get('https://fbref.com/en/comps/9/Premier-League-Stats').text
fbref = fbref.replace('<!--', '').replace('-->', '')
main_page_soup = BeautifulSoup(fbref, 'lxml')
teams = main_page_soup.find('table', id='stats_squads_standard_for').find('tbody').find_all('tr')


def team_general_info():
    for team in teams:
        name = team.find('th')
        team_base = client[name.get_text().replace(" ", "")]
        team_collection = team_base["general_stats"]

        time.sleep(2.1)
        team_link = requests.get('https://fbref.com' + name.find('a')['href']).text
        team_soup = BeautifulSoup(team_link, 'lxml')

        logo = team_soup.find(class_="teamlogo")['src']

        team_general = {"Badge": logo, "Name": name.find('a').get_text(), "Manager": 'N/A'}
        teams_info = team_soup.find('div', {'data-template': 'Partials/Teams/Summary'}).find_all('strong')

        for team_info in teams_info:
            stat_name = team_info.text

            match stat_name:
                case "Record:":
                    key = stat_name.replace(":", "")
                    val = team_info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")
                    team_general[key] = val
                    val = team_info.next_sibling.strip().partition("\n")[2].strip().replace(",", "").split("\n")
                    team_general["Points"] = val[0]
                    team_general["Standing"] = val[2].replace(" ", "")
                case "Home Record:":
                    key = stat_name.replace(":", "")
                    val = team_info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")
                    team_general[key] = val
                case "Away Record:":
                    key = stat_name.replace(":", "")
                    val = team_info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")
                    team_general[key] = val
                case "Goals":
                    goals_parent = team_info.parent
                    val = goals_parent.next_sibling.strip().partition("\n")[0].replace(":", "").replace(",", "").strip()
                    team_general[stat_name] = val
                case "Goals Against":
                    against_parent = team_info.parent
                    val = against_parent.next_sibling.strip().partition("\n")[0].replace(":", "").replace(",", "").strip()
                    team_general[stat_name] = val
                case "xG:":
                    key = stat_name.replace(":", "")
                    val = team_info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")
                    team_general[key] = val
                case "xGA:":
                    key = stat_name.replace(":", "")
                    val = team_info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")
                    team_general[key] = val
                case "Manager:":
                    key = stat_name.replace(":", "")
                    val = team_info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")
                    team_general[key] = val
                case "Next Match:":
                    date = team_info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")
                    key = stat_name.replace(":", "")
                    val = f"{date} {team_info.next_sibling.next_sibling.get_text()}"
                    team_general[key] = val

        filter = {}
        newvalues = {"$set": team_general}
        team_collection.update_one(filter, newvalues, True)


def team_player_info():
    for team in teams:
        team_name = team.find('th')
        team_base = client[team_name.get_text().replace(" ", "")]
        collection_name = team_name.get_text().lower().replace(" ", "")
        players_collection = team_base[f"{collection_name}_players"]

        time.sleep(2.1)
        team_link = requests.get('https://fbref.com' + team_name.find('a')['href']).text
        team_soup = BeautifulSoup(team_link, 'lxml')

        player_names = team_soup.find('table', id="stats_standard_9").find('tbody').find_all('th')

        for player in player_names:
            time.sleep(2.1)
            player_link = requests.get("https://fbref.com" + player.find('a')['href']).text
            player_soup = BeautifulSoup(player_link, 'lxml')

            player_post = {}

            player_general_info = player_soup.find('div', id="meta")

            player_name = player_general_info.find('h1').find('span').get_text()
            player_img = "https://cdn.ssref.net/req/202212191/tlogo/fb/9.png"

            try:
                player_img = player_general_info.find('img')['src']
            except TypeError:
                pass

            player_birth = "N/A"

            try:
                player_birth = player_general_info.find('span', id='necro-birth')['data-birth']
            except TypeError:
                pass

            all_other_general_info = player_general_info.find_all('strong')

            player_post["Name"] = player_name
            player_post["Image"] = player_img
            player_post["Birth Date"] = player_birth

            player_post["Footed"] = "N/A"

            for info in all_other_general_info:
                info_name = info.get_text()
                match info_name:
                    case "Footed:":
                        key = info_name.replace(":", "")
                        val = info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")
                        player_post[key] = val
                    case "National Team:":
                        key = "Country"
                        val = info.parent.find('a').get_text()
                        player_post[key] = val
                    case "Club:":
                        key = info_name.replace(":", "")
                        val = info.parent.find('a').get_text()
                        player_post[key] = val
                    case "Citizenship:":
                        key = "Country"
                        val = info.parent.find('a').get_text()
                        player_post[key] = val
                    case "Youth National Team:":
                        key = "Country"
                        val = info.parent.find('a').get_text()
                        player_post[key] = val
                    case "Position:":
                        key = info_name.replace(":", "")
                        this_player_pos = info_name.replace(":", "")
                        val = info.next_sibling.strip().partition("\n")[0].strip().replace(",", "")

                        if "(" in val:
                            bracket_index = val.index("(")
                            val = val[0:bracket_index].strip()
                        elif "▪" in val:
                            special_index = val.index("▪")
                            val = val[0:special_index].strip()

                        player_post[key] = val

            player_report = {}
            have_report = True

            try:
                player_stats = player_soup.find('div', id="all_scout").find('tbody').find_all('tr')
            except AttributeError:
                have_report = False
                player_stats = [1, 2]

            if not have_report and this_player_pos == "GK":
                player_report = {"PSxG-GA": "N/A", "Goals Against": "N/A", "Save Percentage": "N/A", "PSxG/SoT": "N/A",
                                 "Save% (PenaltyKicks)": "N/A", "Clean Sheet Percentage": "N/A", "Touches": "N/A", 
                                 "Launch %": "N/A", "Goal Kicks": "N/A", "Avg. Length of Goal Kicks": "N/A",
                                 "Crosses Stopped %": "N/A", "Def. Actions Outside Pen. Area": "N/A",
                                 "Avg. Distance of Def. Actions": "N/A"}
            elif not have_report:
                player_report = {'Non-Penalty Goals': 'N/A', 'Non-Penalty xG': 'N/A', 'Shots Total': 'N/A',
                                 'Assists': 'N/A', 'xAG': 'N/A', 'npxG + xAG': 'N/A', 'Shot-Creating Actions': 'N/A', 
                                 'Passes Attempted': 'N/A', 'Pass Completion %': 'N/A', 'Progressive Passes': 'N/A', 
                                 'Dribbles Completed': 'N/A', 'Touches (Att Pen)': 'N/A', 'Progressive Passes Rec': 'N/A', 
                                 'Tackles': 'N/A', 'Interceptions': 'N/A', 'Blocks': 'N/A', 'Clearances': 'N/A', 'Aerials won': 'N/A'}

            for stat in player_stats:
                if not have_report:
                    break

                try:
                    key = stat.find('th').get_text()
                    percentile = stat.find('td', {'data-stat': 'percentile'})['csk']
                    per90 = stat.find('td', {'data-stat': 'per90'})['csk']
                    val = f"{per90} per 90 ({percentile})"
                    player_report[key] = val
                except KeyError:
                    pass

            if player_report != {}:
                player_post["Scouting Report"] = player_report

            filter = {"Name": player_general_info.find('h1').find('span').get_text()}
            newvalues = {"$set": player_post}
            players_collection.update_one(filter, newvalues, True)


def league_leaders():
    leader_base = client["StatLeaders"]
    leaders = main_page_soup.find('div', id='div_leaders')

    populate_stat_leaders(leader_base, leaders, 'top_scorers', 'leaders_goals')
    populate_stat_leaders(leader_base, leaders, 'top_assisters', 'leaders_assists')
    populate_stat_leaders(leader_base, leaders, 'top_g/a', 'leaders_goals_assists')
    populate_stat_leaders(leader_base, leaders, 'top_clean_sheets', 'leaders_gk_clean_sheets')
    populate_stat_leaders(leader_base, leaders, 'top_prog_passes', 'leaders_progressive_passes')
    populate_stat_leaders(leader_base, leaders, 'top_g/ap90', 'leaders_goals_assists_per90')
    populate_stat_leaders(leader_base, leaders, 'top_goalsp90', 'leaders_goals_per90')
    populate_stat_leaders(leader_base, leaders, 'top_assistsp90', 'leaders_assists_per90')
    populate_stat_leaders(leader_base, leaders, 'top_key_passes', 'leaders_assisted_shots')


def populate_stat_leaders(leader_base, leaders, collection_name, div_id):
    stat_collection = leader_base[collection_name]
    stat_collection.delete_many({})
    top_leaders = leaders.find('div', id=div_id).find('table', class_='columns').find_all('tr')

    boardlist = []
    outDict = {}

    for leader in top_leaders:
        #rank = leader.find('td', class_='rank').get_text().replace(".", "")

        player_name = leader.find('td', class_='who').get_text().replace(u'\xa0', ' ')
        num_of_stat = leader.find('td', class_='value').get_text().strip()
        name_string = f"{player_name} ({num_of_stat})"

        boardlist.append(name_string)

        if boardlist[0] == name_string:
            time.sleep(2.1)
            player_link = requests.get('https://fbref.com' + leader.find('td', class_='who').find('a')['href']).text
            league_leader_soup = BeautifulSoup(player_link, 'lxml')

            player_general_info = league_leader_soup.find('div', id="meta")

            player_img = "https://cdn.ssref.net/req/202212191/tlogo/fb/9.png"

            try:
                player_img = player_general_info.find('img')['src']
            except TypeError:
                pass
            
            outDict['Leader Image'] = player_img


    outDict['Leaders'] = boardlist

    newvalues = {"$set": outDict}
    stat_collection.update_one({}, newvalues, True)


if __name__ == "__main__":
    team_general_info()
    print("Populating team general info complete...")
    league_leaders()
    print("Populating league statistical data complete...")
    team_player_info()
    print("Populating player general information and scouting reports complete...")
    
