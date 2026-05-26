'use client';

export function CreateProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[440px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0f111a] px-6 text-center transition hover:border-[#b794ff]/40 hover:bg-[#151828]"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl text-white/80">
        +
      </div>
      <p className="text-3xl font-semibold text-white">Create New Project</p>
      <p className="mt-2 text-xl text-white/65">Start a new initiative from template</p>
    </button>
  );
}
