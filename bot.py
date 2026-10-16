#!/usr/bin/env python3
"""
LinkedIn Job Alert Bot para Telegram (Versión Python)
Busca automáticamente ofertas de empleo en LinkedIn y envía notificaciones instantáneas a Telegram.
Funciona únicamente con librerías estándar de Python (sin necesidad de pip install obligatorios).
"""

import os
import sys
import json
import time
import re
import urllib.request
import urllib.parse
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')
DATA_DIR = os.path.join(BASE_DIR, 'data')
SEEN_JOBS_FILE = os.path.join(DATA_DIR, 'seen_jobs.json')


def load_config():
    if not os.path.exists(CONFIG_FILE):
        print(f"[ERROR] No se encontró config.json en {CONFIG_FILE}")
        sys.exit(1)
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_seen_jobs():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(SEEN_JOBS_FILE):
        with open(SEEN_JOBS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        return set()
    try:
        with open(SEEN_JOBS_FILE, 'r', encoding='utf-8') as f:
            return set(json.load(f))
    except Exception:
        return set()


def save_seen_job(seen_set, job_id):
    seen_set.add(job_id)
    history = list(seen_set)[-3000:]
    with open(SEEN_JOBS_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=2)


def send_telegram_message(bot_token, chat_id, message_html):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message_html,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            return res_body.get("ok", False)
    except Exception as e:
        print(f"[Telegram Error] {e}")
        return False


def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'<[^>]*>', '', text)
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
    return re.sub(r'\s+', ' ', text).strip()


def parse_jobs_html(html_text):
    jobs = []
    items = re.split(r'<li[^>]*>', html_text, flags=re.IGNORECASE)

    for block in items[1:]:
        job_id = None
        urn_match = re.search(r'data-entity-urn=["\']urn:li:jobPosting:(\d+)["\']', block, re.IGNORECASE)
        if urn_match:
            job_id = urn_match.group(1)

        url_match = re.search(r'<a[^>]*class=["\'][^"\']*base-card__full-link[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', block, re.IGNORECASE)
        if not url_match:
            url_match = re.search(r'<a[^>]*href=["\'](https://[\w.]*linkedin\.com/jobs/view/[^"\']+)["\']', block, re.IGNORECASE)

        job_url = url_match.group(1).split('?')[0] if url_match else None

        if not job_id and job_url:
            id_in_url = re.search(r'/view/(?:.*-)?(\d+)', job_url)
            if id_in_url:
                job_id = id_in_url.group(1)
            else:
                job_id = job_url

        title_match = re.search(r'<h3[^>]*class=["\'][^"\']*base-search-card__title[^"\']*["\'][^>]*>([\s\S]*?)</h3>', block, re.IGNORECASE)
        title = clean_text(title_match.group(1)) if title_match else None

        company_match = re.search(r'<h4[^>]*class=["\'][^"\']*base-search-card__subtitle[^"\']*["\'][^>]*>([\s\S]*?)</h4>', block, re.IGNORECASE)
        company = clean_text(company_match.group(1)) if company_match else "Empresa no especificada"

        loc_match = re.search(r'<span[^>]*class=["\'][^"\']*job-search-card__location[^"\']*["\'][^>]*>([\s\S]*?)</span>', block, re.IGNORECASE)
        location = clean_text(loc_match.group(1)) if loc_match else "No especificada"

        time_match = re.search(r'<time[^>]*class=["\'][^"\']*job-search-card__listdate[^"\']*["\'][^>]*>([\s\S]*?)</time>', block, re.IGNORECASE)
        posted_time = clean_text(time_match.group(1)) if time_match else "Reciente"

        if job_id and title and job_url:
            jobs.append({
                "id": job_id,
                "title": title,
                "company": company,
                "location": location,
                "posted_time": posted_time,
                "url": job_url
            })

    return jobs


def fetch_linkedin_jobs(keyword, location, time_filter="r86400", start=0):
    params = urllib.parse.urlencode({
        "keywords": keyword,
        "location": location,
        "f_TPR": time_filter,
        "start": start
    })
    url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?{params}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"'
    }

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            return parse_jobs_html(html)
    except Exception as e:
        print(f"[LinkedIn Error] {keyword} ({location}): {e}")
        return []


def run_job_search():
    config = load_config()
    seen_jobs = load_seen_jobs()

    bot_token = config.get("telegram", {}).get("bot_token", "")
    chat_id = config.get("telegram", {}).get("chat_id", "")

    if "TU_BOT_TOKEN" in bot_token or "TU_CHAT_ID" in chat_id:
        print("⚠️ Por favor configura tu 'bot_token' y 'chat_id' en 'config.json'.")
        return

    search_cfg = config.get("search", {})
    keywords = search_cfg.get("keywords", [])
    locations = search_cfg.get("locations", ["Colombia"])
    time_filter = search_cfg.get("time_filter", "r86400")

    now_str = datetime.now().strftime("%H:%M:%S")
    print(f"\n🔍 [{now_str}] Buscando vacantes de sistemas en LinkedIn...")

    new_count = 0
    for keyword in keywords:
        for location in locations:
            print(f" -> Buscando: '{keyword}' en '{location}'...")
            jobs = fetch_linkedin_jobs(keyword, location, time_filter)

            for job in jobs:
                if job["id"] not in seen_jobs:
                    new_count += 1
                    save_seen_job(seen_jobs, job["id"])

                    msg = (
                        f"🚀 <b>NUEVA VACANTE DE EMPLEO DETECTADA</b>\n"
                        f"━━━━━━━━━━━━━━━━━━━━\n"
                        f"💼 <b>Puesto:</b> {job['title']}\n"
                        f"🏢 <b>Empresa:</b> {job['company']}\n"
                        f"📍 <b>Ubicación:</b> {job['location']}\n"
                        f"⏱️ <b>Publicado:</b> {job['posted_time']}\n"
                        f"🎯 <b>Criterio:</b> {keyword}\n"
                        f"━━━━━━━━━━━━━━━━━━━━\n"
                        f"👉 <a href='{job['url']}'>Haz clic aquí para ver y postularte en LinkedIn</a>"
                    )

                    print(f"   ✨ ¡Nueva oferta!: {job['title']} en {job['company']}")
                    send_telegram_message(bot_token, chat_id, msg)
                    time.sleep(1.5)

            time.sleep(2.5)

    now_str = datetime.now().strftime("%H:%M:%S")
    print(f"✅ [{now_str}] Escaneo terminado. Vacantes nuevas enviadas: {new_count}")


def main():
    config = load_config()
    interval_min = config.get("search", {}).get("check_interval_minutes", 30)

    print("=" * 52)
    print("🤖 LinkedIn Job Alert Bot para Telegram (Python)")
    print(f"⏰ Frecuencia de escaneo: cada {interval_min} minutos")
    print("=" * 52)

    while True:
        try:
            run_job_search()
        except Exception as e:
            print(f"[Error no controlado]: {e}")

        print(f"\n💤 Esperando {interval_min} minutos hasta la próxima revisión...\n")
        time.sleep(interval_min * 60)


if __name__ == "__main__":
    main()
