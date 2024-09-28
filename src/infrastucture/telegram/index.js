import {Telegraf, session, Context, Scenes, Markup,} from 'telegraf';
import path from 'path';
import grammyjs from '@grammyjs/i18n';
import {limit as limitGrammyjs} from '@grammyjs/ratelimiter';
import logger from '../../app/logger/index.js';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import {addHouseInfoScene} from "./scenes/addHouseInfoScene.js";
import {User} from "../mongoDb/entities/User.js";
import {myAccountScene} from "./scenes/myAccountScene.js";

const {Stage} = Scenes;

const {I18n, I18nContext} = grammyjs;
export let tgProfiles = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initialize = (botToken) => {
    const i18n = new I18n({
        locales: [ 'en'],
        useSession: true,
        defaultLocale: 'en',
        resources: {
            en: { translation: 'en'},
        },
        // fallbackLocale: 'en',
        // directory: path.resolve(__dirname, 'locales'),
    });
    // Also you can provide i18n data directly
    // i18n.loadLocalesDirSync(`${path.resolve(__dirname, 'locales')}`)

    const bot = new Telegraf(botToken);
    bot.i18n = i18n;
    bot.use(i18n.middleware());
    bot.catch(err => {
        logger.error(err);
    });
    const stage = new Stage([
        addHouseInfoScene,
        myAccountScene
    ]);

    bot.use(session());
    bot.use(stage.middleware());
    bot.use(limitGrammyjs());


    bot.use(async (ctx, next) => {
        const tgId = ctx.chat.id;

        const user= await User.findOne({tgId: tgId})
        if (!user){
            await User.create(
                {
                    tgId: tgId,
                    firstName: ctx?.chat?.first_name,
                    lastName:ctx?.chat?.last_name,
                    username: ctx?.chat?.username,
                    type: ctx?.chat?.type
                })
        }

        return next();
    });

    bot.start(async (ctx) => {
        try {
            if (!('message' in ctx.update) || !('text' in ctx.update.message)) {
                throw new Error('No message in ctx.update');
            }
            const userId = ctx.chat.id;
            await ctx.reply(`Ласкаво просимо до боту!`);
            await ctx.scene.enter('addHouseInfoScene')
        } catch (error) {
            logger.error(error);
        }
    });

    bot.telegram.setMyCommands([
        {command: 'my_account', description: 'Мій акаунт'},
        {command: 'update_info', description: 'Оновити інформацію'},
    ]);

    bot.command('my_account', (ctx) => ctx.scene.enter('myAccountScene'));
    bot.command('update_info', (ctx) => ctx.scene.enter('addHouseInfoScene'));

    return bot;
}

const start = (botToken) => {
    const bot = initialize(botToken);
    bot.launch();

    console.log(`Bot starting ${process.env.BOT_NAME}`);
    return bot;
};


export {initialize, start};
