const TelegramBot = require('node-telegram-bot-api');
const Beneficiary = require('../models/Beneficiary');
const AidRecord = require('../models/AidRecord');

let bot;

const initBot = () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('Telegram bot token not set, skipping...');
    return;
  }

  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      `Саламатсызбы! FundsDB botuna кош келдиңиз.\n\n` +
      `Буйруктар:\n` +
      `/tekshir [ИНН] — Муктажды ИНН боюнча текшерүү\n` +
      `/yangi — Жаңы муктаж кошуу (кадам-кадам)`
    );
  });

  // /tekshir [INN]
  bot.onText(/\/tekshir (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const inn = match[1].trim();

    try {
      const beneficiary = await Beneficiary.findOne({ inn }).populate('registeredBy', 'name');

      if (!beneficiary) {
        return bot.sendMessage(chatId, `❌ ИНН: ${inn}\n\nБул адам системада жок.`);
      }

      const aidRecords = await AidRecord.find({ beneficiary: beneficiary._id })
        .populate('foundation', 'name')
        .sort({ givenAt: -1 });

      let text = `✅ Муктаж табылды!\n\n`;
      text += `👤 Аты-жөнү: ${beneficiary.fullName}\n`;
      text += `🪪 ИНН: ${beneficiary.inn}\n`;
      text += `📞 Телефону: ${beneficiary.phone || '—'}\n`;
      text += `📍 Дареги: ${beneficiary.address || '—'}\n`;
      text += `🏷️ Абалы: ${beneficiary.status}\n`;
      text += `📋 Муктаждыгы: ${beneficiary.needType}\n`;
      text += `🏢 Каттаган фонд: ${beneficiary.registeredBy?.name || '—'}\n\n`;

      if (aidRecords.length > 0) {
        text += `💝 Жардам тарыхы (${aidRecords.length}):\n`;
        aidRecords.slice(0, 5).forEach((rec) => {
          const date = new Date(rec.givenAt).toLocaleDateString('ru-RU');
          text += `• ${date} — ${rec.foundation?.name || '—'} — ${rec.aidType}`;
          if (rec.amount) text += ` (${rec.amount} сом)`;
          text += '\n';
        });
      } else {
        text += `💝 Жардам тарыхы жок.`;
      }

      bot.sendMessage(chatId, text);
    } catch (err) {
      bot.sendMessage(chatId, '⚠️ Ката кетти. Кийинчерээк кайра аракет кылыңыз.');
    }
  });

  // /yangi — step-by-step muhtoj qo'shish
  const sessions = {};

  bot.onText(/\/yangi/, (msg) => {
    const chatId = msg.chat.id;
    sessions[chatId] = { step: 'inn' };
    bot.sendMessage(chatId, '📝 Жаңы муктаж кошуу\n\nИНН киргизиңиз:');
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!sessions[chatId] || text?.startsWith('/')) return;

    const session = sessions[chatId];

    if (session.step === 'inn') {
      const existing = await Beneficiary.findOne({ inn: text.trim() });
      if (existing) {
        delete sessions[chatId];
        return bot.sendMessage(chatId, `⚠️ Бул ИНН менен муктаж системада бар: ${existing.fullName}`);
      }
      session.inn = text.trim();
      session.step = 'fullName';
      bot.sendMessage(chatId, 'Аты-жөнүн киргизиңиз (Фамилия Аты Атасынын аты):');

    } else if (session.step === 'fullName') {
      session.fullName = text.trim();
      session.step = 'phone';
      bot.sendMessage(chatId, 'Телефон номерин киргизиңиз:');

    } else if (session.step === 'phone') {
      session.phone = text.trim();
      session.step = 'needType';
      bot.sendMessage(chatId, 'Муктаждыгын тандаңыз:\n1 — Азык-түүлүк\n2 — Дары-дармек\n3 — Акча\n4 — Кийим\n5 — Башка');

    } else if (session.step === 'needType') {
      const types = ['Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Башка'];
      session.needType = types[parseInt(text) - 1] || 'Башка';
      session.step = 'confirm';
      bot.sendMessage(
        chatId,
        `✅ Маалымат:\nИНН: ${session.inn}\nАты-жөнү: ${session.fullName}\nТелефон: ${session.phone}\nМуктаждыгы: ${session.needType}\n\nСактоо үчүн "ооба" жазыңыз:`
      );

    } else if (session.step === 'confirm') {
      if (text.toLowerCase() === 'ооба') {
        try {
          await Beneficiary.create({
            inn: session.inn,
            fullName: session.fullName,
            phone: session.phone,
            needType: session.needType,
            registeredBy: process.env.DEFAULT_FOUNDATION_ID,
          });
          bot.sendMessage(chatId, '✅ Муктаж ийгиликтүү катталды!');
        } catch {
          bot.sendMessage(chatId, '⚠️ Ката кетти. Сайт аркылуу кошуп көрүңүз.');
        }
      } else {
        bot.sendMessage(chatId, '❌ Жокко чыгарылды.');
      }
      delete sessions[chatId];
    }
  });

  console.log('Telegram bot started');
};

// Fond adminga bildirishnoma yuborish
const notifyFoundation = async (telegramChatId, message) => {
  if (!bot || !telegramChatId) return;
  try {
    await bot.sendMessage(telegramChatId, message);
  } catch {}
};

module.exports = { initBot, notifyFoundation };
