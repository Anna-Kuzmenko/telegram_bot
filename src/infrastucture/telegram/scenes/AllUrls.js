import {Markup, Scenes} from 'telegraf';
import {mainMenu} from "../menu/menu.js";
import db from "../../../db/orm.js";
import {tgProfiles} from "../index.js";
import axios from "axios";
import {collection, getDocs, limit, orderBy, query, where} from "firebase/firestore";
import dbFirestore, {storageFirebase} from "../../firebase/index.js";
import {getDownloadURL, ref, getBytes} from "firebase/storage";
import {stripeInstance} from "../../../app/modules/profile/payment/getStripeUrl.js";
import {Report, Report as ReportMongo} from "../../mongodb/models/report.js";
import reportScript from "../../../app/public/pdf-report/pdfSchemas/reportScript.js";
import {checkReport} from "../services/reportService.js";

const {BaseScene} = Scenes;

export const allUrlsScene = new BaseScene('allUrlsScene');

const userPages = {};

allUrlsScene.enter(async (ctx) => {
    const tgId = ctx.update.message.from.id;
    userPages[tgId] = { page: 1 }; // Initialize page for the user

    await sendUrlsWithPagination(ctx, tgId, userPages[tgId].page);
});

allUrlsScene.action('back', async (ctx) => {
    await ctx.scene.leave();
});

allUrlsScene.leave(async (ctx) => {
    const userId = ctx.chat.id;
    await ctx.reply(ctx.translate('choose_option'), mainMenu(tgProfiles[userId].lang));
});

allUrlsScene.action(/page_(next|prev)/, async (ctx) => {
    const tgId = ctx.update.callback_query.from.id;
    const action = ctx.match[1]; // 'next' or 'prev'

    if (action === 'next') {
        userPages[tgId].page++;
    } else if (action === 'prev' && userPages[tgId].page > 1) {
        userPages[tgId].page--;
    }

    await sendUrlsWithPagination(ctx, tgId, userPages[tgId].page);
});

// Function to handle individual URL button click
allUrlsScene.action(/url_(\w+-\w+-\w+-\w+-\w+|\d+)/, async (ctx) => {
    const urlId = ctx.match[1];
    const userId = ctx.update.callback_query.from.id;

    console.log(ctx.match);

    const selectedUrl = await db.tgSiteRepo.findOne({ id: urlId, telegramProfile: { tgId: userId } },
        {
            populate:['historyReports', 'telegramProfile.tariff']
        });
    const tariffDetailedReport= selectedUrl?.telegramProfile?.tariff?.detailedReports;

    if (selectedUrl) {
        await ctx.reply(`You selected the URL: ${selectedUrl.url}`);

        let buttons=[];

        if(selectedUrl.historyReports.length!==0){
            buttons.push(  [Markup.button.callback('📝 Mini Report', `mini_report_${urlId}`)],
                [Markup.button.callback('📊 Detailed Report', `detailed_report_${urlId}`)])
        }

        if (selectedUrl.historyReports.length===0 || selectedUrl.payment || tariffDetailedReport){
            buttons.push([Markup.button.callback('🚀 Start Report', `start_report_${urlId}`)]);
        }

        await ctx.reply('Please choose an option:', Markup.inlineKeyboard(buttons));
    } else {
        await ctx.reply('URL not found.');
    }
});

allUrlsScene.action(/mini_report_(\w+-\w+-\w+-\w+-\w+|\d+)/, async (ctx) => {
    const siteId = ctx.match[1];
    const userId = ctx.update.callback_query.from.id;

    const report = await checkReport(siteId)

    const name= `${tgProfiles[userId].lang}_mini`
    const reportUrl = report[`pdf`][`${name}`]

    const storageRefImage =reportUrl?ref(storageFirebase, `${reportUrl}`): null;
    const imageUrl= storageRefImage? await  getDownloadURL(storageRefImage): '';
    await ctx.reply(imageUrl);

});

allUrlsScene.action(/detailed_report_(\w+-\w+-\w+-\w+-\w+|\d+)/, async (ctx) => {

    const siteId = ctx.match[1];
    const userId = ctx.update.callback_query.from.id;

    console.log(ctx.match);

    const user = await db.telegramProfileRepo.findOne({  tgId: userId },
        {
            populate:['tariff']
        });

    const detailedReports= user.tariff?.detailedReports;

    const selectedUrl = await db.tgSiteRepo.findOne({ id: siteId, telegramProfile: { tgId: userId } },
        {
            populate:['historyReports']
        });

    if (!selectedUrl?.payment && !detailedReports) {
        await ctx.reply( ctx.translate('upgrade_info'))

        await ctx.reply( ctx.translate('detailed_payment'),
        Markup.inlineKeyboard(
            [Markup.button.url('Stripe 🔷',
                `${await createPaymentLink(userId, siteId)}`),
                Markup.button.callback(`Stars ⭐️`, `pay_with_stars:${userId}:${siteId}`)
                // Markup.button.url('Stars ⭐️', `${  ctx.replyWithInvoice(await createPaymentLinkStars(userId, urlId))}`)
            ],

        // [ Markup.button.callback(`Stars ⭐️`, `pay_with_stars:${userId}:${urlId}`)]

                // [Markup.button.url('Stars ⭐️',
                // `${  ctx.replyWithInvoice(await createPaymentLinkStars(userId, urlId))}`)]
        ))
    }
    else {
        await ctx.reply(ctx.translate('request_is_being_processed'))
        let report = await checkReport(siteId);

        const name = `${tgProfiles[userId].lang}_detailed`
        let reportUrl = report['pdf'][name]

        if (!reportUrl) {
            const reportData = await Report.findOne({siteId: siteId}).populate('analyses').sort({createdAt: -1});
            reportData.lang = tgProfiles[userId].lang;
            await reportScript(reportData, true)
            report = await checkReport(siteId)
            reportUrl = report[`pdf`][`${name}`]
        }

        const storageRefImage = reportUrl ? ref(storageFirebase, `${reportUrl}`) : null;
        const urlReport = storageRefImage ? await getDownloadURL(storageRefImage) : `${ctx.translate('something_went_wrong')}`;
        await ctx.reply(urlReport);
    }

});

allUrlsScene.action(/pay_with_stars:(.+):(.+)/, async (ctx) => {
    const userId = ctx.match[1];
    const urlId = ctx.match[2];
    await ctx.replyWithInvoice(await createPaymentLinkStars(userId, urlId));
});

allUrlsScene.action(/start_report_(\w+-\w+-\w+-\w+-\w+|\d+)/, async (ctx) => {
    const userId = ctx.update.callback_query.from.id;
    const urlId = ctx.match[1];

    const config = {
        tgSiteId: urlId,
        tgId: userId
    };

    try {
        await axios.post(`${process.env.REPORT_API}/api/report/telegram`,  config)
    }
    catch (e) {
        throw e
    }

    await ctx.reply(ctx.translate('starting_report_generation'));
});

async function sendUrlsWithPagination(ctx, tgId, page) {
    const limit = 5; // Number of URLs per page
    const offset = (page - 1) * limit;
    await ctx.i18n.setLocale(tgProfiles[tgId].lang);

    const [urls, totalCount] = await db.tgSiteRepo.findAndCount({
        telegramProfile: { tgId },
    }, {
        populate: ["telegramProfile"],
        orderBy: { createdAt: 'DESC'},
        limit,
        offset,
    });

    if (!urls.length) {
        return ctx.reply(ctx.translate('no_urls_found'));
    }

    const urlButtons = urls.map((site, index) =>
        [Markup.button.callback(`${offset + index + 1}. ${site.url}`, `url_${site.id}`)]
);


    const navigationButtons = [];
    if (page > 1) {
        navigationButtons.push(Markup.button.callback(`${ctx.translate('back')}`, 'page_prev'));
    }
    if (offset + limit < totalCount) {
        navigationButtons.push(Markup.button.callback(`${ctx.translate('forward')}`, 'page_next'));
    }

    await ctx.reply(`${ctx.translate('select_url')}`, Markup.inlineKeyboard([...urlButtons, navigationButtons]));
}

async function createPaymentLink(tgId, siteId) {
    try {

        const profile= await db.telegramProfileRepo.findOne({tgId})
        if(!profile.customerStripe){
            const customer = await stripeInstance.customers.create({
                description: `Telegram customer with ID: ${tgId}`,
                metadata: {
                    tgId: tgId,
                },
            });
            profile.customerStripe=customer.id
            await db.telegramProfileRepo.persistAndFlush(profile)
        }

        const session = await stripeInstance.checkout.sessions.create({
            metadata: {
                tgId: tgId,
                siteId: siteId
            },
            payment_method_types: ['card'],
            line_items: [
                {
                    price: 'price_1PuAR1HYYpvO3FPOqfmN9Fj1',
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `https://${process.env.BOT_URL}`,
            cancel_url: `https://${process.env.BOT_URL}`,
            customer: profile.customerStripe,
        });

        return session.url;
    } catch (error) {
        console.error('Error creating Stripe session:', error);
        throw error;
    }
}

async function createPaymentLinkStars(tgId, siteId) {
    const payload = {
        date: new Date(),
        tgId: tgId,
        siteId: siteId
    };
    return {
            title: '🚀 Detailed report',
            description: '🚀 Payment for a detailed report',
            payload: `${JSON.stringify(payload)}`,
            provider_token: '',
            start_parameter: 'start', // Параметр запуску (може бути будь-яким рядком)
            currency: 'XTR', // Валюта Звёд
            prices: [{label: 'Test Product', amount: 1}], // Ціна в найменших одиницях валюти (наприклад, 1000 XTR = 10 Z)
        }
}