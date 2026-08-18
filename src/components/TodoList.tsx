// Replaces TodoDrawer + TodoCompact. No expand/collapse — this lives
// directly in the main layout flow. Hard-capped at MAX_TASKS.
import { useState, type FormEvent } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { useAppStore, MAX_TASKS } from "@/store/useAppStore";
import type { Task } from "@/types";

function sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return b.createdAt - a.createdAt;
    });
}

export function TodoList() {
    const tasks = useAppStore((s) => s.tasks);
    const addTask = useAppStore((s) => s.addTask);
    const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
    const toggleTaskFavorite = useAppStore((s) => s.toggleTaskFavorite);
    const renameTask = useAppStore((s) => s.renameTask);
    const deleteTask = useAppStore((s) => s.deleteTask);

    const [draft, setDraft] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const atLimit = tasks.length >= MAX_TASKS;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!draft.trim() || atLimit) return;
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
        <div className="flex min-h-0 flex-1 flex-col gap-2" data-no-drag>
            <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-current/80">
          Tasks
        </span>
                <span
                    className={`font-mono text-[9px] ${atLimit ? "font-bold text-terracotta" : "text-current/50"}`}
                >
          {tasks.length}/{MAX_TASKS}
        </span>
            </div>

            <form onSubmit={submit} className="flex items-center gap-1.5">
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={atLimit ? "Task limit reached" : "Add a task..."}
                    disabled={atLimit}
                    className="w-full min-w-0 rounded-md bg-black/5 px-2.5 py-1.5 text-[11px] text-current placeholder:text-current/40 focus:bg-black/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={atLimit || !draft.trim()}
                    aria-label="Add task"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-terracotta text-cream transition hover:brightness-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                    <Plus size={13} strokeWidth={3} />
                </button>
            </form>

            {atLimit && (
                <p className="-mt-1 text-[10px] italic text-terracotta/90">
                    10-task limit reached — finish or remove one to add more.
                </p>
            )}

            <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
                {tasks.length === 0 && (
                    <li className="pt-1 text-[11px] italic leading-snug text-current/50">
                        Nothing here yet — add your first task above.
                    </li>
                )}
                {sortTasks(tasks).map((task) => (
                    <li
                        key={task.id}
                        className={`group flex items-start gap-1.5 rounded-lg px-1 py-1 transition hover:bg-black/5 ${
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
                                className="min-w-0 flex-1 rounded bg-black/5 px-1 text-[11px] text-current focus:outline-none"
                            />
                        ) : (
                            <button
                                type="button"
                                onDoubleClick={() => beginEdit(task)}
                                className={`min-w-0 flex-1 text-left text-[11px] leading-snug text-current/90 ${task.done ? "line-through" : ""}`}
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
                                size={11}
                                className={task.favorite ? "fill-terracotta text-terracotta opacity-100" : "text-current/50"}
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            aria-label="Delete task"
                            className="opacity-0 text-current/50 transition hover:text-terracotta group-hover:opacity-100"
                        >
                            <Trash2 size={11} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}