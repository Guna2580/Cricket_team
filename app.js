const express = require('express')

const path = require('path')

const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

const app = express()
app.use(express.json())

let dbpath = path.join(__dirname, 'cricketTeam.db')
let db = null

const IntializingDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}
IntializingDBandServer()

const convertDBobjectintoResponseObject = eachPlayer => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
    jerseyNumber: eachPlayer.jersey_number,
    role: eachPlayer.role,
  }
}

//Allplayers

app.get('/players/', async (request, response) => {
  const getplayers = `SELECT * FROM cricket_team;`
  const cricketArray = await db.all(getplayers)
  response.send(
    cricketArray.map(eachPlayer =>
      convertDBobjectintoResponseObject(eachPlayer),
    ),
  )
})

// update player

app.post('/players/', async (request, response) => {
  const playerDetails = request.body
  const {playerName, jerseyNumber, role} = playerDetails
  const query = `INSERT into cricket_team(player_name,jersey_number,role) VALUES('${playerName}',${jerseyNumber}
  ,'${role}');`
  const dbreponse = await db.run(query)
  response.send('Player Added to Team')
})

//Getting single player

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const query = `select * from cricket_team where player_id=${playerId};`
  let playerdetails = await db.get(query)
  response.send(convertDBobjectintoResponseObject(playerdetails))
})

module.exports = app
