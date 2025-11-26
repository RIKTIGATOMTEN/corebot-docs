---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Core"
  text: "Build Discord Bots, Not Infrastructure"
  tagline: A modular framework with nested addon architecture — stop rewriting the same code for every bot
  actions:
    - theme: brand
      text: Get Started
      link: /docs/getting-started
    - theme: alt
      text: How It Works
      link: /docs/how-core-works
    - theme: alt
      text: GitHub
      link: https://github.com/riktigatomten/corebot

features:
  - icon: 🧩
    title: Nested Addon Architecture
    details: Create addons with sub-extensions. Build a ticket system with logging extensions, or a leveling system with rank commands — infinitely composable and reusable across projects.
  
  - icon: ⚡
    title: Zero Boilerplate
    details: Database connections, schema initialization, intent management, command registration, event routing, caching — all handled automatically so you can focus on features, not infrastructure.
  
  - icon: 📡
    title: Addon Event Bus
    details: Addons communicate through a powerful namespaced event system. Emit events from one addon and listen in another — perfect for decoupled, modular architectures without tight coupling.
  
  - icon: 🗄️
    title: Built-in Database Layer
    details: SQLite with automatic schema loading from SQL files. Just drop your .sql files in your addon's database folder and Core handles the rest. MySQL syntax auto-converts too.
  
  - icon: 🎯
    title: Declarative Intents
    details: Each addon declares its required intents in a simple file. Core automatically merges and optimizes gateway intents across all your addons — no duplicates, no waste.
  
  - icon: 🛡️
    title: Production Ready
    details: Rate limiting, duplicate request detection, formatted error handling with timing breakdowns, namespaced caching, and request tracking — battle-tested in real FiveM and Discord projects.

---

## No Lock-In

Core doesn't wrap Discord.js in abstractions. You get direct access to the `client`, you use Discord.js methods directly, and if you ever outgrow Core, refactoring is straightforward.

```js
// Your addon code - it's just Discord.js with structure
export function onReady(client) {
  // Full Discord.js client access
  console.log(`Logged in as ${client.user.tag}`);
}

export function onGuildMemberAdd(member, client) {
  member.guild.systemChannel?.send(`Welcome, ${member}!`);
}
```

## Honest About Limitations

Core isn't for everyone. It's **SQLite only**, has **no built-in sharding**, is maintained by **one developer**, and adds structure that might be overkill for simple bots.

[Read the honest assessment →](/docs/how-core-works#what-core-doesnt-do-well-honest-limitations)