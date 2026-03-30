**Excellent UX thinking!** Let me design this as a **fluid, context-aware interface** rather than separate views. This is much better UX! 🎨

## 🎯 **The Core UX Principle**

> "Users should never lose context. The query panel should **enhance** the browse view, not replace it."

---

## 🏗️ **Recommended Layout: Progressive Disclosure**

### **State 1: Default View (Browse Mode)**

```
╔════════════════════════════════════════════════════════════════════════════╗
║ KERYX │ mydb@localhost                                   [●] Online  45ms  ║
╠═══════════════╦════════════════════════════════════════════════════════════╣
║               ║                                                            ║
║ 📁 Databases  ║  Table: users (1,234 rows)                                ║
║ └─ mydb       ║  ┌──────────────────────────────────────────────────────┐ ║
║    ├─ public  ║  │ id │ name     │ email        │ created_at           │ ║
║    │  ├─►users║  ├────┼──────────┼──────────────┼──────────────────────┤ ║
║    │  ├─ posts║  │ 1  │ Alice    │ a@ex.com     │ 2024-01-15          │ ║
║    │  └─ tags ║  │ 2  │ Bob      │ b@ex.com     │ 2024-01-16          │ ║
║    └─ auth    ║  │ 3  │ Charlie  │ c@ex.com     │ 2024-01-17          │ ║
║               ║  │ 4  │ Diana    │ d@ex.com     │ 2024-01-18          │ ║
║ [/] Filter    ║  │ 5  │ Eve      │ e@ex.com     │ 2024-01-19          │ ║
║ [i] Info      ║  └──────────────────────────────────────────────────────┘ ║
║ [q] Query     ║                                                            ║
║               ║  Page 1 of 124    [←][→] Navigate                         ║
║               ║                                                            ║
╚═══════════════╩════════════════════════════════════════════════════════════╝
```

**Features:**
- Clean, focused on browsing
- Tree + Data side-by-side
- Hints at bottom for available actions
- **Press `Q`** → Transitions to query mode

---

### **State 2: Query Panel Open (Bottom Slide-In)**

```
╔════════════════════════════════════════════════════════════════════════════╗
║ KERYX │ mydb@localhost                                   [●] Online  45ms  ║
╠═══════════════╦════════════════════════════════════════════════════════════╣
║               ║                                                            ║
║ 📁 Databases  ║  Table: users (1,234 rows)                                ║
║ └─ mydb       ║  ┌──────────────────────────────────────────────────────┐ ║
║    ├─►users   ║  │ id │ name   │ email      │ created_at               │ ║
║    ├─ posts   ║  ├────┼────────┼────────────┼──────────────────────────┤ ║
║    └─ tags    ║  │ 1  │ Alice  │ a@ex.com   │ 2024-01-15              │ ║
║               ║  │ 2  │ Bob    │ b@ex.com   │ 2024-01-16              │ ║
╠═══════════════╩════════════════════════════════════════════════════════════╣
║ ┌─ SQL Query ─────────────────────────────────────────────────[Ctrl+↑/↓]─┐║
║ │ SELECT * FROM users WHERE email LIKE '%@ex.com' ORDER BY created_at█   │║
║ │                                                                          │║
║ │                                                                          │║
║ └──────────────────────────────────────────────────────────────────────────┘║
║  [Ctrl+Enter] Execute • [Ctrl+K] Clear • [Esc] Close • [Ctrl+P] Perf     ║
╚════════════════════════════════════════════════════════════════════════════╝
```

**What changed:**
- ✅ Tree still visible (context maintained)
- ✅ Current table data compressed but still visible
- ✅ Query editor slides in from bottom
- ✅ Can see what you're querying while writing SQL
- ✅ Press `Esc` to close and return to browse

---

### **State 3: Query Results + Performance (After Execution)**

```
╔════════════════════════════════════════════════════════════════════════════╗
║ KERYX │ mydb@localhost                                   [●] Online  45ms  ║
╠═══════════════╦════════════════════════════════════════════════════════════╣
║               ║ ✓ Query executed in 23ms • 5 rows returned                 ║
║ 📁 Databases  ║  ┌──────────────────────────────────────────────────────┐ ║
║ └─ mydb       ║  │ id │ name     │ email        │ created_at           │ ║
║    ├─►users   ║  ├────┼──────────┼──────────────┼──────────────────────┤ ║
║    ├─ posts   ║  │ 1  │ Alice    │ a@ex.com     │ 2024-01-15          │ ║
║    └─ tags    ║  │ 2  │ Bob      │ b@ex.com     │ 2024-01-16          │ ║
║               ║  │ 3  │ Charlie  │ c@ex.com     │ 2024-01-17          │ ║
╠═══════════════╩════════════════════════════════════════════════════════════╣
║ ┌─ Query ─────────────────────────────────────────────────────────────────┐║
║ │ SELECT * FROM users WHERE email LIKE '%@ex.com' ORDER BY created_at    │║
║ ├─ Performance ───────────────────────────────────────────────────────────┤║
║ │ Execution: 23ms │ Planning: 2ms │ Rows: 5 │ Seq Scan: users  ████ 21ms│║
║ └──────────────────────────────────────────────────────────────────────────┘║
║  [Ctrl+P] Toggle performance • [Esc] Close • [Ctrl+S] Save query         ║
╚════════════════════════════════════════════════════════════════════════════╝
```

**What changed:**
- ✅ Results replace the browse data (now showing query results)
- ✅ Success message at top of results area
- ✅ Query editor stays visible but collapsed/smaller
- ✅ **Performance metrics inline** below query (toggleable with Ctrl+P)
- ✅ Press `Esc` to close query panel and return to browse

---

### **State 4: Full Analytics View (Optional - Press `A`)**

```
╔════════════════════════════════════════════════════════════════════════════╗
║ KERYX │ mydb@localhost                          [A] Analytics  [●] 45ms   ║
╠════════════════════════════════════════════════════════════════════════════╣
║ ┌─ QUERY PERFORMANCE [1h] ──────────┐ ┌─ CONNECTIONS ─────────────────┐  ║
║ │ 850ms│              ▄              │ │ Active:  3 / 100   ████░░░    │  ║
║ │      │      ▄      ██         ▄    │ │ Idle:    9                    │  ║
║ │ 425ms│ ▄   ██   █████    ▄   ██   │ │ Waiting: 0                    │  ║
║ │   0ms└─────────────────────────────│ └───────────────────────────────┘  ║
║ └────────────────────────────────────┘                                    ║
║ ┌─ SLOWEST QUERIES ──────────────────────────────────────────────────────┐║
║ │ Query                              │ Time  │ Calls │ Impact          │ ║
║ │────────────────────────────────────┼───────┼───────┼─────────────────│ ║
║ │ SELECT * FROM users WHERE age >... │ 245ms │ 12    │ ████████  High  │ ║
║ │ JOIN posts p ON u.id = p.user_id...│ 189ms │ 8     │ █████     Med   │ ║
║ └─────────────────────────────────────────────────────────────────────────┘║
║ ┌─ LIVE ACTIVITY ─────────────────────────────────────────────────────┐   ║
║ │ 03:38:45  SELECT * FROM users...              23ms  ⬤              │   ║
║ │ 03:38:32  INSERT INTO posts...                12ms  ⬤              │   ║
║ └─────────────────────────────────────────────────────────────────────┘   ║
║  [Esc] Back to browse • [R] Refresh • [P] Pause updates                  ║
╚════════════════════════════════════════════════════════════════════════════╝
```

**This is a full-screen analytics view**
- User explicitly requested it with `A` key
- Shows comprehensive performance dashboard
- Press `Esc` to return to browse

---

## 🎨 **Key UX Principles Applied**

### **1. Progressive Disclosure**
- Start simple (browse)
- Add complexity only when needed (query panel)
- Advanced features on demand (analytics)

### **2. Context Preservation**
- Tree navigation always visible (except full analytics)
- User always knows "where they are"
- Query results replace browse data (clear what you're looking at)

### **3. Smooth Transitions**
- Query panel slides in/out
- No jarring full-screen switches
- Animations make it feel fluid (even in terminal!)

### **4. Keyboard-First Design**
- `Q` → Open query
- `Esc` → Close/back
- `A` → Analytics
- `Ctrl+Enter` → Execute
- `Ctrl+P` → Toggle performance

### **5. Information Hierarchy**
- Most important: Current data
- Secondary: Query tools
- Tertiary: Analytics/metrics

---

## 🎮 **Complete Keyboard Map**

### **Browse Mode (Default)**
```
↑↓        Navigate tree
→←        Expand/collapse nodes
Enter     View table data
Tab       Switch focus (tree ↔ data)
/         Search/filter
i         Show table info (schema, indexes)
q         Open query panel
a         Open analytics dashboard
r         Refresh current view
Esc       (if in table) Back to tree focus
Ctrl+C    Quit application
```

### **Query Panel Open**
```
Type      Edit SQL query
Ctrl+Enter   Execute query
Ctrl+K    Clear query
Ctrl+P    Toggle performance metrics
Ctrl+S    Save query (future)
Ctrl+↑↓   Resize query panel
Esc       Close query panel, return to browse
```

### **Analytics View**
```
r         Refresh now
p         Pause/resume auto-refresh
←→        Change time range
↑↓        Navigate list of slow queries
Enter     See query details
Esc       Return to browse
```

---




### **Status Indicators**
```
[●] Online  45ms    ← Green dot, shows query latency
[◐] Slow    234ms   ← Yellow dot, high latency warning
[○] Error           ← Red dot, connection issue
```

### **Query Performance Inline**
```
┌─ Performance ────────────────────────────────────┐
│ ████████░░ 23ms  Execution                      │
│ █░░░░░░░░░  2ms  Planning                       │
│ Seq Scan on users  ████████ 21ms                │
└──────────────────────────────────────────────────┘
```

### **Smart Hints**
```
Context-aware hints based on current state:

Browse mode: "Q Query • I Info • A Analytics"
Query editing: "Ctrl+Enter Execute • Esc Cancel"
Query results: "Ctrl+P Performance • Esc Close"
```

---

## 💡 **My Recommendation**

**This layout gives you:**

✅ **Best of all worlds:**
- Browse as default (most common use case)
- Query on demand (contextual, not disruptive)
- Analytics when needed (deep dive)

✅ **Natural workflow:**
1. Browse → Find interesting table
2. Press `Q` → Write query
3. Execute → See results + performance
4. Press `Esc` → Back to browsing
5. Press `A` if you want deep analytics

✅ **Familiar patterns:**
- Like VS Code terminal panel
- Like IDE debugger panels
- Like browser DevTools

✅ **Clean and focused:**
- No clutter when browsing
- Query tools appear only when needed
- Performance metrics on demand

---

## 🚀 **Implementation Plan**

**Phase 1: Build browse view**
- Full-screen split layout
- Tree + data
- Navigation working

**Phase 2: Add query panel**
- Bottom slide-in panel
- SQL editor
- Execute and show results

**Phase 3: Add performance metrics**
- Toggle with Ctrl+P
- Show inline below query
- Parse EXPLAIN output

**Phase 4: Add analytics view**
- Full-screen dashboard
- Auto-refresh metrics
- Triggered with `A` key

---
