/**
 * Script de prueba de conexión a Telegram con soporte para .env y GitHub Secrets.
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const CONFIG_PATH = path.join(__dirname, 'config.json');

async function testTelegram() {
  const config = fs.existsSync(CONFIG_PATH) ? JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) : {};
  const botToken = process.env.TELEGRAM_BOT_TOKEN || config.telegram?.bot_token;
  const chatId = process.env.TELEGRAM_CHAT_ID || config.telegram?.chat_id;

  if (!botToken || botToken.includes('AQUI')) {
    console.log('⚠️ Configura TELEGRAM_BOT_TOKEN en tu .env o en config.json');
    return;
  }

  if (!chatId || chatId.includes('AQUI')) {
    console.log('⚠️ Configura TELEGRAM_CHAT_ID en tu .env o en config.json');
    return;
  }

  console.log('📡 Verificando conexión segura con Telegram...');

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const me = await res.json();

    if (!me.ok) {
      console.error(`❌ Token inválido: ${me.description}`);
      return;
    }

    console.log(`🤖 ¡Bot identificado con éxito!: @${me.result.username} (${me.result.first_name})`);

    const msg = [
      `🔒 <b>¡Conexión segura validada!</b>`,
      `Tus credenciales están ahora protegidas mediante Variables de Entorno / Secrets.`
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
      console.log('✅ ¡Mensaje de prueba seguro enviado con éxito a tu Telegram!');
    } else {
      console.error(`❌ Error al enviar mensaje: ${sendData.description}`);
    }

  } catch (err) {
    console.error('❌ Error de red:', err.message);
  }
}

testTelegram();
