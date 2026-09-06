import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { AppShell } from "@/components/crm/app-shell";
import { ErrorState, LoadingBlock } from "@/components/crm/states";
import { TiltCard } from "@/components/crm/tilt-card";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/crm/format";
import { useCrm } from "@/lib/crm/store";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects & units — Aurelia Residences CRM" },
      {
        name: "description",
        content:
          "Browse Aurelia's four developments, unit availability, galleries and illustrated master site plans.",
      },
      { property: "og:title", content: "Projects & units — Aurelia Residences CRM" },
      {
        property: "og:description",
        content: "Developments, availability and master site plans for the sales team.",
      },
    ],
  }),
  component: ProjectsLayout,
});

function ProjectsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/projects") return <Outlet />;
  return <ProjectsIndex />;
}

function ProjectsIndex() {
  const { projects, units, status, retry } = useCrm();

  return (
    <AppShell title="Projects" description="Four live developments across Amman and Aqaba">
      {status === "error" ? (
        <ErrorState onRetry={retry} />
      ) : status === "loading" ? (
        <LoadingBlock rows={4} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const own = units.filter((u) => u.projectId === project.id);
            const available = own.filter((u) => u.status === "available").length;
            return (
              <TiltCard key={project.id} className="card-sheen overflow-hidden" max={6} lift={12}>
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.cover}
                      alt={`${project.name} in ${project.district}`}
                      loading="lazy"
                      width={1200}
                      height={800}
                      className="tilt-layer size-full scale-110 object-cover"
                      style={{ ["--tilt-depth" as string]: "34px" }}
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-serif text-2xl leading-tight">{project.name}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {project.district}, {project.city}
                        </p>
                      </div>
                      <Badge variant="secondary">{project.handover}</Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-serif text-lg">from {money(project.priceFrom)}</span>
                      <span className="text-muted-foreground">
                        {available} of {own.length} available
                      </span>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
