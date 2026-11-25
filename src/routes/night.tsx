import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired: part of the first Harbor prototype. Old links land on /play instead.
export const Route = createFileRoute("/night")({
  beforeLoad: () => {
    throw redirect({ to: "/play", statusCode: 301 });
  },
});
