# Cursor project config

## MCP servers

Project-level MCPs are in `mcp.json`. They are merged with your user-level `~/.cursor/mcp.json` when this project is open; project entries take precedence for the same server name.

### Reddit MCP

The **reddit** server ([adhikasp/mcp-reddit](https://github.com/adhikasp/mcp-reddit)) is configured for fetching and analyzing Reddit content (hot threads, post content, comments).

- **Requirement:** [uv](https://docs.astral.sh/uv/) (provides `uvx`). Install: `brew install uv` or `pip install uv`.
- **Used by:** Cursor (this project), Claude Code (`.claude/claude.json`). Codex uses Cursor’s MCP config when running in Cursor.
