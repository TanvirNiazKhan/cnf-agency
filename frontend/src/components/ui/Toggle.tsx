'use client';
interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  label?: string;
  desc?: string;
}
export function Toggle({ on, onToggle, label, desc }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || desc) && (
        <div>
          {label && <div className="text-[13.5px] font-semibold text-[#16222e]">{label}</div>}
          {desc && <div className="text-[12px] text-[#7b8794] mt-0.5">{desc}</div>}
        </div>
      )}
      <button
        onClick={onToggle}
        className="relative flex-shrink-0 transition-colors duration-200 rounded-full cursor-pointer"
        style={{ width: 42, height: 24, background: on ? '#0a6ed1' : '#cfd6df' }}
      >
        <span
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-[left] duration-200"
          style={{ left: on ? 21 : 3 }}
        />
      </button>
    </div>
  );
}
