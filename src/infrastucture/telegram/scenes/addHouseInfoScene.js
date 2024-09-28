import {Markup, Scenes} from 'telegraf';
import {tgProfiles} from "../index.js";
import axios from "axios";
import {collection, getDocs, limit, orderBy, query, where} from "firebase/firestore";
import {Entrances, Floors, ApartmentsPerFloor} from "../enums/homeEnums.js";
import {User} from "../../mongoDb/entities/User.js";
import {
    getAvailableApartments,
    menuEntrance,
    sendEntranceButtons,
    sendFloorsPage,
    sendApartmentsPage,
    floorsPerPage
} from "../services/addHouseInfo.service.js";

const {BaseScene} = Scenes;

export const addHouseInfoScene = new BaseScene('addHouseInfoScene');

export const userPages = {}; // Store user pages

addHouseInfoScene.enter(async (ctx) => {
    const tgId = ctx.update.message.from.id;
    userPages[tgId] = {page: 1};

    await sendEntranceButtons(ctx);
});

addHouseInfoScene.action(/entrance_(\d+)/, async (ctx) => {
    const entranceIndex = ctx.match[1];
    const selectedEntrance = Entrances[`ENTRANCE_${entranceIndex}`];
    const entrances = Object.values(Entrances);

    userPages[ctx.update.callback_query.from.id].entrance = entranceIndex;

    const entranceText = `Виберіть номер під'їзду:`;

    const updatedEntrances = entrances.map((entrance, index) => {
        const buttonLabel = (index + 1 === parseInt(entranceIndex)) ? `${entrance} ✅` : entrance;
        return [Markup.button.callback(`🔻 Під\'їзд ${buttonLabel}`, `entrance_${index + 1}`)];
    });

    await ctx.editMessageText(entranceText, await menuEntrance(updatedEntrances));

    await ctx.reply(`Ви обрали під'їзд ${selectedEntrance}.`);

    await sendFloorsPage(ctx);

});

addHouseInfoScene.action(/apartment_(\d+)/, async (ctx) => {
    const tgId = ctx.update.callback_query.from.id;
    const apartment = ctx.match[1];
    await sendApartmentsPage(ctx, true, apartment)

    const entrance = userPages[tgId].entrance;
    const floor = userPages[tgId].floor;

    const userInfo = {
        entrance: Entrances[`ENTRANCE_${entrance}`],
        floor: Floors[floor - 1],
        apartment: apartment
    };

    try {
        await User.findOneAndUpdate(
            {tgId},
            {$set: {houseInfo: userInfo}},
            {new: true, upsert: true}
        );
        await ctx.reply(`<b>Ви обрали квартиру ${apartment}.</b> Інформацію оновлено.`, { parse_mode: 'HTML' });

        await ctx.reply(
            `<b>🎉 Приєднуйтесь до нас!</b>\n\n` +
            `Щоб отримувати останні новини та оновлення, будь ласка, перейдіть за посиланням нижче:\n\n` +
            `<a href="${process.env.REFERENCE_CHANEL}">👉 Підписатися на канал</a>\n\n` +
            `Дякуємо за вашу підтримку! 🙌`,
            { parse_mode: 'HTML' }
        );

    } catch (error) {
        console.error('Error updating user info:', error);
        await ctx.reply('Виникла помилка при оновленні інформації. Спробуйте ще раз.');
    }
})

addHouseInfoScene.action(/floor_page_(\d+)/, async (ctx) => {
    const pageIndex = parseInt(ctx.match[1]);
    await sendFloorsPage(ctx, pageIndex);
});


addHouseInfoScene.action(/floor_(\d+)/, async (ctx) => {
    const floorIndex = parseInt(ctx.match[1]);
    userPages[ctx.update.callback_query.from.id].floor = ctx.match[1].toString();

    await sendFloorsPage(ctx, Math.ceil(floorIndex / floorsPerPage), true, floorIndex)
    await sendApartmentsPage(ctx)
});
