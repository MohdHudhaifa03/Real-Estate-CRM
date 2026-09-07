"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { images } from "@/lib/crm/images";
import { useCrm } from "@/lib/crm/store";

export default function LoginPage() {
  const { login, user, hydrated } = useCrm();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && user) router.push("/");
  }, [hydrated, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 4) return setError("Enter your password.");
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) return setError(result.error ?? "Sign in failed.");
    router.push("/");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src={typeof images.hero === "string" ? images.hero : images.hero.src}
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
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your sales workspace.</p>

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
        </div>
      </div>
    </div>
  );
}
