import React, { useState } from "react";
import { FaLinkedin, FaGithub, FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-scroll";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants for hamburger menu
const menuVariants = {
  hidden: { opacity: 0, x: "100%" },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.3, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    x: "100%", 
    transition: { duration: 0.2, ease: "easeIn" } 
  }
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="mb-20 flex items-center justify-between py-6 relative">
      {/* Social Links - Left */}
      <div className="flex items-center gap-4 text-2xl">
        <a 
          href="https://linkedin.com/in/nihal-khan-49522818b/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white hover:text-gray-300 transition-colors"
        >
          <FaLinkedin />
        </a>
        <a 
          href="https://github.com/nihalkhan2810" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white hover:text-gray-300 transition-colors"
        >
          <FaGithub />
        </a>
      </div>

      {/* Navigation Links - Desktop */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          to="about"
          spy={true}
          smooth={true}
          offset={-50}
          duration={500}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
        >
          About
        </Link>
        <Link
          to="technologies"
          spy={true}
          smooth={true}
          offset={-50}
          duration={500}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
        >
          Technologies
        </Link>
        <Link
          to="skills"
          spy={true}
          smooth={true}
          offset={-50}
          duration={500}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
        >
          Skills
        </Link>
        <Link
          to="experience"
          spy={true}
          smooth={true}
          offset={-50}
          duration={500}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
        >
          Experience
        </Link>
        <Link
          to="resume"
          spy={true}
          smooth={true}
          offset={-50}
          duration={500}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
        >
          Resume
        </Link>

        <Link
          to="projects"
          spy={true}
          smooth={true}
          offset={-50}
          duration={500}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
        >
        
          Projects
        </Link>
        <Link
          to="contact"
          spy={true}
          smooth={true}
          offset={-50}
          duration={500}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
        >
          Contact
        </Link>
      </div>

      {/* Hamburger Icon - Mobile */}
      <div className="md:hidden flex items-center">
        <motion.button
          onClick={toggleMenu}
          className="text-white text-2xl p-2 rounded-full bg-neutral-900/50 border border-neutral-700 hover:bg-cyan-500/20 hover:border-cyan-300 transition-all duration-300 fixed top-6 right-6 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </motion.button>
      </div>

      {/* Floating Hamburger Menu - Mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed top-20 right-4 z-40 w-64 bg-neutral-900/90 backdrop-blur-md rounded-xl p-6 shadow-xl border border-neutral-700 md:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
          >
            <div className="flex flex-col gap-4 text-center">
              <Link
                to="about"
                spy={true}
                smooth={true}
                offset={-50}
                duration={500}
                className="text-white hover:text-cyan-300 transition-colors cursor-pointer"
                onClick={toggleMenu}
              >
                About
              </Link>
              <Link
                to="technologies"
                spy={true}
                smooth={true}
                offset={-50}
                duration={500}
                className="text-white hover:text-cyan-300 transition-colors cursor-pointer"
                onClick={toggleMenu}
              >
                Technologies
              </Link>
              <Link
                to="skills"
                spy={true}
                smooth={true}
                offset={-50}
                duration={500}
                className="text-white hover:text-cyan-300 transition-colors cursor-pointer"
                onClick={toggleMenu}
              >
                Skills
              </Link>
              <Link
                to="experience"
                spy={true}
                smooth={true}
                offset={-50}
                duration={500}
                className="text-white hover:text-cyan-300 transition-colors cursor-pointer"
                onClick={toggleMenu}
              >
                Experience
              </Link>
              <Link
                to="projects"
                spy={true}
                smooth={true}
                offset={-50}
                duration={500}
                className="text-white hover:text-cyan-300 transition-colors cursor-pointer"
                onClick={toggleMenu}
              >
                Projects
              </Link>
              <Link
                to="contact"
                spy={true}
                smooth={true}
                offset={-50}
                duration={500}
                className="text-white hover:text-cyan-300 transition-colors cursor-pointer"
                onClick={toggleMenu}
              >
                Contact
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;