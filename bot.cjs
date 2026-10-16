/**
 * LinkedIn Job Alert Bot para Telegram
 * Calibrado para Edwin Aldana: Desarrollador Junior / QA / Soporte L2-L3 / Sistemas
 * Ubicaciones: Bogotá y Remoto
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const DATA_DIR = path.join(__dirname, 'data');
const SEEN_JOBS_FILE = path.join(DATA_DIR, 'seen_jobs.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`[ERROR] No se encontró el archivo de configuración en: ${CONFIG_PATH}`);
    process.exit(1);
  }
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

function isJobExcluded(title, excludeList) {
  if (!excludeList || !Array.isArray(excludeList)) return false;
  const lower = title.toLowerCase();
  for (const word of excludeList) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\W)${escaped.toLowerCase()}(\\W|$)`, 'i');
    if (regex.test(lower)) return true;
  }
  return false;
}

function parseJobsFromHtml(html, excludeList) {
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

    if (!title || isJobExcluded(title, excludeList)) {
      continue;
    }

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

async function fetchLinkedInJobs(keyword, location, timeFilter, excludeList) {
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
    return parseJobsFromHtml(html, excludeList);
  } catch (err) {
    return [];
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runJobSearch() {
  const config = loadConfig();
  const seenJobs = loadSeenJobs();

  const botToken = config.telegram.bot_token;
  const chatId = config.telegram.chat_id;

  const { keywords, exclude_keywords, locations, time_filter } = config.search;
  console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Buscando ofertas Junior / Soporte / QA en Bogotá y Remoto...`);

  let newJobsCount = 0;

  for (const keyword of keywords) {
    for (const location of locations) {
      console.log(` -> Buscando: "${keyword}" en "${location}"...`);
      const jobs = await fetchLinkedInJobs(keyword, location, time_filter, exclude_keywords);

      for (const job of jobs) {
        if (!seenJobs.has(job.id)) {
          newJobsCount++;
          saveSeenJob(seenJobs, job.id);

          const messageHtml = [
            `🚀 <b>NUEVA VACANTE AFÍN A TU PERFIL</b>`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `💼 <b>Puesto:</b> ${job.title}`,
            `🏢 <b>Empresa:</b> ${job.company}`,
            `📍 <b>Ubicación:</b> ${job.location}`,
            `⏱️ <b>Publicado:</b> ${job.postedTime}`,
            `🎯 <b>Afinidad:</b> ${keyword}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `👉 <a href="${job.url}">Ver y postularme en LinkedIn</a>`
          ].join('\n');

          console.log(`   ✨ ¡Nueva propuesta!: ${job.title} en ${job.company}`);
          await sendTelegramMessage(botToken, chatId, messageHtml);
          await sleep(600);
        }
      }
      await sleep(1000);
    }
  }

  console.log(`✅ [${new Date().toLocaleTimeString()}] Escaneo completado. Vacantes afines enviadas: ${newJobsCount}`);
}

async function main() {
  const config = loadConfig();
  const intervalMinutes = config.search.check_interval_minutes || 30;

  console.log('====================================================');
  console.log('🤖 LinkedIn Job Alert Bot - Edwin Aldana (Junior/Sistemas)');
  console.log(`⏰ Intervalo de revisión: cada ${intervalMinutes} minutos`);
  console.log('====================================================');

  await runJobSearch();

  setInterval(async () => {
    try {
      await runJobSearch();
    } catch (err) {
      console.error('Error durante la ejecución:', err);
    }
  }, intervalMinutes * 60 * 1000);
}

main().catch(console.error);
