const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

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

const hasPriorityAndHasStatus = requestquery => {
  return (
    requestquery.priority !== undefined && requestquery.status !== undefined
  )
}

const hasPriority = requestquery => {
  return requestquery.priority !== undefined
}

const hasStatus = requestquery => {
  return requestquery.status !== undefined
}

//scenaario 1

app.get('/todos/', async (request, response) => {
  const {search_q = '', priority, status} = request.query
  let dbquery = ''

  switch (true) {
    case hasPriorityAndHasStatus(request.query):
      dbquery = `select * from todo where todo like '%${search_q}%' and 
            status='${status}' and priority='${priority}'; `
      break
    case hasPriority(request.query):
      dbquery = `select * from todo where todo like '%${search_q}%' and priority='${priority}';`
      break
    case hasStatus(request.query):
      dbquery = `select * from todo where todo like '%${search_q}%' and status='${status}';`
      break
    default:
      dbquery = `select * from todo where todo like '%${search_q}%';`
  }
  const tododata = await db.all(dbquery)
  response.send(tododata)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `select * from todo where id=${todoId};`
  const data = await db.get(query)
  response.send(data)
})

app.post('/todos/', async (request, response) => {
  const tododata = request.body
  const {id, todo, priority, status} = tododata
  const query = `INSERT INTO todo(id,todo,priority,status) VALUES(${id},'${todo}',
  '${priority}','${status}');`

  await db.run(query)
  response.send('Todo Successfully Added')
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `delete from todo where id=${todoId};`
  const data = await db.get(query)
  response.send('Todo Deleted')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`

  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

module.exports = app
