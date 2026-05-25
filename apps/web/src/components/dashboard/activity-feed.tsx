'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DashboardActivity } from '@plan-self/types';

interface ActivityFeedProps {
  activities: DashboardActivity[];
}

export const ActivityFeed = memo(function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <article className="glass-card rounded-lg border border-white/10 p-4 transition duration-200 hover:shadow-glow">
      <h2 className="text-sm font-semibold text-white">Atividade Recente</h2>

      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-[#d2bbff]/65">Sem atividades recentes.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {activities.slice(0, 8).map((activity, index) => (
            <motion.li
              key={activity.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded border border-white/10 bg-white/[0.04] p-2.5"
            >
              <p className="text-xs font-medium text-white">{activity.user}</p>
              <p className="mt-0.5 text-xs text-[#d2bbff]/70">{activity.type}</p>
              {activity.task && <p className="mt-1 text-xs text-white/80">{activity.task}</p>}
              <p className="mt-1 text-[11px] text-white/45">
                {new Date(activity.createdAt).toLocaleString('pt-BR')}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </article>
  );
});
