import dotenv from 'dotenv'
dotenv.config()

import morgan from 'morgan'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

import './services/database.js'

import StudentRoutes from './routes/Student.js'
import CourseRoutes from './routes/Course.js'
import FacultyRoutes from './routes/Faculty.js'

const app = express()
const port = process.env.PORT || 17130

app.use(morgan('tiny'))
app.use(bodyParser.json())
app.use(cors())

app.use('/student', StudentRoutes)
app.use('/course', CourseRoutes)
app.use('/faculty', FacultyRoutes)

app.listen(port, () => {
  console.log(`EduChain Server listening on port ${port}`)
})