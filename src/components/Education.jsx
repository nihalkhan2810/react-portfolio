import React from "react";
import { motion } from "framer-motion";

// Animation variants
const educationVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

const Education = () => {
  const educationData = [
    {
      degree: "Masters of Engineering in Electrical and Computer Engineering",
      university: "University of Windsor",
      duration: "Sept 2023 - Dec 2024",
      location: "Windsor, Canada"
    },
    {
      degree: "Bachelor of Technology in Information Technology",
      university: "Sathyabama Institute of Science and Technology",
      duration: "June 2019 - May 2023",
      location: "Chennai, India"
    }
  ];

  return (
    <section id="education" className="py-20">
      <motion.h1
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={educationVariants}
        className="mb-12 text-center text-4xl font-bold text-white"
      >
        Education
      </motion.h1>
      <div className="flex flex-wrap justify-center gap-8">
        {educationData.map((edu, index) => (
          <motion.div
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={educationVariants}
            className="w-full max-w-md bg-gradient-to-r from-cyan-600/70 via-purple-600/70 to-blue-700/70 rounded-lg p-6 shadow-lg border border-neutral-700 hover:border-cyan-300 transition-all duration-300 hover:scale-102 hover:shadow-2xl animate-aurora"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-2xl font-semibold text-white hover:text-cyan-200 transition-colors duration-300">
              {edu.degree}
            </h3>
            <p className="mt-2 text-lg text-cyan-300 hover:text-cyan-100 transition-colors duration-300">
              {edu.university}
            </p>
            <p className="mt-1 text-sm text-neutral-200">{edu.duration}</p>
            <p className="mt-1 text-sm text-neutral-200">{edu.location}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Education;