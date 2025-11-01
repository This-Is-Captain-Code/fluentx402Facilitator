import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Network, BookOpen, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md -ml-3 cursor-pointer">
            <Network className="h-6 w-6 text-primary" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">x402 Facilitator</span>
              <span className="text-xs text-muted-foreground font-mono">Fluent Testnet</span>
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/docs" data-testid="link-docs">
            <Button
              variant="ghost"
              size="sm"
              className={location === "/docs" ? "bg-accent" : ""}
              data-testid="button-nav-docs"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              API Docs
            </Button>
          </Link>
          <Link href="/dashboard" data-testid="link-dashboard">
            <Button
              variant="ghost"
              size="sm"
              className={location === "/dashboard" ? "bg-accent" : ""}
              data-testid="button-nav-dashboard"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
