---
title: Getting Started
description: Get up and running with Core in minutes
---

# Getting Started

Welcome to Core! This guide will get you from zero to a running Discord bot in just a few minutes. Let's dive in.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** installed on your system ([download](https://nodejs.org))
- **A Discord Bot Token** — Create one in the [Discord Developer Portal](https://discord.com/developers/applications)
- **Git** installed (optional, for cloning)

## Installation

### Option 1: Clone the Repository

```bash
git clone https://github.com/RIKTIGATOMTEN/CoreBot.git my-bot
cd my-bot
npm install
```

### Option 2: Use as a Template

Visit the [GitHub repository](https://github.com/RIKTIGATOMTEN/CoreBot) and click "Use this template" to create your own copy.

## Project Structure

After installation, your project structure looks like this:

```
my-bot/
├── addons/              # Your bot addons go here
│   └── YourAddon/
│       ├── addon.info   # Addon metadata
│       ├── main.js      # Addon logic
│       └── extensions/  # Optional nested extensions
├── config/
│   ├── .env             # Bot token and settings
│   └── database.yaml    # Database configuration
├── core/                # The Core framework (don't modify)
├── database/            # SQLite database files (auto-created)
├── cache/               # Addon cache files (auto-created)
└── index.ts             # Main entry point
```

::: tip Don't Modify Core
The `core/` directory contains the framework itself. Keep your code in `addons/` to make updates easier.
:::

## Configuration

### Step 1: Environment Variables

Copy the example environment file:

```bash
cp config/.env.example config/.env
```

Now edit `config/.env` with your settings:

```bash
#-------------------
# Core Configuration
#-------------------
# Debug mode - outputs detailed logs for troubleshooting
DEBUG=false

# Load addons - set to true to enable the addon system
ADDONS=true

#-------------------
# Discord Configuration
#-------------------
# Bot Token - get this from the Discord Developer Portal
TOKEN=your_bot_token_here

# Client ID - your bot's Application ID
CLIENT_ID=your_client_id_here

# Command Registration Scope
# "guild" - Fast updates, good for development
# "global" - Up to 1 hour to propagate, for production
REGISTRATION_SCOPE=guild

# Clear and re-register all commands on startup
CLEAR_COMMANDS=false

# Guild ID - required when REGISTRATION_SCOPE=guild
GUILD_ID=your_guild_id_here

#-------------------
# Locale Settings
#-------------------
# Language tag (e.g., en-US, sv-SE, de-DE)
LOCALE=en-US

# Timezone (e.g., Europe/Stockholm, America/New_York)
TIMEZONE=Europe/Stockholm

# Time format - 12h or 24h
TIME_FORMAT=24h
```

### Getting Your Discord Credentials

::: details How to get your Bot Token
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. Navigate to the **"Bot"** section in the sidebar
4. Click **"Reset Token"** to generate a new token
5. Copy the token — you'll only see it once!
6. Paste it into your `.env` file as `TOKEN=your_token_here`
:::

::: details How to get your Client ID
1. In the Developer Portal, go to your application
2. In the **"General Information"** section
3. Copy the **"Application ID"** — this is your Client ID
:::

::: details How to get your Guild ID
1. Open Discord and go to **User Settings → Advanced**
2. Enable **"Developer Mode"**
3. Right-click on your server icon in the sidebar
4. Click **"Copy Server ID"**
:::

### Step 2: Enable Gateway Intents

Some features require privileged intents. In the Discord Developer Portal:

1. Go to your application → **Bot** section
2. Scroll down to **"Privileged Gateway Intents"**
3. Enable the intents your addons need:
   - **Message Content Intent** — for reading message contents
   - **Server Members Intent** — for member events
   - **Presence Intent** — for presence updates

::: warning
Only enable the intents you actually need. Discord limits bots with over 100 servers that use privileged intents.
:::

### Step 3: Database Configuration (Optional)

The `config/database.yaml` file comes with sensible defaults. You usually don't need to change it:

```yaml
database:
  path: ./database/           # Where SQLite files are stored
  name: bot.db               # Database filename
  journal_mode: wal          # Write-Ahead Logging (recommended)
  synchronous: normal        # Balance of safety and speed
  debug: false               # Set to true for query debugging
  foreign_keys: true         # Enable foreign key constraints
  cache_size: -2000          # 2MB cache (negative = KB)
  temp_store: memory         # Use memory for temp operations
```

::: info Database is Optional
If your addons don't use the database, you can ignore this file entirely. Core only initializes the database when addons actually use it.
:::

## Running Your Bot

### Development Mode

Start the bot in development mode with hot-reloading:

```bash
npm run dev
```

### Production Mode

Build and run for production:

```bash
npm run build
npm start
```

If everything is configured correctly, you'll see:

```
23:31:48:[info] Starting RiktigaTomten's Core...
23:31:48:[info] Setting up Discord bot...
23:31:48:[info] Initializing interaction registry...
23:31:48:[info] 🔐 Connecting to Discord...
23:31:49:[success] Bot fully loaded and ready in 802ms
23:31:49:[success] Test Dev#6002 is now online and ready!
23:31:49:[info] Connected to Discord as: Test Dev#6002
23:31:49:[info] Serving 1 server(s) with 1 users

  ______  ____  __  __  ______  ______ _   __
 /_  __/ / __ \/  |/  //_  __/ / ____// | / /
  / /   / / / / /|_/ /  / /   / __/  /  |/ / 
 / /   / /_/ / /  / /  / /   / /___ / /|  /  
/_/    \____/_/  /_/  /_/   /_____//_/ |_/   

RiktigaTomten's Core
───────────────────────────────────────────────────────────
Core successfully initialized
───────────────────────────────────────────────────────────
🔗 Check me out on GitHub: https://github.com/RiktigaTomten
───────────────────────────────────────────────────────────
```

::: warning First Run
On the first run with `CLEAR_COMMANDS=true`, the bot may take longer to start as it registers all commands with Discord. After the initial setup, set `CLEAR_COMMANDS=false` for faster startups.
:::

## Inviting Your Bot

Before your bot can join servers, you need to generate an invite link:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → **OAuth2** → **URL Generator**
3. Select scopes:
   - `bot`
   - `applications.commands`
4. Select bot permissions your addons need (Administrator for testing is fine)
5. Copy the generated URL and open it in your browser
6. Select a server and authorize

## What's Next?

Now that Core is running, you're ready to build! Here are your next steps:

<div class="next-steps">

- 🔍 **[How Core Works](/docs/how-core-works)** — Deep dive into the internals
- 📦 **[Creating Addons](/docs/creating-addons)** — Build your first addon
- 🔌 **[Extensions System](/docs/extensions)** — Create nested addon functionality  
- 🏗️ **[Addon Architecture](/docs/addon-architecture)** — Understand how addons work
- 📡 **[Event System](/docs/events)** — Learn about the AddonBus
- 🗄️ **[Database Integration](/docs/database)** — Store and retrieve data

</div>

## Troubleshooting

### Bot doesn't start

<details>
<summary><strong>Check your environment variables</strong></summary>

Make sure `TOKEN`, `CLIENT_ID`, and `GUILD_ID` are all filled in correctly in `config/.env`. Common issues:
- Extra spaces around the values
- Missing or invalid token
- Incorrect Client ID format
</details>

<details>
<summary><strong>Verify your bot token</strong></summary>

If you regenerated your token in the Discord Developer Portal, you need to update your `.env` file. Old tokens become invalid immediately.
</details>

### "Missing Access" error

<details>
<summary><strong>Enable Privileged Gateway Intents</strong></summary>

Go to your bot settings in the Discord Developer Portal and enable the required Gateway Intents under the "Bot" section. Your addons might need:
- Message Content Intent
- Server Members Intent
- Presence Intent
</details>

### Commands not appearing

<details>
<summary><strong>Force command re-registration</strong></summary>

1. Set `CLEAR_COMMANDS=true` in `config/.env`
2. Restart the bot
3. Set `CLEAR_COMMANDS=false` again

If using `global` scope, commands can take up to an hour to appear. Use `guild` scope during development.
</details>

### Database errors

<details>
<summary><strong>Permission or corruption issues</strong></summary>

- Ensure the `./database/` directory exists and is writable
- If the database is corrupted, delete `database/bot.db` and restart
- Check that no other process has the database file locked
</details>