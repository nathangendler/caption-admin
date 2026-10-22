export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="title mt-1 text-[28px] leading-none">{value}</p>
      {hint && <p className="mt-2 text-[12px] text-subtle">{hint}</p>}
    </div>
  );
}
