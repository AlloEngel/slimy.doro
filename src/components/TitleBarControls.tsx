import { type ReactNode } from "react";
import { Minus, Pin, PinOff, Settings, X } from "lucide-react";
import { closeApp, minimizeApp } from "@/lib/tauri";

interface Props {
    pinned: boolean;
    onTogglePin: () => void;
    onOpenSettings: () => void;
}

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

export function TitleBarControls({ pinned, onTogglePin, onOpenSettings }: Props) {
    return (
        <>
            <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5" data-no-drag>
                <ControlButton
                    label={pinned ? "Unpin (disable click-through)" : "Pin window (click-through)"}
                    onClick={onTogglePin}
                    active={pinned}
                >
                    {pinned ? <PinOff size={18} /> : <Pin size={18} />}
                </ControlButton>

                {pinned && (
                    <span className="font-mono text-[9px] leading-none text-[var(--text)]">
                        Unlock: Ctrl+Shift+U
                    </span>
                )}
            </div>

            <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5" data-no-drag>
                <ControlButton label="Settings" onClick={onOpenSettings}>
                    <Settings size={18} />
                </ControlButton>

                <ControlButton label="Minimize" onClick={() => void minimizeApp()}>
                    <Minus size={18} />
                </ControlButton>

                <ControlButton label="Close" onClick={() => void closeApp()}>
                    <X size={18} />
                </ControlButton>
            </div>
        </>
    );
}