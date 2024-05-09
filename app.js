const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

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

const convertDBdateintoresponseData = stateDetails => {
  return {
    stateId: stateDetails.state_id,
    stateName: stateDetails.state_name,
    population: stateDetails.population,
  }
}

const convertDbobjectintoResponseObjectcases = data => {
  return {
    totalCases: data.cases,
    totalCured: data.cured,
    totalActive: data.active,
    totalDeaths: data.deaths,
  }
}

const convertdistrictDBdateintoresponseData = data => {
  return {
    districtId: data.district_id,
    districtName: data.district_name,
    stateId: data.state_id,
    cases: data.cases,
    cured: data.cured,
    active: data.active,
    deaths: data.deaths,
  }
}
//getting state details

app.get('/states/', async (request, response) => {
  const query = `select * from state;`
  const stateDetails = await db.all(query)
  response.send(
    stateDetails.map(each => {
      return {
        stateId: each.state_id,
        stateName: each.state_name,
        population: each.population,
      }
    }),
  )
})

//Getting state details by ID

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const query = `select * from state where state_id=${stateId};`
  const stateDetails = await db.get(query)
  response.send(convertDBdateintoresponseData(stateDetails))
})

// creting a district

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const query = `INSERT into district(district_name,state_id,cases,cured,active,deaths)
  VALUES("${districtName}",${stateId},${cases},${cured},${active},${deaths});`

  const dbresponse = await db.run(query)
  response.send('District Successfully Added')
})

// getting disrtict based on id

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const query = `select * from district where district_id=${districtId};`
  const data = await db.get(query)
  response.send(convertdistrictDBdateintoresponseData(data))
})

// deleting district

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const query = `delete from district where district_id=${districtId};`

  await db.run(query)
  response.send('District Removed')
})

//PUT  district data

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const query = `UPDATE district 
  SET district_name="${districtName}", state_id=${stateId},cases=${cases},
  cured=${cured},active=${active}, deaths=${deaths} where district_id=${districtId};`

  await db.run(query)
  response.send('District Details Updated')
})

// getting stats

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const query = `select sum(cases) as cases,sum(cured) as cured, sum(active) as active,sum(deaths) as deaths from district where state_id=${stateId};`
  const data = await db.get(query)
  response.send(convertDbobjectintoResponseObjectcases(data))
})

// getting state name by district ID

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const query = `select state.state_name from state inner join district on state.state_id=district.state_id where district.district_id=${districtId}`
  const data = await db.get(query)
  response.send({stateName: data.state_name})
})

module.exports = app
