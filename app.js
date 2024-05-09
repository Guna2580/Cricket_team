const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

/// getting players data

app.get('/players/', async (request, response) => {
  const query = `select * from player_details;`
  const playersData = await db.all(query)
  response.send(
    playersData.map(each => {
      return {
        playerId: each.player_id,
        playerName: each.player_name,
      }
    }),
  )
})

/// getting players data by id

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const query = `select * from player_details where player_id=${playerId};`
  const data = await db.get(query)
  response.send({
    playerId: data.player_id,
    playerName: data.player_name,
  })
})

// updating player data

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const player = request.body

  const {playerName} = player
  const query = `UPDATE player_details
  SET player_name='${playerName}' 
  where player_id=${playerId};`

  await db.run(query)
  response.send('Player Details Updated')
})

// getting  macth details

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const query = `select match_id as matchId, match, year from match_details where match_id=${matchId};`
  const matchdata = await db.get(query)
  response.send(matchdata)
})

/// getting match details of a player

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const query = ` select match_id as matchId, match,year from player_match_score natural join match_details
  where player_id=${playerId};`

  const data = await db.all(query)
  response.send(data)
})

/// getting player details of a match

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const query = `select player_match_score.player_id as playerId,
  player_name as playerName from player_details inner join player_match_score on player_details.player_id = player_match_score.player_id 
  where match_id=${matchId};`

  const data = await db.all(query)
  response.send(data)
})

/// getting player score details

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const query = `select player_details.player_id as playerId,player_details.player_name as playerName, sum(player_match_score.score) as totalScore,
  sum(player_match_score.fours) as totalFours, sum(player_match_score.sixes) as totalSixes
   from player_details inner join player_match_score on player_details.player_id = player_match_score.player_id 
  where player_details.player_id=${playerId};`

  const data = await db.get(query)
  response.send(data)
})

module.exports = app
