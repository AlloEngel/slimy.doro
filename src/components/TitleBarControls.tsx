import { type ReactNode } from "react";
import { Minus, Pin, PinOff, Settings, X } from "lucide-react";
import { closeApp, minimizeApp } from "@/lib/tauri";

interface Props {
    // Indicates whether the window is currently pinned and click-through.
    pinned: boolean;

    // Toggles the window between pinned and normal interaction modes.
    onTogglePin: () => void;

    // Opens the Settings panel.
    onOpenSettings: () => void;
}

/**
 * Reusable circular control button used by the title bar.
 *
 * The data-no-drag attribute prevents the window drag handler from
 * treating the button as a draggable surface.
 */
function ControlButton({
                           label,
                           onClick,
                           children,
                           active,
                       }: {
    label: string;
    onClick: () => void;
    children: ReactNode;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            data-no-drag
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
                active
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
                    : "bg-white/10 text-current hover:bg-white/15"
            }`}
        >
            {children}
        </button>
    );
}

/**
 * Renders the application's top-left and top-right window controls.
 *
 * The left side contains the Pin control. When the window is pinned,
 * the interface becomes click-through, so the displayed shortcut
 * provides the way to unlock the window again.
 *
 * The right side contains Settings, Minimize, and Close controls.
 */
export function TitleBarControls({
                                     pinned,
                                     onTogglePin,
                                     onOpenSettings,
                                 }: Props) {
    return (
        <>
            {/* Pin control and unlock information. */}
            <div
                className="absolute left-3 top-3 z-20 flex items-center gap-1.5"
                data-no-drag
            >
                <ControlButton
                    label={
                        pinned
                            ? "Unpin (disable click-through)"
                            : "Pin window (click-through)"
                    }
                    onClick={onTogglePin}
                    active={pinned}
                >
                    {pinned ? (
                        <PinOff size={18} />
                    ) : (
                        <Pin size={18} />
                    )}
                </ControlButton>

                {/* The pinned window is click-through, so the shortcut is
                    the available way to unlock it after pinning. */}
                {pinned && (
                    <span className="text-[11px] font-medium leading-tight text-[var(--text)]">
                        Unlock —{" "}
                        <strong className="font-mono font-extrabold text-white">
                            Ctrl+Shift+U
                        </strong>
                    </span>
                )}
            </div>

            {/* Settings, minimize, and close controls. */}
            <div
                className="absolute right-3 top-3 z-20 flex items-center gap-1.5"
                data-no-drag
            >
                <ControlButton
                    label="Settings"
                    onClick={onOpenSettings}
                >
                    <Settings size={18} />
                </ControlButton>

                <ControlButton
                    label="Minimize"
                    onClick={() => void minimizeApp()}
                >
                    <Minus size={18} />
                </ControlButton>

                <ControlButton
                    label="Close"
                    onClick={() => void closeApp()}
                >
                    <X size={18} />
                </ControlButton>
            </div>
        </>
    );
}