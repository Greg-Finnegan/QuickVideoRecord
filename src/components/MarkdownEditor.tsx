import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Eye,
  Pencil,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
}

// ── Inline HTML renderer ──────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

function markdownToHtml(text: string): string {
  const blocks = text.split(/\n{2,}/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      const lines = trimmed.split("\n");

      // Bullet list
      if (lines.every((l) => /^\s*[-*]\s/.test(l))) {
        const items = lines
          .map((l) => `<li>${inlineHtml(l.replace(/^\s*[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul class="list-disc list-inside space-y-0.5 my-2 text-slate-900 dark:text-slate-100">${items}</ul>`;
      }

      // Ordered list
      if (lines.every((l) => /^\s*\d+\.\s/.test(l))) {
        const items = lines
          .map((l) => `<li>${inlineHtml(l.replace(/^\s*\d+\.\s+/, ""))}</li>`)
          .join("");
        return `<ol class="list-decimal list-inside space-y-0.5 my-2 text-slate-900 dark:text-slate-100">${items}</ol>`;
      }

      // Individual lines
      return lines
        .map((line) => {
          const t = line.trim();
          if (!t) return "";

          if (/^[-*_]{3,}$/.test(t)) {
            return '<hr class="border-slate-300 dark:border-slate-600 my-3"/>';
          }

          const hm = t.match(/^(#{1,3})\s+(.+)$/);
          if (hm) {
            const level = hm[1].length;
            const sizeClass = ["text-lg font-bold", "text-base font-bold", "text-sm font-semibold"][
              level - 1
            ];
            return `<h${level} class="${sizeClass} my-1 text-slate-900 dark:text-slate-100">${inlineHtml(hm[2])}</h${level}>`;
          }

          return `<p class="my-1 text-slate-900 dark:text-slate-100">${inlineHtml(t)}</p>`;
        })
        .join("");
    })
    .join("");
}

// ── Toolbar insertion logic ───────────────────────────────────────────────────

type FormatType = "bold" | "italic" | "h1" | "h2" | "h3" | "bullet" | "ordered" | "hr";

function applyFormat(
  value: string,
  start: number,
  end: number,
  type: FormatType
): { newValue: string; cursorStart: number; cursorEnd: number } {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  switch (type) {
    case "bold": {
      const inner = selected || "bold text";
      return {
        newValue: before + `**${inner}**` + after,
        cursorStart: start + 2,
        cursorEnd: start + 2 + inner.length,
      };
    }
    case "italic": {
      const inner = selected || "italic text";
      return {
        newValue: before + `*${inner}*` + after,
        cursorStart: start + 1,
        cursorEnd: start + 1 + inner.length,
      };
    }
    case "h1":
    case "h2":
    case "h3": {
      const level = parseInt(type[1]);
      const prefix = "#".repeat(level) + " ";
      const lineStart = before.lastIndexOf("\n") + 1;
      return {
        newValue: value.slice(0, lineStart) + prefix + value.slice(lineStart),
        cursorStart: start + prefix.length,
        cursorEnd: end + prefix.length,
      };
    }
    case "bullet": {
      const lineStart = before.lastIndexOf("\n") + 1;
      return {
        newValue: value.slice(0, lineStart) + "- " + value.slice(lineStart),
        cursorStart: start + 2,
        cursorEnd: end + 2,
      };
    }
    case "ordered": {
      const lineStart = before.lastIndexOf("\n") + 1;
      return {
        newValue: value.slice(0, lineStart) + "1. " + value.slice(lineStart),
        cursorStart: start + 3,
        cursorEnd: end + 3,
      };
    }
    case "hr": {
      const hr = "\n\n---\n\n";
      return {
        newValue: before + hr + after,
        cursorStart: start + hr.length,
        cursorEnd: start + hr.length,
      };
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  disabled = false,
  rows = 6,
  placeholder = "Write a description...",
}) => {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = (type: FormatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const result = applyFormat(value, start, end, type);

    onChange(result.newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursorStart, result.cursorEnd);
    });
  };

  const toolbarButtons: { type: FormatType; icon: React.ReactNode; title: string }[] = [
    { type: "bold", icon: <Bold size={14} />, title: "Bold (wrap in **)" },
    { type: "italic", icon: <Italic size={14} />, title: "Italic (wrap in *)" },
    { type: "h1", icon: <Heading1 size={14} />, title: "Heading 1" },
    { type: "h2", icon: <Heading2 size={14} />, title: "Heading 2" },
    { type: "h3", icon: <Heading3 size={14} />, title: "Heading 3" },
    { type: "bullet", icon: <List size={14} />, title: "Bullet list" },
    { type: "ordered", icon: <ListOrdered size={14} />, title: "Ordered list" },
    { type: "hr", icon: <Minus size={14} />, title: "Horizontal rule" },
  ];

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded overflow-hidden">
      {/* Tab bar + toolbar */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-600 px-2 py-1 gap-2">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("write")}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              tab === "write"
                ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            } disabled:opacity-50`}
          >
            <Pencil size={12} />
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              tab === "preview"
                ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            } disabled:opacity-50`}
          >
            <Eye size={12} />
            Preview
          </button>
        </div>

        {/* Formatting toolbar (only in write mode) */}
        {tab === "write" && (
          <div className="flex items-center gap-0.5">
            {toolbarButtons.map(({ type, icon, title }) => (
              <button
                key={type}
                type="button"
                title={title}
                disabled={disabled}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep textarea focus
                  handleFormat(type);
                }}
                className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-40"
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Write */}
      {tab === "write" && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:opacity-50 font-mono"
        />
      )}

      {/* Preview */}
      {tab === "preview" && (
        <div
          className="px-3 py-2 bg-white dark:bg-slate-700 text-sm min-h-[6rem] prose-sm"
          style={{ minHeight: `${rows * 1.5}rem` }}
          // Content is generated from user's own typed text — not from external input
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: value.trim()
              ? markdownToHtml(value)
              : `<p class="text-slate-400 dark:text-slate-500 italic">${placeholder}</p>`,
          }}
        />
      )}
    </div>
  );
};

export default MarkdownEditor;
