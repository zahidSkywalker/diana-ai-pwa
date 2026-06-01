'use client'

import { motion } from 'framer-motion'

interface OrbProps {
  isThinking: boolean
  isSpeaking: boolean
  isListening: boolean
}

export function JarvisOrb({ isThinking, isSpeaking, isListening }: OrbProps) {
  const getStatusColor = () => {
    if (isListening) return '#ff4444'
    if (isSpeaking) return '#00ffa3'
    if (isThinking) return '#00d4ff'
    return '#00d4ff'
  }

  const color = getStatusColor()

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      {/* Outer pulse rings - only when active */}
      {(isThinking || isSpeaking || isListening) && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 120,
              height: 120,
              border: `2px solid ${color}`,
              opacity: 0,
            }}
            animate={{
              scale: [1, 2],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 120,
              height: 120,
              border: `1px solid ${color}`,
              opacity: 0,
            }}
            animate={{
              scale: [1, 2.5],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 120,
              height: 120,
              border: `1px solid ${color}`,
              opacity: 0,
            }}
            animate={{
              scale: [1, 3],
              opacity: [0.2, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 1,
            }}
          />
        </>
      )}

      {/* Rotating outer ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 100,
          height: 100,
          border: `2px solid ${color}33`,
          borderTopColor: color,
          borderRightColor: `${color}88`,
        }}
        animate={{ rotate: isThinking || isSpeaking || isListening ? 360 : 0 }}
        transition={{
          duration: isThinking ? 2 : isSpeaking ? 4 : 3,
          repeat: isThinking || isSpeaking || isListening ? Infinity : 0,
          ease: 'linear',
        }}
      />

      {/* Counter-rotating ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 88,
          height: 88,
          border: `1px solid ${color}22`,
          borderBottomColor: `${color}66`,
          borderLeftColor: `${color}44`,
        }}
        animate={{
          rotate: isThinking || isSpeaking || isListening ? -360 : 0,
          scale: isThinking ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 3,
          repeat: isThinking || isSpeaking || isListening ? Infinity : 0,
          ease: 'linear',
        }}
      />

      {/* Inner glowing core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 60,
          height: 60,
          background: `radial-gradient(circle, ${color}40 0%, ${color}15 40%, transparent 70%)`,
        }}
        animate={{
          scale: isThinking
            ? [1, 1.15, 1]
            : isSpeaking
              ? [1, 1.1, 1]
              : isListening
                ? [1, 1.2, 1]
                : [1, 1.05, 1],
          boxShadow: isThinking
            ? [
                `0 0 20px ${color}33, 0 0 40px ${color}22`,
                `0 0 40px ${color}55, 0 0 80px ${color}33`,
                `0 0 20px ${color}33, 0 0 40px ${color}22`,
              ]
            : isSpeaking
              ? [
                  `0 0 25px ${color}44, 0 0 50px ${color}22`,
                  `0 0 45px ${color}66, 0 0 90px ${color}33`,
                  `0 0 25px ${color}44, 0 0 50px ${color}22`,
                ]
              : isListening
                ? [
                    `0 0 30px #ff444444, 0 0 60px #ff444422`,
                    `0 0 50px #ff444466, 0 0 100px #ff444433`,
                    `0 0 30px #ff444444, 0 0 60px #ff444422`,
                  ]
                : [
                    `0 0 15px ${color}22, 0 0 30px ${color}11`,
                    `0 0 25px ${color}33, 0 0 50px ${color}22`,
                    `0 0 15px ${color}22, 0 0 30px ${color}11`,
                  ],
        }}
        transition={{
          duration: isThinking ? 1.5 : isSpeaking ? 0.8 : isListening ? 1 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Center dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 12,
          height: 12,
          background: color,
          boxShadow: `0 0 10px ${color}, 0 0 20px ${color}88`,
        }}
        animate={{
          scale: isThinking ? [1, 1.3, 1] : isSpeaking ? [1, 1.2, 1] : [1, 1.1, 1],
        }}
        transition={{
          duration: isThinking ? 0.8 : isSpeaking ? 0.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Status text */}
      <motion.div
        className="absolute mt-[75px] text-xs font-medium tracking-widest uppercase"
        style={{ color: `${color}cc` }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {isThinking ? 'Processing' : isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Online'}
      </motion.div>
    </div>
  )
}
