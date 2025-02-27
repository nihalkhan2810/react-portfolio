import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EXPERIENCES } from "../constants";

// Animation variants
const experienceVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: "easeOut" 
    } 
  }
};

const detailVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { 
    opacity: 1, 
    height: "auto", 
    transition: { duration: 0.5, ease: "easeOut" } 
  },
  exit: { opacity: 0, height: 0, transition: { duration: 0.3 } }
};

const Experience = () => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="pb-4">
      <h1 className="my-20 text-center text-4xl text-white">Experience</h1>
      <div>
        {EXPERIENCES.map((experience, index) => (
          <motion.div
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={experienceVariants}
            className="mb-8 flex flex-wrap lg:justify-center"
          >
            <div className="w-full lg:w-1/4">
              <p className="mb-2 text-sm text-neutral-400">{experience.year}</p>
            </div>
            <div className="w-full max-w-xl lg:w-3/4">
              <h6 className="mb-2 font-semibold text-white">
                {experience.role} -{" "}
                <span className="text-sm text-cyan-400">{experience.company}</span>
              </h6>
              <p className="mb-4 text-neutral-400">{experience.summary}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {experience.technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="mr-2 rounded bg-neutral-800/50 px-2 py-1 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <motion.button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-400/50 rounded-full 
                          hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showDetails ? "Show Less" : "View More"}
              </motion.button>
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    variants={detailVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mt-4 text-neutral-400"
                  >
                    {experience.description.map((desc, idx) => (
                      <p key={idx} className="mb-2">• {desc}</p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Experience;