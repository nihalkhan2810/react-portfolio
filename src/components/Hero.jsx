// Hero.jsx
import React from "react";
import { HERO_CONTENT } from "../constants";
import Nihalprofile from "../assets/Nihalprofile.jpg";
import { motion } from "framer-motion";


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

const Hero = () => {
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
