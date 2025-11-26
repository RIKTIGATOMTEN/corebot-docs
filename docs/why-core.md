---
title: Why Core?
description: The story behind Core and why it exists
---

# Why Core Exists

## The Problem

It all started with FiveM. I was making a lot of Discord bots for different servers, and I kept running into the same frustrating pattern: rewriting the same logic over and over again.

Every new bot meant:
- Setting up database connections again
- Recreating command handlers
- Rebuilding event systems
- Reinventing error handling
- Copy-pasting utility functions

I was spending more time on infrastructure than actually building the features my clients wanted.

## Building From Scratch vs Using Core

Let's be real—building a Discord bot from scratch is absolutely possible. Discord.js is well-documented and powerful. But here's what you'll end up building yourself:

### What You'd Need to Build

| Feature | From Scratch | With Core |
|---------|-------------|-----------|
| Command registration | ~200 lines | Built-in |
| Database setup | ~150 lines | Auto-configured |
| Intent management | Manual per feature | Declarative per addon |
| Error handling | DIY | Comprehensive system |
| Rate limiting | DIY | Built-in protection |
| Module system | DIY | Addon architecture |
| Event bus | DIY | Ready to use |
| Caching | DIY | Namespaced per addon |
| Logging | DIY | Timestamped + levels |

That's roughly **500-1000 lines** of infrastructure code before you write a single feature. And that's a conservative estimate.

### The Hidden Costs

Beyond the initial setup, there are ongoing costs:

- **Maintenance**: Every piece of infrastructure you write is code you have to maintain
- **Bug fixes**: Discord.js updates, database driver changes, security patches
- **Testing**: Infrastructure bugs are the hardest to catch and the most impactful
- **Consistency**: Without a framework, every project develops its own patterns

## The Solution

I started building Core as a simple framework to stop repeating myself. At first, it was basic—just a way to load modules and handle commands. But as I used it across more projects, it grew into something much more powerful.

The addon system changed everything. Instead of starting from scratch each time, I could:
- **Reuse** the same Core across all my projects
- **Focus** on building features, not infrastructure
- **Save** hours (sometimes days) of development time
- **Compose** functionality by mixing and matching addons

A ticket system from one project could be dropped into another. A leveling system could be extended with custom commands. Moderation tools could be shared across multiple bots.

## Why I'm Sharing This

I believe Core could help others who just want to build features without reinventing the wheel every time.

### Core Doesn't Lock You In

This isn't a restrictive framework with its own special way of doing things. Core simply:
- Handles the boring infrastructure stuff
- Runs your code directly
- Stays out of your way
- Gives you full access to Discord.js

You write normal TypeScript/JavaScript. You use Discord.js like you always would. Core just makes it modular and reusable.

### It's About Freedom

Want to structure your addon differently? Go ahead—as long as you have an `addon.info`, you're good.

Need to access the Discord client directly? It's right there via `globalThis.client`.

Want to use a different database? The database layer is completely optional.

Core provides the foundation, but you're in control.

## What Core Provides

### 🗄️ Database Layer
- SQLite support with automatic schema initialization
- Load schemas from `.sql` files—just drop them in your addon
- MySQL query syntax conversion for portability
- Connection pooling and pragma management

### 📡 Event Bus (AddonBus)
- Namespaced events to prevent collisions
- Emit events from one addon, listen in another
- Perfect for decoupled, modular architectures
- Stats collection and debugging tools

### 🔌 Addon Registry
- Register public APIs for cross-addon communication
- Dependency resolution between addons
- Metadata tracking and validation

### ⚡ Interaction System
- Centralized handler registration for buttons, modals, select menus
- Priority-based routing
- Supports exact, prefix, and regex matching

### 🛡️ Protection Utilities
- Built-in rate limiting per user/action
- Duplicate request detection
- Request tracking and statistics

### 📦 Caching System
- Namespaced cache per addon
- JSON or binary encoding options
- Automatic directory management

### 🎯 Intent Management
- Each addon declares its required intents
- Core automatically merges and optimizes
- Warnings for late intent requests

## The Philosophy

**Developer Experience First**: If it's annoying to use, it's not worth using. Core should make your life easier, not harder.

**Modularity Without Complexity**: Addons should be simple to create and easy to understand. No magic, no hidden behavior.

**Production Ready**: Built from real projects, for real projects. Rate limiting, error handling, and performance aren't afterthoughts.

**Open and Transparent**: No vendor lock-in, no black boxes. If you want to know how something works, read the code.

## Who Is Core For?

Core is ideal if you:

- ✅ Build multiple Discord bots and want to share functionality
- ✅ Want a clean, modular architecture without building it yourself
- ✅ Need production-ready features like rate limiting and error handling
- ✅ Prefer TypeScript but want JavaScript addon support too
- ✅ Value developer experience and fast iteration
- ✅ Are comfortable reading source code when docs are insufficient

Core might not be for you if you:

- ❌ Are building a one-off, simple bot (vanilla Discord.js might be enough)
- ❌ Need PostgreSQL, MySQL, or MongoDB (Core only supports SQLite)
- ❌ Need built-in sharding for 2,500+ server bots
- ❌ Prefer heavy abstraction over direct Discord.js access
- ❌ Need enterprise support or strict SLAs
- ❌ Want a web dashboard or GUI configuration

## Honest Limitations

No framework is perfect. Here's where Core falls short:

1. **SQLite only** — The database layer doesn't support other databases yet
2. **No sharding** — You'll implement this yourself for large bots
3. **Single maintainer** — Updates may be slow; this is a passion project
4. **Documentation gaps** — We're actively improving, but some areas are sparse
5. **Learning curve** — For simple bots, the addon structure adds friction

If any of these are dealbreakers, that's okay. Use what works for you.

## What's Next?

If this resonates with you, jump into the [Getting Started](/docs/getting-started) guide and build your first bot with Core. Check out [How Core Works](/docs/how-core-works) for a deep dive into the internals.

And if you find it useful, consider contributing back—whether that's reporting bugs, sharing your addons, or just letting others know about Core.

Happy building! 🚀