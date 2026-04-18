# MCP credential smoke test

This repo includes `test-per-request-creds.mjs` to verify the Korbly v0 credential model:

- host browsing credentials come from `.env` as `RHL_EMAIL` / `RHL_PASS`
- user ordering credentials are supplied per run
- the two MCP clients use separate temporary `MCP_REMOTE_CONFIG_DIR` directories
- the test calls `get_user_info` for each client and compares redacted account fingerprints
- temporary MCP config directories are deleted after the run

Run it with:

```sh
npm run test:creds
```

The script will prompt for the user Gurkerl email and password. It prints redacted identity fields and a short fingerprint only; it does not write credentials or raw MCP responses to disk.

You can also run it non-interactively in automation:

```sh
USER_RHL_EMAIL="user@example.com" USER_RHL_PASS="..." npm run test:creds
```

Avoid committing `.env`, shell transcripts, or debug logs. `.gitignore` already excludes `.env`, `.env.local`, `*.log`, and `.mcp-auth/`.

## Expected verdicts

- `PASS`: the host and user credential pairs returned different `get_user_info` fingerprints, so per-request credential context works.
- `INCONCLUSIVE`: both credential pairs used the same email, so separation cannot be proven.
- `FAIL`: different emails returned the same fingerprint. Do not build checkout around per-request credentials until this is resolved.

When both real credential pairs use the same email, the script also runs a negative control with intentionally invalid credentials in a third isolated MCP client. That cannot prove two real accounts differ, but it does check that an invalid per-request credential set does not silently reuse the host account context.

## Notes for app implementation

Use the same isolation pattern in the app helper:

- create one MCP client per request
- pass the credential headers when spawning `mcp-remote`
- use a request-scoped or temporary config directory, not a shared `.mcp-auth`
- close the client in `finally`
- never log request bodies or MCP args for checkout routes
