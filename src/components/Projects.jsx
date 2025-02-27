import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROJECTS } from "../constants";

// Animation variants
const projectVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
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

const popupVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.4, ease: "easeOut" } 
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
};

const Projects = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(null);

  return (
    <div className="pb-4">
      <h1 className="my-20 text-center text-4xl text-white">Projects</h1>
      <div>
        {PROJECTS.map((project, index) => (
          <motion.div
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={projectVariants}
            className="mb-12 flex flex-wrap lg:flex-nowrap lg:justify-center gap-8"
          >
            <div className="w-full lg:w-1/4 flex flex-col items-center">
              <motion.div
                className="relative cursor-pointer"
                onClick={() => setGalleryIndex(galleryIndex === index ? null : index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="mb-4 rounded w-40 h-40 object-cover"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded">
                  <span className="text-white text-sm">Click to view more</span>
                </div>
              </motion.div>
            </div>
            <div className="w-full max-w-xl lg:w-3/4">
              <h6 className="mb-2 font-semibold text-white">{project.title}</h6>
              <p className="mb-4 text-neutral-400">{project.summary}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech, techIndex) => (
                  <motion.span
                    key={techIndex}
                    className="mr-2 rounded bg-neutral-900 px-2 py-1 text-sm font-medium text-purple-800"
                    whileHover={{ scale: 1.1, y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
              <motion.button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="px-4 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-400/50 rounded-full 
                          hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {expandedIndex === index ? "Show Less" : "View More"}
              </motion.button>
              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    variants={detailVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mt-4 text-neutral-400"
                  >
                    {project.details.map((detail, idx) => (
                      <p key={idx} className="mb-2">• {detail}</p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pop-up Gallery with Horizontal Scroll */}
      <AnimatePresence>
        {galleryIndex !== null && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-md bg-black/50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={popupVariants}
            onClick={() => setGalleryIndex(null)} // Close on backdrop click
          >
            <motion.div
              className="bg-neutral-900 rounded-lg p-6 max-w-4xl w-full"
              variants={popupVariants}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
                {PROJECTS[galleryIndex].images.map((img, imgIndex) => (
                  <motion.img
                    key={imgIndex}
                    src={img}
                    alt={`${PROJECTS[galleryIndex].title} - Image ${imgIndex + 1}`}
                    className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 object-cover rounded flex-shrink-0 snap-center"
                    whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}
                  />
                ))}
              </div>
              <button
                onClick={() => setGalleryIndex(null)}
                className="mt-4 w-full px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-400/50 rounded-full 
                          hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-200"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;