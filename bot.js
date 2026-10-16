/**
 * LinkedIn Job Alert Bot para Telegram
 * Busca automáticamente vacantes de sistemas y tecnología en LinkedIn y te las envía a Telegram.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const DATA_DIR = path.join(__dirname, 'data');
const SEEN_JOBS_FILE = path.join(DATA_DIR, 'seen_jobs.json');

// Cargar configuración
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`[ERROR] No se encontró el archivo de configuración en: ${CONFIG_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// Cargar empleos ya vistos (para evitar duplicados)
function loadSeenJobs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SEEN_JOBS_FILE)) {
    fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify([]));
    return new Set();
  }
  try {
    const list = JSON.parse(fs.readFileSync(SEEN_JOBS_FILE, 'utf-8'));
    return new Set(list);
  } catch (e) {
    return new Set();
  }
}

// Guardar empleo visto
function saveSeenJob(seenSet, jobId) {
  seenSet.add(jobId);
  const maxHistory = 3000; // Mantener un historial razonable de los últimos 3000 empleos
  const array = Array.from(seenSet).slice(-maxHistory);
  fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify(array, null, 2));
}

// Enviar notificación a Telegram
async function sendTelegramMessage(botToken, chatId, messageHtml) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(`[Telegram Error] ${data.description}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Telegram Network Error]`, err.message);
    return false;
  }
}

// Limpiar texto HTML básico
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Extraer empleos de HTML devuelto por la API pública de invitados de LinkedIn
function parseJobsFromHtml(html) {
  const jobs = [];
  
  // Dividir por bloques de elementos <li> de la lista de empleos
  const items = html.split(/<li[^>]*>/i);

  for (let i = 1; i < items.length; i++) {
    const block = items[i];

    // Extraer ID único del empleo
    let jobId = null;
    const urnMatch = block.match(/data-entity-urn=["']urn:li:jobPosting:(\d+)["']/i);
    if (urnMatch) {
      jobId = urnMatch[1];
    }

    // Extraer enlace del empleo
    let jobUrl = null;
    const urlMatch = block.match(/<a[^>]*class=["'][^"']*base-card__full-link[^"']*["'][^>]*href=["']([^"']+)["']/i)
      || block.match(/<a[^>]*href=["'](https:\/\/[\w.]*linkedin\.com\/jobs\/view\/[^"']+)["']/i);
    
    if (urlMatch) {
      jobUrl = urlMatch[1].split('?')[0]; // Limpiar parámetros de tracking
    }

    if (!jobId && jobUrl) {
      const idInUrl = jobUrl.match(/\/view\/(?:.*-)?(\d+)/);
      if (idInUrl) jobId = idInUrl[1];
      else jobId = jobUrl;
    }

    // Extraer título
    let title = null;
    const titleMatch = block.match(/<h3[^>]*class=["'][^"']*base-search-card__title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i);
    if (titleMatch) {
      title = cleanText(titleMatch[1]);
    }

    // Extraer empresa
    let company = null;
    const companyMatch = block.match(/<h4[^>]*class=["'][^"']*base-search-card__subtitle[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i);
    if (companyMatch) {
      company = cleanText(companyMatch[1]);
    }

    // Extraer ubicación
    let location = null;
    const locMatch = block.match(/<span[^>]*class=["'][^"']*job-search-card__location[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    if (locMatch) {
      location = cleanText(locMatch[1]);
    }

    // Extraer fecha
    let postedTime = 'Reciente';
    const timeMatch = block.match(/<time[^>]*class=["'][^"']*job-search-card__listdate[^"']*["'][^>]*>([\s\S]*?)<\/time>/i);
    if (timeMatch) {
      postedTime = cleanText(timeMatch[1]);
    }

    if (jobId && title && jobUrl) {
      jobs.push({
        id: jobId,
        title,
        company: company || 'Empresa no especificada',
        location: location || 'No especificada',
        postedTime,
        url: jobUrl
      });
    }
  }

  return jobs;
}

// Consultar LinkedIn Jobs
async function fetchLinkedInJobs(keyword, location, timeFilter = 'r86400', start = 0) {
  const encodedKeywords = encodeURIComponent(keyword);
  const encodedLocation = encodeURIComponent(location);
  const endpoint = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedKeywords}&location=${encodedLocation}&f_TPR=${timeFilter}&start=${start}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  };

  try {
    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      console.warn(`[LinkedIn Warning] HTTP ${res.status} al buscar "${keyword}" en "${location}"`);
      return [];
    }
    const html = await res.text();
    return parseJobsFromHtml(html);
  } catch (err) {
    console.error(`[LinkedIn Error] Error al consultar "${keyword}":`, err.message);
    return [];
  }
}

// Pequeña pausa para no saturar los servidores
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ciclo de búsqueda principal
async function runJobSearch() {
  const config = loadConfig();
  const seenJobs = loadSeenJobs();

  const botToken = config.telegram.bot_token;
  const chatId = config.telegram.chat_id;

  if (!botToken || botToken.includes('TU_BOT_TOKEN') || !chatId || chatId.includes('TU_CHAT_ID')) {
    console.log(`⚠️ Por favor configura tu 'bot_token' y 'chat_id' en 'config.json' antes de continuar.`);
    return;
  }

  const { keywords, locations, time_filter } = config.search;
  console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Iniciando escaneo de vacantes en LinkedIn...`);

  let newJobsCount = 0;

  for (const keyword of keywords) {
    for (const location of locations) {
      console.log(` -> Buscando: "${keyword}" en "${location}"...`);
      const jobs = await fetchLinkedInJobs(keyword, location, time_filter, 0);

      for (const job of jobs) {
        if (!seenJobs.has(job.id)) {
          newJobsCount++;
          saveSeenJob(seenJobs, job.id);

          const messageHtml = [
            `🚀 <b>NUEVA VACANTE DE EMPLEO DETECTADA</b>`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `💼 <b>Puesto:</b> ${job.title}`,
            `🏢 <b>Empresa:</b> ${job.company}`,
            `📍 <b>Ubicación:</b> ${job.location}`,
            `⏱️ <b>Publicado:</b> ${job.postedTime}`,
            `🎯 <b>Búsqueda:</b> ${keyword}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `👉 <a href="${job.url}">Haz clic aquí para ver y postularte en LinkedIn</a>`
          ].join('\n');

          console.log(`   ✨ ¡Nueva propuesta!: ${job.title} en ${job.company}`);
          await sendTelegramMessage(botToken, chatId, messageHtml);

          // Pausa breve entre mensajes de Telegram para respetar límites de la API
          await sleep(1500);
        }
      }

      // Pausa prudente entre búsquedas de LinkedIn
      await sleep(2500);
    }
  }

  console.log(`✅ [${new Date().toLocaleTimeString()}] Escaneo completado. Vacantes nuevas enviadas: ${newJobsCount}`);
}

// Modo de ejecución
async function main() {
  const config = loadConfig();
  const intervalMinutes = config.search.check_interval_minutes || 30;

  console.log('====================================================');
  console.log('🤖 LinkedIn Job Alert Bot para Telegram');
  console.log(`⏰ Intervalo de revisión: cada ${intervalMinutes} minutos`);
  console.log('====================================================');

  // Ejecución inmediata
  await runJobSearch();

  // Programar repetición periódica
  setInterval(async () => {
    try {
      await runJobSearch();
    } catch (err) {
      console.error('Error durante la ejecución periódica:', err);
    }
  }, intervalMinutes * 60 * 1000);
}

main().catch(console.error);
