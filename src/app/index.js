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
// const uri = `mongodb+srv://${config.username}:${config.password}@${config.host}/${config.database}?retryWrites=true&w=majority`;
const uri = `mongodb+srv://house-faq:house-faq@cluster0.wepvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Connect to MongoDB
try {
    mongoose.connect(uri)
    console.log("Connected to MongoDB")
}catch (e){
    console.log(e)
    console.log("error connecting to MongoDB")
}



// const config = {
//     // username: process.env.MONGO_DB_USERNAME,
//     // password: process.env.MONGO_DB_PASSWORD,
//     // host: process.env.MONGO_DB_HOST,
//     // database: process.env.MONGO_DB_DATABASE
//     username: "house-faq",
//     password: "6kpxJeoijWCUKvGO",
//     host: process.env.MONGO_DB_HOST,
//     database: process.env.MONGO_DB_DATABASE
// }
// mongodb+srv://house-faq:<db_password>@cluster0.wepvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//
//
// const uri = `${config.host}/${config.database}?tls=true&authSource=admin&replicaSet=db-mongodb-nyc3-77931`
// try {
//     mongoose.connect(uri, {
//         user: config.username,
//         pass: config.password,
//     })
//     console.log("Connected to MongoDB")
// } catch (e) {
//     console.log(e)
//     console.log("error connecting to MongoDB")
// }


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
