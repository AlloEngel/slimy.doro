import { useState, type DragEvent, type FormEvent } from "react";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Star,
    Trash2,
} from "lucide-react";
import { useAppStore, MAX_TASKS } from "@/store/useAppStore";
import type { Task } from "@/types";

export function TodoList() {
    // Reads the current task list in its manually defined order.
    const tasks = useAppStore((s) => s.tasks);

    // Adds a new task to the beginning of the task list.
    const addTask = useAppStore((s) => s.addTask);

    // Toggles whether a task is completed.
    const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);

    // Toggles whether a task is marked as a favorite.
    const toggleTaskFavorite = useAppStore(
        (s) => s.toggleTaskFavorite,
    );

    // Changes the title of an existing task.
    const renameTask = useAppStore((s) => s.renameTask);

    // Removes a task from the list.
    const deleteTask = useAppStore((s) => s.deleteTask);

    // Moves a task one position upward.
    const moveTaskUp = useAppStore((s) => s.moveTaskUp);

    // Moves a task one position downward.
    const moveTaskDown = useAppStore((s) => s.moveTaskDown);

    // Moves a task directly to another position.
    // This is used by drag and drop.
    const moveTask = useAppStore((s) => s.moveTask);

    // Temporary value used by the new-task input.
    const [draft, setDraft] = useState("");

    // ID of the task currently being renamed.
    const [editingId, setEditingId] = useState<string | null>(null);

    // Temporary value used while renaming a task.
    const [editValue, setEditValue] = useState("");

    // ID of the task currently being dragged.
    const [draggedId, setDraggedId] = useState<string | null>(null);

    // Prevents adding more tasks after reaching the global limit.
    const atLimit = tasks.length >= MAX_TASKS;

    /**
     * Submits the new-task form.
     *
     * Empty values and submissions after reaching MAX_TASKS are ignored.
     * After successfully adding a task, the input is cleared.
     */
    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (!draft.trim() || atLimit) {
            return;
        }

        addTask(draft);
        setDraft("");
    };

    /**
     * Starts editing a task title.
     *
     * The current title is copied into a temporary input value so
     * the user can change it without modifying the task immediately.
     */
    const beginEdit = (task: Task) => {
        setEditingId(task.id);
        setEditValue(task.title);
    };

    /**
     * Saves the currently edited task title.
     *
     * Empty titles are ignored by the store, and the editing state
     * is cleared after the edit is committed.
     */
    const commitEdit = () => {
        if (editingId && editValue.trim()) {
            renameTask(editingId, editValue.trim());
        }

        setEditingId(null);
    };

    /**
     * Moves a task one position upward.
     *
     * The store also protects against moving the first task,
     * while the UI disables the button for the first item.
     */
    const handleMoveUp = (taskId: string) => {
        moveTaskUp(taskId);
    };

    /**
     * Moves a task one position downward.
     *
     * The store also protects against moving the last task,
     * while the UI disables the button for the last item.
     */
    const handleMoveDown = (taskId: string) => {
        moveTaskDown(taskId);
    };

    /**
     * Starts dragging a task.
     *
     * The task ID is stored both locally and in the browser's
     * drag-and-drop data transfer object.
     */
    const handleDragStart = (
        e: DragEvent<HTMLLIElement>,
        taskId: string,
    ) => {
        setDraggedId(taskId);

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", taskId);
    };

    /**
     * Allows a task row to receive another dragged task.
     *
     * preventDefault is required for the drop event to work.
     */
    const handleDragOver = (e: DragEvent<HTMLLIElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    /**
     * Moves the dragged task to the position of the task
     * on which it was dropped.
     */
    const handleDrop = (
        e: DragEvent<HTMLLIElement>,
        targetIndex: number,
    ) => {
        e.preventDefault();

        const taskId = e.dataTransfer.getData("text/plain");

        if (!taskId) {
            return;
        }

        moveTask(taskId, targetIndex);
        setDraggedId(null);
    };

    /**
     * Clears the drag state after the drag operation ends.
     */
    const handleDragEnd = () => {
        setDraggedId(null);
    };

    return (
        <div
            className="flex min-h-0 flex-1 flex-col gap-2"
            data-no-drag
        >
            {/* Todo header and current task count. */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-bold uppercase tracking-[0.15em] text-current/80">
                    Tasks
                </span>

                <span
                    className={`font-mono text-[13px] ${
                        atLimit
                            ? "font-bold text-[var(--accent)]"
                            : "text-current/50"
                    }`}
                >
                    {tasks.length}/{MAX_TASKS}
                </span>
            </div>

            {/* Input used to create a new task. */}
            <form
                onSubmit={submit}
                className="flex items-center gap-1.5"
            >
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={
                        atLimit
                            ? "Task limit reached"
                            : "Add a task..."
                    }
                    disabled={atLimit}
                    className="w-full min-w-0 rounded-md bg-black/5 px-2.5 py-1.5 text-[15px] text-current placeholder:text-current/40 focus:bg-black/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={atLimit || !draft.trim()}
                    aria-label="Add task"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--on-accent)] transition hover:brightness-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                    <Plus size={13} strokeWidth={3} />
                </button>
            </form>

            {/* Explains why a new task cannot be added after reaching the limit. */}
            {atLimit && (
                <p className="-mt-1 text-sm italic text-[var(--accent)]/90">
                    10-task limit reached — finish or remove one to add more.
                </p>
            )}

            {/*
                Task list.
                The order here is exactly the order stored in the Zustand store.
                Tasks can be reordered using either the chevrons or drag and drop.
            */}
            <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
                {/* Empty-state message shown when there are no tasks. */}
                {tasks.length === 0 && (
                    <li className="pt-1 text-sm italic leading-snug text-current/50">
                        Nothing here yet — add your first task above.
                    </li>
                )}

                {/* Tasks are rendered directly in their manually stored order. */}
                {tasks.map((task, index) => {
                    // Determines whether this is the first task in the list.
                    const isFirst = index === 0;

                    // Determines whether this is the last task in the list.
                    const isLast = index === tasks.length - 1;

                    // Determines whether this task is currently being dragged.
                    const isDragging = draggedId === task.id;

                    return (
                        <li
                            key={task.id}
                            draggable
                            onDragStart={(e) =>
                                handleDragStart(e, task.id)
                            }
                            onDragOver={handleDragOver}
                            onDrop={(e) =>
                                handleDrop(e, index)
                            }
                            onDragEnd={handleDragEnd}
                            className={`group flex cursor-grab items-center gap-1.5 rounded-lg px-1 py-1.5 transition hover:bg-black/5 active:cursor-grabbing ${
                                task.done ? "opacity-50" : ""
                            } ${
                                isDragging
                                    ? "opacity-40"
                                    : ""
                            }`}
                        >
                            {/* Completion checkbox. */}
                            <button
                                type="button"
                                onClick={() =>
                                    toggleTaskDone(task.id)
                                }
                                aria-label={`Mark "${task.title}" ${
                                    task.done ? "not done" : "done"
                                }`}
                                className={`h-3.5 w-3.5 shrink-0 rounded-[4px] border transition ${
                                    task.done
                                        ? "border-[var(--accent)] bg-[var(--accent)]"
                                        : "border-current/40 hover:border-[var(--accent)]"
                                }`}
                            />

                            {/* Task title or inline rename field. */}
                            {editingId === task.id ? (
                                <input
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) =>
                                        setEditValue(
                                            e.target.value,
                                        )
                                    }
                                    onBlur={commitEdit}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            commitEdit();
                                        }

                                        if (e.key === "Escape") {
                                            setEditingId(null);
                                        }
                                    }}
                                    className="min-w-0 flex-1 rounded bg-black/5 px-1 text-[15px] text-current focus:outline-none"
                                />
                            ) : (
                                <button
                                    type="button"
                                    onDoubleClick={() =>
                                        beginEdit(task)
                                    }
                                    className={`min-w-0 flex-1 text-left text-[15px] leading-snug text-current/90 ${
                                        task.done
                                            ? "line-through"
                                            : ""
                                    }`}
                                    title="Double-click to rename"
                                >
                                    {task.title}
                                </button>
                            )}

                            {/*
                                Manual ordering controls.
                                They remain hidden until the task row is hovered,
                                matching the favorite and delete buttons.
                            */}
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                                {/* Move task up. Disabled for the first task. */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleMoveUp(task.id)
                                    }
                                    disabled={isFirst}
                                    aria-label={`Move "${task.title}" up`}
                                    title="Move task up"
                                    className="flex h-5 w-5 items-center justify-center rounded transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-20"
                                >
                                    <ChevronUp
                                        size={16}
                                        strokeWidth={2.25}
                                    />
                                </button>

                                {/* Move task down. Disabled for the last task. */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleMoveDown(task.id)
                                    }
                                    disabled={isLast}
                                    aria-label={`Move "${task.title}" down`}
                                    title="Move task down"
                                    className="flex h-5 w-5 items-center justify-center rounded transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-20"
                                >
                                    <ChevronDown
                                        size={16}
                                        strokeWidth={2.25}
                                    />
                                </button>
                            </div>

                            {/* Favorite toggle. */}
                            <button
                                type="button"
                                onClick={() =>
                                    toggleTaskFavorite(task.id)
                                }
                                aria-label={
                                    task.favorite
                                        ? "Unfavorite"
                                        : "Favorite"
                                }
                                title={
                                    task.favorite
                                        ? "Unfavorite"
                                        : "Favorite"
                                }
                                className={`flex h-5 w-5 shrink-0 items-center justify-center transition ${
                                    task.favorite
                                        ? "opacity-100"
                                        : "opacity-0 group-hover:opacity-100"
                                }`}
                            >
                                <Star
                                    size={16}
                                    className={
                                        task.favorite
                                            ? "fill-[var(--accent)] text-[var(--accent)]"
                                            : "text-current/50"
                                    }
                                />
                            </button>

                            {/* Task deletion button. */}
                            <button
                                type="button"
                                onClick={() =>
                                    deleteTask(task.id)
                                }
                                aria-label="Delete task"
                                title="Delete task"
                                className="flex h-5 w-5 shrink-0 items-center justify-center text-current/50 opacity-0 transition hover:text-[var(--accent)] group-hover:opacity-100 focus:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}