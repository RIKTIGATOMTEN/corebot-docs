---
title: Event System
description: Cross-addon communication with the AddonBus
---

# Event System (AddonBus)

The AddonBus is Core's event system for communication between addons. It allows addons to emit events and listen for events from other addons without tight coupling.

## Why Use AddonBus?

Without an event bus, addons would need to:
- Import each other directly (creates dependencies)
- Know about each other's internals
- Break when other addons change

With AddonBus:
- Addons communicate via events
- No direct imports needed
- Loosely coupled architecture
- Easy to add/remove listeners

## Basic Usage

### Emitting Events

```js
import { AddonBus } from '#core';

// Emit an event with data
AddonBus.emitEvent('tickets:created', {
  ticketId: 123,
  userId: '456789',
  subject: 'Help needed'
});

// Emit without data
AddonBus.emitEvent('tickets:systemCheck');
```

### Listening for Events

```js
import { AddonBus } from '#core';

// Listen for events
AddonBus.onEvent('tickets:created', (data) => {
  console.log(`Ticket ${data.ticketId} was created`);
});

// One-time listener
AddonBus.onceEvent('tickets:created', (data) => {
  console.log('First ticket created!');
  // Automatically removed after first call
});
```

## Namespacing

Events use a namespace format: `addonName:eventName`

```js
// Recommended: colon notation
AddonBus.emitEvent('tickets:created', data);
AddonBus.onEvent('tickets:created', handler);
```

### Why Namespaces?

Namespaces prevent collisions between addons:

```js
// Without namespaces (bad)
AddonBus.emitEvent('created', data);  // Which addon? Confusing!

// With namespaces (good)
AddonBus.emitEvent('tickets:created', data);  // Clear!
AddonBus.emitEvent('users:created', data);    // Different event!
```

## API Reference

### emitEvent(namespacedEvent, data?)

Emit an event to all listeners using colon notation (recommended).

```js
AddonBus.emitEvent('myAddon:eventName', { any: 'data' });
```

**Returns**: `boolean` - `true` if any listeners were called

::: tip Preferred Method
`emitEvent` with colon notation is the recommended way to emit events. It's clearer and more consistent.
:::

### onEvent(namespacedEvent, listener)

Add a persistent listener using colon notation.

```js
AddonBus.onEvent('myAddon:eventName', (data) => {
  // Called every time event is emitted
});
```

**Returns**: `AddonBus` (for chaining)

### onceEvent(namespacedEvent, listener)

Add a one-time listener (removed after first call).

```js
AddonBus.onceEvent('myAddon:ready', () => {
  console.log('Addon is ready (only logged once)');
});
```

### offEvent(namespacedEvent, listener)

Remove a specific listener.

```js
const handler = (data) => console.log(data);

// Add
AddonBus.onEvent('myAddon:event', handler);

// Remove
AddonBus.offEvent('myAddon:event', handler);
```

### offAll(addonName, eventName)

Remove all listeners for an event.

```js
AddonBus.offAll('myAddon', 'event');
```

### getStats()

Get bus statistics.

```js
const stats = AddonBus.getStats();
console.log(stats);
// {
//   totalEvents: 150,
//   listeners: { 'tickets:created': 3, 'users:joined': 1 },
//   totalEmissions: 500
// }
```

## Patterns

### Event-Driven Architecture

Structure your addons around events:

```js
// tickets/main.js - Emits events
import { AddonBus } from '#core';

export function createTicket(userId, subject) {
  const ticket = saveTicket(userId, subject);
  
  AddonBus.emitEvent('tickets:created', {
    ticketId: ticket.id,
    userId,
    subject,
    createdAt: Date.now()
  });
  
  return ticket;
}

export function closeTicket(ticketId, closedBy) {
  const ticket = markClosed(ticketId);
  
  AddonBus.emitEvent('tickets:closed', {
    ticketId,
    closedBy,
    closedAt: Date.now()
  });
  
  return ticket;
}
```

```js
// logger/main.js - Listens for events
import { AddonBus } from '#core';

export function onReady() {
  AddonBus.onEvent('tickets:created', logTicketCreated);
  AddonBus.onEvent('tickets:closed', logTicketClosed);
}

function logTicketCreated(data) {
  saveToLog('TICKET_CREATED', data);
}

function logTicketClosed(data) {
  saveToLog('TICKET_CLOSED', data);
}
```

### Async Event Handling

Listeners can be async:

```js
AddonBus.onEvent('tickets:created', async (data) => {
  await sendNotification(data.userId);
  await updateDashboard(data);
});
```

::: warning
The emitter doesn't wait for async listeners. If you need to wait, use a different pattern (like the Registry).
:::

### Request-Response Pattern

For when you need a response, combine Bus with Registry:

```js
// Provider addon
import { AddonRegistry, AddonBus } from '#core';

const api = {
  getUser: async (userId) => {
    return await fetchUser(userId);
  }
};

AddonRegistry.register('users', 'api', api);

// Consumer addon
import { AddonRegistry } from '#core';

const usersAPI = AddonRegistry.get('users', 'api');
const user = await usersAPI.getUser('123');
```

### Plugin System

Use events to make your addon extensible:

```js
// Main addon
import { AddonBus } from '#core';

export function processMessage(message) {
  // Let extensions pre-process
  AddonBus.emitEvent('myAddon:beforeProcess', { message });
  
  // Main processing
  const result = doProcessing(message);
  
  // Let extensions post-process
  AddonBus.emitEvent('myAddon:afterProcess', { message, result });
  
  return result;
}
```

```js
// Extension
AddonBus.onEvent('myAddon:beforeProcess', ({ message }) => {
  // Modify message before processing
  message.content = message.content.toLowerCase();
});

AddonBus.onEvent('myAddon:afterProcess', ({ result }) => {
  // React to results
  analytics.track('message_processed', result);
});
```

## Best Practices

### 1. Use Descriptive Event Names

```js
// Good - clear what happened
AddonBus.emitEvent('tickets:created', data);
AddonBus.emitEvent('tickets:assignedToStaff', data);
AddonBus.emitEvent('tickets:escalatedToPriority', data);

// Bad - vague
AddonBus.emitEvent('tickets:update', data);
AddonBus.emitEvent('tickets:change', data);
```

### 2. Document Your Events

```js
/**
 * Events emitted by the Tickets addon:
 * 
 * tickets:created
 *   Data: { ticketId, userId, subject, createdAt }
 *   When: A new ticket is opened
 * 
 * tickets:closed
 *   Data: { ticketId, closedBy, closedAt, resolution }
 *   When: A ticket is closed
 * 
 * tickets:assigned
 *   Data: { ticketId, staffId, assignedAt }
 *   When: Ticket is assigned to staff
 */
```

### 3. Include Relevant Data

```js
// Good - includes everything listeners might need
AddonBus.emitEvent('users:levelUp', {
  userId: user.id,
  username: user.username,
  previousLevel: oldLevel,
  newLevel: newLevel,
  xpRequired: xpForNextLevel,
  timestamp: Date.now()
});

// Bad - missing useful context
AddonBus.emitEvent('users:levelUp', { id: user.id });
```

### 4. Clean Up Listeners

```js
// Store reference to remove later
const handler = (data) => processData(data);
AddonBus.onEvent('addon:event', handler);

// Clean up when needed
AddonBus.offEvent('addon:event', handler);
```

### 5. Handle Missing Events Gracefully

```js
// Don't assume events will be emitted
let initialized = false;

AddonBus.onceEvent('core:ready', () => {
  initialized = true;
});

// Have a fallback
setTimeout(() => {
  if (!initialized) {
    logger.warn('Core ready event not received, initializing anyway');
    initialize();
  }
}, 5000);
```

## Debugging Events

### Enable Debug Mode

With `DEBUG=true`, the bus logs activity:

```
[debug] [AddonBus] Emitting: tickets:created (with data)
[debug] [AddonBus] Listener added: tickets:created
```

### Check Statistics

```js
const stats = AddonBus.getStats();
console.log('Total emissions:', stats.totalEmissions);
console.log('Listener counts:', stats.listeners);
```

### List Active Listeners

```js
// Get listeners for a specific event
const count = AddonBus.listenerCount('tickets', 'created');
console.log(`${count} listeners for tickets:created`);
```

## Common Issues

### Event Not Firing

1. Check the namespace spelling
2. Verify the listener was added before emit
3. Enable DEBUG mode to see bus activity

### Listener Called Multiple Times

1. Check you're not adding the listener multiple times
2. Use `once()` if you only want one call
3. Remove listeners when cleaning up

### Memory Leaks

1. Remove listeners when no longer needed
2. Don't add listeners in loops without removal
3. Use `once()` for one-time events

## What's Next?

- [Database Integration](/docs/database) — Persistent data storage
- [Addon Architecture](/docs/addon-architecture) — How addons work
- [API Reference](/reference/api) — Full Core API
