'use client';

export function SprintDropzone({ isOver }: { isOver: boolean }) {
  return (
    <div
      className={`mt-3 flex min-h-28 items-center justify-center rounded-3xl border border-dashed px-4 text-center text-base transition ${
        isOver
          ? 'border-[#b794ff]/80 bg-[#b794ff]/10 text-[#e8dcff]'
          : 'border-white/10 bg-black/10 text-white/35'
      }`}
    >
      Drop tasks here to add to sprint
    </div>
  );
}
