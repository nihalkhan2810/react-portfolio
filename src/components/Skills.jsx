import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SKILLS } from "../data/skills";

const containerVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut", 
      staggerChildren: 0.1 
    } 
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Skills = () => {
  const [showAll, setShowAll] = useState(false);

  const topSkills = SKILLS.flatMap(category => category.skills)
    .sort((a, b) => b.level - a.level)
    .slice(0, 8);

  return (
    <section id="skills" className="py-20 bg-neutral-950">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-white mb-12">Skills</h2>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {topSkills.map((skill, index) => (
            <motion.div 
              key={index}
              className="px-5 py-2 bg-neutral-800/20 border border-neutral-700 rounded-full 
                        hover:bg-cyan-500/10 hover:border-cyan-400 
                        transition-all duration-300 cursor-default text-cyan-400"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">{skill.name}</span>
            </motion.div>
          ))}
        </div>

        <div className="text-center mb-12">
          <motion.button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-400/50 
                      rounded-full hover:bg-cyan-500/20 hover:text-cyan-300 
                      transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showAll ? "Show Less" : "View All Skills"}
          </motion.button>
        </div>

        <AnimatePresence>
          {showAll && (
            <motion.div
              key="all-skills"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-12" // Removed bg-neutral-900/50 rounded-lg p-6 shadow-lg
            >
              {SKILLS.map((category, index) => (
                <motion.div 
                  key={index}
                  variants={containerVariants}
                  className="mb-8"
                >
                  <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
                    {category.category}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {category.skills.map((skill, idx) => (
                      <motion.div 
                        key={idx}
                        variants={itemVariants}
                        className="px-4 py-2 bg-neutral-800/30 border border-neutral-700 
                                  rounded-full hover:bg-cyan-500/10 hover:border-cyan-400 
                                  transition-all duration-300 text-neutral-300"
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <span>{skill.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Skills;