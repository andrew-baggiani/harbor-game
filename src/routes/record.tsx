import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired: part of the first Harbor prototype. Old links land on /portal instead.
export const Route = createFileRoute("/record")({
  beforeLoad: () => {
    throw redirect({ to: "/portal", statusCode: 301 });
  },
});
