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
            <Network className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-bold tracking-tight">x402</span>
              <span className="text-xs text-muted-foreground font-mono hidden sm:block">Fluent Testnet</span>
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
              <BookOpen className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">API Docs</span>
            </Button>
          </Link>
          <Link href="/dashboard" data-testid="link-dashboard">
            <Button
              variant="ghost"
              size="sm"
              className={location === "/dashboard" ? "bg-accent" : ""}
              data-testid="button-nav-dashboard"
            >
              <LayoutDashboard className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
