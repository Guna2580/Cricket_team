const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const bcrypt = require('bcrypt')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')

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

const validate = password => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const query = `select * from user where username='${username}';`
  const data = await db.get(query)
  if (data === undefined) {
    const createquery = `INSERT INTO user(username,name,password,gender,location)
      VALUES("${username}","${name}","${hashedPassword}","${gender}","${location}");`
    if (validate(password)) {
      await db.run(createquery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const query = `select * from user where username='${username}'`
  const data = await db.get(query)
  if (data === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, data.password)

    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const query = `select * from user where username='${username}';`
  const databaseUser = await db.get(query)
  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      if (validate(newPassword)) {
        const passwordHashed = await bcrypt.hash(newPassword, 10)
        const updatedQuery = `UPDATE user
        SET password='${passwordHashed}'
        where username='${username}';`

        await db.run(updatedQuery)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
