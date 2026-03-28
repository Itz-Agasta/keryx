# Keryx

<img width="1920" height="1080" alt="Screenshot_28-Mar_21-00-44_13982" src="https://github.com/user-attachments/assets/2e03096d-d643-41b3-8635-393447eb8ea6" />

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
