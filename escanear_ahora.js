/**
 * Escaneo Matutino / Inmediato de Vacantes de Hoy
 * Realiza una única pasada por LinkedIn (últimas 24 horas) y envía todas las vacantes nuevas a Telegram.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const DATA_DIR = path.join(__dirname, 'data');
const SEEN_JOBS_FILE = path.join(DATA_DIR, 'seen_jobs.json');

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function loadSeenJobs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SEEN_JOBS_FILE)) {
    fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify([]));
    return new Set();
  }
  try {
    return new Set(JSON.parse(fs.readFileSync(SEEN_JOBS_FILE, 'utf-8')));
  } catch (e) {
    return new Set();
  }
}

function saveSeenJob(seenSet, jobId) {
  seenSet.add(jobId);
  const array = Array.from(seenSet).slice(-3000);
  fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify(array, null, 2));
}

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
    return (await res.json()).ok;
  } catch (err) {
    return false;
  }
}

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

function parseJobsFromHtml(html) {
  const jobs = [];
  const items = html.split(/<li[^>]*>/i);

  for (let i = 1; i < items.length; i++) {
    const block = items[i];

    let jobId = null;
    const urnMatch = block.match(/data-entity-urn=["']urn:li:jobPosting:(\d+)["']/i);
    if (urnMatch) jobId = urnMatch[1];

    let jobUrl = null;
    const urlMatch = block.match(/<a[^>]*class=["'][^"']*base-card__full-link[^"']*["'][^>]*href=["']([^"']+)["']/i)
      || block.match(/<a[^>]*href=["'](https:\/\/[\w.]*linkedin\.com\/jobs\/view\/[^"']+)["']/i);
    
    if (urlMatch) jobUrl = urlMatch[1].split('?')[0];

    if (!jobId && jobUrl) {
      const idInUrl = jobUrl.match(/\/view\/(?:.*-)?(\d+)/);
      if (idInUrl) jobId = idInUrl[1];
      else jobId = jobUrl;
    }

    const titleMatch = block.match(/<h3[^>]*class=["'][^"']*base-search-card__title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i);
    const title = titleMatch ? cleanText(titleMatch[1]) : null;

    const companyMatch = block.match(/<h4[^>]*class=["'][^"']*base-search-card__subtitle[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i);
    const company = companyMatch ? cleanText(companyMatch[1]) : 'Empresa no especificada';

    const locMatch = block.match(/<span[^>]*class=["'][^"']*job-search-card__location[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const location = locMatch ? cleanText(locMatch[1]) : 'No especificada';

    const timeMatch = block.match(/<time[^>]*class=["'][^"']*job-search-card__listdate[^"']*["'][^>]*>([\s\S]*?)<\/time>/i);
    const postedTime = timeMatch ? cleanText(timeMatch[1]) : 'Reciente';

    if (jobId && title && jobUrl) {
      jobs.push({ id: jobId, title, company, location, postedTime, url: jobUrl });
    }
  }
  return jobs;
}

async function fetchLinkedInJobs(keyword, location, timeFilter = 'r86400') {
  const endpoint = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_TPR=${timeFilter}&start=0`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
  };
  try {
    const res = await fetch(endpoint, { headers });
    if (!res.ok) return [];
    const html = await res.text();
    return parseJobsFromHtml(html);
  } catch (err) {
    return [];
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const config = loadConfig();
  const seenJobs = loadSeenJobs();

  const botToken = config.telegram.bot_token;
  const chatId = config.telegram.chat_id;
  const { keywords, locations, time_filter } = config.search;

  console.log('========================================================');
  console.log('☀️  INICIANDO ESCANEO DE VACANTES DE HOY EN LINKEDIN');
  console.log('========================================================');

  // Enviar mensaje de apertura a Telegram
  const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  await sendTelegramMessage(botToken, chatId, `☕ <b>¡Buenos días Edwin!</b>\n📅 <i>${todayStr}</i>\n\nIniciando búsqueda de vacantes de sistemas en LinkedIn publicadas en las últimas 24 horas...`);

  let newJobsCount = 0;

  for (const keyword of keywords) {
    for (const location of locations) {
      console.log(`🔎 Buscando: "${keyword}" en "${location}"...`);
      const jobs = await fetchLinkedInJobs(keyword, location, time_filter || 'r86400');

      for (const job of jobs) {
        if (!seenJobs.has(job.id)) {
          newJobsCount++;
          saveSeenJob(seenJobs, job.id);

          const messageHtml = [
            `💼 <b>${job.title}</b>`,
            `🏢 <b>Empresa:</b> ${job.company}`,
            `📍 <b>Ubicación:</b> ${job.location}`,
            `⏱️ <b>Publicado:</b> ${job.postedTime}`,
            `🎯 <b>Categoría:</b> ${keyword}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `👉 <a href="${job.url}">Postularme ahora en LinkedIn</a>`
          ].join('\n');

          console.log(`   ✨ Enviando oferta: ${job.title} (${job.company})`);
          await sendTelegramMessage(botToken, chatId, messageHtml);
          await sleep(1500);
        }
      }
      await sleep(2000);
    }
  }

  const finalMsg = newJobsCount > 0
    ? `✅ <b>Escaneo completado con éxito.</b>\nSe encontraron y enviaron <b>${newJobsCount}</b> nuevas vacantes para postularte hoy. ¡Mucho éxito en tus postulaciones! 🎯`
    : `✅ <b>Escaneo completado.</b>\nNo hay vacantes nuevas adicionales en este momento (las anteriores ya te fueron enviadas). Se revisará nuevamente más tarde. 👍`;

  await sendTelegramMessage(botToken, chatId, finalMsg);
  console.log(`\n${finalMsg.replace(/<[^>]*>/g, '')}`);
  console.log('========================================================');
}

main().catch(console.error);
