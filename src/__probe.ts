import type { ErrorRouteComponent } from "@tanstack/react-router";
const bad: ErrorRouteComponent = 42 as never;
console.log(bad);
