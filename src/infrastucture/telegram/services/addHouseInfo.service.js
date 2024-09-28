import {ApartmentsPerFloor, entranceApartments, Entrances, Floors} from "../enums/homeEnums.js";
import {Markup} from "telegraf";
import {userPages} from "../scenes/addHouseInfoScene.js";

export async function getAvailableApartments(floor, entrance) {
    const totalApartmentsInEntrance = entranceApartments[entrance];
    if (!totalApartmentsInEntrance) {
        throw new Error(`Під'їзд ${entrance} не знайдено`);
    }

    const [start, end] = totalApartmentsInEntrance;
    const apartmentsPerFloor = ApartmentsPerFloor[entrance] ||  ApartmentsPerFloor.default;

    const apartmentsOnFloor = [];
    const firstApartmentOnFloor = start + (floor - 1) * apartmentsPerFloor;

    for (let i = 0; i < apartmentsPerFloor; i++) {
        const apartmentNumber = firstApartmentOnFloor + i;
        if (apartmentNumber <= end) {
            apartmentsOnFloor.push(apartmentNumber);
        }
    }
    return apartmentsOnFloor;
};

export function menuEntrance(updatedEntrances) {
    return  Markup.inlineKeyboard(
        updatedEntrances
    ).resize();
}

export const sendEntranceButtons = async (ctx) => {
    const entrances = Object.values(Entrances);

    await ctx.reply('Виберіть номер під\'їзду:', Markup.inlineKeyboard(
        entrances.map((entrance, index) => [Markup.button.callback(`🔻 Під\'їзд ${entrance}`, `entrance_${index + 1}`)])
    ).resize());
};

export const floorsPerPage = 5;
export async function sendFloorsPage(ctx, page = 1, edit=false, selectedFloor) {
    const totalPages = Math.ceil(Floors.length / floorsPerPage); // Загальна кількість сторінок
    if(!selectedFloor) selectedFloor=userPages[ctx?.update.callback_query.from.id].floor;
    const start = (page - 1) * floorsPerPage;
    const end = Math.min(start + floorsPerPage, Floors.length);
    const floorsToShow = Floors.slice(start, end);

    const floorButtons = floorsToShow.map((floor, index) =>
        [Markup.button.callback(
            `🔸 Поверх ${edit && floor == selectedFloor ? `${floor} ✅` :
                selectedFloor && floor == selectedFloor ? `${floor} ✅` :
                    floor}`,
            `floor_${start + index + 1}`)]);


    const navigationButtons = [];
    if (page > 1) {
        navigationButtons.push(Markup.button.callback('Назад ⏮', `floor_page_${page - 1}`));
    }
    if (page < totalPages) {
        navigationButtons.push(Markup.button.callback('Вперед ⏭', `floor_page_${page + 1}`));
    }

    const replyMarkup = Markup.inlineKeyboard([...floorButtons, navigationButtons]).resize();
    const text= `Виберіть поверх:`;
    edit? await ctx.editMessageText(text, replyMarkup): await ctx.reply(text, replyMarkup);
}

export async function sendApartmentsPage(ctx, page = 1, edit=false, selectedFloor) {
    const { entrance, floor }= userPages[ctx?.update.callback_query.from.id]

    const availableApartments= await getAvailableApartments(floor, entrance);

    const apartamentButtons = availableApartments.map((entrance, index) =>
        [Markup.button.callback(`🏚 Квартира ${entrance}`, `apartment_${entrance}`)]);

    return ctx.reply('Виберіть номер квартири:', Markup.inlineKeyboard([...apartamentButtons]).resize());
}
