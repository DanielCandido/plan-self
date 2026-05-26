'use client';

interface FilterOption {
  label: string;
  value: string | null;
}

function SelectPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-base text-white/80">
      <span className="text-white/85">{label}:</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="bg-transparent outline-none"
      >
        {options.map((option) => (
          <option key={option.label} value={option.value ?? ''} className="bg-[#101118] text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProjectFilters({
  totalCount,
  status,
  priority,
  ownerId,
  ownerOptions,
  onStatusChange,
  onPriorityChange,
  onOwnerChange,
}: {
  totalCount: number;
  status: string | null;
  priority: string | null;
  ownerId: string | null;
  ownerOptions: Array<{ value: string; label: string }>;
  onStatusChange: (value: string | null) => void;
  onPriorityChange: (value: string | null) => void;
  onOwnerChange: (value: string | null) => void;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <SelectPill
          label="Status"
          value={status}
          onChange={onStatusChange}
          options={[
            { label: 'All', value: null },
            { label: 'On Track', value: 'ON_TRACK' },
            { label: 'At Risk', value: 'AT_RISK' },
            { label: 'Off Track', value: 'OFF_TRACK' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'Planned', value: 'PLANNED' },
          ]}
        />
        <SelectPill
          label="Priority"
          value={priority}
          onChange={onPriorityChange}
          options={[
            { label: 'All', value: null },
            { label: 'Critical', value: 'CRITICAL' },
            { label: 'High', value: 'HIGH' },
            { label: 'Medium', value: 'MEDIUM' },
            { label: 'Low', value: 'LOW' },
          ]}
        />
        <SelectPill
          label="Owner"
          value={ownerId}
          onChange={onOwnerChange}
          options={[{ label: 'Team', value: null }, ...ownerOptions]}
        />
      </div>

      <p className="text-2xl text-white/75">Showing {totalCount} Projects</p>
    </div>
  );
}
