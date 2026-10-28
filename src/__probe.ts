import type { ErrorRouteComponent } from "@tanstack/react-router";
import { lazy } from "react";
function Inner(_p: { error: Error; reset: () => void }) { return null; }
const v1: ErrorRouteComponent = lazy(() => Promise.resolve({ default: Inner }));
console.log(v1);
