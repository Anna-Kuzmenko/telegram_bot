import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import mixins from './start/mixins.js';
import rotes from './api/index.js'
import {start} from "../infrastucture/telegram/index.js";
import mongoose from "mongoose";
mixins();
Error.stackTraceLimit = Infinity;
export const app = express();

const config = {
    username: process.env.MONGO_DB_USERNAME,
    password: process.env.MONGO_DB_PASSWORD,
    host: process.env.MONGO_DB_HOST,
    database: process.env.MONGO_DB_DATABASE
};

// Construct the MongoDB URI
const uri = `mongodb+srv://${config.username}:${config.password}@${config.host}/${config.database}?retryWrites=true&w=majority`;

// Connect to MongoDB
try {
    mongoose.connect(uri)
    console.log("Connected to MongoDB")
}catch (e){
    console.log(e)
    console.log("error connecting to MongoDB")
}


app.use(
    cors({
        origin: ['http://localhost:3000', 'http://localhost:3002', process.env.WEB_DOMAIN, process.env.WEB_DOMAIN_DEV],
        credentials: true,
    })
);

app.use(express.static(path.join(process.cwd(), 'src/app/public')));
app.use('/images', express.static(path.join(process.cwd(), 'images')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
// app.use(formData.format());

app.use(rotes);
export const bot = start(process.env.BOT_TOKEN);

export default app;
