import dotenv from 'dotenv'
dotenv.config()
import mongoose from "mongoose";

const connection = mongoose.createConnection(process.env.MONGO_URI, {
  user: process.env.MONGO_USER,
  pass: process.env.MONGO_PASSWORD
})

connection.addListener('connected', () => {
  console.log('Connected to database')
})

export default connection;