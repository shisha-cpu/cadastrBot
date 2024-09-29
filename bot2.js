const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://admin:wwwwww@cluster0.weppimj.mongodb.net/chatBot?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('DB connected'))
    .catch((err) => console.log('DB error', err));

const listingSchema = new mongoose.Schema({
    city: { type: String, required: true },
    district: { type: String, required: true },
    photo: { type: String, required: true },
    description: { type: String, required: true },
});

const Listing = mongoose.model('Listing', listingSchema);

const addBot = new Telegraf('7762059907:AAHDTy7uXhuWjxsIsIL4VzkPyNj8oJEG0kk');

let awaitingPhoto = false;
let awaitingDescription = false;
let newListing = {};

addBot.start((ctx) => {
    ctx.reply('Привет! Я помогу добавить новое объявление. Выберите город:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Москва и МО', callback_data: 'city_MSK_MO' }],
                [{ text: 'Санкт-Петербург', callback_data: 'city_SPB' }],
                [{ text: 'Сочи', callback_data: 'city_Sochi' }],
                [{ text: 'Калининград', callback_data: 'city_Kaliningrad' }],
            ],
        },
    });
});


addBot.action('city_MSK_MO', (ctx) => {
    newListing.city = 'Москва и МО';
    ctx.reply('Выберите административный округ:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'СЗАО', callback_data: 'district_SZAO' }],
                [{ text: 'СВАО', callback_data: 'district_SVAO' }],
                [{ text: 'ЮЗАО', callback_data: 'district_YZAO' }],
                [{ text: 'НАО', callback_data: 'district_NAO' }],
                [{ text: 'САО', callback_data: 'district_SAO' }],
                [{ text: 'ЦАО', callback_data: 'district_CAO' }],
                [{ text: 'ВАО', callback_data: 'district_VAO' }],
                [{ text: 'ЮАО', callback_data: 'district_YAO' }],
            ],
        },
    });
});


addBot.action(/district_.+/, (ctx) => {
    const district = ctx.match[0].split('_')[1];
    newListing.district = district;  

    ctx.reply('Теперь отправьте ссылку на фото для объявления:');
    awaitingPhoto = true;
});


addBot.on('text', async (ctx) => {
    if (awaitingPhoto) {
        newListing.photo = ctx.message.text;
        ctx.reply('Теперь введите описание объявления:');
        awaitingPhoto = false;
        awaitingDescription = true;
    } else if (awaitingDescription) {
        newListing.description = ctx.message.text;

        const listing = new Listing(newListing);
        await listing.save();

        ctx.reply('Объявление успешно добавлено!');
        awaitingDescription = false;
        newListing = {};
    }
});


addBot.action('city_SPB', (ctx) => {
    newListing.city = 'Санкт-Петербург';
    ctx.reply('Выберите район Санкт-Петербурга:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Центральный', callback_data: 'district_Central' }],
                [{ text: 'Адмиралтейский', callback_data: 'district_Admiral' }],
                [{ text: 'Василеостровский', callback_data: 'district_Vasileostrovsky' }],
            ],
        },
    });
});


addBot.action('city_Sochi', (ctx) => {
    newListing.city = 'Сочи';
    ctx.reply('Выберите район Сочи:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Хостинский', callback_data: 'district_Khostinsky' }],
                [{ text: 'Центральный', callback_data: 'district_Central_Sochi' }],
                [{ text: 'Адлеровский', callback_data: 'district_Adler' }],
            ],
        },
    });
});

addBot.action('city_Kaliningrad', (ctx) => {
    newListing.city = 'Калининград';
    ctx.reply('В Калининграде доступен только один ЖК.');
    ctx.reply('Теперь отправьте ссылку на фото для объявления:');
    awaitingPhoto = true;
});


addBot.launch();
