---
title: Error Codes
description: Reference for error codes and handling in Core
---

# Error Codes

Core provides a comprehensive error handling system that gives you human-readable error messages with solutions. This page documents common error codes and how to handle them.

## How Errors Work

When Core encounters an error, it:

1. Identifies the error code
2. Looks up a user-friendly explanation
3. Displays the error with severity, description, and solution
4. In debug mode, shows technical details

```
🚨 Database Connection Failed [startup] 23:31:48
The bot cannot connect to the database server. This usually means
the database is not running or the connection settings are incorrect.
Check if your database server is running and verify your connection
settings in the .env file (host, port, username, password).
⚠️  Severity: CRITICAL
```

## Using the ErrorHandler

```js
import { ErrorHandler, logger } from '#core';

try {
  await riskyOperation();
} catch (error) {
  // Formatted error with solution
  ErrorHandler.handleError(error, 'MyAddon', logger);
}
```

### Adding Custom Error Mappings

```js
ErrorHandler.addErrorMapping('MY_CUSTOM_ERROR', {
  title: 'Custom Error Title',
  description: 'What happened and why.',
  solution: 'How to fix it.',
  severity: 'medium'  // critical, high, medium, low
});
```

---

## Database Errors

Core uses SQLite via better-sqlite3. While the error mapping includes MySQL error codes for historical reasons, most database errors you'll encounter are SQLite-specific.

### SQLITE_CANTOPEN

| | |
|-|-|
| **Title** | Cannot Open Database |
| **Severity** | Critical |
| **Description** | SQLite cannot open the database file. |
| **Solution** | Check that the `database/` directory exists and is writable. Ensure no other process has the file locked. |

**Common Causes**:
- Directory doesn't exist
- Permission denied
- File locked by another process

### SQLITE_CORRUPT

| | |
|-|-|
| **Title** | Database Corrupted |
| **Severity** | Critical |
| **Description** | The SQLite database file is corrupted. |
| **Solution** | Delete the database file and restart. If you have backups, restore from backup. |

**Common Causes**:
- Improper shutdown
- Disk failure
- Concurrent access issues

### ER_NO_SUCH_TABLE

| | |
|-|-|
| **Title** | Database Table Missing |
| **Severity** | High |
| **Description** | A required table is missing from the database. |
| **Solution** | Run the database migration scripts to create the required tables, or check if the table name is correct. |

**Common Causes**:
- Schema not initialized
- Table dropped accidentally
- Typo in table name
- Using wrong database

---

## Discord API Errors

### DISCORD_API_ERROR

| | |
|-|-|
| **Title** | Discord API Error |
| **Severity** | Medium |
| **Description** | There was an error communicating with Discord's servers. |
| **Solution** | Check your bot token and permissions. If the issue persists, Discord's API might be experiencing issues. |

**Common Causes**:
- Invalid bot token
- Discord outage
- Rate limiting
- Invalid request data

### MISSING_PERMISSIONS

| | |
|-|-|
| **Title** | Bot Missing Permissions |
| **Severity** | Medium |
| **Description** | The bot doesn't have the required permissions to perform this action. |
| **Solution** | Check the bot's role permissions in your Discord server settings. |

**Common Causes**:
- Bot role too low in hierarchy
- Missing specific permissions
- Channel-level permission overrides

---

## Network Errors

### ENOTFOUND

| | |
|-|-|
| **Title** | Network Connection Error |
| **Severity** | High |
| **Description** | Cannot resolve the hostname. This could be a network connectivity issue. |
| **Solution** | Check your internet connection and verify the server hostname is correct. |

**Common Causes**:
- No internet connection
- DNS resolution failure
- Hostname typo

### ETIMEDOUT

| | |
|-|-|
| **Title** | Connection Timeout |
| **Severity** | Medium |
| **Description** | The connection to the server timed out. |
| **Solution** | Check your network connection and server availability. The server might be overloaded. |

**Common Causes**:
- Server overloaded
- Network congestion
- Firewall issues
- Server not responding

---

## Protection Errors

Thrown by the `protect()` function:

### REQUEST_DUPLICATE

| | |
|-|-|
| **Severity** | Low |
| **Description** | The same request is already being processed. |
| **Solution** | Wait for the current request to complete before retrying. |

```js
import { protect } from '#core';

try {
  await protect(userId, 'action', doSomething);
} catch (error) {
  if (error.code === 'REQUEST_DUPLICATE') {
    await interaction.reply({
      content: 'Please wait, your request is being processed.',
      ephemeral: true
    });
  }
}
```

### RATE_LIMITED

| | |
|-|-|
| **Severity** | Low |
| **Description** | User has exceeded the rate limit for this action. |
| **Solution** | Wait before retrying. |

```js
try {
  await protect(userId, 'action', doSomething);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    await interaction.reply({
      content: `Slow down! Try again in ${error.retryAfter} seconds.`,
      ephemeral: true
    });
  }
}
```

---

## SQLite Errors

### SQLITE_CONSTRAINT_UNIQUE

| | |
|-|-|
| **Description** | Attempted to insert a duplicate value in a unique column. |
| **Solution** | Use INSERT OR REPLACE, or check if record exists first. |

```js
try {
  db.prepare('INSERT INTO users (id) VALUES (?)').run(userId);
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    // User already exists
  }
}
```

### SQLITE_CONSTRAINT_FOREIGNKEY

| | |
|-|-|
| **Description** | Foreign key constraint violation. |
| **Solution** | Ensure referenced record exists before inserting. |

### SQLITE_BUSY

| | |
|-|-|
| **Description** | Database is locked by another process. |
| **Solution** | Use WAL mode, retry with backoff, or ensure single writer. |

### SQLITE_READONLY

| | |
|-|-|
| **Description** | Attempted to write to a read-only database. |
| **Solution** | Check file permissions and database path. |

---

## Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| **Critical** | Red background | System cannot function, immediate action required |
| **High** | Red | Major functionality broken |
| **Medium** | Yellow | Feature affected but workarounds exist |
| **Low** | Cyan | Minor issue, can be ignored temporarily |

---

## Best Practices

### 1. Always Catch Errors

```js
// Bad - errors crash your addon
await doRiskyThing();

// Good - handle gracefully
try {
  await doRiskyThing();
} catch (error) {
  ErrorHandler.handleError(error, 'MyAddon');
  // Optionally notify user
}
```

### 2. Use Appropriate Response

```js
try {
  await createTicket(userId);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // User error - inform them
    await interaction.reply({
      content: 'Please slow down!',
      ephemeral: true
    });
  } else {
    // System error - log and generic message
    ErrorHandler.handleError(error, 'Tickets');
    await interaction.reply({
      content: 'Something went wrong. Please try again later.',
      ephemeral: true
    });
  }
}
```

### 3. Add Context

```js
// With context - easier to debug
ErrorHandler.handleError(error, 'Tickets/createTicket');

// Without context - harder to trace
ErrorHandler.handleError(error);
```

### 4. Don't Swallow Errors

```js
// Bad - silently fails
try {
  await doThing();
} catch (error) {
  // Nothing happens
}

// Good - at least log it
try {
  await doThing();
} catch (error) {
  logger.error('[MyAddon] doThing failed:', error.message);
}
```

### 5. Custom Error Types

For addon-specific errors:

```js
// Register once during initialization
ErrorHandler.addErrorMapping('TICKET_LIMIT_REACHED', {
  title: 'Ticket Limit Reached',
  description: 'You have reached the maximum number of open tickets.',
  solution: 'Please close some existing tickets before opening new ones.',
  severity: 'low'
});

// Throw when needed
const error = new Error('Too many tickets');
error.code = 'TICKET_LIMIT_REACHED';
throw error;
```

---

## Debug Mode

With `DEBUG=true`, errors include technical details:

```
🚨 Database Table Missing [Tickets] 23:31:48
A required table is missing from the database.
Run the database migration scripts to create the required tables.
⚠️  Severity: HIGH

Technical Details:
   Error Code: ER_NO_SUCH_TABLE
   Error Message: Table 'bot.tickets' doesn't exist
   SQL: SELECT * FROM tickets WHERE id = ?
```

Enable debug mode during development for maximum information.
