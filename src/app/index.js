import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import mixins from './start/mixins.js';
import rotes from './api/index.js'
import {start} from "../infrastucture/telegram/index.js";

mixins();
Error.stackTraceLimit = Infinity;
export const app = express();

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
