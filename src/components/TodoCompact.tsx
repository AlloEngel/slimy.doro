import { useState, type FormEvent } from "react";
import { ChevronLeft, Plus, Star } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task } from "@/types";

function pickPriorityTasks(tasks: Task[], limit: number): Task[] {
  const open = tasks.filter((t) => !t.done);
  const favorites = open.filter((t) => t.favorite).sort((a, b) => a.createdAt - b.createdAt);
  const rest = open.filter((t) => !t.favorite).sort((a, b) => a.createdAt - b.createdAt);
  return [...favorites, ...rest].slice(0, limit);
}

interface Props {
  onExpand: () => void;
}

export function TodoCompact({ onExpand }: Props) {
  const tasks = useAppStore((s) => s.tasks);
  const addTask = useAppStore((s) => s.addTask);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const [draft, setDraft] = useState("");

  const priority = pickPriorityTasks(tasks, 3);
  const doneCount = tasks.filter((t) => t.done).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addTask(draft);
    setDraft("");
  };

  return (
    <div className="flex h-full w-[132px] shrink-0 flex-col gap-2.5 border-r border-black/5 py-4 pl-4 pr-2" data-no-drag>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-current/80">Tasks</span>
        <span className="font-mono text-[9px] text-current/50">
          {doneCount}/{tasks.length}
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-1.5 overflow-hidden">
        {priority.length === 0 && (
          <li className="pt-1 text-[11px] italic leading-snug text-current/50">Nothing queued yet.</li>
        )}
        {priority.map((task) => (
          <li key={task.id} className="flex items-start gap-1.5">
            <button
              type="button"
              onClick={() => toggleTaskDone(task.id)}
              aria-label={`Mark "${task.title}" done`}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-[4px] border border-current/40 transition hover:border-terracotta"
            />
            <span className="line-clamp-2 flex items-center gap-1 text-[11px] leading-snug text-current/90">
              {task.favorite && <Star size={9} className="shrink-0 fill-terracotta text-terracotta" />}
              {task.title}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="flex items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add task"
          className="w-full min-w-0 rounded-md bg-black/5 px-2 py-1 text-[11px] text-current placeholder:text-current/40 focus:bg-black/10 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-terracotta text-cream transition hover:brightness-105 active:scale-90"
        >
          <Plus size={12} strokeWidth={3} />
        </button>
      </form>

      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand task list"
        title="Expand task list"
        className="flex h-6 w-6 items-center justify-center self-start rounded-full bg-black/5 text-current/70 transition hover:bg-black/10"
      >
        <ChevronLeft size={14} />
      </button>
    </div>
  );
}
