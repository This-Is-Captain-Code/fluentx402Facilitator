import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "javascript" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 w-8"
          data-testid="button-copy-code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      {language && (
        <div className="absolute left-3 top-2 text-xs font-mono text-muted-foreground uppercase">
          {language}
        </div>
      )}
      <pre className="bg-muted rounded-md p-4 overflow-x-auto border">
        <code className="text-sm font-mono">{code}</code>
      </pre>
    </div>
  );
}
