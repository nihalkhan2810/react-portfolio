// TypingTextIndicator.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Component to simulate typing text animation
const TypingTextIndicator = ({ text, delay = 0, speed = 50, className = '' }) => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Start typing animation after the initial delay
    const initialDelayTimer = setTimeout(() => {
        const typingTimer = setInterval(() => {
            setIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                // Add the next character to the display text
                setDisplayText(text.substring(0, nextIndex));

                if (nextIndex === text.length) {
                    clearInterval(typingTimer); // Stop when text is fully typed
                }
                return nextIndex;
            });
        }, speed); // Typing speed (milliseconds per character)

        // Cleanup interval on component unmount
        return () => clearInterval(typingTimer);

    }, delay); // Initial delay before typing starts

     // Cleanup initial timeout on component unmount
    return () => clearTimeout(initialDelayTimer);

  }, [text, delay, speed]); // Re-run effect if text, delay, or speed changes


  // Use framer-motion to animate the container of the text
  // The typing effect happens via state updates, not motion here.
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } }, // Simple fade in for the container itself
  };


  return (
    // Wrap in a motion div for potential container animations if needed
    <motion.div
       variants={containerVariants}
       initial="hidden"
       animate="visible"
       className={className} // Apply external classes for styling (font, color etc.)
    >
      {displayText} {/* Display the text being typed */}
    </motion.div>
  );
};

export default TypingTextIndicator;