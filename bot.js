const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');


mongoose.connect('mongodb+srv://admin:wwwwww@cluster0.weppimj.mongodb.net/chatBot?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('DB connected'))
    .catch((err) => console.log('DB error', err));


const userSchema = new mongoose.Schema({
    chatId: { type: String, required: true },
    city: String,
    district: String,
    consultationRequested: Boolean
});

const User = mongoose.model('User', userSchema);


const listingSchema = new mongoose.Schema({
    city: { type: String, required: true },
    district: String,
    description: String,
    price: String,
    photo: String
});

const Listing = mongoose.model('Listing', listingSchema);


const bot = new Telegraf('7518600478:AAHdnYnYtcf5mBpDXsCc-4xRQQ3AWrOgtmc');

bot.start((ctx) => {
    ctx.reply('Регистрируем документы на каждую студию в Росреестре. Вы получаете законные метры и прописку и льготы в Москве.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Видео наших объектов', callback_data: 'videos' }],
                [{ text: 'Отзывы', callback_data: 'reviews' }],
                [{ text: 'Юрист о «нашем формате.', callback_data: 'form' }],
                [{ text: 'Выбрать город', callback_data: 'choose_city' }]
            ]
        }
    });
});


bot.action('videos', (ctx) => {
    ctx.reply('Вот видео наших объектов.');
    ctx.replyWithVideo({ source: './obj1.mp4' });
});


bot.action('reviews', (ctx) => {
    ctx.reply('Вот отзывы наших клиентов.');
    ctx.replyWithVideo({ source: './10.mp4' });
});
bot.action('form', (ctx) => {
    ctx.reply('Юрист о «нашем формате.');
    ctx.replyWithVideo({ source: './10.mp4' });

});

bot.action('choose_city', (ctx) => {
    ctx.reply('Выберите город:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Москва и МО', callback_data: 'city_MSK_MO' }],
                [{ text: 'Санкт-Петербург', callback_data: 'city_SPB' }],
                [{ text: 'Сочи', callback_data: 'city_Sochi' }],
                [{ text: 'Калининград', callback_data: 'city_Kaliningrad' }]
            ]
        }
    });
});

bot.action(/city_(.+)/, async (ctx) => {
    const city = ctx.match[1];
    await User.updateOne({ chatId: ctx.chat.id }, { city }, { upsert: true });

    if (city === 'MSK_MO') {
        ctx.reply('Выберите административный округ Москвы и МО:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'СЗАО', callback_data: 'district_SZAO' }],
                    [{ text: 'СВАО', callback_data: 'district_SVAO' }],
                    [{ text: 'ЮЗАО', callback_data: 'district_YZAO' }],
                    [{ text: 'ЦАО', callback_data: 'district_CAO' }],
                    [{ text: 'ВАО', callback_data: 'district_VAO' }],
                    [{ text: 'МО', callback_data: 'district_MO' }]
                ]
            }
        });
    } else if (city === 'SPB') {
        ctx.reply('Выберите район Санкт-Петербурга:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Центральный', callback_data: 'district_Central' }],
                    [{ text: 'Адмиралтейский', callback_data: 'district_Admiral' }],
                    [{ text: 'Василеостровский', callback_data: 'district_Vasileostrovsky' }]
                ]
            }
        });
    } else if (city === 'Sochi') {
        ctx.reply('Выберите район Сочи:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Хостинский', callback_data: 'district_Khostinsky' }],
                    [{ text: 'Центральный', callback_data: 'district_Central_Sochi' }],
                    [{ text: 'Адлеровский', callback_data: 'district_Adler' }]
                ]
            }
        });
    } else if (city === 'Kaliningrad') {
        ctx.reply('Доступен только один ЖК в Калининграде.');
    }
});

bot.action(/district_.+/, async (ctx) => {
    const district = ctx.match[0].split('_')[1];
    await User.updateOne({ chatId: ctx.chat.id }, { district }, { upsert: true });

    const user = await User.findOne({ chatId: ctx.chat.id });
    const listings = await Listing.find({ district: user.district });

    if (listings.length > 0) {
        for (const listing of listings) {
            await ctx.replyWithPhoto(listing.photo, { caption: `${listing.description}\nЦена: ${listing.price}` });
        }
    } else {
        ctx.reply('Извините, по выбранным параметрам ничего не найдено.');
    }

    ctx.reply('Задать вопрос или записаться на консультацию?', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Задать вопрос', callback_data: 'faq' }],
                [{ text: 'Записаться на консультацию', callback_data: 'consult' }]
            ]
        }
    });
});


bot.action('faq', (ctx) => {
    ctx.reply('Вот PDF файл с ответами на вопросы.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Скачать PDF', callback_data: 'download_pdf' }]
            ]
        }
    });
});


bot.action('download_pdf', (ctx) => {
    ctx.replyWithDocument({ source: './Brevis_Apartments_.pdf' });
});

bot.action('consult', async (ctx) => {
    await User.updateOne({ chatId: ctx.chat.id }, { consultationRequested: true });
    ctx.reply('Мы свяжемся с вами для консультации.');
});


bot.launch();
