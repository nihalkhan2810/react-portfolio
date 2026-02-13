import React from "react";
import { motion } from "framer-motion";
import resumePdf from "../data/ai ml.pdf";

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const cardVariants = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

const buttonVariants = {
  hover: { scale: 1.05, y: -2, transition: { duration: 0.15 } },
  tap: { scale: 0.95 },
};

const Resume = () => {
  return (
    <div className="pb-4">
      <h1 className="my-20 text-center text-4xl text-white">Resume</h1>

      <motion.div
        className="mx-auto max-w-4xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <motion.div
          className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-xl backdrop-blur-lg"
          whileHover="hover"
          variants={cardVariants}
        >
          {/* Top row: text + buttons */}
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
                Download / View Resume
              </h2>
              <p className="mt-1 text-sm text-neutral-300">
                Quick preview of my latest resume. You can download the PDF or
                open it in a new tab for a better view.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.a
                href={resumePdf}
                download="Nihal_Khan_Resume.pdf"
                className="px-4 py-2 rounded-full bg-cyan-500/90 text-slate-900 text-sm font-medium shadow 
                           hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 
                           focus:ring-offset-2 focus:ring-offset-slate-900"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Download PDF
              </motion.a>

              <motion.a
                href={resumePdf}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full border border-cyan-400/60 text-cyan-300 text-sm font-medium 
                           hover:bg-cyan-500/10 hover:text-cyan-200 focus:outline-none focus:ring-2 
                           focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Open Full View
              </motion.a>
            </div>
          </div>

          {/* Semi-preview area */}
          <div className="mt-5 rounded-xl border border-slate-700/70 bg-slate-950/60 p-2">
            <div className="h-96 overflow-hidden rounded-lg border border-slate-800/80 bg-slate-900/80 custom-scrollbar">
              {/* Inline PDF preview (works best on desktop) */}
              <embed
                src={resumePdf}
                type="application/pdf"
                className="h-full w-full"
              />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Inline preview works best on desktop browsers. If it doesn&apos;t
              load, use{" "}
              <span className="font-medium text-cyan-300">Open Full View</span>{" "}
              above to see the full PDF.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Resume;
