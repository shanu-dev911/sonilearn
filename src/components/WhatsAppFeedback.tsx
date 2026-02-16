'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// IMPORTANT: Replace '910000000000' with your actual WhatsApp number including the country code.
const WHATSAPP_NUMBER = '910000000000';
const PRE_FILLED_MESSAGE = 'Hey, mujhe SoniLearn app ke baare mein ek feedback/suggestion dena hai: ';

const WhatsAppIcon = () => (
  <svg
    height="32px"
    width="32px"
    viewBox="0 0 24 24"
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.75 13.96c-.25-.12-1.48-.72-1.71-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.48-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.35-.76-1.84c-.2-.48-.41-.42-.56-.42-.14,0-.3,0-.46,0-.17,0-.43.06-.66.31-.23.25-.87.85-1.07,2.06-.2,1.22.29,2.4,1.4,3.83,1.1,1.44,2.65,2.5,4.22,3.01.2.06.36.09.49.12.5.11,1.01.05,1.38-.23.43-.31.64-.87.73-1.08.1-.2.04-.38-.02-.5z"
    />
    <path
      d="M12.01,2.02c-5.5,0-9.9,4.4-9.9,9.9c0,1.8,0.5,3.5,1.3,5l-1.3,4.9l5-1.3c1.5,0.8,3.2,1.3,5,1.3c5.5,0,9.9-4.4,9.9-9.9 C21.91,6.42,17.51,2.02,12.01,2.02z M12.01,19.92c-1.6,0-3.2-0.5-4.5-1.3l-0.3-0.2l-3.3,0.9l0.9-3.2l-0.2-0.3 c-0.9-1.3-1.4-2.9-1.4-4.6c0-4.3,3.5-7.8,7.8-7.8c2.1,0,4.1,0.9,5.5,2.3c1.4,1.4,2.3,3.4,2.3,5.5 C19.81,16.42,16.31,19.92,12.01,19.92z"
    />
  </svg>
);


const WhatsAppFeedback = () => {
  const encodedMessage = encodeURIComponent(PRE_FILLED_MESSAGE);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  return (
    <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Feedback">
      <motion.div
        className="fixed bottom-8 right-8 z-50 h-16 w-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer text-white"
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 1, ease: 'easeOut' }}
      >
        <WhatsAppIcon />
      </motion.div>
    </Link>
  );
};

export default WhatsAppFeedback;
