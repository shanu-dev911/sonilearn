'use client';

import { motion } from 'framer-motion';
import type { FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  desc: string;
  children?: ReactNode;
  icon: LucideIcon;
}

const DashboardCard: FC<DashboardCardProps> = ({ title, desc, children, icon: Icon }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="glass p-6 card-3d flex flex-col"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mt-2 flex-grow">{desc}</p>
      {children && <div className="mt-6">{children}</div>}
    </motion.div>
  )
}

export default DashboardCard;
