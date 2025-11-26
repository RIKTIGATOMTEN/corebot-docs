---
title: Database Integration
description: Storing and retrieving data with Core's database layer
---

# Database Integration

Core provides a built-in database layer using SQLite. It handles connection management, schema initialization, and query execution so you can focus on your addon's logic.

## Overview

The database system includes:
- **SQLite** for local storage (with WAL mode for performance)
- **Automatic schema loading** from `.sql` files
- **MySQL syntax conversion** for portability
- **Connection pooling** and pragma management
- **Query validation** and error handling

## Quick Start

### 1. Create a Schema File

```sql
-- addons/MyAddon/database/schema.sql
CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  points INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Query the Database

```js
import { db } from '#core';

// Insert
db.prepare(`
  INSERT INTO user_data (user_id, points) VALUES (?, ?)
`).run(userId, 100);

// Select
const user = db.prepare(`
  SELECT * FROM user_data WHERE user_id = ?
`).get(userId);

// Update
db.prepare(`
  UPDATE user_data SET points = points + ? WHERE user_id = ?
`).run(50, userId);
```

That's it! Core automatically discovers and initializes your schema.

## Configuration

The database is configured in `config/database.yaml`:

```yaml
database:
  # Where SQLite files are stored
  path: ./database/
  
  # Database filename
  name: bot.db
  
  # Write-Ahead Logging (recommended for performance)
  journal_mode: wal
  
  # Balance of safety and speed
  # Options: off, normal, full, extra
  synchronous: normal
  
  # Enable query logging
  debug: false
  
  # Enable foreign key constraints
  foreign_keys: true
  
  # Cache size in KB (negative) or pages (positive)
  cache_size: -2000
  
  # Where to store temp tables
  # Options: default, file, memory
  temp_store: memory
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `path` | `./database/` | Directory for database files |
| `name` | `bot.db` | Database filename |
| `journal_mode` | `wal` | SQLite journal mode |
| `synchronous` | `normal` | Sync mode (safety vs speed) |
| `debug` | `false` | Log all queries |
| `foreign_keys` | `true` | Enable FK constraints |
| `cache_size` | `-2000` | Cache size (2MB) |
| `temp_store` | `memory` | Temp table storage |

## Schema Files

### Location

Place `.sql` files anywhere in your addon's `database/` folder:

```
addons/
└── MyAddon/
    └── database/
        ├── schema.sql        # Main tables
        ├── views.sql         # Database views
        └── indexes.sql       # Custom indexes
```

Core recursively finds all `.sql` files.

### Schema Format

Use standard SQL with `IF NOT EXISTS` for safety:

```sql
-- Tables
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user 
ON transactions(user_id);

-- Views
CREATE VIEW IF NOT EXISTS user_balances AS
SELECT 
  u.id,
  u.discord_id,
  COALESCE(SUM(t.amount), 0) as balance
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id;
```

### MySQL Compatibility

Core automatically converts common MySQL syntax to SQLite:

| MySQL | Converted To |
|-------|--------------|
| `AUTO_INCREMENT` | `AUTOINCREMENT` |
| `INT` | `INTEGER` |
| `VARCHAR(n)` | `TEXT` |
| `DATETIME` | `DATETIME` |
| `ENGINE=InnoDB` | (removed) |
| `` ` `` backticks | (removed) |

This means you can write MySQL-style schemas and they'll work with SQLite.

## Querying

### Basic Queries

```js
import { db } from '#core';

// Run (for INSERT, UPDATE, DELETE)
const result = db.prepare(`
  INSERT INTO users (discord_id, username) VALUES (?, ?)
`).run(discordId, username);

console.log(result.lastInsertRowid);  // Auto-generated ID
console.log(result.changes);          // Rows affected

// Get (returns first row or undefined)
const user = db.prepare(`
  SELECT * FROM users WHERE discord_id = ?
`).get(discordId);

// All (returns array of rows)
const users = db.prepare(`
  SELECT * FROM users WHERE created_at > ?
`).all(yesterday);
```

### Prepared Statements

For frequently-used queries, prepare once and reuse:

```js
// Prepare once
const getUser = db.prepare(`
  SELECT * FROM users WHERE discord_id = ?
`);

const addPoints = db.prepare(`
  UPDATE users SET points = points + ? WHERE discord_id = ?
`);

// Use many times
const user1 = getUser.get('123');
const user2 = getUser.get('456');
addPoints.run(100, '123');
```

### Transactions

For multiple related operations:

```js
import { db } from '#core';

const transfer = db.transaction((from, to, amount) => {
  db.prepare(`
    UPDATE accounts SET balance = balance - ? WHERE user_id = ?
  `).run(amount, from);
  
  db.prepare(`
    UPDATE accounts SET balance = balance + ? WHERE user_id = ?
  `).run(amount, to);
  
  db.prepare(`
    INSERT INTO transfers (from_user, to_user, amount) VALUES (?, ?, ?)
  `).run(from, to, amount);
});

// Execute transaction
transfer('user1', 'user2', 500);
```

If any statement fails, the entire transaction is rolled back.

### Parameterized Queries

**Always use parameters** to prevent SQL injection:

```js
// ✅ Good - parameterized
db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);

// ✅ Good - named parameters
db.prepare(`SELECT * FROM users WHERE id = :id`).get({ id: userId });

// ❌ Bad - string concatenation (SQL injection risk!)
db.prepare(`SELECT * FROM users WHERE id = ${userId}`).get();
```

## Advanced Usage

### Execute Multiple Queries

```js
import { executeQueries } from '#core';

const queries = [
  { sql: 'INSERT INTO logs (message) VALUES (?)', params: ['Log 1'] },
  { sql: 'INSERT INTO logs (message) VALUES (?)', params: ['Log 2'] },
  { sql: 'UPDATE counters SET value = value + 1 WHERE name = ?', params: ['logs'] },
];

await executeQueries(queries);
```

### Check If Table Exists

```js
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name=?
`).get('users');

if (tableExists) {
  // Table exists
}
```

### Get Table Schema

```js
const columns = db.prepare(`PRAGMA table_info(users)`).all();
console.log(columns);
// [
//   { cid: 0, name: 'id', type: 'INTEGER', notnull: 0, dflt_value: null, pk: 1 },
//   { cid: 1, name: 'username', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
//   ...
// ]
```

### Custom Functions

Register custom SQL functions:

```js
db.function('discord_mention', (userId) => `<@${userId}>`);

const result = db.prepare(`
  SELECT discord_mention(user_id) as mention FROM users
`).all();
// [{ mention: '<@123456>' }, ...]
```

## Caching

For frequently accessed data, use the cache layer:

```js
import { JSONCacheManager } from '#core';

const cache = new JSONCacheManager('my-addon-settings');

// Load from cache
const settings = await cache.load();

// Save to cache
await cache.save({ theme: 'dark', notifications: true });

// Update cache
await cache.update((current) => ({
  ...current,
  lastUpdated: Date.now()
}));

// Clear cache
await cache.clear();
```

### Binary Cache

For performance-critical data:

```js
import { CacheManager } from '#core';

const cache = new CacheManager(
  'my-binary-cache',
  (data) => Buffer.from(JSON.stringify(data)),  // encoder
  (buffer) => JSON.parse(buffer.toString())      // decoder
);
```

## Best Practices

### 1. Use IF NOT EXISTS

Always include `IF NOT EXISTS` in CREATE statements:

```sql
CREATE TABLE IF NOT EXISTS users (...);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 2. Add Indexes for Frequent Queries

```sql
-- If you often query by discord_id
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_id, created_at);
```

### 3. Use Transactions for Related Operations

```js
const createUserWithProfile = db.transaction((userData, profileData) => {
  const { lastInsertRowid: userId } = db.prepare(`
    INSERT INTO users (name) VALUES (?)
  `).run(userData.name);
  
  db.prepare(`
    INSERT INTO profiles (user_id, bio) VALUES (?, ?)
  `).run(userId, profileData.bio);
  
  return userId;
});
```

### 4. Handle Errors

```js
try {
  db.prepare(`INSERT INTO users (id) VALUES (?)`).run(duplicateId);
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    // Handle duplicate
  } else {
    throw error;
  }
}
```

### 5. Close Connections on Shutdown

Core handles this automatically, but if you need manual control:

```js
import { closeDatabase } from '#core';

process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});
```

## Troubleshooting

### Database Locked

**Cause**: Multiple processes accessing the same database

**Solutions**:
- Use WAL mode (default)
- Ensure only one bot instance runs
- Use transactions for long operations

### Schema Not Loading

**Check**:
1. `.sql` files are in a `database/` folder in your addon
2. SQL syntax is valid
3. `DEBUG=true` to see loading logs

### Query Performance

**Tips**:
- Add indexes for WHERE columns
- Use EXPLAIN to analyze queries
- Batch inserts with transactions
- Use prepared statements

### Foreign Key Errors

**Cause**: `foreign_keys: true` but referenced row doesn't exist

**Solutions**:
- Insert parent row first
- Use `ON DELETE CASCADE` for auto-cleanup
- Check `foreign_keys` setting in config

## What's Next?

- [API Reference](/reference/api) — Full database API
- [Event System](/docs/events) — React to data changes
- [Configuration](/reference/configuration) — All config options
