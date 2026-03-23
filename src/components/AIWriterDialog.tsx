import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AIWriterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert?: (content: string) => void;
}

const documentTypes = [
  { value: "general", label: "General Writing" },
  { value: "agreement", label: "Agreement / Contract" },
  { value: "quote", label: "Quotation / Proposal" },
  { value: "letter", label: "Business Letter" },
  { value: "report", label: "Report" },
];

export const AIWriterDialog = ({ open, onOpenChange, onInsert }: AIWriterDialogProps) => {
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [docType, setDocType] = useState("general");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generateContent = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult("");

    abortRef.current = new AbortController();

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, context, type: docType }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to generate");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message || "AI generation failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  };

  const handleInsert = () => {
    onInsert?.(result);
    onOpenChange(false);
    toast.success("Content inserted");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-card border-2 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI WRITING ASSISTANT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Context (e.g. client name, project details)..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />

          <div className="flex gap-2">
            <Textarea
              placeholder="Describe what you want to write... e.g. 'Write a web development agreement for client ABC Corp for a React website project worth $5,000'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={generateContent} disabled={loading || !prompt.trim()} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Document</>
            )}
          </Button>

          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Generated Content</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  {onInsert && (
                    <Button size="sm" onClick={handleInsert}>
                      <Send className="h-3 w-3 mr-1" /> Insert
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-64 rounded-lg border p-4 bg-muted/50">
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
