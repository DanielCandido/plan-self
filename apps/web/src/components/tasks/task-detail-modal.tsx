'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { TaskDetail, TaskChecklistItem } from '@plan-self/types';
import type { TaskActivityItem } from '@/hooks/use-task-detail';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

const STATUS_DOT: Record<string, string> = {
  BACKLOG: 'bg-white/40',
  TODO: 'bg-[#8ad4ff]',
  IN_PROGRESS: 'bg-[#b794ff]',
  REVIEW: 'bg-amber-300',
  DONE: 'bg-emerald-400',
  BLOCKED: 'bg-rose-400',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-white/50',
  MEDIUM: 'text-[#8ad4ff]',
  HIGH: 'text-amber-300',
  URGENT: 'text-rose-400',
};

const PRIORITY_ICON: Record<string, string> = {
  LOW: '↓',
  MEDIUM: '→',
  HIGH: '↑',
  URGENT: '⚡',
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInput(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

function historyLabel(item: TaskActivityItem) {
  if (item.fromStatus && item.toStatus) {
    const actor = item.actor?.name ?? 'Alguém';
    const from = STATUS_LABELS[item.fromStatus] ?? item.fromStatus;
    const to = STATUS_LABELS[item.toStatus] ?? item.toStatus;
    return `${actor} moveu de ${from} para ${to}`;
  }
  if (item.action === 'CREATED') return `Tarefa criada por ${item.actor?.name ?? 'Alguém'}`;
  if (item.action === 'DELETED') return `Tarefa removida por ${item.actor?.name ?? 'Alguém'}`;
  if (item.action === 'COMMENTED') return null; // shown as comment
  return `${item.action?.toLowerCase().replace(/_/g, ' ')} por ${item.actor?.name ?? 'Alguém'}`;
}

function Avatar({ name, avatarUrl, size = 8 }: { name: string; avatarUrl: string | null; size?: number }) {
  const sizeStyle = { width: size * 4, height: size * 4 };
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={sizeStyle}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={sizeStyle}
      className="flex items-center justify-center rounded-full bg-[#8b5cf6]/30 text-xs font-semibold text-[#c4b5fd]"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Modal skeleton ─────────────────────────────────────────────────────────────

function ModalSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6 animate-pulse p-1">
      <div className="h-4 w-48 rounded-full bg-white/10" />
      <div className="h-8 w-3/4 rounded-xl bg-white/10" />
      <div className="h-32 w-full rounded-2xl bg-white/[0.05]" />
      <div className="h-24 w-full rounded-2xl bg-white/[0.05]" />
    </div>
  );
}

// ── Checklist ─────────────────────────────────────────────────────────────────

function ChecklistSection({
  items,
  onToggle,
  onAdd,
  onRemove,
}: {
  items: TaskChecklistItem[];
  onToggle: (id: string, done: boolean) => void;
  onAdd: (title: string) => void;
  onRemove: (id: string) => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const done = items?.filter((i) => i.done).length;
  const pct = items?.length > 0 ? Math.round((done / items.length) * 100) : 0;

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    onAdd(title);
    setNewTitle('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Subtasks</span>
        <span className="text-xs text-white/40">{pct}% Completo</span>
      </div>
      {items?.length > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#8b5cf6] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <div className="space-y-2">
        {items?.map((item) => (
          <div key={item.id} className="flex items-center gap-3 group">
            <button
              type="button"
              onClick={() => onToggle(item.id, !item.done)}
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition ${
                item.done
                  ? 'border-[#8b5cf6] bg-[#8b5cf6] text-white'
                  : 'border-white/20 bg-white/[0.04] hover:border-white/40'
              }`}
            >
              {item.done ? '✓' : ''}
            </button>
            <span
              className={`flex-1 text-sm transition ${
                item.done ? 'text-white/35 line-through' : 'text-white/80'
              }`}
            >
              {item.title}
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="hidden group-hover:block text-white/30 hover:text-rose-400 text-xs px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
          }}
          placeholder="Adicionar subtask…"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/65 hover:bg-white/[0.08] disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Activity feed ─────────────────────────────────────────────────────────────

function ActivityFeed({
  items,
  onAddComment,
  onDeleteComment,
  currentUserId,
}: {
  items: TaskActivityItem[];
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => void;
  currentUserId: string | null;
}) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const content = comment.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(content);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Activity</span>
      <div className="space-y-3">
        {items.map((item) => {
          if (item.type === 'comment') {
            return (
              <div key={item.id} className="flex gap-3">
                <Avatar name={item.author?.name ?? '?'} avatarUrl={item.author?.avatarUrl ?? null} size={8} />
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl border border-white/8 bg-[#14151c] px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{item.author?.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/35">{timeAgo(item.createdAt)}</span>
                        {currentUserId && item.author?.id === currentUserId && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(item.id)}
                            className="text-[10px] text-white/25 hover:text-rose-400"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-white/70">{item.content}</p>
                  </div>
                </div>
              </div>
            );
          }

          const label = historyLabel(item);
          if (!label) return null;
          return (
            <div key={item.id} className="flex items-center gap-3 text-xs text-white/40">
              <svg viewBox="0 0 16 16" className="h-4 w-4 flex-shrink-0 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v4l2 2" />
              </svg>
              <span>{label}</span>
              <span className="ml-auto text-white/25">{timeAgo(item.createdAt)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void handleSubmit(); }
          }}
          rows={2}
          placeholder="Adicionar comentário… (Ctrl+Enter para enviar)"
          className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!comment.trim() || submitting}
          className="self-end rounded-2xl bg-[#8b5cf6] px-4 py-3 text-sm font-medium text-white hover:bg-[#7c3aed] disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

// ── Meta panel ────────────────────────────────────────────────────────────────

function MetaPanel({
  task,
  members,
  statusOptions,
  onUpdate,
  onShare,
  onDelete,
}: {
  task: TaskDetail;
  members: Array<{ userId: string; name: string; avatarUrl: string | null }>;
  statusOptions: Array<{ id: string; name: string; type: string }>;
  onUpdate: (payload: Record<string, unknown>) => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const assigneeIds = task.assignees.map((a) => a.id);

  const toggleAssignee = (userId: string) => {
    const next = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId];
    onUpdate({ assigneeIds: next });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* AI panel */}
      <div className="rounded-[24px] border border-white/10 bg-[#0e0c18] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">✦ IA Plan Self</span>
          </div>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/50">BETA</span>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Suggested Next Steps</div>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-white/60">
            <span className="mt-0.5 text-emerald-400">✓</span>
            Revisar e validar os critérios de aceitação.
          </li>
          <li className="flex items-start gap-2 text-sm text-white/60">
            <span className="mt-0.5 text-emerald-400">✓</span>
            Testar acessibilidade via leitor de tela.
          </li>
        </ul>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-white/35">Risk Analysis</span>
          <span className="rounded-full border border-emerald-400/30 px-2 py-0.5 text-[11px] text-emerald-400">Low</span>
        </div>
        <button
          type="button"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 text-sm text-white/65 hover:bg-white/[0.08]"
        >
          Generate Summary
        </button>
      </div>

      {/* Status */}
      <MetaRow label="Status">
        <select
          value={task.boardColumnId ?? ''}
          onChange={(e) => onUpdate({ boardColumnId: e.target.value })}
          className="flex-1 rounded-xl border border-white/10 bg-transparent px-2 py-1 text-sm text-white outline-none"
        >
          {statusOptions.map((column) => (
            <option key={column.id} value={column.id} className="bg-[#101118]">
              {column.name}
            </option>
          ))}
        </select>
        <span
          className={`h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT[task.boardColumnType ?? 'BACKLOG'] ?? 'bg-white/30'}`}
        />
      </MetaRow>

      {/* Assignee */}
      <MetaRow label="Assignee">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {task.assignees.length === 0 && (
            <span className="text-sm text-white/30">Nenhum</span>
          )}
          {task.assignees.map((a) => (
            <div key={a.id} className="flex items-center gap-1.5">
              <Avatar name={a.name} avatarUrl={a.avatarUrl} size={6} />
              <span className="text-sm text-white/80">{a.name}</span>
            </div>
          ))}
        </div>
        {members.length > 0 && (
          <AssigneeDropdown
            members={members}
            assigneeIds={assigneeIds}
            onToggle={toggleAssignee}
          />
        )}
      </MetaRow>

      {/* Priority */}
      <MetaRow label="Priority">
        <select
          value={task.priority}
          onChange={(e) => onUpdate({ priority: e.target.value })}
          className={`flex-1 rounded-xl border border-white/10 bg-transparent px-2 py-1 text-sm font-semibold outline-none ${PRIORITY_COLOR[task.priority] ?? 'text-white/70'}`}
        >
          {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
            <option key={p} value={p} className="bg-[#101118] text-white">{p}</option>
          ))}
        </select>
        <span className={`text-sm ${PRIORITY_COLOR[task.priority] ?? ''}`}>{PRIORITY_ICON[task.priority]}</span>
      </MetaRow>

      {/* Due Date */}
      <MetaRow label="Due Date">
        <input
          type="date"
          value={toDateInput(task.dueDate)}
          onChange={(e) => onUpdate({ dueDate: e.target.value || null })}
          className="flex-1 rounded-xl border border-white/10 bg-transparent px-2 py-1 text-sm text-white outline-none"
        />
        {task.dueDate && (
          <span className="text-sm text-white/60">{formatDate(task.dueDate)}</span>
        )}
      </MetaRow>

      {/* Labels */}
      <MetaRow label="Labels">
        <LabelEditor
          labels={task.labels}
          onChange={(labels) => onUpdate({ labels })}
        />
      </MetaRow>

      {/* Points */}
      <MetaRow label="Points">
        <input
          type="number"
          min={0}
          max={1000}
          value={task.points ?? ''}
          onChange={(e) => onUpdate({ points: e.target.value ? Number(e.target.value) : null })}
          className="w-20 rounded-xl border border-white/10 bg-transparent px-2 py-1 text-sm text-white outline-none"
          placeholder="—"
        />
      </MetaRow>

      {/* Time spent placeholder */}
      <div className="rounded-[20px] border border-white/10 bg-[#0e0c18] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Time spent</span>
          <button type="button" className="text-white/30 hover:text-white">▶</button>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-white">—</span>
          <span className="text-sm text-white/40">/ {task.points ? `${task.points}h est.` : '—'}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm text-white/65 hover:bg-white/[0.08]"
        >
          <ShareIcon />
          Share Task
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] py-3 text-sm text-rose-400 hover:bg-rose-500/10"
        >
          <TrashIcon />
          Delete
        </button>
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 flex-shrink-0 text-sm text-white/40">{label}</span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function AssigneeDropdown({
  members,
  assigneeIds,
  onToggle,
}: {
  members: Array<{ userId: string; name: string; avatarUrl: string | null }>;
  assigneeIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/50 hover:bg-white/[0.08]"
      >
        +
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 rounded-2xl border border-white/10 bg-[#101118] p-2 shadow-2xl">
          {members.map((m) => (
            <button
              key={m.userId}
              type="button"
              onClick={() => onToggle(m.userId)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/[0.06] ${
                assigneeIds.includes(m.userId) ? 'text-white' : 'text-white/55'
              }`}
            >
              <Avatar name={m.name} avatarUrl={m.avatarUrl} size={6} />
              <span className="flex-1 text-left">{m.name}</span>
              {assigneeIds.includes(m.userId) && <span className="text-[#8b5cf6]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LabelEditor({ labels, onChange }: { labels: string[]; onChange: (labels: string[]) => void }) {
  const [newLabel, setNewLabel] = useState('');
  const LABEL_COLORS = [
    'bg-[#8ad4ff]/15 text-[#8ad4ff]',
    'bg-amber-400/15 text-amber-300',
    'bg-rose-400/15 text-rose-300',
    'bg-emerald-400/15 text-emerald-300',
    'bg-[#b794ff]/15 text-[#c4b5fd]',
    'bg-orange-400/15 text-orange-300',
  ];
  const colorFor = (name: string) => LABEL_COLORS[name.charCodeAt(0) % LABEL_COLORS.length];

  return (
    <div className="flex flex-1 flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${colorFor(label)}`}
        >
          {label}
          <button
            type="button"
            onClick={() => onChange(labels.filter((l) => l !== label))}
            className="opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={newLabel}
        onChange={(e) => setNewLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && newLabel.trim()) {
            e.preventDefault();
            if (!labels.includes(newLabel.trim())) onChange([...labels, newLabel.trim()]);
            setNewLabel('');
          }
        }}
        placeholder="+ Label"
        className="w-20 rounded-md border border-white/10 bg-transparent px-2 py-0.5 text-xs text-white placeholder-white/30 outline-none"
      />
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="4" r="1.5" />
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="M5.5 7.1 10.5 4.9M5.5 8.9l5 2.2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9h8l1-9" />
    </svg>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export interface TaskDetailModalProps {
  open: boolean;
  taskId: string | null;
  projectName: string;
  members: Array<{ userId: string; name: string; avatarUrl: string | null }>;
  statusOptions: Array<{ id: string; name: string; type: string }>;
  task: TaskDetail | null;
  isLoading: boolean;
  activity: TaskActivityItem[];
  currentUserId: string | null;
  onClose: () => void;
  onUpdate: (payload: Record<string, unknown>) => void;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => void;
  onDelete: () => void;
}

export function TaskDetailModal({
  open,
  taskId,
  projectName,
  members,
  statusOptions,
  task,
  isLoading,
  activity,
  currentUserId,
  onClose,
  onUpdate,
  onAddComment,
  onDeleteComment,
  onDelete,
}: TaskDetailModalProps) {
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // sync drafts when task loads
  useEffect(() => {
    if (task) {
      setTitleDraft(task.title);
      setDescDraft(task.description ?? '');
    }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const scheduleUpdate = useCallback(
    (payload: Record<string, unknown>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onUpdate(payload), 600);
    },
    [onUpdate],
  );

  const handleChecklistToggle = (id: string, done: boolean) => {
    if (!task) return;
    const next = task.checklist.map((item) => (item.id === id ? { ...item, done } : item));
    onUpdate({ checklist: next });
  };

  const handleChecklistAdd = (title: string) => {
    if (!task) return;
    const next = [
      ...task.checklist,
      { id: crypto.randomUUID(), title, done: false },
    ];
    onUpdate({ checklist: next });
  };

  const handleChecklistRemove = (id: string) => {
    if (!task) return;
    const next = task.checklist.filter((item) => item.id !== id);
    onUpdate({ checklist: next });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${task?.code ?? taskId ?? ''}`).then(
      () => toast.success('Task ID copiado!'),
      () => toast.error('Não foi possível copiar o ID.'),
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 backdrop-blur-sm bg-black/70">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Fechar modal"
      />

      {/* panel */}
      <div className="relative z-10 flex h-[90vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#101118] shadow-2xl">
        {/* ── Left column ── */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-white/8">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading || !task ? (
              <ModalSkeleton />
            ) : (
              <>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-white/35">
                  <span>Projects</span>
                  <span>›</span>
                  <span>{projectName}</span>
                  <span>›</span>
                  <span className="font-semibold text-white/55">{task.code}</span>
                </div>

                {/* Title */}
                {editingTitle ? (
                  <textarea
                    ref={titleRef}
                    value={titleDraft}
                    rows={2}
                    autoFocus
                    onChange={(e) => {
                      setTitleDraft(e.target.value);
                      scheduleUpdate({ title: e.target.value });
                    }}
                    onBlur={() => {
                      setEditingTitle(false);
                      if (titleDraft.trim() && titleDraft !== task.title) {
                        onUpdate({ title: titleDraft.trim() });
                      }
                    }}
                    className="w-full resize-none rounded-xl border border-white/20 bg-white/[0.04] p-2 text-3xl font-bold text-white outline-none"
                  />
                ) : (
                  <h1
                    className="cursor-pointer text-3xl font-bold text-white leading-tight hover:opacity-80"
                    onClick={() => setEditingTitle(true)}
                  >
                    {task.title}
                  </h1>
                )}

                {/* Formatting bar */}
                <div className="flex items-center gap-1">
                  {[
                    { label: 'B', title: 'Bold', cls: 'font-bold' },
                    { label: 'I', title: 'Italic', cls: 'italic' },
                    { label: '≡', title: 'List' },
                    { label: '🔗', title: 'Link' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      title={btn.title}
                      className={`rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/60 hover:bg-white/[0.09] ${btn.cls ?? ''}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ml-2 flex items-center gap-1.5 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 px-3 py-1.5 text-sm font-medium text-[#c4b5fd] hover:bg-[#8b5cf6]/30"
                  >
                    ✦ AI Sparkle
                  </button>
                </div>

                {/* Description */}
                {editingDesc ? (
                  <textarea
                    ref={descRef}
                    value={descDraft}
                    rows={6}
                    autoFocus
                    onChange={(e) => {
                      setDescDraft(e.target.value);
                      scheduleUpdate({ description: e.target.value });
                    }}
                    onBlur={() => {
                      setEditingDesc(false);
                      if (descDraft !== (task.description ?? '')) {
                        onUpdate({ description: descDraft });
                      }
                    }}
                    className="w-full resize-none rounded-xl border border-white/20 bg-white/[0.04] p-3 text-sm text-white/80 outline-none leading-relaxed"
                  />
                ) : (
                  <div
                    className="cursor-pointer rounded-xl text-sm text-white/65 leading-relaxed hover:text-white/80"
                    onClick={() => setEditingDesc(true)}
                  >
                    {task.description ? (
                      <p className="whitespace-pre-wrap">{task.description}</p>
                    ) : (
                      <p className="italic text-white/30">Clique para adicionar descrição…</p>
                    )}
                  </div>
                )}

                {/* Checklist */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <ChecklistSection
                    items={task.checklist}
                    onToggle={handleChecklistToggle}
                    onAdd={handleChecklistAdd}
                    onRemove={handleChecklistRemove}
                  />
                </div>

                {/* Activity */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <ActivityFeed
                    items={activity}
                    onAddComment={onAddComment}
                    onDeleteComment={onDeleteComment}
                    currentUserId={currentUserId}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex w-80 flex-shrink-0 flex-col overflow-y-auto p-5">
          {/* close button */}
          <div className="mb-4 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/50 hover:bg-white/[0.09]"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {isLoading || !task ? (
            <div className="animate-pulse space-y-4">
              <div className="h-40 rounded-2xl bg-white/[0.05]" />
              <div className="h-8 rounded-xl bg-white/[0.05]" />
              <div className="h-8 rounded-xl bg-white/[0.05]" />
            </div>
          ) : (
            <>
              <MetaPanel
                task={task}
                members={members}
                statusOptions={statusOptions}
                onUpdate={onUpdate}
                onShare={handleShare}
                onDelete={handleDelete}
              />
              {confirmDelete && (
                <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
                  Clique em Delete novamente para confirmar a exclusão.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
