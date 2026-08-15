import { useState, type FormEvent } from "react";
import { ChevronLeft, Plus, Star, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { TODO_EXPANDED_WIDTH } from "@/lib/layout";
import type { Task } from "@/types";

interface Props {
  onCollapse: () => void;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}

export function TodoDrawer({ onCollapse }: Props) {
  const tasks = useAppStore((s) => s.tasks);
  const addTask = useAppStore((s) => s.addTask);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const toggleTaskFavorite = useAppStore((s) => s.toggleTaskFavorite);
  const renameTask = useAppStore((s) => s.renameTask);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addTask(draft);
    setDraft("");
  };

  const beginEdit = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      renameTask(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      className="flex h-full shrink-0 animate-slide-in flex-col gap-3 border-r border-black/5 bg-cream-soft/70 py-4 pl-4 pr-3 backdrop-blur-sm"
      style={{ width: DRAWER_WIDTH }}
      data-no-drag
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-current/80">
          All Tasks
        </span>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse task list"
          title="Collapse"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-current/70 transition hover:bg-black/10"
        >
          <ChevronLeft size={14} className="rotate-180" />
        </button>
      </div>

      <form onSubmit={submit} className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task..."
          className="w-full min-w-0 rounded-md bg-black/5 px-2.5 py-1.5 text-[12px] text-current placeholder:text-current/40 focus:bg-black/10 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-terracotta text-cream transition hover:brightness-105 active:scale-90"
        >
          <Plus size={13} strokeWidth={3} />
        </button>
      </form>

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {tasks.length === 0 && (
          <li className="pt-2 text-[12px] italic leading-snug text-current/50">
            Nothing here yet — add your first task above.
          </li>
        )}
        {sortTasks(tasks).map((task) => (
          <li
            key={task.id}
            className={`group flex items-start gap-1.5 rounded-lg px-1.5 py-1.5 transition hover:bg-black/5 ${
              task.done ? "opacity-50" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => toggleTaskDone(task.id)}
              aria-label={`Mark "${task.title}" ${task.done ? "not done" : "done"}`}
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-[4px] border transition ${
                task.done ? "border-terracotta bg-terracotta" : "border-current/40 hover:border-terracotta"
              }`}
            />

            {editingId === task.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                className="min-w-0 flex-1 rounded bg-black/5 px-1 text-[12px] text-current focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onDoubleClick={() => beginEdit(task)}
                className={`min-w-0 flex-1 text-left text-[12px] leading-snug text-current/90 ${task.done ? "line-through" : ""}`}
                title="Double-click to rename"
              >
                {task.title}
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleTaskFavorite(task.id)}
              aria-label={task.favorite ? "Unfavorite" : "Favorite"}
              className="opacity-0 transition group-hover:opacity-100"
            >
              <Star
                size={12}
                className={task.favorite ? "fill-terracotta text-terracotta opacity-100" : "text-current/50"}
              />
            </button>
            <button
              type="button"
              onClick={() => deleteTask(task.id)}
              aria-label="Delete task"
              className="opacity-0 text-current/50 transition hover:text-terracotta group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
