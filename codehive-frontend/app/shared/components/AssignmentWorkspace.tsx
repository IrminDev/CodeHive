import { useEffect, useState, type ReactNode } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type LayoutStorage,
} from "react-resizable-panels";

export type AssignmentWorkspacePane = "assignment" | "editor" | "tests";

interface AssignmentWorkspaceProps {
  assignmentPane: ReactNode;
  editorPane: ReactNode;
  testsPane: ReactNode;
  mobilePane: AssignmentWorkspacePane;
  onMobilePaneChange: (pane: AssignmentWorkspacePane) => void;
  persistenceKey: string;
  editorLabel?: string;
}

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
}: AssignmentWorkspaceProps) {
  const desktop = useDesktopWorkspace();
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
    const labels: Record<AssignmentWorkspacePane, string> = {
      assignment: "Assignment",
      editor: editorLabel,
      tests: "Tests",
    };
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface">
          {(Object.keys(labels) as AssignmentWorkspacePane[]).map((pane) => (
            <button
              key={pane}
              onClick={() => onMobilePaneChange(pane)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                mobilePane === pane
                  ? "border-azure text-azure dark:border-yellow dark:text-yellow"
                  : "border-transparent text-gray-400 dark:text-gray-500"
              }`}
            >
              {labels[pane]}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobilePane === "assignment"
            ? assignmentPane
            : mobilePane === "editor"
              ? editorPane
              : testsPane}
        </div>
      </div>
    );
  }

  return (
    <Group
      orientation="horizontal"
      className="flex-1 min-h-0 overflow-hidden"
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
      <WorkspaceSeparator orientation="vertical" />
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
          <WorkspaceSeparator orientation="horizontal" />
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
}

function WorkspaceSeparator({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const vertical = orientation === "vertical";
  return (
    <Separator
      className={`group relative z-10 flex flex-shrink-0 items-center justify-center bg-gray-200 dark:bg-gray-800 transition-colors hover:bg-azure/40 focus:bg-azure/40 dark:hover:bg-yellow/40 dark:focus:bg-yellow/40 focus:outline-none ${vertical ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize"}`}
      aria-label={vertical ? "Resize assignment and code panes" : "Resize code and tests panes"}
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
