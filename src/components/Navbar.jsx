import React from 'react';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { Link } from 'react-scroll';

const Navbar = () => {
  return (
    <nav className="mb-20 flex items-center justify-between py-6">
      {/* Social Links - Moved to left */}
      <div className="flex items-center gap-4 text-2xl">
        <a 
          href="https://linkedin.com/in/your-profile" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white hover:text-gray-300 transition-colors"
        >
          <FaLinkedin />
        </a>
        <a 
          href="https://github.com/your-username" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white hover:text-gray-300 transition-colors"
        >
          <FaGithub />
        </a>
      </div>

      {/* Navigation Links */}
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
    </nav>
  );
};

export default Navbar;