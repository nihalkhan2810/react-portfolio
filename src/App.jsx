// app.jsx
import React, { useState } from 'react'; // Import useState
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Education from './components/Education';
import Technologies from './components/Technologies';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Skills from './components/Skills';
// Import the ChatbotComponent
import ChatbotComponent from './components/ChatbotComponent'; // Adjust path if needed

const App = () => {
  // Lift the showBot state up to App.jsx
  const [showBot, setShowBot] = useState(false); // <--- NEW STATE

  return (
    <div className="overflow-x-hidden text-neutral-300 antialiased selection:bg-cyan-300 selection:text-cyan-900">
      {/* Background Gradient - fixed and behind everything (-z-10) */}
      <div className="fixed top-0 -z-10 h-full w-full">
        <div className="absolute inset-0 -z-10 h-full w-full [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
      </div>

      {/* Main content container */}
      <div className="container mx-auto px-8">
        <Navbar />
        {/* Pass setShowBot down to Hero */}
        <Hero setShowBot={setShowBot} /> {/* <--- PASSED PROP */}
        <About />
        <section id="education">
          <Education />
        </section>
        <section id="technologies">
          <Technologies />
        </section>
        <section id="skills">
          <Skills />
        </section>
        <section id="experience">
          <Experience />
        </section>
        <section id="projects">
          <Projects />
        </section>
        <section id="contact">
          <Contact />
        </section>
      </div>

      {/* Add the ChatbotComponent here */}
      {/* Pass showBot and setShowBot down to ChatbotComponent */}
      <ChatbotComponent showBot={showBot} setShowBot={setShowBot} /> {/* <--- PASSED PROPS */}

    </div>
  );
};

export default App;