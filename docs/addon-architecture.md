---
title: Addon Architecture
description: Understanding how Core discovers, loads, and manages addons
---

# Addon Architecture

This page explains how Core's addon system works under the hood. Understanding the architecture helps you build better addons and debug issues.

## Overview

Core's addon system is built around these principles:

1. **Discovery**: Automatically find addons by scanning directories
2. **Validation**: Ensure addons have required metadata
3. **Loading**: Import and initialize addon code
4. **Registration**: Register commands and event handlers
5. **Lifecycle**: Manage addon state throughout runtime

## The Loading Pipeline

```
┌─────────────────┐
│  Validate Env   │  Check required environment variables
└────────┬────────┘
         ▼
┌─────────────────┐
│  Init Database  │  Connect SQLite, run pragmas
└────────┬────────┘
         ▼
┌─────────────────┐
│   Scan Addons   │  Find all addon.info files
└────────┬────────┘
         ▼
┌─────────────────┐
│ Load Intents    │  Collect gateway intents from all addons
└────────┬────────┘
         ▼
┌─────────────────┐
│ Create Client   │  Initialize Discord.js with merged intents
└────────┬────────┘
         ▼
┌─────────────────┐
│ Connect Discord │  Authenticate and connect to gateway
└────────┬────────┘
         ▼
┌─────────────────┐
│ Load Commands   │  Import and register slash commands
└────────┬────────┘
         ▼
┌─────────────────┐
│  Load Addons    │  Import addon files and call onReady
└────────┬────────┘
         ▼
┌─────────────────┐
│     Ready!      │  Bot is fully operational
└─────────────────┘
```

## Discovery Phase

Core scans the `addons/` directory recursively, looking for `addon.info` files:

```
addons/
├── Tickets/
│   ├── addon.info        ← Found!
│   └── extensions/
│       └── Logger/
│           └── addon.info  ← Found!
├── Welcome/
│   └── addon.info        ← Found!
└── utilities.js          ← Ignored (no addon.info)
```

### What Gets Discovered

- Any directory containing `addon.info`
- Nested directories (for extensions)
- Multiple levels deep

### What Gets Ignored

- Directories without `addon.info`
- Files in the addons folder
- `node_modules` directories
- Hidden directories (starting with `.`)

## Validation Phase

Each discovered `addon.info` is validated:

```ini
# Required: At least one must be present
addonfile: ./main.js
commandfile: ./commands.js

# Optional fields
author: YourName
version: 1.0.0
intentconfig: ./intents.js
extensions: ./extensions/
priority: 10
enabled: true
```

### Validation Rules

| Field | Required | Description |
|-------|----------|-------------|
| `addonfile` | One of these | Main addon file |
| `commandfile` | required | Command definitions |
| `author` | No | Author name |
| `version` | No | Semantic version |
| `intentconfig` | No | Intent declarations |
| `extensions` | No | Path to extensions folder |
| `priority` | No | Load order (default: 0) |
| `enabled` | No | Whether to load (default: true) |

### Validation Failures

If validation fails, Core logs the error and skips the addon:

```
[warn] Addon at /addons/Broken has no addonfile or commandfile, skipping
```

## Intent Collection

Before creating the Discord client, Core collects intents from all addons:

```js
// addons/Welcome/intents.js
import { GatewayIntentBits } from 'discord.js';

export const intents = [
  GatewayIntentBits.GuildMembers,
];
```

Core automatically:
1. Finds all `intentconfig` files
2. Imports and extracts intents
3. Merges into a single set (no duplicates)
4. Passes to Discord.js client

### Intent Registry

The IntentRegistry tracks which addons requested which intents:

```js
import { hasIntent, GatewayIntentBits } from '#core';

// Check if an intent is available
if (hasIntent(GatewayIntentBits.MessageContent)) {
  // Safe to read message content
}
```

### Late Intent Requests

Intents requested after the client connects are logged as warnings:

```
[warn] Intent GUILD_MEMBERS requested by MyAddon after bot initialization.
       This intent will not be available.
```

## Loading Phase

### Command Loading

Command files export `data` and `execute`:

```js
// commands.js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Ping the bot');

export async function execute(interaction) {
  await interaction.reply('Pong!');
}
```

Core:
1. Imports the file
2. Extracts the `data` builder
3. Registers with Discord's API
4. Stores `execute` for handling interactions

### Addon Loading

Addon files export lifecycle hooks:

```js
// main.js
export const name = 'MyAddon';

export function onReady(client) {
  // Called when bot connects
}

export function onMessageCreate(message, client) {
  // Called for every message
}
```

Core:
1. Imports the file
2. Stores exported functions
3. Wires up event handlers
4. Calls `onReady` when appropriate

## Lifecycle Hooks

### Available Hooks

| Hook | Parameters | When Called |
|------|------------|-------------|
| `onReady` | `(client)` | Bot connects to Discord |
| `onMessageCreate` | `(message, client)` | Message sent in accessible channel |
| `onGuildMemberAdd` | `(member, client)` | User joins a guild |
| `onGuildMemberRemove` | `(member, client)` | User leaves a guild |
| `onInteractionCreate` | `(interaction, client)` | Any interaction received |

### Hook Registration

Hooks are registered based on exported function names:

```js
// If you export onMessageCreate, Core registers it
export function onMessageCreate(message, client) {
  // This gets called for messages
}

// Typos are silently ignored
export function onMessageCraete(message, client) {
  // Never called - typo in name
}
```

## Priority System

The `priority` field controls load order:

```ini
priority: 100  # Loads first
priority: 50   # Loads second
priority: 0    # Default
priority: -10  # Loads last
```

Use cases:
- **High priority**: Core systems other addons depend on
- **Normal priority**: Most addons
- **Low priority**: Logging, cleanup, analytics

## The Client Object

Core extends the Discord.js Client with additional properties:

```js
client.commands      // Collection of loaded commands
client.interactions  // InteractionRegistry for handlers
```

Access globally:
```js
const client = globalThis.client;
```

## Interaction Registry

Buttons, modals, and select menus are handled by the InteractionRegistry:

```js
// Register a handler
client.interactions.register({
  type: 'button',
  customId: 'confirm',
  matchType: 'exact',
  handler: async (interaction, client, logger) => {
    await interaction.reply('Confirmed!');
    return true;
  },
  priority: 0,
  source: 'MyAddon'
});
```

### Handler Resolution

When an interaction arrives:

1. Core determines the interaction type
2. Finds handlers matching the customId
3. Sorts by priority (highest first)
4. Calls handlers until one returns `true`

### Match Types

```js
// Exact - customId must match exactly
{ customId: 'confirm-btn', matchType: 'exact' }
// Matches: confirm-btn
// Doesn't match: confirm-btn-123

// Prefix - customId must start with pattern
{ customId: 'ticket-', matchType: 'prefix' }
// Matches: ticket-123, ticket-abc
// Doesn't match: my-ticket-123

// Regex - customId must match pattern
{ customId: '^user-\\d+$', matchType: 'regex' }
// Matches: user-123, user-9999
// Doesn't match: user-abc, the-user-123
```

## Error Handling

Core catches errors at multiple levels:

### Addon Load Errors

```js
// If main.js throws during import
export function onReady() {
  throw new Error('Initialization failed');
}
// Core logs error and continues with other addons
```

### Interaction Errors

```js
// If handler throws
handler: async (interaction) => {
  throw new Error('Handler failed');
}
// Core catches, logs, and tries next handler
```

### Event Errors

```js
// If event handler throws
export function onMessageCreate(message) {
  throw new Error('Event failed');
}
// Core catches and logs, but continues processing
```

## Debugging

### Enable Debug Mode

Set `DEBUG=true` in your `.env`:

```bash
DEBUG=true
```

You'll see detailed logs:

```
[debug] Loading intent configurations...
[debug] Intent GUILD_MEMBERS requested by Welcome
[debug] Building intent configuration...
[debug] Creating Discord client with configured intents...
[debug] Registered exact button handler: "confirm" from MyAddon
```

### Check Load Results

Core logs a summary after loading:

```
[info] Starting RiktigaTomten's Core...
[info] Setting up Discord bot...
[info] 🔐 Connecting to Discord...
[success] Bot fully loaded and ready in 802ms
[info] Connected to Discord as: MyBot#1234
[info] Serving 5 server(s) with 1234 users
```

## Performance Considerations

### Addon Load Time

- Large addons slow startup
- Use lazy loading for heavy dependencies
- Consider splitting into extensions

### Intent Efficiency

- Only request intents you use
- Privileged intents (GUILD_MEMBERS, MESSAGE_CONTENT) have stricter requirements

### Handler Efficiency

- Use specific match types over regex when possible
- Set appropriate priorities to avoid unnecessary handler calls
- Return `true` from handlers to stop propagation

## What's Next?

- [Event System](/docs/events) — AddonBus for cross-addon communication
- [Database Integration](/docs/database) — Storing persistent data
- [API Reference](/reference/api) — Full Core API
