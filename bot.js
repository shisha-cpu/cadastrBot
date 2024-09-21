const { Telegraf } = require('telegraf');
    const mongoose = require('mongoose');

   
    mongoose.connect('mongodb+srv://admin:wwwwww@cluster0.weppimj.mongodb.net/chatBot?retryWrites=true&w=majority&appName=Cluster0')
        .then(() => console.log('DB connected'))
        .catch((err) => console.log('DB error', err));


    const userSchema = new mongoose.Schema({
        chatId: { type: String, required: true },
        paymentMethod: String,
        city: String,
        priceRange: String,
        fullName: String,
        phone: String,
    });

    const User = mongoose.model('User', userSchema);

    
    const listingSchema = new mongoose.Schema({
        city: { type: String, required: true },
        price: { type: String, required: true },
        photo: { type: String, required: true },
        description: { type: String, required: true },
    });

    const Listing = mongoose.model('Listing', listingSchema);

    const bot = new Telegraf('7518600478:AAHdnYnYtcf5mBpDXsCc-4xRQQ3AWrOgtmc');

    bot.start((ctx) => {
        ctx.reply('Привет! Выберите способ оплаты: Наличными или Ипотека?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Наличными', callback_data: 'cash' }],
                    [{ text: 'Ипотека', callback_data: 'mortgage' }],
                ],
            },
        });
    });

    bot.action(['cash', 'mortgage'], async (ctx) => {
        const paymentMethod = ctx.match[0] === 'cash' ? 'Наличными' : 'Ипотека';
        await User.updateOne({ chatId: ctx.chat.id }, { paymentMethod }, { upsert: true });
        ctx.reply('Выберите город:', {
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

  
    bot.action(/city_.+/, async (ctx) => {
        const city = ctx.match[0].split('_')[1];
        await User.updateOne({ chatId: ctx.chat.id }, { city }, { upsert: true });
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


    bot.action(/price_.+/, async (ctx) => {
        const priceRange = ctx.match[0].split('_')[1] + ' млн';
        await User.updateOne({ chatId: ctx.chat.id }, { priceRange }, { upsert: true });

        const user = await User.findOne({ chatId: ctx.chat.id });
     
        const listings = await Listing.find({ city: user.city, price: { $regex: priceRange } });

        if (listings.length > 0) {
            for (const listing of listings) {
                await ctx.replyWithPhoto(listing.photo, { caption: listing.description });
            }
        } else {
            ctx.reply('Извините, студий в выбранной категории нет.');
        }

        ctx.reply('Записаться на консультацию?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Записаться', callback_data: 'consult' }],
                ],
            },
        });
    });


    bot.launch();