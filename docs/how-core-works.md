---
title: How Core Works
description: A deep dive into Core's architecture, startup process, and what makes it tick
---

# How Core Works

This page takes you behind the scenes of Core. You'll learn exactly what happens when you start your bot, how the pieces fit together, and—importantly—where Core shines and where it doesn't.

## The 30-Second Version

Core is a modular framework for Discord.js bots. When you run your bot:

1. **Environment loads** — Config, database, and validation
2. **Intents gather** — Core scans addons for required Discord intents
3. **Client creates** — Discord.js client spins up with merged intents
4. **Discord connects** — Authentication and gateway handshake
5. **Addons load** — Your code runs, commands register
6. **Bot goes online** — Ready to handle interactions

That's it. No magic, no hidden complexity.

## The Startup Sequence (Detailed)

When you run `npm start` or `npm run dev`, here's exactly what happens:

### Phase 1: Bootstrap (0-50ms typical)

```
[info] Starting RiktigaTomten's Core...
```

The entry point (`index.ts`) kicks off the boot sequence:

```typescript
// 1. Validate environment variables
const missingVars = validateEnvironmentVariables();
if (missingVars.length > 0) {
  // Fail fast with helpful error
  process.exit(1);
}

// 2. Initialize database
await initDatabases(db);

// 3. Set up the bot
const client = await setupBot();
```

Core validates your `.env` file immediately. Missing `TOKEN`? You'll know in milliseconds, not after a cryptic Discord error.

### Phase 2: Intent Collection (10-30ms)

Before creating the Discord client, Core needs to know what intents to request. This happens in `setupBot()`:

```
[debug] Loading intent configurations...
[debug] Building intent configuration...
```

Core scans every addon's `intents.js` file and merges them:

```typescript
// From your addon
export const intents = [
  GatewayIntentBits.GuildMembers,  // Your addon needs this
];

// Core collects these from ALL addons and merges them
const allIntents = buildIntents(); // No duplicates
```

**Why this matters**: Discord limits privileged intents. Core tracks which addon requested what, so when something breaks, you know where to look.

### Phase 3: Client Creation (< 5ms)

```
[debug] Creating Discord client with configured intents...
[info] Initializing interaction registry...
```

The Discord.js client is created with the merged intents. At this point:

- Interaction handlers are set up (buttons, modals, select menus)
- The command collection is initialized
- Event listeners are attached

The interaction registry is a key piece—it routes button clicks, modal submissions, and select menus to the right handler using pattern matching (exact, prefix, or regex).

### Phase 4: Discord Connection (300-1000ms)

```
[info] 🔐 Connecting to Discord...
```

This is the slowest part—network latency to Discord's servers. Core measures this separately:

```
[debug] Timing breakdown: Local init 32ms | Discord handshake 1055ms
```

If your bot is slow to start, it's almost always the Discord handshake, not Core.

### Phase 5: Ready & Addon Loading

Once Discord says "ready," the real work begins:

```
[success] Test Dev#6002 is now online and ready!
[info] Connected to Discord as: Test Dev#6002
[info] Serving 1 server(s) with 1 users
[info] Loading commands...
[info] Loading addons...
```

**Commands load first**, then addons. Why? Commands need to be registered with Discord before addon `onReady` hooks run, so addons can rely on commands being available.

Each addon/command is:
1. Discovered by scanning for `addon.info` files
2. Grouped by priority (higher priorities load first)
3. Loaded in parallel within each priority group
4. Timed and logged (in debug mode)

```
[debug] Loading priority 10 addon: Tickets
[debug] Loaded addon: Tickets v1.0.0 (23ms)
```

### Phase 6: Banner & Done

```
  ______  ____  __  __  ______  ______ _   __
 /_  __/ / __ \/  |/  //_  __/ / ____// | / /
  / /   / / / / /|_/ /  / /   / __/  /  |/ / 
 / /   / /_/ / /  / /  / /   / /___ / /|  /  
/_/    \____/_/  /_/  /_/   /_____//_/ |_/   

RiktigaTomten's Core
───────────────────────────────────────────────────────────
Core successfully initialized
```

Your bot is now fully operational.

## How Logging Works

Core's logger is straightforward but useful:

```typescript
logger.info('General information');     // White
logger.warn('Warning message');         // Yellow  
logger.error('Error occurred', err);    // Red
logger.debug('Verbose info');           // Cyan (only when DEBUG=true)
logger.success('Something worked!');    // Green
```

Every log line includes a timestamp formatted according to your `LOCALE` and `TIMEZONE` settings:

```
23:31:48:[info] Loading addons...
23:31:48:[success] Bot fully loaded and ready in 802ms
```

### Debug Mode

Set `DEBUG=true` in your `.env` to see verbose logging:

```
[debug] Loading intent configurations...
[debug] Intent GUILD_MEMBERS requested by Welcome
[debug] Building intent configuration...
[debug] Creating Discord client with configured intents...
[debug] Loading priority 10 addon: Tickets v1.0.0
[debug] Addon initialization completed in 47ms
```

This is invaluable for troubleshooting but noisy for production.

## How Addons Load

The addon discovery system is recursive and priority-aware:

```
addons/
├── Tickets/              → Priority 10, loads first
│   ├── addon.info
│   └── extensions/
│       └── Logger/       → Loads after parent
└── Welcome/              → Priority 0, loads after Tickets
    └── addon.info
```

### Discovery Rules

1. **Recursive scan** — Core finds all `addon.info` files, nested or not
2. **Validation** — Each addon must have `addonfile` or `commandfile`
3. **Priority sort** — Higher priority numbers load first
4. **Parallel loading** — Same-priority addons load simultaneously
5. **Timeout protection** — Any addon taking > 30 seconds fails gracefully

### What Gets Skipped

- Directories without `addon.info`
- Addons with `enabled: false`
- Invalid addon configurations (with a warning)
- `node_modules` and hidden directories

## How the Event Bus Works

The `AddonBus` is how addons talk to each other without direct dependencies:

```typescript
// Addon A emits (use colon notation)
AddonBus.emitEvent('tickets:created', { ticketId: 123 });

// Addon B (or C, or D...) listens
AddonBus.onEvent('tickets:created', (data) => {
  // React to the event
});
```

Events are namespaced (`addonName:eventName`) to prevent collisions. The bus supports:

- Multiple listeners per event
- One-time listeners (`onceEvent`)
- Event statistics collection
- Colon notation for clean, readable code

## How the Database Works

Core uses SQLite with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for synchronous, fast queries:

```typescript
// Schemas are auto-discovered
addons/
└── MyAddon/
    └── database/
        └── schema.sql  // Core runs this automatically

// Then just query
import { db } from '#core';
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
```

### What Happens at Startup

1. Core loads `config/database.yaml` for settings
2. Database file is created if it doesn't exist
3. Pragmas are set (WAL mode, cache size, etc.)
4. All `*.sql` files in addon `database/` folders are executed
5. Connection pool is ready

Queries are synchronous (better-sqlite3's design), which actually simplifies addon code—no async/await soup for simple lookups.

## How Interactions Route

When someone clicks a button or submits a modal, Core's `InteractionRegistry` handles routing:

```typescript
// Register during addon load
client.interactions.register({
  type: 'button',
  customId: 'ticket-close-*',  // Wildcard matching
  matchType: 'prefix',
  handler: handleTicketClose,
  priority: 10,
  source: 'Tickets'
});
```

The registry supports:

| Match Type | Example | Matches |
|------------|---------|---------|
| `exact` | `confirm-delete` | Only `confirm-delete` |
| `prefix` | `ticket-` | `ticket-123`, `ticket-abc` |
| `regex` | `/order-\d+/` | `order-1`, `order-999` |

Higher priority handlers run first. If a handler returns `true`, processing stops.

---

## What Core Does Well

Let's be honest about strengths:

### ✅ Fast Startup
Local initialization is typically 30-80ms. The Discord handshake is what takes time, and that's not something any framework can optimize.

### ✅ Modular by Default
Addons are truly isolated. You can drop in a ticket system from one project to another without modification.

### ✅ Developer Experience
- Clear error messages
- Debug mode for verbose logging
- Timing breakdowns
- Fail-fast validation

### ✅ No Lock-in
Core doesn't wrap Discord.js in abstractions. You get `client`, you use Discord.js methods directly. If Core disappeared tomorrow, refactoring wouldn't be a nightmare.

### ✅ Production-Tested
Core came from real FiveM/Discord projects with real users. Rate limiting, error handling, and graceful degradation aren't afterthoughts.

---

## What Core Doesn't Do Well (Honest Limitations)

Every framework has tradeoffs. Here's where Core falls short:

### ⚠️ Learning Curve for Simple Bots

If you just need a bot that responds to `/ping`, Core is overkill. The addon structure, `addon.info` files, and directory conventions add friction for trivial use cases.

**Who this affects**: Beginners, one-off bots, simple utilities

### ⚠️ SQLite Only (For Now)

The database layer is built around SQLite. If you need PostgreSQL, MySQL, or MongoDB, you'll have to bring your own solution. The `db` export won't help you.

**Who this affects**: Large-scale bots, existing database infrastructure, analytics-heavy projects

### ⚠️ No Built-in Sharding

Core doesn't handle sharding out of the box. For bots in 2,500+ servers, you'll need to implement sharding yourself using Discord.js's `ShardingManager`.

**Who this affects**: Large bots approaching Discord's limits

### ⚠️ Limited Documentation (We're Working on It)

The docs you're reading are new. Edge cases, advanced patterns, and real-world examples are still being written.

**Who this affects**: Everyone, honestly

### ⚠️ Single Developer Project

Core is primarily maintained by one person (RiktigaTomten). That means updates can be slow, and you might need to dig into the source code to understand something.

**Who this affects**: Teams needing enterprise support, strict SLAs

### ⚠️ No GUI or Dashboard

Core is code-only. If you want a web dashboard to configure your bot, you'll build it yourself. There's no admin panel, no config UI.

**Who this affects**: Non-developers managing bots, visual configuration needs

---

## When to Use Core

**Core is for you if:**

- You build multiple Discord bots and want reusable components
- You value clean architecture over quick hacks
- You want TypeScript support with JavaScript addon flexibility
- You're comfortable reading source code when docs fall short
- You need a foundation, not a finished product

**Core is NOT for you if:**

- You need a simple bot up in 5 minutes (use raw Discord.js)
- You need enterprise support or SLAs
- You require PostgreSQL/MySQL/MongoDB
- You need sharding built-in for massive bots
- You prefer heavy abstraction over direct Discord.js access

---

## Architecture Diagram

Here's how the pieces connect:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Bot                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Addon A   │  │   Addon B   │  │   Addon C   │   Addons     │
│  │             │  │             │  │             │              │
│  │ ┌─────────┐ │  └─────────────┘  └─────────────┘              │
│  │ │Extension│ │                                                 │
│  │ └─────────┘ │                                                 │
│  └─────────────┘                                                 │
│         │              │                │                        │
│         ▼              ▼                ▼                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                    Core Framework                     │       │
│  │                                                       │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │       │
│  │  │ AddonBus │ │ Registry │ │ Database │ │ Logger  │  │       │
│  │  │  Events  │ │   API    │ │  SQLite  │ │         │  │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘  │       │
│  │                                                       │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │       │
│  │  │Interaction│ │ Intent   │ │  Error   │              │       │
│  │  │ Registry │ │ Manager  │ │ Handler  │              │       │
│  │  └──────────┘ └──────────┘ └──────────┘              │       │
│  └──────────────────────────────────────────────────────┘       │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   Discord.js Client                   │       │
│  └──────────────────────────────────────────────────────┘       │
│         │                                                        │
└─────────┼────────────────────────────────────────────────────────┘
          │
          ▼
    ┌───────────┐
    │  Discord  │
    │    API    │
    └───────────┘
```

---

## Next Steps

Now that you understand how Core works:

- **[Getting Started](/docs/getting-started)** — Set up your first Core project
- **[Creating Addons](/docs/creating-addons)** — Build your first addon
- **[Addon Architecture](/docs/addon-architecture)** — Deep dive into the addon system
- **[API Reference](/reference/api)** — Full API documentation
