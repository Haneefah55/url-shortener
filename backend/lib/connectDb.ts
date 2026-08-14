import 'dotenv/config'
import { MongoClient } from "mongodb";
import mongoose from 'mongoose'


const mongoUri = process.env.MONGODB_URI!

export const client = new MongoClient(mongoUri);


export const connectDb = async (mongoUri) =>{
  try{
    const conn = await mongoose.connect(mongoUri)
    console.log(`Mongodb connected.`)
  }catch(error: unknown){
    if (error instanceof Error) {
      console.log("error connecting to mongodb.",  error.message)
    } else {
      console.log("An unknown error occurred.")
    }
    process.exit(1)
  }
}


export const db = async() => {
  const res = mongoose.connection.db

  return res
}