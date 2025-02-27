import React, { useState } from "react";
import { motion } from "framer-motion";
import { CONTACT } from "../constants";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaCopy, FaCheck } from "react-icons/fa";

// Animation variants
const contactVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

const Contact = () => {
  const [copied, setCopied] = useState({ email: false, phone: false });

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  return (
    <div className="border-b border-neutral-900 pb-20">
      <motion.h2
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={contactVariants}
        className="my-10 text-center text-4xl text-white"
      >
        Get in Touch
      </motion.h2>
      <div className="flex md:flex-wrap md:items-center md:justify-center md:gap-6 flex-row overflow-x-auto gap-4 snap-x snap-mandatory pb-4">
        {/* Sleek Contact Info Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={contactVariants}
          className="w-full sm:w-72 bg-gradient-to-r from-cyan-600/70 via-purple-600/70 to-blue-700/70 rounded-full p-4 shadow-md border border-neutral-700 hover:border-cyan-300 transition-all duration-300 md:hover:scale-105 md:hover:shadow-xl animate-aurora shrink-0"
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex items-center gap-3">
            <FaMapMarkerAlt className="text-cyan-300 text-xl flex-shrink-0" />
            <p className="text-neutral-200 text-sm truncate">{CONTACT.address}</p>
          </div>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={contactVariants}
          className="w-full sm:w-72 bg-gradient-to-r from-cyan-600/70 via-purple-600/70 to-blue-700/70 rounded-full p-4 shadow-md border border-neutral-700 hover:border-cyan-300 transition-all duration-300 md:hover:scale-105 md:hover:shadow-xl animate-aurora shrink-0"
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex items-center gap-3">
            <FaPhone className="text-cyan-300 text-xl flex-shrink-0" />
            <p className="text-neutral-200 text-sm truncate">{CONTACT.phoneNo}</p>
            <motion.button
              onClick={() => handleCopy(CONTACT.phoneNo, "phone")}
              className="ml-2 text-cyan-400 hover:text-cyan-200 flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copied.phone ? <FaCheck /> : <FaCopy />}
            </motion.button>
          </div>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={contactVariants}
          className="w-full sm:w-72 bg-gradient-to-r from-cyan-600/70 via-purple-600/70 to-blue-700/70 rounded-full p-4 shadow-md border border-neutral-700 hover:border-cyan-300 transition-all duration-300 md:hover:scale-105 md:hover:shadow-xl animate-aurora shrink-0"
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-cyan-300 text-xl flex-shrink-0" />
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-neutral-200 text-sm truncate border-b border-transparent hover:border-cyan-300"
            >
              {CONTACT.email}
            </a>
            <motion.button
              onClick={() => handleCopy(CONTACT.email, "email")}
              className="ml-2 text-cyan-400 hover:text-cyan-200 flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copied.email ? <FaCheck /> : <FaCopy />}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;