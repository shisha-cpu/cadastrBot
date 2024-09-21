const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');


mongoose.connect('mongodb+srv://admin:wwwwww@cluster0.weppimj.mongodb.net/chatBot?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('DB connected'))
    .catch((err) => console.log('DB error', err));

const listingSchema = new mongoose.Schema({
    city: { type: String, required: true },
    price: { type: String, required: true },
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
                [{ text: 'МСК', callback_data: 'city_MSK' }],
                [{ text: 'СПБ', callback_data: 'city_SPB' }],
                [{ text: 'Калининград', callback_data: 'city_Kaliningrad' }],
                [{ text: 'Сочи', callback_data: 'city_Sochi' }],
            ],
        },
    });
});

addBot.action(/city_.+/, (ctx) => {
    const city = ctx.match[0].split('_')[1];
    newListing.city = city;

    ctx.reply('Выберите ценовой диапазон:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'до 3 млн', callback_data: 'price_3' }],
                [{ text: 'до 4 млн', callback_data: 'price_4' }],
                [{ text: 'до 5 млн', callback_data: 'price_5' }],
                [{ text: 'до 6 млн', callback_data: 'price_6' }],
            ],
        },
    });
});


addBot.action(/price_.+/, (ctx) => {
    const priceRange = ctx.match[0].split('_')[1] + ' млн';
    newListing.price = priceRange;

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


addBot.launch();
