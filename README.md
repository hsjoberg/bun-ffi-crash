# bun-ffi-crash

Minimal Bun FFI crash repro.

What it does:

- creates one Bun `JSCallback({ threadsafe: true })`
- passes that callback pointer directly to native code
- native code spawns one worker thread
- That worker repeatedly call that same Bun callback
- the callback only increments a JS counter
- no payloads or callback-context structs are involved

Run:

```bash
bun install
bun run repro
```

Expected result on the affected setup:

- Bun crashes with a segmentation fault shortly after `StartCallbackStress` begins invoking the callback.
