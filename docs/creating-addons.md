---
title: Creating Your First Addon
description: Build a simple addon using Core and Discord.js
---

# Creating Your First Addon

Now that you have Core running, let's create your first addon! This guide walks you through building addons from the ground up.

## What is an Addon?

An addon is a self-contained module that adds functionality to your Discord bot. Think of addons as plugins—each one handles a specific feature or set of features.

Addons can:
- Handle Discord events (messages, interactions, member joins, etc.)
- Register slash commands
- Store data in the database
- Communicate with other addons via the Event Bus
- Have nested extensions for additional features

## Minimal Addon Structure

At minimum, an addon needs just one file:

```
addons/
└── MyAddon/
    └── addon.info          # Required: Addon metadata
```

A more complete structure might look like:

```
addons/
└── MyAddon/
    ├── addon.info          # Required: Addon metadata
    ├── main.js             # Addon logic
    ├── intents.js          # Gateway intents needed
    ├── database/
    │   └── schema.sql      # Database tables
    └── extensions/         # Nested extensions
        └── SubFeature/
            ├── addon.info
            └── main.js
```

## The addon.info File

Every addon must have an `addon.info` file. This tells Core how to load your addon:

```ini
# Basic addon metadata
author: YourName
version: 1.0.0

# What files to load (specify at least one)
addonfile: ./main.js
commandfile: ./commands.js
intentconfig: ./intents.js

# Optional: Load extensions from this directory
extensions: ./extensions/

# Optional: Priority (higher loads first)
priority: 10

# Optional: Enable/disable
enabled: true
```

### Required Fields

You must specify **at least one** of these:
- `addonfile` — Main addon file with lifecycle hooks and event handlers
- `commandfile` — File that exports slash command definitions

Without either, Core will skip the addon.

### File Format

The `.info` format is simple:
- One `key: value` per line
- Lines starting with `#` are comments
- Whitespace around values is trimmed

## Creating a Simple Addon

Let's build a "Ping" addon step by step.

### Step 1: Create the Directory

```bash
mkdir -p addons/Ping
```

### Step 2: Create addon.info

```ini
# addons/Ping/addon.info
author: YourName
version: 1.0.0
commandfile: ./commands.js
```

### Step 3: Create the Command File

```js
// addons/Ping/commands.js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check if the bot is responsive');

export async function execute(interaction) {
  const latency = Date.now() - interaction.createdTimestamp;
  await interaction.reply(`🏓 Pong! Latency: ${latency}ms`);
}

export default {
  data,
  execute,
};
```

### Step 4: Restart Core

Restart your bot and the `/ping` command will be available!

## Creating an Addon with Events

For more complex addons that need event handling, use an `addonfile`:

### addon.info

```ini
# addons/Welcome/addon.info
author: YourName
version: 1.0.0
addonfile: ./main.js
intentconfig: ./intents.js
```

### intents.js

```js
// addons/Welcome/intents.js
import { GatewayIntentBits } from 'discord.js';

export const intents = [
  GatewayIntentBits.GuildMembers,  // Required for member events
];
```

### main.js

```js
// addons/Welcome/main.js
import { logger } from '#core';

export const name = 'Welcome';

export function onReady(client) {
  logger.info('[Welcome] Addon loaded and ready!');
}

export function onGuildMemberAdd(member, client) {
  const channel = member.guild.systemChannel;
  if (channel) {
    channel.send(`Welcome to the server, ${member}! 🎉`);
  }
}
```

## Lifecycle Hooks

Addons can export these lifecycle functions:

| Hook | When it's Called |
|------|-----------------|
| `onReady(client)` | When the bot connects to Discord |
| `onGuildMemberAdd(member, client)` | When a member joins a server |
| `onGuildMemberRemove(member, client)` | When a member leaves a server |
| `onMessageCreate(message, client)` | When a message is sent |
| `onInteractionCreate(interaction, client)` | When any interaction occurs |

## Importing Core Utilities

Core provides many utilities via the `#core` import alias:

```js
import { 
  // Logging
  logger,
  
  // Database
  db,
  executeQueries,
  
  // Event Bus
  AddonBus,
  
  // Registry
  AddonRegistry,
  
  // Caching
  JSONCacheManager,
  
  // Rate Limiting
  protect,
  userLimiter,
  
  // Intents
  requestIntent,
  GatewayIntentBits,
  
  // Paths
  ADDONS_DIR,
  DATABASE_DIR,
} from '#core';
```

## Module Types Explained

### Addons (addonfile)

Full-featured modules with:
- Lifecycle hooks
- Event handling
- State management
- Full Core API access

Use addons when you need complex logic or event-driven behavior.

### Commands (commandfile)

Lightweight modules that only define slash commands:
- Simpler structure
- No lifecycle management
- Just `data` and `execute` exports

Use commands for simple, stateless slash commands.

::: tip When to Use What
- **Addon**: Event handling, persistent state, background tasks
- **Command**: Simple slash commands with no side effects
- **Both**: Complex commands that also need event handling
:::

## Discovery Process

When Core starts up, it:

1. **Scans** the `addons/` directory recursively
2. **Discovers** modules by finding `addon.info` files
3. **Validates** each module's metadata
4. **Loads** intents from all `intentconfig` files
5. **Initializes** the Discord client with merged intents
6. **Loads** addon and command files
7. **Registers** slash commands with Discord
8. **Calls** `onReady` hooks when connected

Each step is logged so you can see exactly what's happening during startup.

## Handling Interactions

Beyond slash commands, you can handle buttons, modals, and select menus.

### Registering Button Handlers

```js
// In your addon's main.js
export function onReady(client) {
  // Register a button handler
  client.interactions.register({
    type: 'button',
    customId: 'my-button',
    matchType: 'exact',  // or 'prefix', 'regex'
    handler: async (interaction, client, logger) => {
      await interaction.reply('Button clicked!');
      return true;
    }
  });
}
```

### Match Types

| Type | Description | Example |
|------|-------------|---------|
| `exact` | Must match exactly | `customId: 'confirm-btn'` matches only `confirm-btn` |
| `prefix` | Starts with | `customId: 'ticket-'` matches `ticket-123`, `ticket-456` |
| `regex` | Regular expression | `customId: '^user-\\d+$'` matches `user-123` |

### Handling Modals

```js
client.interactions.register({
  type: 'modal',
  customId: 'feedback-modal',
  matchType: 'exact',
  handler: async (interaction, client, logger) => {
    const feedback = interaction.fields.getTextInputValue('feedback-input');
    await interaction.reply(`Thanks for your feedback: ${feedback}`);
    return true;
  }
});
```

## Using the Database

Addons can define database schemas that Core automatically initializes.

### Create a Schema File

```sql
-- addons/MyAddon/database/schema.sql
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  setting_name TEXT NOT NULL,
  setting_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Query the Database

```js
import { db, executeQueries } from '#core';

// Insert data
db.prepare(`
  INSERT INTO user_settings (user_id, setting_name, setting_value)
  VALUES (?, ?, ?)
`).run(userId, 'theme', 'dark');

// Query data
const settings = db.prepare(`
  SELECT * FROM user_settings WHERE user_id = ?
`).all(userId);
```

## Extensions

Addons can have **extensions**—nested addons that extend the parent's functionality. Extensions:

- Live in the parent addon's `extensions/` directory
- Have their own `addon.info` and main file
- Load after the parent addon
- Can access Core utilities independently

We cover extensions in detail in [Extensions System](/docs/extensions).

## Best Practices

### 1. Use Descriptive Names
Name your addon directory and commands clearly. `Tickets` is better than `T1`.

### 2. Declare Only Needed Intents
Don't request intents you don't use—it wastes resources and may require verification for large bots.

### 3. Handle Errors Gracefully
```js
export async function execute(interaction) {
  try {
    // Your logic here
  } catch (error) {
    logger.error('[MyAddon] Error:', error);
    await interaction.reply({ 
      content: 'Something went wrong!', 
      ephemeral: true 
    });
  }
}
```

### 4. Use the Logger
```js
import { logger } from '#core';

logger.info('[MyAddon] Something happened');
logger.warn('[MyAddon] Warning message');
logger.error('[MyAddon] Error occurred', error);
logger.debug('[MyAddon] Debug info');  // Only shows when DEBUG=true
```

## What's Next?

You now understand how to create addons! Continue learning:

- [Extensions System](/docs/extensions) — Nested addon functionality
- [Event System](/docs/events) — Cross-addon communication
- [Database Integration](/docs/database) — Storing persistent data
- [API Reference](/reference/api) — Full Core API documentation