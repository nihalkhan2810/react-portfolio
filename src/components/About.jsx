import React from 'react'
import { motion } from 'framer-motion'
import { ABOUT_TEXT } from '../constants'

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
}

const boxVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { delay: 0.3, duration: 0.6 } }
}

const About = () => {
  return (
    <motion.section 
      id="about"
      className="scroll-mt-20 pb-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={sectionVariants}
    >
      {/* Heading with reveal animation */}
      <motion.h1 
        className="my-20 text-center text-5xl lg:text-6xl"
        variants={sectionVariants}
      >
        <span className="bg-gradient-to-r from-pink-300 via-slate-500 to-purple-500 
                       bg-clip-text text-transparent
                       animate-[gradient_8s_ease_infinite]
                       bg-[length:300%_300%]">
          About Me
        </span>
      </motion.h1>

      {/* Animated content box */}
      <motion.div 
        className="flex justify-center"
        variants={boxVariants}
      >
        <div className="w-full max-w-4xl mx-4 lg:mx-8 p-8
                      bg-neutral-900/50 backdrop-blur-sm
                      border border-neutral-800 rounded-xl
                      shadow-xl">
          <p className="text-neutral-300 leading-relaxed">
            {ABOUT_TEXT}
          </p>
        </div>
      </motion.div>
    </motion.section>
  )
}

export default About