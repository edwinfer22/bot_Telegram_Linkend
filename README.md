# 🤖 LinkedIn Job Alert Bot para Telegram

Un sistema automatizado y ligero diseñado para rastrear vacantes de empleo de **Sistemas, Software y Tecnología en LinkedIn** y enviártelas de inmediato a tu **Telegram** (tanto en tu celular como en tu PC) con enlace directo para postularte antes que nadie.

---

## ⚡ Características Principales

- **Sin baneos ni login requerido:** Utiliza los endpoints públicos de invitados de LinkedIn, protegiendo al 100% tu cuenta personal.
- **Sin duplicados:** Registra automáticamente los IDs de las vacantes ya enviadas en `data/seen_jobs.json` para que nunca recibas ofertas repetidas.
- **Formato enriquecido:** Te envía puesto, empresa, ubicación, antigüedad de la vacante y el botón de postulación directa.
- **Doble motor disponible:** Puedes ejecutarlo indistintamente con **Node.js** (`bot.js`) o con **Python** (`bot.py`), sin necesidad de instalar librerías pesadas.
- **Filtros personalizables:** Ajusta palabras clave (Python, React, Fullstack, DevOps, etc.) y ubicaciones (Remoto, Colombia, etc.).

---

## 🚀 Guía Rápida de Configuración (3 Minutos)

### Paso 1: Crear tu Bot de Telegram
1. Abre tu aplicación de **Telegram** en el celular o PC.
2. Busca al usuario oficial **[@BotFather](https://t.me/BotFather)** (tiene una insignia azul de verificación).
3. Escribe o selecciona `/start` y luego envía `/newbot`.
4. Elige un nombre para tu bot (por ejemplo: `Mis Empleos Bot`).
5. Elige un nombre de usuario que termine en `bot` (por ejemplo: `edwin_empleos_bot`).
6. BotFather te responderá con tu **Token de la API** (se ve algo como: `7182938491:AAHdxx...`). Cópialo.

### Paso 2: Obtener tu Chat ID de Telegram
1. En Telegram, busca el bot **[@userinfobot](https://t.me/userinfobot)** o **[@myidbot](https://t.me/myidbot)**.
2. Dale a `/start`.
3. Te devolverá un número llamado `Id` (por ejemplo: `123456789`). Cópialo.
4. **IMPORTANTE:** Entra a la conversación de tu **propio bot** que creaste en el Paso 1 y dale clic al botón **"INICIAR"** (o envía `/start`). Si no haces esto, Telegram no le permitirá a tu bot enviarte mensajes primero.

### Paso 3: Configurar el archivo `config.json`
Abre el archivo `config.json` y reemplaza los valores de ejemplo con tus datos:

```json
{
  "telegram": {
    "bot_token": "TU_TOKEN_DE_BOTFATHER_AQUI",
    "chat_id": "TU_CHAT_ID_NUMERICO_AQUI"
  },
  "search": {
    "keywords": [
      "Desarrollador de Software",
      "Ingeniero de Sistemas",
      "Backend Developer",
      "Frontend Developer",
      "Full Stack Developer",
      "Python Developer"
    ],
    "locations": [
      "Colombia",
      "Remote"
    ],
    "time_filter": "r86400",
    "check_interval_minutes": 30
  }
}
```

---

## 💻 Formas de Ejecución

### Opción A (La más fácil): Usar el lanzador
Haz doble clic sobre el archivo:
```text
iniciar_bot.bat
```
Te abrirá un menú para:
1. Probar tu conexión con Telegram.
2. Iniciar el bot en Node.js.
3. Iniciar el bot en Python.

### Opción B: Por línea de comandos

**Para probar tu bot primero:**
```bash
node test_telegram.js
```

**Para iniciar el rastreador continuo:**
```bash
# Con Node.js:
node bot.js

# O con Python:
python bot.py
```

---

## 🕒 Ejecución automática en segundo plano (Windows)

Si deseas que el programa se ejecute automáticamente sin tener una ventana abierta:
1. Presiona `Windows + R`, escribe `taskschd.msc` y presiona Enter para abrir el **Programador de Tareas**.
2. Haz clic en **Crear tarea básica...**.
3. Ponle de nombre: `LinkedIn Job Bot`.
4. En desencadenador selecciona **Al iniciar la sesión** o **Diariamente**.
5. En acción selecciona **Iniciar un programa**:
   - Programa: `node.exe` (o `python.exe`)
   - Argumentos: `bot.js` (o `bot.py`)
   - Iniciar en (directorio): La ruta completa donde está el bot.
6. ¡Listo! Recibirás ofertas directo en tu bolsillo sin preocuparte por abrir programas.
