import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { TiltCard } from "@/components/crm/tilt-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { images } from "@/lib/crm/mock-data";
import { useCrm } from "@/lib/crm/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Aurelia Residences CRM" },
      {
        name: "description",
        content: "Sign in to the Aurelia Residences sales CRM as an admin or sales employee.",
      },
      { property: "og:title", content: "Sign in — Aurelia Residences CRM" },
      {
        property: "og:description",
        content: "Role-aware access to leads, projects, units and bookings.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, loginAs, user, hydrated } = useCrm();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@aurelia.com");
  const [password, setPassword] = useState("aurelia");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && user) navigate({ to: "/" });
  }, [hydrated, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 4) return setError("Enter your password.");
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) return setError(result.error ?? "Sign in failed.");
    navigate({ to: "/" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src={images.hero}
          alt="Palazzo Aurelia tower at golden hour"
          width={1600}
          height={912}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-navy opacity-70" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-navy-foreground">
          <p className="font-serif text-4xl leading-tight">
            Warm, considered selling
            <br />
            for landmark homes.
          </p>
          <p className="mt-3 max-w-md text-sm text-navy-foreground/80">
            Four live developments, 342 units and a pipeline your team can actually read.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm rise-in">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-warm text-primary-foreground shadow-soft">
            <Building2 className="size-5" />
          </span>
          <h1 className="mt-6 font-serif text-4xl text-foreground">Aurelia CRM</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your sales workspace. Demo password: <strong>aurelia</strong>
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div>
              <Label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password" className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Or explore a demo role
          </p>
          <div className="mt-3 grid gap-3">
            <TiltCard max={4} lift={6}>
              <button
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => {
                  loginAs("u-1");
                  navigate({ to: "/" });
                }}
              >
                <ShieldCheck className="size-5 text-primary" />
                <span>
                  <span className="block text-sm text-foreground">Layla Haddad — Admin</span>
                  <span className="block text-xs text-muted-foreground">
                    Full pipeline, team and booking oversight
                  </span>
                </span>
              </button>
            </TiltCard>
            <TiltCard max={4} lift={6}>
              <button
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => {
                  loginAs("u-2");
                  navigate({ to: "/" });
                }}
              >
                <Users className="size-5 text-primary" />
                <span>
                  <span className="block text-sm text-foreground">Omar Nassar — Sales</span>
                  <span className="block text-xs text-muted-foreground">
                    Sees only his own leads and bookings
                  </span>
                </span>
              </button>
            </TiltCard>
          </div>
        </div>
      </div>
    </div>
  );
}
