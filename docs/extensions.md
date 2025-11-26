---
title: Extensions System
description: Create nested addons with the Extensions system
---

# Extensions System

Extensions are nested addons that live inside a parent addon. They allow you to break complex functionality into smaller, manageable pieces while keeping related code together.

## Why Use Extensions?

Consider a ticket system addon. It might need:
- Core ticket creation/management
- Logging of all ticket actions
- Staff assignment system
- Analytics dashboard
- API for external integrations

Instead of cramming everything into one addon, you can split it:

```
addons/
└── Tickets/
    ├── addon.info
    ├── main.js              # Core ticket logic
    └── extensions/
        ├── Logger/          # Logs all ticket events
        │   ├── addon.info
        │   └── main.js
        ├── StaffAssign/     # Staff assignment features
        │   ├── addon.info
        │   └── main.js
        └── Analytics/       # Usage statistics
            ├── addon.info
            └── main.js
```

## Benefits

- **Modularity**: Enable/disable features independently
- **Organization**: Keep related code together
- **Reusability**: Move extensions between addons
- **Maintainability**: Smaller files are easier to understand
- **Team Development**: Different people can work on different extensions

## Creating Extensions

### Step 1: Enable Extensions in Parent

Add the `extensions` field to your parent addon's `addon.info`:

```ini
# addons/Tickets/addon.info
author: YourName
version: 1.0.0
addonfile: ./main.js
extensions: ./extensions/
```

### Step 2: Create Extension Directory

```bash
mkdir -p addons/Tickets/extensions/Logger
```

### Step 3: Create Extension addon.info

```ini
# addons/Tickets/extensions/Logger/addon.info
author: YourName
version: 1.0.0
addonfile: ./main.js
priority: 5
```

### Step 4: Create Extension Logic

```js
// addons/Tickets/extensions/Logger/main.js
import { AddonBus, logger } from '#core';

export const name = 'Tickets-Logger';

export function onReady(client) {
  logger.info('[Tickets-Logger] Logger extension loaded');
  
  // Listen for events from the parent addon
  AddonBus.onEvent('tickets:created', (data) => {
    logger.info(`[Tickets] Ticket #${data.ticketId} created by ${data.userId}`);
  });
  
  AddonBus.onEvent('tickets:closed', (data) => {
    logger.info(`[Tickets] Ticket #${data.ticketId} closed`);
  });
}
```

## Extension Loading Order

Extensions load **after** their parent addon. Within extensions, the `priority` field controls order:

```ini
# Higher priority loads first
priority: 10  # Loads before priority: 5
```

This is useful when extensions depend on each other.

## Communication Patterns

### Parent → Extension

The parent addon emits events that extensions listen to:

```js
// Parent addon (main.js)
import { AddonBus } from '#core';

function createTicket(userId, subject) {
  // ... create ticket logic ...
  
  // Emit event for extensions
  AddonBus.emitEvent('tickets:created', {
    ticketId: ticket.id,
    userId,
    subject,
    timestamp: Date.now()
  });
}
```

```js
// Extension (Logger/main.js)
import { AddonBus } from '#core';

AddonBus.onEvent('tickets:created', (data) => {
  // Log the event
  saveToLogFile(data);
});
```

### Extension → Parent

Extensions can also emit events:

```js
// Extension emits
AddonBus.emitEvent('tickets-analytics:reportGenerated', { reportId: 123 });

// Parent or other extension listens
AddonBus.onEvent('tickets-analytics:reportGenerated', handleReport);
```

### Shared State via Registry

For more complex data sharing, use the AddonRegistry:

```js
// Parent registers an API
import { AddonRegistry } from '#core';

const ticketAPI = {
  getTicket: (id) => { /* ... */ },
  closeTicket: (id) => { /* ... */ },
};

AddonRegistry.register('tickets', 'api', ticketAPI);
```

```js
// Extension uses the API
import { AddonRegistry } from '#core';

const api = AddonRegistry.get('tickets', 'api');
const ticket = api.getTicket(123);
```

## Extension Structure Examples

### Minimal Extension

```
Extension/
└── addon.info
```

With just a commandfile:
```ini
author: YourName
commandfile: ./command.js
```

### Full Extension

```
Extension/
├── addon.info
├── main.js
├── intents.js
├── commands.js
└── database/
    └── schema.sql
```

### Extension with Sub-Extensions

Yes, extensions can have their own extensions!

```
addons/
└── Tickets/
    └── extensions/
        └── Analytics/
            ├── addon.info
            ├── main.js
            └── extensions/        # Sub-extensions
                └── Charts/
                    ├── addon.info
                    └── main.js
```

## Enabling/Disabling Extensions

Set `enabled: false` in the extension's `addon.info`:

```ini
# addons/Tickets/extensions/Analytics/addon.info
author: YourName
addonfile: ./main.js
enabled: false
```

The extension won't load, but you don't need to delete it.

## Best Practices

### 1. Use Namespaced Events

Always namespace your events to avoid collisions:

```js
// Good
AddonBus.emitEvent('tickets:created', data);
AddonBus.emitEvent('tickets-logger:logged', data);

// Bad - might conflict with other addons
AddonBus.emitEvent('created', data);
```

### 2. Keep Extensions Focused

Each extension should do one thing well. If an extension is getting too large, consider splitting it.

### 3. Document Dependencies

If an extension requires the parent addon to emit certain events, document it:

```js
/**
 * Tickets-Logger Extension
 * 
 * Requires parent to emit:
 * - tickets:created  { ticketId, userId, subject }
 * - tickets:closed   { ticketId, closedBy }
 * - tickets:updated  { ticketId, changes }
 */
```

### 4. Handle Missing Parent Gracefully

```js
import { AddonRegistry, logger } from '#core';

export function onReady(client) {
  const ticketAPI = AddonRegistry.get('tickets', 'api');
  
  if (!ticketAPI) {
    logger.warn('[Tickets-Logger] Parent API not found, some features disabled');
    return;
  }
  
  // Continue with normal initialization
}
```

## Use Cases

### Feature Flags
Enable/disable features by toggling extensions:
- `Premium/` - Premium-only features
- `Beta/` - Beta features for testing

### Logging & Monitoring
- `Logger/` - Log all events to file
- `Metrics/` - Send metrics to monitoring service

### Integration Points
- `API/` - REST API for external access
- `Webhooks/` - Send notifications to external services

### Optional Functionality
- `Reminders/` - Optional reminder system
- `Archives/` - Optional ticket archiving

## What's Next?

- [Event System](/docs/events) — Deep dive into AddonBus
- [Addon Architecture](/docs/addon-architecture) — How addons work internally
- [API Reference](/reference/api) — Full Core API documentation
