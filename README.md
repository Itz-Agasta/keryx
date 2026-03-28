# Keryx

A terminal PostgreSQL client with a Rust backend and INK TUI. The TUI spawns the Rust backend as a child process. They communicate via newline-delimited JSON over stdin/stdout.

## Usage

```sh
# From apps/tui — runs both TUI dev server
bun run start
```

## Keyboard Shortcuts

| Key          | Action                                  |
| ------------ | --------------------------------------- |
| `Tab`        | Switch fields (connection screen)       |
| `Enter`      | Connect (connection screen)             |
| `Ctrl+E`     | Execute query                           |
| `Ctrl+T`     | Toggle table browser                    |
| `Ctrl+R`     | Refresh table list                      |
| `Ctrl+D`     | Disconnect                              |
| `Ctrl+C`     | Quit                                    |
| `Up/Down`    | Scroll results / navigate query history |
| `Left/Right` | Scroll results horizontally             |
