import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired: part of the first Harbor prototype. Old links land on /week instead.
export const Route = createFileRoute("/lesson/$lessonId")({
  beforeLoad: () => {
    throw redirect({ to: "/week", statusCode: 301 });
  },
});
