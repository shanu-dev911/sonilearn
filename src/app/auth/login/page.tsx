'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-300, 300], [10, -10]);
  const rotateY = useTransform(x, [-300, 300], [-10, 10]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const xPos = clientX - (left + width / 2);
    const yPos = clientY - (top + height / 2);
    x.set(xPos);
    y.set(yPos);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };


  return (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex items-center justify-center min-h-screen p-4 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={ref}
        style={{
          transformStyle: 'preserve-3d',
          rotateX,
          rotateY,
        }}
        className="relative w-full max-w-md h-[650px]"
      >
        <div
            className="absolute w-full h-full"
            style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
            <motion.div
            className="absolute w-full h-full glass rounded-3xl flex flex-col items-center justify-center p-6 md:p-8 [backface-visibility:hidden]"
            initial={false}
            animate={{ rotateY: mounted ? (isFlipped ? -180 : 0) : 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
            <AuthForm isLogin={true} onFlip={() => setIsFlipped(true)} />
            </motion.div>
            <motion.div
            className="absolute w-full h-full glass rounded-3xl flex flex-col items-center justify-center p-6 md:p-8 [backface-visibility:hidden]"
            initial={false}
            animate={{ rotateY: mounted ? (isFlipped ? 0 : 180) : 180 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
            <AuthForm isLogin={false} onFlip={() => setIsFlipped(false)} />
            </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
