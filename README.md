# 🤖 LinkedIn Job Alert Bot para Telegram

Sistema automatizado de búsqueda y notificación de vacantes de empleo de **Sistemas, Software, QA Testing y Soporte TI en LinkedIn**, con alertas instantáneas enviadas a **Telegram** y ejecución programada **100% en la Nube mediante GitHub Actions**.

---

## 🌟 Características Principales

* **☁️ Ejecución 24/7 en la Nube (Gratis):** Corre en los servidores de GitHub Actions todos los días a las **10:00 AM (hora Colombia)**. No necesitas tener tu computador encendido ni aplicaciones abiertas.
* **🎯 Filtro Inteligente de Perfil (Junior / Sistemas / QA):** Calibrado para posiciones afines a tu hoja de vida:
  * *Desarrollo:* Desarrollador Junior, Full Stack, Python.
  * *Calidad:* QA Tester, Analista QA.
  * *Infraestructura y Soporte:* Ingeniero de Soporte L2/L3, Analista de Sistemas.
* **🛡️ Filtro Anti-Senior y Anti-Spam:** Descarta automáticamente puestos con palabras como `Senior`, `Sr`, `Lead`, `Principal`, `Gerente`, `Director` o `Architect`.
* **🗣️ Adaptado a Nivel de Inglés Medio:** Enfocado en vacantes de Bogotá y Remoto (Colombia / Latam) donde el inglés medio (B1/B2) o español es suficiente, filtrando exigencias estrictas de inglés nativo o C1/C2.
* **⚡ Sin Duplicados:** Registra el identificador único de cada vacante en un historial para garantizar que **nunca recibas la misma oferta dos veces**.
* **🔒 Seguro y sin baneos:** Consulta los endpoints públicos de LinkedIn, por lo que **no requiere contraseña ni inicio de sesión en LinkedIn**, protegiendo tu cuenta personal.

---

## 📁 Estructura del Proyecto

```text
linkedin-job-bot/
├── .github/
│   └── workflows/
│       └── alerta_empleos.yml     # Flujo automático en la nube (10:00 AM)
├── data/
│   └── seen_jobs.json             # Historial de ofertas ya enviadas (antiduplicados)
├── config.json                    # Configuración de credenciales, roles y filtros
├── escanear_ahora.cjs             # Script de escaneo único (vacantes últimas 24h)
├── bot.cjs                        # Script de monitor continuo (revisión cada 30 min)
├── bot.py                         # Motor alternativo en Python nativo
├── test_telegram.cjs              # Script de prueba de conexión a Telegram
├── escanear_ahora.bat             # Lanzador rápido en Windows (1 clic)
├── programar_a_las_10am.bat       # Programador de tarea automática en Windows
├── iniciar_bot.bat                # Menú interactivo para Windows
└── README.md                      # Documentación completa del proyecto
```

---

## 🚀 Guía de Configuración Paso a Paso

### 1. Crear tu Bot en Telegram
1. Abre Telegram y busca al bot oficial **[@BotFather](https://t.me/BotFather)**.
2. Envía `/start` y luego el comando `/newbot`.
3. Escribe un nombre para tu bot (ejemplo: `Mi Job Alert Bot`).
4. Escribe un nombre de usuario terminado en `bot` (ejemplo: `mi_joblink_bot`).
5. BotFather te responderá con tu **API Token** (ejemplo: `8688726643:AAFCs34s...`). Guárdalo.

### 2. Obtener tu Chat ID Personal
1. En Telegram busca a **[@userinfobot](https://t.me/userinfobot)** y envíale `/start`.
2. Te responderá con tu información; copia el número que aparece en **`Id:`** (ejemplo: `8523938998`).
3. **Paso fundamental:** Abre la conversación con **tu propio bot recién creado** y dale clic al botón **"INICIAR"** (o envíale `/start`). Esto es obligatorio para que Telegram le permita enviarte mensajes a tu cuenta.

### 3. Configurar el archivo `config.json`
Edita el archivo `config.json` con tus datos y preferencias:

```json
{
  "telegram": {
    "bot_token": "TU_BOT_TOKEN_DE_TELEGRAM",
    "chat_id": "TU_CHAT_ID_NUMERICO"
  },
  "search": {
    "keywords": [
      "Desarrollador Junior",
      "Junior Developer",
      "Desarrollador Python",
      "Desarrollador Full Stack",
      "QA Tester",
      "Analista QA",
      "Ingeniero de Soporte",
      "Analista de Sistemas"
    ],
    "exclude_keywords": [
      "Senior",
      "Sr",
      "Lead",
      "Principal",
      "Gerente",
      "Director",
      "Architect",
      "Tech Lead",
      "Inglés Avanzado",
      "Advanced English",
      "Fluent English",
      "C1",
      "C2",
      "100% Bilingüe"
    ],
    "locations": [
      "Bogota, Colombia",
      "Colombia",
      "Latin America"
    ],
    "time_filter": "r86400",
    "check_interval_minutes": 30,
    "max_results_per_query": 20
  }
}
```

---

## ☁️ Automatización en la Nube con GitHub Actions

El proyecto incluye el archivo `.github/workflows/alerta_empleos.yml` que corre en la nube de GitHub sin requerir servidores propios ni pagos:

* **Horarios automáticos programados:**
  * **10:00 AM (Hora Colombia / 15:00 UTC):** Momento de mayor publicación de vacantes en LinkedIn.
  * **3:00 PM (Hora Colombia / 20:00 UTC):** Revisión de la tarde (Lunes a Viernes).

### ¿Cómo disparar un escaneo manual en la nube desde el celular o PC?
1. Ingresa a tu repositorio en GitHub.
2. Ve a la pestaña **Actions**.
3. Selecciona el flujo **`LinkedIn Job Alert Bot`**.
4. Haz clic en **`Run workflow`** -> **`Run workflow`**.
5. En 30 segundos te llegará el resumen directo a tu Telegram.

---

## 💻 Ejecución Local en tu Computador

Si deseas probar o ejecutar el programa desde tu equipo físico:

### Forma 1: Mediante archivos ejecutables (.bat)
* **`escanear_ahora.bat`**: Realiza un escaneo inmediato de las ofertas de hoy y te las manda a Telegram.
* **`iniciar_bot.bat`**: Abre un menú con todas las opciones (probar conexión, modo continuo, Python, editar configuración).
* **`programar_a_las_10am.bat`**: Configura el Programador de Tareas de Windows para que corra localmente a las 10:00 AM.

### Forma 2: Por consola o terminal
```powershell
# Entrar a la carpeta del proyecto
cd "C:\Users\edwin\.gemini\antigravity-ide\scratch\linkedin-job-bot"

# Probar la conexión con Telegram
node test_telegram.cjs

# Escanear las ofertas de hoy una sola vez
node escanear_ahora.cjs

# Dejar el bot vigilando continuamente (revisa cada 30 minutos)
node bot.cjs
```

---

## ⚙️ Parámetros de Personalización

| Parámetro | Descripción |
| :--- | :--- |
| `keywords` | Lista de cargos y tecnologías a rastrear en LinkedIn. |
| `exclude_keywords` | Palabras para descartar ofertas (ej. Senior, C1, etc.). |
| `locations` | Ciudades o regiones objetivo de búsqueda. |
| `time_filter` | Filtro de tiempo: `r86400` (últimas 24h), `r604800` (última semana). |
| `check_interval_minutes` | Frecuencia de revisión para el modo continuo local. |

---

## 📄 Licencia y Privacidad
Este proyecto es de uso personal y educativo. Se recomienda mantener el repositorio en modo **Privado** en GitHub para proteger las credenciales y tokens personales.
