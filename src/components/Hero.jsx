// Hero.jsx
import React from "react";
import { HERO_CONTENT } from "../constants";
import Nihalprofile from "../assets/Nihalprofile.jpeg";
import { motion } from "framer-motion";
// Import the robot icon and a standard right arrow icon
import { FaRobot, FaArrowRight } from 'react-icons/fa'; // <--- Changed FaArrowDownRight to FaArrowRight
// Import the TypingTextIndicator component
import TypingTextIndicator from './TypingTextIndicator';


// Animation variants (Keep existing variants)
const container = (delay) => ({
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, delay: delay },
  },
});

const photoVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.8, ease: "easeOut", delay: 1.2 },
  },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

const indicatorVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, delay: 1.5 },
  },
};

// Receive setShowBot as a prop
const Hero = ({ setShowBot }) => {
  return (
    <div className="pb-4 lg:mb-35">
      <div className="flex flex-wrap items-center">
        {/* Text Content Section */}
        <div className="w-full lg:w-1/2 lg:pr-8">
          <div className="flex flex-col items-center lg:items-start">
            {/* Existing Name */}
            <motion.h1
              variants={container(0)}
              initial="hidden"
              animate="visible"
              className="pb-16 text-6xl font-thin tracking-tight lg:mt-16 lg:text-8xl text-white"
            >
              Mohammed Nihal Khan
            </motion.h1>
            {/* Existing Title */}
            <motion.span
              variants={container(0.5)}
              initial="hidden"
              animate="visible"
              className="bg-gradient-to-r from-pink-300 via-slate-500 to-purple-500
                         bg-clip-text text-4xl tracking-tight text-transparent
                         animate-[gradient_8s_ease_infinite] bg-[length:300%_300%]"
            >
              AI Engineer
            </motion.span>
            {/* Existing Description */}
            <motion.p
              variants={container(1)}
              initial="hidden"
              animate="visible"
              className="my-2 max-w-xl py-6 font-light tracking-tighter text-neutral-300"
            >
              {HERO_CONTENT}
            </motion.p>

            {/* --- Chatbot Existence Indicator (Clickable with Animated Arrow) --- */}
            <motion.div
                variants={indicatorVariants}
                initial="hidden"
                animate="visible"
                className="my-4 cursor-pointer group flex items-center"
                onClick={() => setShowBot(true)}
                aria-label="Open AI Chat Assistant"
                role="button"
            >
                {/* Container for Icon and Typing Text */}
                <p className="text-xl font-light tracking-tight text-cyan-400 lg:text-2xl flex items-center group-hover:text-cyan-300 transition-colors duration-200">
                    <FaRobot className="mr-2 text-cyan-500 group-hover:text-cyan-400 transition-colors duration-200" size={24} />
                    <TypingTextIndicator
                        text="Check out my AI Assistant! Ask anything about me"
                        delay={1500}
                        speed={40}
                    />
                </p>

                {/* --- Animated Arrow --- */}
                {/* Using FaArrowRight and animating its position and rotation */}
                <motion.div
                   className="ml-2 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-200"
                   // Animate position and rotation to point towards bottom-right
                   animate={{ x: [0, 5, 0], y: [0, 5, 0], rotate: [0, 45, 0] }} // Move down-right and rotate 45 degrees
                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                >
                    <FaArrowRight size={24} /> {/* Using the standard right arrow */}
                </motion.div>
                {/* --- End Animated Arrow --- */}

                 {/* Underline effect on hover */}
                 <motion.div
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                    className="h-0.5 bg-cyan-400 mt-1 absolute bottom-0 left-0 right-0"
                 />
            </motion.div>
            {/* --- End Chatbot Existence Indicator --- */}

          </div>
        </div>
        {/* Image Section */}
        <div className="w-full lg:w-1/2 lg:pl-8 mt-8 lg:mt-0">
          <div className="flex justify-center lg:justify-end">
            <motion.div
              initial="hidden"
              animate="visible"
              whileHover="hover"
              variants={photoVariants}
              className="relative w-64 h-64 lg:w-80 lg:h-80"
            >
              <img
                src={Nihalprofile}
                alt="Nihal Khan"
                className="w-full h-full object-cover rounded-full shadow-2xl border-4 border-cyan-400/50 hover:border-cyan-300 transition-all duration-300"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;