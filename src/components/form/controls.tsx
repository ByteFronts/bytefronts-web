"use client";

// Small controlled form controls. Each one renders hidden/native inputs so the
// value is posted with the surrounding <form> and handled by a server action.

type Option = { value: string; label: string };

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-medium text-muted">
          {label}
        </label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export const inputClass =
  "slot w-full px-4 py-3 text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--brand)]";

// Pick exactly one option, shown as equal-width buttons.
export function Segmented({
  name,
  value,
  onChange,
  options,
  disabledValues = [],
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly Option[];
  disabledValues?: string[];
}) {
  return (
    <div role="radiogroup" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      <input type="hidden" name={name} value={value} />
      {options.map((o) => {
        const on = o.value === value;
        const disabled = disabledValues.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className="chip justify-center px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Pick any number of options, shown as pills.
export function Chips({
  name,
  value,
  onChange,
  options,
  max,
}: {
  name: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: readonly Option[];
  max?: number;
}) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else if (!max || value.length < max) onChange([...value, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o.value)}
            className="chip px-4 py-1.5 text-sm"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  name,
  checked,
  onChange,
  title,
  description,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6">
      <span>
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="notch relative h-6 w-11 shrink-0 bg-line transition peer-checked:bg-brand peer-focus-visible:shadow-[inset_0_0_0_2px_var(--fg)] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="notch bg-red-400/10 px-3 py-2 text-sm text-red-300">{children}</p>
  );
}
