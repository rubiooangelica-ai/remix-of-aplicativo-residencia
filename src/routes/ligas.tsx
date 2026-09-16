import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ligas")({
  beforeLoad: () => {
    throw redirect({ to: "/equipes" });
  },
});
