'use client'

import { motion } from 'framer-motion'

interface VoiceWaveformProps {
  isActive: boolean
  color?: string
  barCount?: number
}

export function VoiceWaveform({
  isActive,
  color = '#ff4444',
  barCount = 24,
}: VoiceWaveformProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i)

  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {bars.map((i) => {
        const centerDist = Math.abs(i - barCount / 2) / (barCount / 2)
        const maxHeight = 36 - centerDist * 20
        const delay = (i * 0.06) % 1.2
        const duration = 0.4 + Math.random() * 0.3

        return (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 3,
              height: 8,
              backgroundColor: color,
              opacity: 0.6,
            }}
            animate={
              isActive
                ? {
                    height: [8, maxHeight * (0.6 + Math.random() * 0.4), 8],
                    opacity: [0.4, 1, 0.4],
                  }
                : { height: 8, opacity: 0.4 }
            }
            transition={
              isActive
                ? {
                    duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay,
                  }
                : { duration: 0.3 }
            }
          />
        )
      })}
    </div>
  )
}
