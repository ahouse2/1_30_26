import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // optional utility for class merging

type Props = {
  title: string;
  value?: string;
  subtitle?: string;
  chart?: boolean;
  timeline?: boolean;
  glow?: 'cyan' | 'pink' | 'violet' | 'blue';
};

export function MetricCard({ title, value, subtitle, chart, timeline, glow }: Props) {
  const glowMap = {
    cyan: 'metric-card--cyan',
    pink: 'metric-card--pink',
    violet: 'metric-card--violet',
    blue: 'metric-card--blue',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'metric-card',
        glowMap[glow || 'blue']
      )}
    >
      <h2>{title}</h2>
      {value && <div className="metric-card__value">{value}</div>}
      {subtitle && <p className="metric-card__subtitle">{subtitle}</p>}
      {chart && <div className="metric-card__chart" />}
      {timeline && (
        <div className="metric-card__timeline" />
      )}
    </motion.div>
  );
}
