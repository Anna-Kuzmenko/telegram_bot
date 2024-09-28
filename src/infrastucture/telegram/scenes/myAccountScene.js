import {Markup, Scenes} from 'telegraf';
import {User} from "../../mongoDb/entities/User.js";

const {BaseScene} = Scenes;

export const myAccountScene = new BaseScene('myAccountScene');

myAccountScene.enter(async (ctx) => {
    const tgId = ctx.update.message.from.id;
    const user = await User.findOne({tgId: tgId})
    const userInfoText = `
<b>Ім'я:</b> ${user.firstName}\n
<b>Користувач:</b> ${user.username}\n
<b>Інформація:</b>\n
    - 🔺Під'їзд: ${user.houseInfo.entrance}\n
    - 🔸Поверх: ${user.houseInfo.floor}\n
    - 🔹Квартира: ${user.houseInfo.apartment}
`;

    await ctx.reply(userInfoText, { parse_mode: 'HTML' });
});



