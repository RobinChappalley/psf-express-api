import express from 'express'
import createError from 'http-errors'
import logger from 'morgan'
import fs from 'fs'
import yaml from 'js-yaml'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors' // ✅ AJOUT
import errorHandler from './middlewares/errorHandler.js'

import indexRouter from './routes/index.js'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import campsRouter from './routes/camps.js'
import hikesRouter from './routes/hikes.js'
import itemsRouter from './routes/items.js'

const app = express()

// Parse the OpenAPI document.
const openApiDocument = yaml.load(fs.readFileSync('./openapi.yml'))
// Serve the Swagger UI documentation.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))

// ✅ AJOUT CORS (AVANT les routes)
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/', indexRouter)
app.use('/', authRouter)
app.use('/items', itemsRouter)
app.use('/users', usersRouter)
app.use('/camps', campsRouter)
app.use('/hikes', hikesRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404, 'Route not found'))
})

// error handler
app.use(errorHandler)

export default app
