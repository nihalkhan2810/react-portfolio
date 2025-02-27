import React from 'react';
import { SiPython, SiTensorflow, SiPytorch, SiPostgresql } from "react-icons/si";
import { RiReactjsLine } from "react-icons/ri";
import { FaAws, FaDocker, FaGitAlt } from "react-icons/fa";

const Technologies = () => {
  return (
    <div className="border-b border-neutral-800 pb-24">
      <h2 className="my-20 text-center text-4xl">Technologies</h2>
      <div className="rounded-lg p-6"> {/* Removed bg-neutral-900 */}
        <div className="flex justify-center items-center gap-8">
          {/* Python */}
          <div 
            className="group relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform hover:scale-125 hover:-translate-y-2" 
            aria-label="Python"
          >
            <SiPython className="text-7xl text-cyan-400 group-hover:animate-shake" />
            <span className="absolute bottom-0 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 text-white text-sm">
              Python
            </span>
          </div>
          {/* TensorFlow */}
          <div 
            className="group relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform hover:scale-125 hover:-translate-y-2" 
            aria-label="TensorFlow"
          >
            <SiTensorflow className="text-7xl text-cyan-400 group-hover:animate-shake" />
            <span className="absolute bottom-0 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 text-white text-sm">
              TensorFlow
            </span>
          </div>
          {/* PyTorch */}
          <div 
            className="group relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform hover:scale-125 hover:-translate-y-2" 
            aria-label="PyTorch"
          >
            <SiPytorch className="text-7xl text-cyan-400 group-hover:animate-shake" />
            <span className="absolute bottom-0 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 text-white text-sm">
              PyTorch
            </span>
          </div>
          {/* ReactJs */}
          <div 
            className="group relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform hover:scale-125 hover:-translate-y-2" 
            aria-label="ReactJs"
          >
            <RiReactjsLine className="text-7xl text-cyan-400 group-hover:animate-shake" />
            <span className="absolute bottom-0 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 text-white text-sm">
              ReactJs
            </span>
          </div>
          {/* AWS */}
          <div 
            className="group relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform hover:scale-125 hover:-translate-y-2" 
            aria-label="AWS"
          >
            <FaAws className="text-7xl text-cyan-400 group-hover:animate-shake" />
            <span className="absolute bottom-0 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 text-white text-sm">
              AWS
            </span>
          </div>
          {/* Docker */}
          <div 
            className="group relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform hover:scale-125 hover:-translate-y-2" 
            aria-label="Docker"
          >
            <FaDocker className="text-7xl text-cyan-400 group-hover:animate-shake" />
            <span className="absolute bottom-0 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 text-white text-sm">
              Docker
            </span>
          </div>
          {/* Git */}
          <div 
            className="group relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform hover:scale-125 hover:-translate-y-2" 
            aria-label="Git"
          >
            <FaGitAlt className="text-7xl text-cyan-400 group-hover:animate-shake" />
            <span className="absolute bottom-0 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 text-white text-sm">
              Git
            </span>
          </div>
          {/* PostgreSQL */}
          <div 
            className="group relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform hover:scale-125 hover:-translate-y-2" 
            aria-label="PostgreSQL"
          >
            <SiPostgresql className="text-7xl text-cyan-400 group-hover:animate-shake" />
            <span className="absolute bottom-0 transform translate-y-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 text-white text-sm">
              PostgreSQL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Technologies;