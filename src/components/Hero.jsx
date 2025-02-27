import React from "react";
import { HERO_CONTENT } from "../constants";
import Nihalprofile from "../assets/Nihalprofile.jpeg";
import { motion } from "framer-motion";

const container = (delay) => ({
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, delay: delay },
  },
});

const Hero = () => {
  return (
    <div className="pb-4 lg:mb-35">
      <div className="flex flex-wrap items-center">
        {" "}
        {/* Added items-center for vertical alignment */}
        {/* Text Content Section */}
        <div className="w-full lg:w-1/2 lg:pr-8">
          {" "}
          {/* Added right padding */}
          <div className="flex flex-col items-center lg:items-start">
            <motion.h1
              variants={container(0)}
              initial="hidden"
              animate="visible"
              className="pb-16 text-6xl font-thin tracking-tight lg:mt-16 lg:text-8xl"
            >
              Mohammed Nihal Khan
            </motion.h1>
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
            <motion.p
              variants={container(1)}
              initial="hidden"
              animate="visible"
              className="my-2 max-w-xl py-6 font-light tracking-tighter"
            >
              {HERO_CONTENT}
            </motion.p>
          </div>
        </div>
        {/* Image Section */}
        <div className="w-full lg:w-1/2 lg:pl-8 mt-8 lg:mt-0">
          {" "}
          {/* Added left padding and margin top */}
          <div className="flex justify-center lg:justify-end">
            {" "}
            {/* Align image to right on desktop */}
            <motion.img
              initial = {{ x:100, opacity:0}}
              animate = {{x:0, opacity: 1}}
              transition = {{duration: 1, delay: 1.2}}
              src={Nihalprofile}
              alt="Nihal Khan"
              className="rounded-lg shadow-xl max-w-[400px] w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;