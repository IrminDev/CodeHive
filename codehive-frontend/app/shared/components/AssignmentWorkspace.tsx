import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelRef,
  type LayoutStorage,
} from "react-resizable-panels";

export type AssignmentWorkspacePane = "assignment" | "editor" | "tests" | "side";

interface AssignmentWorkspaceProps {
  assignmentPane: ReactNode;
  editorPane: ReactNode;
  testsPane: ReactNode;
  mobilePane: AssignmentWorkspacePane;
  onMobilePaneChange: (pane: AssignmentWorkspacePane) => void;
  persistenceKey: string;
  editorLabel?: string;
  /**
   * Optional panel docked on the right. It stays mounted while collapsed, so collapsing
   * never resets its content. Leave undefined for workspaces without one.
   */
  sidePane?: ReactNode;
  sideLabel?: string;
  sideOpen?: boolean;
  onSideOpenChange?: (open: boolean) => void;
}

const SIDE_DEFAULT_SIZE = "30%";

const browserStorage: LayoutStorage = {
  getItem(key) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  },
  setItem(key, value) {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
};

export function AssignmentWorkspace({
  assignmentPane,
  editorPane,
  testsPane,
  mobilePane,
  onMobilePaneChange,
  persistenceKey,
  editorLabel = "Code",
  sidePane,
  sideLabel = "Side panel",
  sideOpen = false,
  onSideOpenChange,
}: AssignmentWorkspaceProps) {
  const desktop = useDesktopWorkspace();
  const hasSide = sidePane !== undefined;
  const columns = useDefaultLayout({
    id: `${persistenceKey}-columns-v1`,
    panelIds: ["assignment", "workspace"],
    storage: browserStorage,
  });
  const rows = useDefaultLayout({
    id: `${persistenceKey}-rows-v1`,
    panelIds: ["editor", "tests"],
    storage: browserStorage,
  });

  if (!desktop) {
    const labels: Array<[AssignmentWorkspacePane, string]> = [
      ["assignment", "Assignment"],
      ["editor", editorLabel],
      ["tests", "Tests"],
      ...(hasSide ? [["side", sideLabel] as [AssignmentWorkspacePane, string]] : []),
    ];
    const active = mobilePane === "side" && !hasSide ? "editor" : mobilePane;
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div role="tablist" aria-label="Workspace panes" className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface">
          {labels.map(([pane, label]) => (
            <button
              key={pane}
              type="button"
              role="tab"
              aria-selected={active === pane}
              onClick={() => onMobilePaneChange(pane)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azure dark:focus-visible:ring-yellow ${
                active === pane
                  ? "border-azure text-azure dark:border-yellow dark:text-yellow"
                  : "border-transparent text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {active === "assignment"
            ? assignmentPane
            : active === "editor"
              ? editorPane
              : active === "tests"
                ? testsPane
                : sidePane}
        </div>
      </div>
    );
  }

  const main = (
    <Group
      orientation="horizontal"
      className={hasSide ? "h-full min-h-0 overflow-hidden" : "flex-1 min-h-0 overflow-hidden"}
      defaultLayout={columns.defaultLayout}
      onLayoutChanged={columns.onLayoutChanged}
      resizeTargetMinimumSize={{ fine: 10, coarse: 28 }}
    >
      <Panel
        id="assignment"
        defaultSize="26%"
        minSize="240px"
        maxSize="50%"
        className="min-w-0 overflow-hidden"
      >
        {assignmentPane}
      </Panel>
      <WorkspaceSeparator orientation="vertical" label="Resize assignment and code panes" />
      <Panel
        id="workspace"
        defaultSize="74%"
        minSize="420px"
        className="min-w-0 overflow-hidden"
      >
        <Group
          orientation="vertical"
          className="h-full min-h-0 overflow-hidden"
          defaultLayout={rows.defaultLayout}
          onLayoutChanged={rows.onLayoutChanged}
          resizeTargetMinimumSize={{ fine: 10, coarse: 28 }}
        >
          <Panel
            id="editor"
            defaultSize="68%"
            minSize="220px"
            className="min-h-0 overflow-hidden"
          >
            {editorPane}
          </Panel>
          <WorkspaceSeparator orientation="horizontal" label="Resize code and tests panes" />
          <Panel
            id="tests"
            defaultSize="32%"
            minSize="160px"
            maxSize="65%"
            className="min-h-0 overflow-hidden"
          >
            {testsPane}
          </Panel>
        </Group>
      </Panel>
    </Group>
  );

  if (!hasSide) return main;

  return (
    <DockedSide
      main={main}
      side={sidePane}
      label={sideLabel}
      open={sideOpen}
      onOpenChange={onSideOpenChange}
      persistenceKey={persistenceKey}
    />
  );
}

/** Wraps the workspace in an outer split whose right panel collapses to nothing without unmounting. */
function DockedSide({ main, side, label, open, onOpenChange, persistenceKey }: {
  main: ReactNode;
  side: ReactNode;
  label: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  persistenceKey: string;
}) {
  const sizeKey = `${persistenceKey}-side-size-v1`;
  const panel = usePanelRef();
  const lastSize = useRef<string>(readSize(sizeKey));
  const [initialSize] = useState(() => open ? lastSize.current : "0%");

  useEffect(() => {
    const handle = panel.current;
    if (!handle) return;
    if (open && handle.isCollapsed()) handle.resize(lastSize.current);
    else if (!open && !handle.isCollapsed()) handle.collapse();
  }, [open, panel]);

  return (
    <Group
      orientation="horizontal"
      className="flex-1 min-h-0 overflow-hidden"
      resizeTargetMinimumSize={{ fine: 10, coarse: 28 }}
    >
      <Panel id="main" minSize="680px" className="min-w-0 overflow-hidden">
        {main}
      </Panel>
      <WorkspaceSeparator orientation="vertical" label={`Resize ${label.toLowerCase()} pane`} hidden={!open} />
      <Panel
        id="side"
        panelRef={panel}
        collapsible
        collapsedSize="0%"
        defaultSize={initialSize}
        minSize="320px"
        maxSize="45%"
        className="min-w-0 overflow-hidden"
        onResize={(size) => {
          const expanded = size.inPixels > 1;
          if (expanded) {
            lastSize.current = `${size.asPercentage.toFixed(2)}%`;
            writeSize(sizeKey, lastSize.current);
          }
          if (expanded !== open) onOpenChange?.(expanded);
        }}
      >
        <div inert={!open} className="h-full min-h-0">
          {side}
        </div>
      </Panel>
    </Group>
  );
}

function readSize(key: string): string {
  try {
    const value = window.localStorage.getItem(key);
    return value && /^\d+(\.\d+)?%$/.test(value) ? value : SIDE_DEFAULT_SIZE;
  } catch {
    return SIDE_DEFAULT_SIZE;
  }
}

function writeSize(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* Width simply is not remembered. */ }
}

function WorkspaceSeparator({ orientation, label, hidden = false }: {
  orientation: "horizontal" | "vertical";
  label: string;
  hidden?: boolean;
}) {
  const vertical = orientation === "vertical";
  return (
    <Separator
      disabled={hidden}
      className={`group relative z-10 flex-shrink-0 items-center justify-center bg-gray-200 dark:bg-gray-800 transition-colors hover:bg-azure/40 focus:bg-azure/40 dark:hover:bg-yellow/40 dark:focus:bg-yellow/40 focus:outline-none ${hidden ? "hidden" : "flex"} ${vertical ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize"}`}
      aria-label={label}
    >
      <span
        className={`${vertical ? "h-10 w-0.5" : "h-0.5 w-10"} rounded-full bg-gray-400 dark:bg-gray-600 group-hover:bg-azure dark:group-hover:bg-yellow group-focus:bg-azure dark:group-focus:bg-yellow`}
      />
    </Separator>
  );
}

function useDesktopWorkspace(): boolean {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return desktop;
}
