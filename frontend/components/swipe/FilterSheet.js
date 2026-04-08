// components/swipe/FilterSheet.js
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function FilterSheet({ filters, onApply, onClose }) {
  const [f, setF] = useState({ minAge: 18, maxAge: 45, maxDistance: 50, ...filters });
  const set = (k) => (v) => setF(p => ({ ...p, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full glass-card rounded-b-none rounded-t-[28px] px-6 pt-6 pb-10"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-xl font-bold text-white">Discovery Filters</h2>
          <button onClick={onClose} className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/50"><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/60">Age range</span>
              <span className="gradient-text font-semibold">{f.minAge} – {f.maxAge}</span>
            </div>
            <div className="flex gap-3">
              <input type="range" min="18" max="80" value={f.minAge} onChange={e => set('minAge')(+e.target.value)} className="flex-1 accent-[#FF2D55]" />
              <input type="range" min="18" max="80" value={f.maxAge} onChange={e => set('maxAge')(+e.target.value)} className="flex-1 accent-[#FF2D55]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/60">Max distance</span>
              <span className="gradient-text font-semibold">{f.maxDistance} km</span>
            </div>
            <input type="range" min="5" max="200" value={f.maxDistance} onChange={e => set('maxDistance')(+e.target.value)} className="w-full accent-[#FF2D55]" />
          </div>
        </div>

        <button onClick={() => onApply(f)} className="btn-spark w-full mt-8 py-4">Apply Filters</button>
      </motion.div>
    </motion.div>
  );
}
