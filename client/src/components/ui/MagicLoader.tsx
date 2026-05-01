import React from "react";
import { motion } from "framer-motion";

export function MagicLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden">
      {/* Magical Atmosphere */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] animate-pulse duration-700" />
      </div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-secondary rounded-full opacity-0"
          animate={{
            y: [-20, -120],
            x: [0, (i % 2 === 0 ? 50 : -50)],
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
          style={{
            left: `${45 + Math.random() * 10}%`,
            top: `${55 + Math.random() * 10}%`,
          }}
        />
      ))}

      <div className="relative scale-125">
        {/* The Book */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotateZ: [0, -2, 0, 2, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10"
        >
          <svg
            width="120"
            height="140"
            viewBox="0 0 120 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]"
          >
            {/* Book Base / Leather */}
            <path
              d="M10 20C10 14.4772 14.4772 10 20 10H60V130H20C14.4772 130 10 125.523 10 120V20Z"
              fill="#2C1810"
              stroke="#D4AF37"
              strokeWidth="2"
            />
            <path
              d="M110 20C110 14.4772 105.523 10 100 10H60V130H100C105.523 130 110 125.523 110 120V20Z"
              fill="#3D2B1F"
              stroke="#D4AF37"
              strokeWidth="2"
            />
            {/* Pages */}
            <motion.path
              d="M20 15H58V125H20C17.2386 125 15 122.761 15 120V20C15 17.2386 17.2386 15 20 15Z"
              fill="#F5F5DC"
              animate={{
                skewY: [0, 1, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M100 15H62V125H100C102.761 125 105 122.761 105 120V20C105 17.2386 102.761 15 100 15Z"
              fill="#FDFDF0"
              animate={{
                skewY: [0, -1, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Spine */}
            <rect x="58" y="10" width="4" height="120" fill="#1A0F0A" />
            {/* Decorative Lines */}
            <path d="M25 35 H50" stroke="#8B4513" strokeWidth="1" opacity="0.3" />
            <path d="M25 45 H50" stroke="#8B4513" strokeWidth="1" opacity="0.3" />
            <path d="M25 55 H50" stroke="#8B4513" strokeWidth="1" opacity="0.3" />
            <path d="M70 35 H95" stroke="#8B4513" strokeWidth="1" opacity="0.3" />
            <path d="M70 45 H95" stroke="#8B4513" strokeWidth="1" opacity="0.3" />
            <path d="M70 55 H95" stroke="#8B4513" strokeWidth="1" opacity="0.3" />
          </svg>
        </motion.div>

        {/* Spinning Feather */}
        <motion.div
          className="absolute inset-0 z-20"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2"
            animate={{
              rotateZ: [-20, 20, -20],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg
              width="40"
              height="80"
              viewBox="0 0 40 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
            >
              {/* Feather/Quill Body */}
              <path
                d="M20 75C20 75 35 55 35 30C35 15 25 5 20 5C15 5 5 15 5 30C5 55 20 75 20 75Z"
                fill="url(#featherGradient)"
                opacity="0.9"
              />
              <path
                d="M20 75V5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Fine details */}
              {[...Array(12)].map((_, i) => (
                <path
                  key={i}
                  d={`M20 ${15 + i * 5} L${i % 2 === 0 ? 32 : 8} ${12 + i * 5}`}
                  stroke="white"
                  strokeWidth="0.5"
                  opacity="0.4"
                />
              ))}
              <defs>
                <linearGradient id="featherGradient" x1="20" y1="5" x2="20" y2="75" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F5F5F5" />
                  <stop offset="1" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Loading Text */}
      <motion.div 
        className="absolute bottom-[20%] flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="h-8 overflow-hidden relative w-64 flex justify-center">
          <motion.div
            animate={{
              y: [0, -40, -80, -120, -160, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center text-center w-full"
          >
            {[
              "Inking the first chapter...",
              "Brewing magical inspiration...",
              "Dusting off ancient scrolls...",
              "Whispering to the quill...",
              "Crafting legends and lore...",
            ].map((msg, i) => (
              <div key={i} className="h-10 text-secondary font-serif text-sm font-bold tracking-[0.2em] uppercase px-4 whitespace-nowrap">
                {msg}
              </div>
            ))}
          </motion.div>
        </div>
        
        <div className="flex gap-3">
           <motion.div 
            className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.8)]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
           />
           <motion.div 
            className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.8)]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
           />
           <motion.div 
            className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.8)]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
           />
        </div>
      </motion.div>
    </div>
  );
}
