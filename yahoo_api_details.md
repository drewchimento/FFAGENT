# Yahoo Fantasy Sports API Details

## Overview
The Yahoo Fantasy Sports API provides URIs to access fantasy sports data including Fantasy Football, Baseball, Basketball, and Hockey. The APIs are based on a RESTful model with resources like game, league, team, player, etc.

## Key Capabilities
- **Data Access**: Game, league, team, player, roster, stats, transactions, and user information
- **Operations**: Both data retrieval (GET) and modification (POST, PUT, DELETE)
- **Sports Supported**: Fantasy Football, Baseball, Basketball, Hockey
- **Resource Types**: Games, leagues, teams, players, rosters, stats, transactions

## Authentication Requirements
- **OAuth 1.0**: Required for all API access
- **Application Registration**: Must register with Yahoo! Developer Network to obtain consumer key and secret
- **Token Management**: Handle request tokens, access tokens, and token refreshes
- **User Authorization**: Users must grant permission for app to access their fantasy data

## Integration Requirements
1. **OAuth Setup**: Implement OAuth 1.0 authentication flow
2. **Application Registration**: Register app with Yahoo! Developer Network
3. **URL Schema Understanding**: Learn resource, collection, and sub-resource structures
4. **Privacy Compliance**: Handle league privacy settings (some data only accessible to league members)
5. **Filtering Support**: Implement filtering by week, date, team, player, etc.

## Data Structure
- **Games**: Contain multiple leagues (8-12 teams typically)
- **Leagues**: Managed by one or more users, contain teams
- **Teams**: Compete based on real-world player statistics
- **Players**: Can be drafted, traded, or acquired via waivers
- **Transactions**: Add/drop/trade operations
- **Rosters**: Team compositions with position requirements

## Key Features for FFAgent Integration
- **League Data**: Access to league settings, scoring rules, roster requirements
- **Player Stats**: Historical and current season statistics
- **Draft Information**: Access to draft results and player selections
- **Real-time Updates**: Current roster compositions and recent transactions
- **User Permissions**: Access limited to leagues where user is a member

## Limitations
- **Privacy Restrictions**: Can only access leagues where authenticated user is a member
- **Rate Limiting**: Subject to Yahoo's API rate limits
- **OAuth Complexity**: Requires proper OAuth implementation for write operations
- **League-Specific Data**: Much data is only meaningful within specific league context

## Technical Considerations
- **OAuth Libraries**: Need OAuth-compatible libraries for chosen development language
- **Token Storage**: Secure storage and refresh of OAuth tokens
- **Error Handling**: Proper handling of authentication and authorization errors
- **Data Caching**: Consider caching strategies due to rate limits

This API provides comprehensive access to Yahoo Fantasy Football data but requires proper OAuth implementation and user authorization for each league access.



# ESPN Fantasy Football API Details

## Overview
ESPN has an undocumented API for interacting with their fantasy sports platforms. The API has undergone changes, with the most recent update in April 2024 changing the base URL.

## Current API Endpoints (as of April 2024)
- **Base URL**: `https://lm-api-reads.fantasy.espn.com/apis/v3/games`
- **Current Season**: `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/<YEAR>/segments/0/leagues/<ID>`
- **Historical Seasons**: `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/<ID>?seasonId=<YEAR>`

## Key Capabilities
- **Historical Data**: Access to historical player projections and performance data
- **League Information**: Team compositions, scores, standings
- **Player Data**: Projections, statistics, roster information
- **Automation Potential**: Can automate player moves and in-season analysis
- **Real-time Scores**: Access to current and historical game scores

## Authentication Requirements
- **Private Leagues**: Require authentication via cookies (SWID and ESPN_S2)
- **Public Leagues**: Can be accessed without authentication
- **Cookie-based Auth**: Uses session cookies rather than OAuth

## Integration Considerations
- **Undocumented**: No official documentation, reverse-engineered by community
- **API Changes**: ESPN has changed the API structure multiple times
- **Rate Limiting**: Likely has rate limits but not officially documented
- **Reliability**: Being undocumented, could change without notice

## Available Libraries
- **JavaScript**: ESPN Fantasy Football API client for web and NodeJS
- **Python**: Various community-maintained Python packages
- **Community Support**: Active community on Reddit and GitHub

## Data Access
- **League-Specific**: Most data requires league ID and appropriate permissions
- **Historical Range**: Can access data back to at least 2013 for some leagues
- **Real-time Updates**: Can track current season progress and scores

## Limitations for FFAgent
- **Undocumented Nature**: Risk of API changes breaking integration
- **Authentication Complexity**: Requires handling ESPN session cookies
- **Private League Access**: Users must provide their own authentication credentials
- **No Official Support**: No official support channel for issues

## Integration Strategy for FFAgent
1. **Cookie Management**: Implement secure storage and handling of ESPN session cookies
2. **Error Handling**: Robust error handling for API changes and authentication issues
3. **Fallback Methods**: Consider web scraping as backup for critical functionality
4. **User Education**: Clear instructions for users on how to obtain their credentials
5. **Monitoring**: Active monitoring for API changes and community updates

