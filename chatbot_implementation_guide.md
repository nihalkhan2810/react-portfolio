# Advanced LLM-Style Chatbot Implementation Guide

## Overview
This guide provides instructions for implementing an advanced LLM-style chatbot for Mohammed Nihal Khan's portfolio website using ChatGPT or a similar service. The goal is to create a sophisticated chatbot that can answer questions about Nihal's skills, experience, projects, and more in a natural, conversational manner.

## Implementation Options

### Option 1: OpenAI API Integration (Recommended)

#### Requirements:
- OpenAI API key (paid service)
- Backend server to handle API requests (Node.js, Python, etc.)

#### Implementation Steps:
1. **Set up a backend server** to handle API requests to OpenAI
2. **Create a React component** for the chatbot UI
3. **Implement conversation history tracking** for context-aware responses
4. **Fine-tune prompts** with Nihal's portfolio data
5. **Add typing indicators and other UI enhancements** for a realistic experience

#### Example Code Structure:
```jsx
// ChatbotComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';

const ChatbotComponent = () => {
  const [showBot, setShowBot] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hi there! I'm NihalBot, Mohammed Nihal Khan's AI assistant. How can I help you today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleBot = () => {
    setShowBot(!showBot);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Send request to backend
      const response = await axios.post('/api/chat', {
        messages: [...messages, userMessage]
      });

      // Add AI response after a short delay to simulate thinking
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      console.error('Error communicating with AI:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later." 
      }]);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chatbot toggle button */}
      <motion.button
        onClick={toggleBot}
        className={`flex items-center justify-center p-4 rounded-full shadow-lg ${
          showBot ? 'bg-red-500' : 'bg-cyan-500'
        } text-white transition-all duration-300`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {showBot ? <FaTimes size={20} /> : <FaRobot size={20} />}
      </motion.button>

      {/* Chatbot container */}
      {showBot && (
        <motion.div
          className="absolute bottom-16 right-0 w-80 md:w-96 rounded-lg overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Chatbot header */}
          <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <FaRobot className="mr-2 text-cyan-400" />
              <span className="font-medium">NihalBot</span>
            </div>
            <button 
              onClick={toggleBot}
              className="text-gray-300 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>
          
          {/* Messages container */}
          <div className="bg-gray-900 h-96 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div 
                  className={`inline-block p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-cyan-600 text-white rounded-br-none' 
                      : 'bg-gray-700 text-white rounded-bl-none'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-left mb-4">
                <div className="inline-block p-3 rounded-lg bg-gray-700 text-white rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSubmit} className="bg-gray-800 p-3 flex">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about Nihal..."
              className="flex-1 bg-gray-700 text-white rounded-l-lg px-4 py-2 focus:outline-none"
            />
            <button 
              type="submit" 
              className="bg-cyan-500 text-white rounded-r-lg px-4 hover:bg-cyan-600 transition-colors"
            >
              <FaPaperPlane />
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default ChatbotComponent;
```

#### Backend Implementation (Node.js example):
```javascript
// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// System prompt with Nihal's portfolio data
const SYSTEM_PROMPT = `You are NihalBot, an AI assistant for Mohammed Nihal Khan's portfolio website. 
Your purpose is to help visitors learn about Nihal's skills, experience, projects, and background.
Be conversational, helpful, and provide detailed information when asked.

Here's information about Mohammed Nihal Khan:

[INSERT PORTFOLIO DATA HERE]

Always stay in character as NihalBot. If asked about topics unrelated to Nihal or his professional background,
politely redirect the conversation back to Nihal's portfolio, skills, or how you can help the visitor learn more about him.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Format messages for OpenAI API
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({ role: msg.role, content: msg.content }))
    ];
    
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    // Send response back to client
    res.json({ message: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Option 2: Hugging Face Inference API

If you prefer an open-source alternative, you can use Hugging Face's Inference API with models like Llama 2, Mistral, or other open-source LLMs.

### Option 3: Local LLM with Ollama

For a completely free solution (though with less powerful models), you could run a local LLM using Ollama and connect to it from your React app.

## Styling and UI Enhancements

Add these styles to your CSS for a polished chatbot UI:

```css
/* Chatbot animations */
@keyframes typing {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}

.typing-indicator span {
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

/* Message animations */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-animation {
  animation: slideIn 0.3s ease forwards;
}
```

## Integration with Your Portfolio

1. Import the ChatbotComponent in your App.jsx
2. Add it as the last component in your JSX
3. Make sure all required dependencies are installed

```jsx
// App.jsx
import React from 'react';
import Navbar from './components/Navbar';
// ... other imports
import ChatbotComponent from './components/ChatbotComponent';

const App = () => {
  return (
    <div className="overflow-x-hidden text-neutral-300 antialiased selection:bg-cyan-300 selection:text-cyan-900">
      {/* ... existing components */}
      
      {/* Add the chatbot component */}
      <ChatbotComponent />
    </div>
  );
};

export default App;
```

## Conclusion

This implementation provides a sophisticated, LLM-powered chatbot that can engage visitors to your portfolio in natural conversation about your skills, experience, and projects. The OpenAI API option will provide the most advanced capabilities, but alternatives are available if you prefer open-source solutions or want to avoid API costs.

Remember to replace the placeholder portfolio data in the system prompt with the actual information from your portfolio.