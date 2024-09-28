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

    userPages[ctx.update.callback_query.from.id].entrance = entranceIndex;

    const entranceText = `Виберіть номер під'їзду:`;

    const updatedEntrances = entrances.map((entrance, index) => {
        const buttonLabel = (index + 1 === parseInt(entranceIndex)) ? `${entrance} ✅` : entrance;
        return [Markup.button.callback(`Під\'їзд ${buttonLabel}`, `entrance_${index + 1}`)];
    });

    await ctx.editMessageText(entranceText, await menuEntrance(updatedEntrances));

    await ctx.reply(`Ви обрали під'їзд ${selectedEntrance}.`);

    await sendFloorsPage(ctx);

});

function menuEntrance(updatedEntrances) {
    return  Markup.inlineKeyboard(
        updatedEntrances
    ).resize();
}
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

addHouseInfoScene.action(/floor_page_(\d+)/, async (ctx) => {
    const pageIndex = parseInt(ctx.match[1]);
    await sendFloorsPage(ctx, pageIndex);
});


const floorsPerPage = 5;
async function sendFloorsPage(ctx, page = 1, edit=false, selectedFloor) {
    const totalPages = Math.ceil(Floors.length / floorsPerPage); // Загальна кількість сторінок
    if(!selectedFloor) selectedFloor=userPages[ctx?.update.callback_query.from.id].floor;
    const start = (page - 1) * floorsPerPage;
    const end = Math.min(start + floorsPerPage, Floors.length);
    const floorsToShow = Floors.slice(start, end);

    const floorButtons = floorsToShow.map((floor, index) =>
        [Markup.button.callback(
            `Поверх ${edit && floor == selectedFloor ? `${floor} ✅` :
                selectedFloor && floor == selectedFloor ? `${floor} ✅` :
                    floor}`,
            `floor_${start + index + 1}`)]);


    const navigationButtons = [];
    if (page > 1) {
        navigationButtons.push(Markup.button.callback('Назад', `floor_page_${page - 1}`));
    }
    if (page < totalPages) {
        navigationButtons.push(Markup.button.callback('Вперед', `floor_page_${page + 1}`));
    }

    const replyMarkup = Markup.inlineKeyboard([...floorButtons, navigationButtons]).resize();
    const text= `Виберіть поверх:`;
    edit? await ctx.editMessageText(text, replyMarkup): await ctx.reply(text, replyMarkup);
}

addHouseInfoScene.action(/floor_(\d+)/, async (ctx) => {
    const floorIndex = parseInt(ctx.match[1]);
    userPages[ctx.update.callback_query.from.id].floor = ctx.match[1].toString();

    const apartmentsCount = (floorIndex === 1 || floorIndex === 6) ? ApartmentsPerFloor[floorIndex] : ApartmentsPerFloor.default;
    console.log(apartmentsCount)
   await sendFloorsPage(ctx, Math.ceil(floorIndex / floorsPerPage), true, floorIndex)

});


//
// const sendApartmentsPage = async (ctx, floorIndex, page, totalPages) => {
//     const apartmentsCount = (floorIndex === 1 || floorIndex === 6) ? ApartmentsPerFloor[floorIndex] : ApartmentsPerFloor.default;
//     const apartments = Array.from({ length: apartmentsCount }, (_, i) => `Квартира ${i + 1}`);
//
//     // Визначаємо квартири для поточної сторінки
//     const start = (page - 1) * apartmentsPerPage;
//     const end = start + apartmentsPerPage;
//     const apartmentsToShow = apartments.slice(start, end);
//
//     // Створюємо клавіатуру для квартир
//     const apartmentButtons = apartmentsToShow.map((apartment, index) => [Markup.button.callback(apartment, `apartment_${start + index + 1}`)]);
//
//     // Додаємо кнопки для пагінації
//     const navigationButtons = [];
//     if (page > 1) {
//         navigationButtons.push(Markup.button.callback('Назад', `page_${page - 1}`));
//     }
//     if (page < totalPages) {
//         navigationButtons.push(Markup.button.callback('Вперед', `page_${page + 1}`));
//     }
//
//     const replyMarkup = Markup.inlineKeyboard([...apartmentButtons, navigationButtons]).resize();
//
//     await ctx.editMessageText(`Ви обрали ${Floors[floorIndex - 1]}. Виберіть квартиру:`, {
//         reply_markup: replyMarkup,
//         parse_mode: 'Markdown' // або 'HTML', якщо потрібно
//     });
// };


