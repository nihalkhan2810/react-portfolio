import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const inputVariants = {
  focus: { scale: 1.02, borderColor: "#22d3ee", transition: { duration: 0.3 } }
};

const sentVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.5, ease: "easeOut" } 
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
};

const Contact = () => {
  const [copied, setCopied] = useState({ email: false, phone: false });
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);

    // Simulate sending (replace with API call later)
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setIsSent(false), 3000); // Hide "Sent" after 3s
    }, 1500);
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
      <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
        {/* Contact Info Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={contactVariants}
          className="w-full sm:w-80 bg-gradient-to-r from-cyan-600/70 via-purple-600/70 to-blue-700/70 rounded-lg p-6 shadow-lg border border-neutral-700 hover:border-cyan-300 transition-all duration-300 hover:scale-102 hover:shadow-2xl animate-aurora"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3">
            <FaMapMarkerAlt className="text-cyan-300 text-2xl" />
            <p className="text-neutral-200">{CONTACT.address}</p>
          </div>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={contactVariants}
          className="w-full sm:w-80 bg-gradient-to-r from-cyan-600/70 via-purple-600/70 to-blue-700/70 rounded-lg p-6 shadow-lg border border-neutral-700 hover:border-cyan-300 transition-all duration-300 hover:scale-102 hover:shadow-2xl animate-aurora"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3">
            <FaPhone className="text-cyan-300 text-2xl" />
            <p className="text-neutral-200">{CONTACT.phoneNo}</p>
            <motion.button
              onClick={() => handleCopy(CONTACT.phoneNo, "phone")}
              className="ml-2 text-cyan-400 hover:text-cyan-200"
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
          className="w-full sm:w-80 bg-gradient-to-r from-cyan-600/70 via-purple-600/70 to-blue-700/70 rounded-lg p-6 shadow-lg border border-neutral-700 hover:border-cyan-300 transition-all duration-300 hover:scale-102 hover:shadow-2xl animate-aurora"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-cyan-300 text-2xl" />
            <a href={`mailto:${CONTACT.email}`} className="text-neutral-200 border-b border-transparent hover:border-cyan-300">
              {CONTACT.email}
            </a>
            <motion.button
              onClick={() => handleCopy(CONTACT.email, "email")}
              className="ml-2 text-cyan-400 hover:text-cyan-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copied.email ? <FaCheck /> : <FaCopy />}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Contact Form */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={contactVariants}
        className="mt-12 max-w-lg mx-auto relative"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.input
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-400"
            whileFocus="focus"
            variants={inputVariants}
            required
          />
          <motion.input
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-400"
            whileFocus="focus"
            variants={inputVariants}
            required
          />
          <motion.textarea
            placeholder="Your Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-400 resize-none h-32"
            whileFocus="focus"
            variants={inputVariants}
            required
          />
          <motion.button
            type="submit"
            disabled={isSending}
            className={`w-full p-4 rounded-lg text-white font-semibold transition-all duration-300 ${
              isSending ? "bg-neutral-700" : "bg-cyan-600 hover:bg-cyan-500"
            }`}
            whileHover={{ scale: isSending ? 1 : 1.05 }}
            whileTap={{ scale: isSending ? 1 : 0.95 }}
            animate={isSending ? { x: [0, -5, 5, -5, 0] } : {}}
            transition={{ duration: 0.2, repeat: isSending ? Infinity : 0 }}
          >
            {isSending ? "Sending..." : "Send Message"}
          </motion.button>
        </form>
        <AnimatePresence>
          {isSent && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
              variants={sentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.span
                className="text-2xl text-cyan-300 font-semibold"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.8, repeat: 1 }}
              >
                Sent!
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Contact;