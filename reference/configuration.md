---
title: Configuration Reference
description: All configuration options for Core
---

# Configuration Reference

Core is configured through environment variables (`.env`) and YAML files. This page documents all available options.

## Environment Variables

Located in `config/.env`:

### Core Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEBUG` | No | `false` | Enable debug logging |
| `ADDONS` | No | `true` | Enable addon loading |

```bash
DEBUG=false
ADDONS=true
```

### Discord Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TOKEN` | **Yes** | — | Your Discord bot token |
| `CLIENT_ID` | **Yes** | — | Your bot's Application ID |
| `GUILD_ID` | Conditional | — | Required if `REGISTRATION_SCOPE=guild` |
| `REGISTRATION_SCOPE` | No | `guild` | `guild` or `global` |
| `CLEAR_COMMANDS` | No | `false` | Re-register all commands on startup |

```bash
TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
REGISTRATION_SCOPE=guild
CLEAR_COMMANDS=false
```

### Locale Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOCALE` | No | `en-US` | Language tag |
| `TIMEZONE` | No | `UTC` | Timezone for timestamps |
| `TIME_FORMAT` | No | `24h` | `12h` or `24h` |

```bash
LOCALE=en-US
TIMEZONE=Europe/Stockholm
TIME_FORMAT=24h
```

## Environment Variable Details

### TOKEN

Your Discord bot token from the Developer Portal.

::: danger Keep Secret
Never commit your token to version control. Add `config/.env` to `.gitignore`.
:::

**How to get it**:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → Bot
3. Click "Reset Token" and copy it

### CLIENT_ID

Your bot's Application ID (also called Client ID).

**How to get it**:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Copy "Application ID" from General Information

### GUILD_ID

The server ID for guild-scoped command registration.

**How to get it**:
1. Enable Developer Mode in Discord (User Settings → Advanced)
2. Right-click your server → Copy Server ID

### REGISTRATION_SCOPE

Controls where slash commands are registered:

| Value | Description | Update Time |
|-------|-------------|-------------|
| `guild` | Commands only in GUILD_ID server | Instant |
| `global` | Commands in all servers | Up to 1 hour |

::: tip Development vs Production
Use `guild` during development for instant command updates. Switch to `global` for production.
:::

### CLEAR_COMMANDS

When `true`, Core re-registers all commands on startup. Useful when:
- Adding new commands
- Changing command names or options
- Commands aren't appearing

Set to `false` after initial setup for faster startups.

### DEBUG

Enables detailed logging:

```
[debug] Loading intent configurations...
[debug] Intent GUILD_MEMBERS requested by Welcome
[debug] Registered button handler: "confirm" from MyAddon
```

Useful for troubleshooting but noisy for production.

---

## Database Configuration

Located in `config/database.yaml`:

```yaml
database:
  path: ./database/
  name: bot.db
  journal_mode: wal
  synchronous: normal
  debug: false
  foreign_keys: true
  cache_size: -2000
  temp_store: memory
```

### Database Options

| Option | Default | Description |
|--------|---------|-------------|
| `path` | `./database/` | Directory for database files |
| `name` | `bot.db` | Database filename |
| `journal_mode` | `wal` | SQLite journal mode |
| `synchronous` | `normal` | Synchronization mode |
| `debug` | `false` | Log all queries |
| `foreign_keys` | `true` | Enable foreign key constraints |
| `cache_size` | `-2000` | Cache size |
| `temp_store` | `memory` | Temp table location |

### journal_mode

Controls how SQLite handles transactions:

| Mode | Description | Best For |
|------|-------------|----------|
| `wal` | Write-Ahead Logging | **Recommended** — best performance |
| `delete` | Delete journal after commit | Compatibility |
| `truncate` | Truncate journal | Slightly faster than delete |
| `persist` | Keep journal file | Avoiding file creation overhead |
| `memory` | Journal in memory | Speed (not crash-safe) |
| `off` | No journal | Maximum speed (dangerous) |

### synchronous

Controls when data is actually written to disk:

| Mode | Description | Safety | Speed |
|------|-------------|--------|-------|
| `off` | No syncing | Dangerous | Fastest |
| `normal` | Sync at critical moments | Good | Fast |
| `full` | Sync after every transaction | Safe | Slower |
| `extra` | Extra syncing | Safest | Slowest |

**Recommendation**: Use `normal` with `wal` journal mode.

### cache_size

SQLite page cache size:

- **Positive number**: Pages (each page is typically 4KB)
- **Negative number**: Kilobytes

Examples:
- `-2000` = 2000 KB = ~2 MB
- `500` = 500 pages = ~2 MB

Larger cache = better performance for read-heavy workloads.

### temp_store

Where SQLite stores temporary tables:

| Value | Description |
|-------|-------------|
| `default` | Let SQLite decide |
| `file` | Use temp files on disk |
| `memory` | Use RAM |

Use `memory` unless you're running out of RAM.

---

## addon.info Format

Each addon has an `addon.info` file:

```ini
# Metadata
author: YourName
version: 1.0.0
name: MyAddon

# Files to load (at least one required)
addonfile: ./main.js
commandfile: ./commands.js
intentconfig: ./intents.js

# Extensions
extensions: ./extensions/

# Load order (higher = earlier)
priority: 10

# Enable/disable
enabled: true
```

### addon.info Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `author` | No | — | Author name |
| `version` | No | — | Semantic version |
| `name` | No | — | Display name |
| `addonfile` | One of these | — | Main addon file |
| `commandfile` | required | — | Command definitions |
| `intentconfig` | No | — | Gateway intents file |
| `extensions` | No | — | Path to extensions folder |
| `priority` | No | `0` | Load order |
| `enabled` | No | `true` | Whether to load |

### Priority Values

Higher priority loads first:

```ini
priority: 100  # Core systems
priority: 50   # Important addons
priority: 0    # Default
priority: -10  # Run after others (logging, cleanup)
```

---

## Intent Configuration

Addons declare required intents in their `intents.js`:

```js
// intents.js
import { GatewayIntentBits } from 'discord.js';

export const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
];
```

### Available Intents

| Intent | Privileged | Description |
|--------|------------|-------------|
| `Guilds` | No | Guild/server info |
| `GuildMembers` | **Yes** | Member info and events |
| `GuildModeration` | No | Bans and kicks |
| `GuildEmojisAndStickers` | No | Emoji updates |
| `GuildIntegrations` | No | Integrations |
| `GuildWebhooks` | No | Webhook updates |
| `GuildInvites` | No | Invite tracking |
| `GuildVoiceStates` | No | Voice channel info |
| `GuildPresences` | **Yes** | Online/offline status |
| `GuildMessages` | No | Messages in guilds |
| `GuildMessageReactions` | No | Reaction events |
| `GuildMessageTyping` | No | Typing indicators |
| `DirectMessages` | No | DM messages |
| `DirectMessageReactions` | No | DM reactions |
| `DirectMessageTyping` | No | DM typing |
| `MessageContent` | **Yes** | Read message text |
| `GuildScheduledEvents` | No | Scheduled events |
| `AutoModerationConfiguration` | No | AutoMod config |
| `AutoModerationExecution` | No | AutoMod actions |

::: warning Privileged Intents
`GuildMembers`, `GuildPresences`, and `MessageContent` require enabling in the Discord Developer Portal. Bots with 100+ servers may need verification.
:::

---

## File Locations

Default paths (can be customized):

| What | Default Path |
|------|--------------|
| Environment | `config/.env` |
| Database config | `config/database.yaml` |
| Addons | `addons/` |
| SQLite database | `database/bot.db` |
| Cache files | `cache/` |

### Customizing Paths

Most paths are defined in `core/utils/paths.ts` and can be modified if needed, though this isn't recommended.

---

## Example Configuration

### Development Setup

```bash
# config/.env
DEBUG=true
ADDONS=true

TOKEN=your_dev_token
CLIENT_ID=your_client_id
GUILD_ID=your_test_server_id
REGISTRATION_SCOPE=guild
CLEAR_COMMANDS=true

LOCALE=en-US
TIMEZONE=America/New_York
TIME_FORMAT=12h
```

### Production Setup

```bash
# config/.env
DEBUG=false
ADDONS=true

TOKEN=your_production_token
CLIENT_ID=your_client_id
REGISTRATION_SCOPE=global
CLEAR_COMMANDS=false

LOCALE=en-US
TIMEZONE=UTC
TIME_FORMAT=24h
```

```yaml
# config/database.yaml
database:
  path: ./database/
  name: production.db
  journal_mode: wal
  synchronous: normal
  debug: false
  foreign_keys: true
  cache_size: -8000    # Larger cache for production
  temp_store: memory
```
