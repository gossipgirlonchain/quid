export function Slider({
  min,
  max,
  step = 10,
  value,
  onChange,
  ariaLabel,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel}
      className="quid-slider my-1.5 w-full cursor-pointer"
    />
  );
}
