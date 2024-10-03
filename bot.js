const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

// Подключение к базе данных
mongoose.connect('mongodb+srv://admin:wwwwww@cluster0.weppimj.mongodb.net/chatBot?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('DB connected'))
    .catch((err) => console.log('DB error', err));

// Схема для пользователей
const userSchema = new mongoose.Schema({
    chatId: { type: String, required: true },
    city: String,
    district: String,
    consultationRequested: Boolean,
    fullName: String,
    phone: String,
    awaitingInput: String  // новое поле для отслеживания состояния
});

const User = mongoose.model('User', userSchema);

// Схема для объявлений
const listingSchema = new mongoose.Schema({
    city: { type: String, required: true },
    district: String,
    description: String,
    price: String,
    photos: [String]  // Массив ссылок на фотографии
});

const Listing = mongoose.model('Listing', listingSchema);

// Инициализация бота с токеном
const bot = new Telegraf('7518600478:AAHdnYnYtcf5mBpDXsCc-4xRQQ3AWrOgtmc');

// Предопределенный chatId для отправки данных админу
const adminChatId = '1098841237';

// Логирование chatId
bot.use((ctx, next) => {
    console.log(`User chatId: ${ctx.chat.id}`);
    return next();
});

// Начальное сообщение при старте
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

// Видео, отзывы и форма
bot.action('videos', (ctx) => {
    ctx.reply('Вот видео наших объектов.');
    ctx.replyWithVideo({ source: './obj1.mp4' });
});

bot.action('reviews', (ctx) => {
    ctx.reply('Пока нет отзывов');
});

bot.action('form', (ctx) => {
    ctx.reply('Юрист о «нашем формате.');
    ctx.replyWithVideo({ source: './form.mp4' });
});

// Выбор города
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

// Обработка выбора города
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
        await User.updateOne({ chatId: ctx.chat.id }, { district: 'Центральный' }, { upsert: true });
        ctx.reply('Доступен только один ЖК в Калининграде.');
        await showListings(ctx);  // Показ объявлений для Калининграда сразу
    }
});

// Показ объявлений для выбранного района
bot.action(/district_.+/, async (ctx) => {
    const district = ctx.match[0].split('_')[1];
    await User.updateOne({ chatId: ctx.chat.id }, { district }, { upsert: true });

    await showListings(ctx);  // Показ объявлений
});



// Функция показа объявлений
async function showListings(ctx) {
    const user = await User.findOne({ chatId: ctx.chat.id });
    const listings = await Listing.find({ district: user.district });

    if (listings.length > 0) {
        for (const listing of listings) {
            const caption = `${listing.description}`; // Оставили только описание

            // Удаление дубликатов из массива фотографий
            const uniquePhotos = [...new Set(listing.photos)];

            // Подготовка массива фотографий для отправки
            const media = uniquePhotos.map((photo, index) => {
                return { type: 'photo', media: photo, caption: index === 0 ? caption : undefined }; // Заголовок только для первого фото
            });
            
            // Отправка всех фотографий в одном сообщении
            await ctx.replyWithMediaGroup(media);
        }
    } else {
        ctx.reply('Извините, по выбранным параметрам ничего не найдено.');
    }

    // Показ кнопок "Задать вопрос" и "Записаться на консультацию"
    ctx.reply('Задать вопрос или записаться на консультацию?', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Задать вопрос', callback_data: 'faq' }],
                [{ text: 'Записаться на консультацию', callback_data: 'consult' }]
            ]
        }
    });
}


// Обработка вопросов и консультаций
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

// Обработка консультаций
bot.action('consult', async (ctx) => {
    await User.updateOne({ chatId: ctx.chat.id }, { consultationRequested: true, awaitingInput: 'fullName' });
    ctx.reply('Пожалуйста, введите ваше ФИО:');
});

// Обработка текстового ввода пользователя (ФИО и телефон)
bot.on('text', async (ctx) => {
    const user = await User.findOne({ chatId: ctx.chat.id });

    if (user.awaitingInput === 'fullName') {
        // Обработка ФИО
        await User.updateOne({ chatId: ctx.chat.id }, { fullName: ctx.message.text, awaitingInput: 'phone' });
        ctx.reply('Теперь введите ваш номер телефона:');
    } else if (user.awaitingInput === 'phone') {
        // Обработка телефона
        await User.updateOne({ chatId: ctx.chat.id }, { phone: ctx.message.text, awaitingInput: null });
        ctx.reply('Спасибо! Ваши данные отправлены.');

        // Отправка данных админу
        bot.telegram.sendMessage(adminChatId, `Новая заявка на консультацию:\nФИО: ${user.fullName}\nТелефон: ${ctx.message.text}`);
    }
});

// Запуск бота
bot.launch();
