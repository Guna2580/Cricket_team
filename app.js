const express = require('express')

const path = require('path')

const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

const app = express()
app.use(express.json())

let dbpath = path.join(__dirname, 'moviesData.db')
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

const convetmovieObjectintoResponseObject = moviedetails => {
  return {
    movieId: moviedetails.movie_id,
    directorId: moviedetails.director_id,
    movieName: moviedetails.movie_name,
    leadActor: moviedetails.lead_actor,
  }
}

// getting movies data

app.get('/movies/', async (request, response) => {
  const query = `select movie_name from movie;`
  const dbresponse = await db.all(query)
  response.send(
    dbresponse.map(each => {
      return {
        movieName: each.movie_name,
      }
    }),
  )
})

// posting data into movie table

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const query = `INSERT into movie(director_id,movie_name,lead_actor) 
  VALUES(${directorId},"${movieName}","${leadActor}");`

  const dbresponse = await db.run(query)
  response.send('Movie Successfully Added')
})

//Getting a Movie details

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const query = `select * from movie where movie_id=${movieId};`
  const moviedetails = await db.get(query)
  response.send(convetmovieObjectintoResponseObject(moviedetails))
})

//PUT method

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const query = `UPDATE movie SET director_id=${directorId},
  movie_name="${movieName}",lead_actor="${leadActor}" 
  WHERE movie_id=${movieId};`

  await db.run(query)
  response.send('Movie Details Updated')
})

// deleting movie from db

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const query = `delete from movie where movie_id=${movieId};`
  await db.run(query)
  response.send('Movie Removed')
})

// getting data from director
app.get('/directors/', async (request, response) => {
  const query = `select * from director;`
  const directorDetails = await db.all(query)
  response.send(
    directorDetails.map(each => {
      return {
        directorId: each.director_id,
        directorName: each.director_name,
      }
    }),
  )
})

// Getting movie details with diretor id

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const query = `select movie_name from movie where director_id=${directorId};`
  const moviedetails = await db.all(query)
  response.send(
    moviedetails.map(each => {
      return {
        movieName: each.movie_name,
      }
    }),
  )
})

module.exports = app
