import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "~/core/providers/ThemeProvider";

function defineThemes(monaco: Monaco) {
  monaco.editor.defineTheme("codehive-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "FDC500", fontStyle: "bold" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "comment", foreground: "8b949e", fontStyle: "italic" },
      { token: "type", foreground: "ff7b72" },
      { token: "class", foreground: "f0883e" },
      { token: "function", foreground: "d2a8ff" },
      { token: "operator", foreground: "ff7b72" },
    ],
    colors: {
      "editor.background": "#0a0f1a",
      "editor.foreground": "#e6edf3",
      "editor.lineHighlightBackground": "#1a2234",
      "editor.selectionBackground": "#00509D40",
      "editor.inactiveSelectionBackground": "#00509D20",
      "editorLineNumber.foreground": "#3d4b62",
      "editorLineNumber.activeForeground": "#FDC500",
      "editorGutter.background": "#0d1420",
      "editorCursor.foreground": "#FDC500",
      "editorIndentGuide.background1": "#1a2234",
      "editorIndentGuide.activeBackground1": "#00509D40",
      "scrollbarSlider.background": "#1a223480",
      "scrollbarSlider.hoverBackground": "#2a356080",
      "editorWidget.background": "#111827",
      "editorSuggestWidget.background": "#111827",
      "editorSuggestWidget.border": "#1a2234",
      "editorSuggestWidget.selectedBackground": "#1a2234",
      "input.background": "#111827",
      "input.border": "#1a2234",
    },
  });

  monaco.editor.defineTheme("codehive-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "00296B", fontStyle: "bold" },
      { token: "string", foreground: "1a7f37" },
      { token: "number", foreground: "0550ae" },
      { token: "comment", foreground: "6a737d", fontStyle: "italic" },
      { token: "type", foreground: "953800" },
      { token: "function", foreground: "8250df" },
      { token: "operator", foreground: "00509D" },
    ],
    colors: {
      "editor.background": "#f8fafc",
      "editor.foreground": "#1f2328",
      "editor.lineHighlightBackground": "#f0f4f8",
      "editor.selectionBackground": "#00509D25",
      "editorLineNumber.foreground": "#9ca3af",
      "editorLineNumber.activeForeground": "#00509D",
      "editorGutter.background": "#f0f4f8",
      "editorCursor.foreground": "#00509D",
      "editorWidget.background": "#ffffff",
      "editorSuggestWidget.background": "#ffffff",
      "editorSuggestWidget.border": "#e5e7eb",
      "editorSuggestWidget.selectedBackground": "#dbeafe",
    },
  });
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  height?: string | number;
  readOnly?: boolean;
  options?: editor.IStandaloneEditorConstructionOptions;
}

export function CodeEditor({
  value,
  onChange,
  language,
  height = "100%",
  readOnly = false,
  options,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const monacoTheme = theme === "dark" ? "codehive-dark" : "codehive-light";

  return (
    <Editor
      height={height}
      theme={monacoTheme}
      language={language}
      value={value}
      beforeMount={defineThemes}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        fontLigatures: true,
        smoothScrolling: true,
        lineNumbers: "on",
        renderLineHighlight: "all",
        padding: { top: 12, bottom: 12 },
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        readOnly,
        ...options,
      }}
      onChange={(v) => onChange?.(v ?? "")}
    />
  );
}
