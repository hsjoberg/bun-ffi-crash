import {
  JSCallback,
  dlopen,
  suffix,
} from "bun:ffi";
import path from "node:path";

const INITIAL_BURST = 200;
const INTERVAL_MS = 1;
const DURATION_MS = 5_000;

const LIBRARY_NAME =
  process.platform === "win32"
    ? "callback_stress_ffi.dll"
    : `libcallback_stress_ffi.${suffix}`;
const LIBRARY_PATH = path.join(
  process.cwd(),
  "native",
  "target",
  "release",
  LIBRARY_NAME
);

type NativeSymbols = {
  StartCallbackStress: {
    args: readonly ["ptr", "i32", "i32"];
    returns: "i32";
  };
};

const native = dlopen<NativeSymbols>(LIBRARY_PATH, {
  StartCallbackStress: {
    args: ["ptr", "i32", "i32"],
    returns: "i32",
  },
});

let callbackEvents = 0;

console.log(`[bun-ffi-crash] library ${LIBRARY_PATH}`);
console.log(
  `[bun-ffi-crash] burst=${INITIAL_BURST} interval=${INTERVAL_MS} duration=${DURATION_MS}`
);

const onResponse = new JSCallback(
  () => {
    callbackEvents += 1;
  },
  { args: [], returns: "void", threadsafe: true }
);

if (onResponse.ptr === null) {
  throw new Error("JSCallback pointer is null.");
}

const started = native.symbols.StartCallbackStress(onResponse.ptr, INITIAL_BURST, INTERVAL_MS);

if (started !== 1) {
  throw new Error("StartCallbackStress failed.");
}

console.log("[bun-ffi-crash] native callback stress started");

const statsTimer = setInterval(() => {
  console.log(`[bun-ffi-crash] callbacks=${callbackEvents}`);
}, 1_000);

setTimeout(() => {
  clearInterval(statsTimer);
  console.log(`[bun-ffi-crash] finished callbacks=${callbackEvents}`);
  process.exit(0);
}, DURATION_MS);
