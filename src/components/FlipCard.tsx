'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface FlipCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
}

const FlipCard: React.FC<FlipCardProps> = ({ frontContent, backContent }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleHoverStart = () => setIsFlipped(true);
  const handleHoverEnd = () => setIsFlipped(false);

  return (
    <div
      className="relative w-full h-48 [transform-style:preserve-3d]"
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      <motion.div
        className="absolute w-full h-full glass flex items-center justify-center p-6 [backface-visibility:hidden] card-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? -180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {frontContent}
      </motion.div>
      <motion.div
        className="absolute w-full h-full glass flex items-center justify-center p-6 [backface-visibility:hidden] card-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {backContent}
      </motion.div>
    </div>
  );
};

export default FlipCard;
