# MCP Integration

How Engineering Atlas configures Antigravity's Model Context Protocol
(MCP) servers at the workspace level. Two integrations are prepared in
this repository:

| Server | Transport | Credentials | Purpose |
|---|---|---|---|
| `github` | stdio (Docker) | GitHub personal access token (PAT) | Read-only GitHub inspection — repo, PRs, issues, Actions, commits |
| `playwright` | stdio (npx) | None | Browser automation against the local dev server for visual/UX inspection |

---

## Configuration location

Antigravity reads **workspace** MCP configuration from
`.agents/mcp_config.json`. The repository commits a template at
`.agents/mcp_config.example.json`; the live file is gitignored because it
may contain a PAT.

Antigravity ignores `.mcp.json` and `mcp.json` at the repo root — those
are other tools' conventions, not Antigravity's.

Global configuration lives under `~/.gemini/config/mcp_config.json`.
Prefer workspace configuration for Engineering Atlas so other projects do
not inherit these servers (and their credentials).

### Config shape

The root object is `{ "mcpServers": { "<name>": { … } } }`. Per-server
fields used here:

- `command` / `args` / `env` — stdio transport (both servers use this).
- `enabledTools` — belt-and-braces tool allow-list enforced by Antigravity
  in addition to any server-side restrictions.
- `timeoutSeconds` — connection and per-call timeout. Antigravity's
  defaults are 300 s connect / 180 s per call.

Fields not in use here but available if needed: `serverUrl` (streamable
HTTP transport), `headers`, `authProviderType` (`google_credentials`),
`oauth`, `disabled`, `disabledTools`, `cwd`, per-tool `eager` / `background`
settings under `tools.<name>`.

Antigravity does **not** document any `${env:VAR}` interpolation syntax
for values in `mcp_config.json`. Values are read literally. This is why
the active file must be gitignored when it holds a token.

---

## Activation

1. Copy the template:
   ```sh
   cp .agents/mcp_config.example.json .agents/mcp_config.json
   ```
2. Fill in the GitHub PAT (see **GitHub MCP** below) and pin the
   Playwright version if you want a reproducible browser snapshot.
3. In Antigravity, reload MCP servers — most sessions pick up changes on
   restart; some builds expose a reload command.
4. The first time a server is used in a session, Antigravity caches its
   tool schemas at `~/.gemini/antigravity/mcp/<serverName>/`.

Tools are lazy-loaded by default. The main agent calls them through
`call_mcp_tool`. Unconfigured MCP tools default to **Ask** — Antigravity
will prompt for approval the first time a tool runs. Permissions can be
pre-granted via policy entries `mcp(github/*)` / `mcp(playwright/*)` /
`mcp(*)` if your workflow is stable.

---

## GitHub MCP

### What it does

Uses GitHub's **official** server (`ghcr.io/github/github-mcp-server`)
with the `--read-only` flag so every mutation tool is disabled
server-side. The `enabledTools` allow-list in `.agents/mcp_config.json`
is a second line of defence in case the server is swapped. Together these
restrict the surface to: repo info, branches, commits, tags, releases,
pull requests (incl. files, reviews, comments), issues (incl. comments),
Actions workflows and runs (incl. logs), file contents, and the four
`search_*` tools.

### Required credentials

A GitHub personal access token with the **minimum** scopes:

- **Public repos only:** no scope required; use an unscoped PAT or
  GitHub's app-based token.
- **Private repos:** `repo:read` (or the fine-grained equivalent:
  Metadata **read**, Contents **read**, Pull requests **read**, Issues
  **read**, Actions **read**).

**Do not** grant `repo` (write), `workflow` (write), `admin:*`, or
`delete_repo`. The server is launched with `--read-only`, but a leaked
token with write scopes is a leaked token with write scopes.

### Setup steps

1. Install Docker (the server runs as a short-lived `docker run` process).
   Verify with `docker --version`.
2. Generate a PAT at <https://github.com/settings/tokens> (classic) or
   <https://github.com/settings/personal-access-tokens/new> (fine-grained).
   Prefer fine-grained, scoped to the Engineering Atlas repo only.
3. Put the token in `.agents/mcp_config.json` under
   `mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN`. The file is
   gitignored.
4. Pre-pull the server image to avoid first-run latency:
   ```sh
   docker pull ghcr.io/github/github-mcp-server
   ```
5. Restart Antigravity or reload MCP servers.

Alternative without Docker: install the server binary from
<https://github.com/github/github-mcp-server/releases>, then set
`"command": "/path/to/github-mcp-server", "args": ["stdio", "--read-only"]`.
Pass the token through `env` the same way.

### Verifying the connection

Ask the main agent to run a known-safe GitHub tool and report the result,
for example "ask the GitHub MCP for my own user info":

- Tool: `get_me`.
- Expected: a JSON object with your login. Antigravity prompts for
  permission the first time.

If that works, confirm the read-only enforcement by asking the agent to
attempt a write operation. The agent should reply that no write tool is
exposed. If a write tool appears, revoke the PAT immediately and open an
issue — the server was not launched in read-only mode.

### Troubleshooting

- `docker: not found` — install Docker Desktop (Windows / macOS) or the
  Docker Engine (Linux). On Windows ensure Docker is running before
  starting Antigravity.
- `401 Bad credentials` — the PAT is wrong, expired, or lacks the
  required scopes. Regenerate with the scopes listed above.
- Tools list shows zero tools — the server failed to start. Run the
  `docker run …` command directly from a shell to see stderr. Check that
  the `ghcr.io/github/github-mcp-server` image pulled cleanly.
- Session hangs for 5 minutes then disconnects — the default connect
  timeout fired. Pre-pull the image (`docker pull`) and try again.

### Security boundary

- Read-only server + read-only PAT + explicit `enabledTools` allow-list.
- Antigravity's **Ask** default on first tool use is kept — no
  `mcp(github/*)` policy is pre-granted here.
- PAT never enters a committed file. `.agents/mcp_config.json` is
  gitignored; `.agents/mcp_config.example.json` uses the literal
  placeholder `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN`.
- Do **not** automatically create PRs, merge PRs, push commits, modify
  issues, or approve reviews. Those tools are not enabled; even if they
  were, they would require explicit user authorisation each time.

---

## Playwright MCP

### What it does

Uses Microsoft's **official** `@playwright/mcp` to drive a real Chromium
browser against the local dev server. The main agent can:

- Open the dev server at `http://localhost:5173/` (Vite default).
- Navigate domains → categories → concepts → lessons → labs.
- Capture accessibility snapshots (`browser_snapshot`) or screenshots
  (`browser_take_screenshot`).
- Interact: click, type, hover, drag, press keys, select options.
- Inspect browser console (`browser_console_messages`), network
  (`browser_network_requests`), and the DOM via `browser_evaluate`.
- Verify responsive layouts with `browser_resize`.

### Required credentials

None. The server is unauthenticated and runs locally.

### Setup steps

1. Node ≥ 22.22 is already a project requirement (`package.json`
   `engines.node`).
2. Install the Chromium Playwright uses:
   ```sh
   npx playwright install chromium
   ```
3. Nothing else — `.agents/mcp_config.example.json` launches
   `npx -y @playwright/mcp@latest`. Pin the version in your local
   `mcp_config.json` (e.g. `@playwright/mcp@0.0.42`) if you need
   reproducibility.
4. Start the dev server in a separate terminal when you want the agent
   to visit it:
   ```sh
   npm run dev
   ```
5. Give the agent the URL explicitly (e.g. "navigate to
   `http://localhost:5173/cloud-fundamentals/compute/virtual-machines`").

### Verifying the connection

Ask the main agent to open the dev server home page and read the
accessibility snapshot:

- Tool: `browser_navigate` with URL `http://localhost:5173/`, then
  `browser_snapshot`.
- Expected: a snapshot showing the home page's main regions, the domain
  sidebar, and no uncaught console errors.

### Troubleshooting

- `browser_navigate` fails with `ECONNREFUSED` — the dev server isn't
  running. Start it with `npm run dev`.
- Chromium prompts to download on first use — expected. Pre-install with
  `npx playwright install chromium`.
- Headless mode hides what's happening — pass `--headed` instead of
  (or remove) the default headless flag in your local `mcp_config.json`
  while debugging.
- A test suggests destructive actions (clearing storage, filling forms
  with secrets) — refuse. The browser is driving the user's real profile
  if `--isolated` is dropped; `.agents/mcp_config.example.json` keeps
  `--isolated` on for exactly this reason.

### Security boundary

- Local use only. The server has no credentials of its own; it just
  drives a browser you launched.
- `--isolated` keeps each session's browser profile out of your main
  browser. Do not drop it.
- Do not point Playwright at unrelated sites. The main agent should only
  visit `localhost:5173` or explicitly approved URLs during a review.
- Do not fill real credentials, API keys, or PII into forms via
  Playwright. Everything the agent types in the browser is logged to the
  session transcript.
- Antigravity's **Ask** default remains — no `mcp(playwright/*)` policy
  is pre-granted.

---

## Important caveat (honesty)

No connection has been **verified** in this session. The configuration
template is written to match Antigravity's documented
`mcp_config.json` shape, and the server packages named here are the
first-party ones from GitHub and Microsoft. The template compiles and
its JSON is valid. Actual connection requires:

1. The `.example` file to be copied to `.agents/mcp_config.json`.
2. A real GitHub PAT to be pasted in.
3. Docker to be installed (GitHub) and Chromium to be installed
   (Playwright).
4. Antigravity to be restarted or MCP reloaded.

Verify the connection yourself with the procedures above. Do not take
the configuration file alone as proof of a working connection.
