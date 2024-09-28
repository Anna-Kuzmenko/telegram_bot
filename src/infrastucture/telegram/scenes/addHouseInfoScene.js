import {Markup, Scenes} from 'telegraf';
import {tgProfiles} from "../index.js";
import axios from "axios";
import {collection, getDocs, limit, orderBy, query, where} from "firebase/firestore";
import {Entrances, Floors, ApartmentsPerFloor} from "../enums/homeEnums.js";
import {User} from "../../mongoDb/entities/User.js";
const {BaseScene} = Scenes;

export const addHouseInfoScene = new BaseScene('addHouseInfoScene');

const userPages = {}; // Store user pages

addHouseInfoScene.enter(async (ctx) => {
    const tgId = ctx.update.message.from.id;
    userPages[tgId] = { page: 1 };

    await sendEntranceButtons(ctx);
});
const sendEntranceButtons = async (ctx) => {
    const entrances = Object.values(Entrances);

    await ctx.reply('Виберіть номер під\'їзду:', Markup.inlineKeyboard(
        entrances.map((entrance, index) => [Markup.button.callback(`Під\'їзд ${entrance}`, `entrance_${index + 1}`)])
    ).resize());
};

addHouseInfoScene.action(/entrance_(\d+)/, async (ctx) => {
    const entranceIndex = ctx.match[1];
    const selectedEntrance = Entrances[`ENTRANCE_${entranceIndex}`];
    const entrances = Object.values(Entrances);

    // Оновлення вибору користувача в пам'яті
    userPages[ctx.update.callback_query.from.id].entrance = entranceIndex;

    // Створення тексту для нового повідомлення
    const entranceText = `Виберіть номер під'їзду:`;

    // Оновлення тексту кнопок під'їздів
    const updatedEntrances = entrances.map((entrance, index) => {
        const buttonLabel = (index + 1 === parseInt(entranceIndex)) ? `${entrance} ✅` : entrance;
        return [Markup.button.callback(`Під\'їзд ${buttonLabel}`, `entrance_${index + 1}`)];
    });

    console.log(updatedEntrances)
    // Оновлення тексту повідомлення
    await ctx.editMessageText(entranceText, await menuEntrance(updatedEntrances));

    // Відправлення повідомлення про вибір під'їзду
    await ctx.reply(`Ви обрали під'їзд ${selectedEntrance}.`);
    await ctx.reply(`Виберіть поверх:`, Markup.inlineKeyboard(
        Floors.map((floor, index) => [Markup.button.callback(floor, `floor_${index + 1}`)])
    ).resize());


});

function menuEntrance(updatedEntrances) {
    return  Markup.inlineKeyboard(
        updatedEntrances
    ).resize();
}
addHouseInfoScene.action(/floor_(\d+)/, async (ctx) => {
    const floorIndex = parseInt(ctx.match[1]);
    userPages[ctx.update.callback_query.from.id].floor = floorIndex; // Store floor selection
    const apartmentsCount = (floorIndex === 1 || floorIndex === 6) ? ApartmentsPerFloor[floorIndex] : ApartmentsPerFloor.default;

    const apartments = Array.from({ length: apartmentsCount }, (_, i) => `Квартира ${i + 1}`);

    await ctx.reply(`Ви обрали ${Floors[floorIndex - 1]}. Виберіть квартиру:`, Markup.inlineKeyboard(
        apartments.map((apartment, index) => [Markup.button.callback(apartment, `apartment_${index + 1}`)])
    ).resize());
});

addHouseInfoScene.action(/apartment_(\d+)/, async (ctx) => {
    const tgId = ctx.update.callback_query.from.id;
    const apartment = ctx.match[1];

    const entrance = userPages[tgId].entrance;
    const floor = userPages[tgId].floor;

    const userInfo = {
        entrance: Entrances[`ENTRANCE_${entrance}`],
        floor: Floors[floor - 1],
        apartment: apartment
    };

    try {
        await User.findOneAndUpdate(
            { tgId },
            { $set: { houseInfo: userInfo } },
            { new: true, upsert: true }
        );
        await ctx.reply(`Ви обрали квартиру ${apartment}. Інформацію оновлено.`);
    } catch (error) {
        console.error('Error updating user info:', error);
        await ctx.reply('Виникла помилка при оновленні інформації. Спробуйте ще раз.');
    }
})