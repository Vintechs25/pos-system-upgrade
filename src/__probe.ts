import type { ErrorRouteComponent } from "@tanstack/react-router";
function C(_p: { error: Error; reset: () => void }) { return null; }
const v1 = Object.assign(C, { preload: undefined as (() => Promise<void> | undefined) | undefined });
const a1: ErrorRouteComponent = v1;
const a2: ErrorRouteComponent = Object.assign(C, { preload: () => Promise.resolve(undefined) });
console.log(a1, a2);
