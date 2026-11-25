import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired: part of the first Harbor prototype. Old links land on /week instead.
export const Route = createFileRoute("/path/$moduleId")({
  beforeLoad: () => {
    throw redirect({ to: "/week", statusCode: 301 });
  },
});
