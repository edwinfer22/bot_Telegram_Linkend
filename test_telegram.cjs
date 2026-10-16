/**
 * Script de prueba para validar que tu Bot de Telegram esté funcionando y configurado correctamente.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');

async function testTelegram() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ No se encontró config.json');
    return;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const botToken = config.telegram?.bot_token;
  const chatId = config.telegram?.chat_id;

  if (!botToken || botToken.includes('TU_BOT_TOKEN')) {
    console.log('⚠️ Reemplaza "TU_BOT_TOKEN_DE_TELEGRAM_AQUI" con tu token real de @BotFather en config.json');
    return;
  }

  if (!chatId || chatId.includes('TU_CHAT_ID')) {
    console.log('⚠️ Reemplaza "TU_CHAT_ID_AQUI" con tu chat_id numérico en config.json');
    return;
  }

  console.log('📡 Verificando conexión con Telegram...');

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const me = await res.json();

    if (!me.ok) {
      console.error(`❌ Token inválido: ${me.description}`);
      return;
    }

    console.log(`🤖 ¡Bot identificado con éxito!: @${me.result.username} (${me.result.first_name})`);

    const msg = [
      `🎉 <b>¡Conexión exitosa!</b>`,
      `El bot de alertas de empleo en LinkedIn está vinculado correctamente a tu cuenta.`,
      `A partir de ahora, cada vez que se detecte una vacante relevante de sistemas, recibirás una alerta con enlace directo aquí.`
    ].join('\n\n');

    const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'HTML'
      })
    });

    const sendData = await sendRes.json();
    if (sendData.ok) {
      console.log('✅ ¡Mensaje de prueba enviado con éxito a tu Telegram! Revisa tu aplicación.');
    } else {
      console.error(`❌ Error al enviar mensaje: ${sendData.description}`);
      console.log('💡 Recuerda que debes entrar a Telegram, buscar a tu bot y darle clic a "INICIAR" (o enviar /start) al menos una vez para que pueda enviarte mensajes.');
    }

  } catch (err) {
    console.error('❌ Error de red:', err.message);
  }
}

testTelegram();
