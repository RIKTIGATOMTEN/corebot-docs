---
title: API Reference
description: Complete reference for Core's public API
---

# API Reference

This page documents all public APIs exported by Core. Import them using:

```js
import { /* exports */ } from '#core';
```

## Database

### db

The SQLite database instance (better-sqlite3).

```js
import { db } from '#core';

// Prepare and run queries
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId);
```

**Methods**:
- `prepare(sql)` — Create a prepared statement
- `exec(sql)` — Execute raw SQL
- `transaction(fn)` — Create a transaction function
- `function(name, fn)` — Register a custom SQL function

### executeQueries(queries)

Execute multiple queries in sequence.

```js
import { executeQueries } from '#core';

await executeQueries([
  { sql: 'INSERT INTO logs VALUES (?)', params: ['entry1'] },
  { sql: 'INSERT INTO logs VALUES (?)', params: ['entry2'] },
]);
```

### initDatabases()

Initialize all database schemas. Called automatically by Core.

### closeDatabase()

Close the database connection gracefully.

```js
import { closeDatabase } from '#core';

await closeDatabase();
```

### validateQuery(sql)

Check if a query is safe to execute.

```js
import { validateQuery } from '#core';

if (validateQuery(userInput)) {
  // Safe to execute
}
```

---

## Logging

### logger

Timestamped, colored console logger.

```js
import { logger } from '#core';

logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error message', error);
logger.debug('Debug message');  // Only when DEBUG=true
logger.success('Success message');
```

**Methods**:

| Method | Color | When to Use |
|--------|-------|-------------|
| `info(msg, ...args)` | White | General information |
| `warn(msg, ...args)` | Yellow | Warnings |
| `error(msg, ...args)` | Red | Errors |
| `debug(msg, ...args)` | Cyan | Debug info (DEBUG=true only) |
| `success(msg, ...args)` | Green | Success messages |
| `log(msg, ...args)` | White | Generic logging |

---

## Locale

### locale

Locale and timezone utilities.

```js
import { locale } from '#core';

// Get formatted timestamp
const timestamp = locale.getTimestamp();  // "23:31:48"

// Get current locale config
const config = locale.getConfig();
// { locale: 'en-US', timezone: 'Europe/Stockholm', timeFormat: '24h' }
```

---

## Event Bus

### AddonBus

Event system for cross-addon communication.

```js
import { AddonBus } from '#core';

// Emit events (use colon notation)
AddonBus.emitEvent('myAddon:eventName', { data: 'here' });

// Listen for events
AddonBus.onEvent('myAddon:eventName', (data) => {
  console.log(data);
});

// One-time listener
AddonBus.onceEvent('myAddon:eventName', handler);

// Remove listener
AddonBus.offEvent('myAddon:eventName', handler);

// Get statistics
const stats = AddonBus.getStats();
```

**Methods**:

| Method | Description |
|--------|-------------|
| `emitEvent(namespaced, data?)` | Emit using `addon:event` format (recommended) |
| `onEvent(namespaced, handler)` | Add listener with colon notation |
| `onceEvent(namespaced, handler)` | One-time listener with colon notation |
| `offEvent(namespaced, handler)` | Remove listener with colon notation |
| `offAll(addon, event)` | Remove all listeners for event |
| `getStats()` | Get bus statistics |
| `listenerCount(addon, event)` | Count listeners for event |

---

## Registry

### AddonRegistry

Registry for sharing APIs between addons.

```js
import { AddonRegistry } from '#core';

// Register an API
AddonRegistry.register('myAddon', 'api', {
  doSomething: () => { /* ... */ },
  getData: () => { /* ... */ },
});

// Get an API
const api = AddonRegistry.get('myAddon', 'api');
api.doSomething();

// Check if registered
if (AddonRegistry.has('myAddon', 'api')) {
  // API exists
}

// Get all registered addons
const all = AddonRegistry.getAll();
```

**Methods**:

| Method | Description |
|--------|-------------|
| `register(addon, name, api, meta?)` | Register an API |
| `get(addon, name)` | Get a registered API |
| `getByKey(key)` | Get using `addon.name` format |
| `has(addon, name)` | Check if API exists |
| `getAll()` | Get all registered APIs |
| `getStats()` | Get registry statistics |

---

## Caching

### JSONCacheManager

Simple JSON-based caching.

```js
import { JSONCacheManager } from '#core';

const cache = new JSONCacheManager('my-addon-cache');

// Save data
await cache.save({ key: 'value' });

// Load data
const data = await cache.load();  // { key: 'value' } or null

// Update data
await cache.update((current) => ({
  ...current,
  newKey: 'newValue'
}));

// Clear cache
await cache.clear();
```

### CacheManager

Binary cache with custom encoding.

```js
import { CacheManager } from '#core';

const cache = new CacheManager(
  'my-binary-cache',
  (data) => Buffer.from(JSON.stringify(data)),  // encoder
  (buffer) => JSON.parse(buffer.toString())      // decoder
);

await cache.save(myData);
const data = await cache.load();
```

### Cache Utilities

```js
import { listAllCaches, clearAllCaches } from '#core';

// List all cache files
const caches = await listAllCaches();

// Clear all caches
await clearAllCaches();
```

---

## Intents

### requestIntent(intent, source?)

Request a gateway intent.

```js
import { requestIntent, GatewayIntentBits } from '#core';

requestIntent(GatewayIntentBits.GuildMembers, 'MyAddon');
```

### requestIntents(intents, source?)

Request multiple intents at once.

```js
import { requestIntents, GatewayIntentBits } from '#core';

requestIntents([
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.MessageContent,
], 'MyAddon');
```

### hasIntent(intent)

Check if an intent is available.

```js
import { hasIntent, GatewayIntentBits } from '#core';

if (hasIntent(GatewayIntentBits.MessageContent)) {
  // Safe to read message content
}
```

### GatewayIntentBits

Re-exported from discord.js for convenience.

```js
import { GatewayIntentBits } from '#core';

// Available intents:
GatewayIntentBits.Guilds
GatewayIntentBits.GuildMembers
GatewayIntentBits.GuildModeration
GatewayIntentBits.GuildEmojisAndStickers
GatewayIntentBits.GuildIntegrations
GatewayIntentBits.GuildWebhooks
GatewayIntentBits.GuildInvites
GatewayIntentBits.GuildVoiceStates
GatewayIntentBits.GuildPresences
GatewayIntentBits.GuildMessages
GatewayIntentBits.GuildMessageReactions
GatewayIntentBits.GuildMessageTyping
GatewayIntentBits.DirectMessages
GatewayIntentBits.DirectMessageReactions
GatewayIntentBits.DirectMessageTyping
GatewayIntentBits.MessageContent
GatewayIntentBits.GuildScheduledEvents
GatewayIntentBits.AutoModerationConfiguration
GatewayIntentBits.AutoModerationExecution
```

---

## Interactions

### InteractionRegistry

Registry for button, modal, and select menu handlers.

```js
// Access via client
const client = globalThis.client;

// Register a handler
client.interactions.register({
  type: 'button',           // button, modal, stringSelect, etc.
  customId: 'my-button',
  matchType: 'exact',       // exact, prefix, regex
  handler: async (interaction, client, logger) => {
    await interaction.reply('Clicked!');
    return true;  // Stop propagation
  },
  priority: 0,              // Higher = called first
  source: 'MyAddon'         // For debugging
});

// Check if handler exists
client.interactions.has('my-button', 'button');

// Get handler
const handler = client.interactions.get('my-button', 'button');
```

**Interaction Types**:
- `button`
- `modal`
- `stringSelect`
- `userSelect`
- `roleSelect`
- `mentionableSelect`
- `channelSelect`

**Match Types**:
- `exact` — customId must match exactly
- `prefix` — customId must start with pattern
- `regex` — customId must match regex pattern

---

## Protection

### protect(userId, action, fn, options?)

Protect a function with rate limiting and duplicate detection.

```js
import { protect } from '#core';

const result = await protect(userId, 'createTicket', async () => {
  return await createTicket(userId);
}, {
  checkDuplicate: true,   // Block duplicate requests
  checkRateLimit: true,   // Apply rate limiting
  customLimit: 5,         // Custom rate limit
  duration: 5000,         // How long to track duplicates
});
```

**Options**:

| Option | Default | Description |
|--------|---------|-------------|
| `checkDuplicate` | `true` | Block duplicate in-flight requests |
| `checkRateLimit` | `true` | Apply rate limiting |
| `customLimit` | `null` | Custom rate limit (null = default) |
| `duration` | `5000` | Duplicate tracking duration (ms) |
| `data` | `''` | Additional data for duplicate detection |

**Error Codes**:
- `REQUEST_DUPLICATE` — Request already being processed
- `RATE_LIMITED` — Rate limit exceeded (includes `retryAfter`)

### userLimiter

Direct access to the rate limiter.

```js
import { userLimiter } from '#core';

// Check if allowed
const { allowed, retryAfter } = userLimiter.check(userId, 'action');

// Set custom limit for an action
userLimiter.setLimit('action', 10);  // 10 requests per window
```

### requestTracker

Track in-flight requests.

```js
import { requestTracker } from '#core';

// Check if processing
if (requestTracker.isProcessing(userId, 'action')) {
  return; // Skip duplicate
}

// Wrap a function
const result = await requestTracker.wrap(userId, 'action', async () => {
  return await doSomething();
});
```

---

## Error Handling

### ErrorHandler

Formatted error handling with solutions.

```js
import { ErrorHandler } from '#core';

try {
  await riskyOperation();
} catch (error) {
  ErrorHandler.handle(error, logger);
  // Logs formatted error with title, description, and solution
}
```

Known error codes are automatically formatted with helpful solutions.

---

## Environment

### config

Access to all environment variables.

```js
import { config } from '#core';

console.log(config.TOKEN);
console.log(config.CLIENT_ID);
console.log(config.DEBUG);
```

### Individual Exports

```js
import { 
  TOKEN,
  CLIENT_ID, 
  GUILD_ID,
  loadAddons,    // boolean
  isDebug,       // boolean
} from '#core';
```

### validateEnvironmentVariables()

Check that required variables are set.

```js
import { validateEnvironmentVariables } from '#core';

validateEnvironmentVariables();  // Throws if invalid
```

---

## Paths

### Path Constants

```js
import {
  ROOT_DIR,       // Project root
  CONFIG_DIR,     // config/ directory
  ADDONS_DIR,     // addons/ directory
  EVENTS_DIR,     // events/ directory
  DATABASE_DIR,   // database/ directory
  ENV_PATH,       // Path to .env file
  PACKAGE_JSON,   // Path to package.json
} from '#core';
```

---

## File Utilities

### parseInfoFile(path)

Parse an `addon.info` file.

```js
import { parseInfoFile } from '#core';

const info = parseInfoFile('/path/to/addon.info');
// {
//   author: 'Name',
//   version: '1.0.0',
//   addonfile: './main.js',
//   ...
// }
```

---

## Discord.js Re-exports

Common Discord.js types are re-exported for convenience:

```js
import {
  Client,
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  AnySelectMenuInteraction,
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  SlashCommandBuilder,
  Collection,
} from '#core';
```

---

## Types

### Logger

```ts
interface Logger {
  info: (msg: string, ...args: any[]) => void;
  warn: (msg: string, ...args: any[]) => void;
  error: (msg: string, ...args: any[]) => void;
  debug: (msg: string, ...args: any[]) => void;
  success: (msg: string, ...args: any[]) => void;
  log: (msg: string, ...args: any[]) => void;
}
```

### AddonInfo

```ts
interface AddonInfo {
  author: string;
  name?: string;
  version?: string;
  priority?: number;
  enabled?: boolean;
  addonfile?: string;
  commandfile?: string;
  eventfile?: string;
  intentconfig?: string;
  extensions?: string;
}
```

### BusStats

```ts
interface BusStats {
  totalEvents: number;
  listeners: Record<string, number>;
  totalEmissions: number;
}
```

### InteractionRegistration

```ts
interface InteractionRegistration {
  type: InteractionType;
  customId: string;
  matchType: 'exact' | 'prefix' | 'regex';
  handler: InteractionHandler;
  priority: number;
  source: string;
}
```

### QueryInfo

```ts
interface QueryInfo {
  sql: string;
  params?: any[];
}
```
