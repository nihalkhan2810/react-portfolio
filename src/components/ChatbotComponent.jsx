// ChatbotComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComment, FaTimes, FaPaperPlane, FaTrash } from 'react-icons/fa';

// --- Configuration ---
const API_URL = 'https://rol2810-my-portfolio-ai.hf.space/ask'; // <-- *** UPDATE THIS URL ***
const CLEAR_HISTORY_URL = API_URL.replace(/\/ask\/?$/, '/clear_history');
const SESSION_STORAGE_KEY = 'chat_session_id';

const getOrCreateSessionId = () => {
    try {
        const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (existingSessionId) return existingSessionId;

        const generatedSessionId =
            'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem(SESSION_STORAGE_KEY, generatedSessionId);
        return generatedSessionId;
    } catch (error) {
        return 'session_' + Date.now();
    }
};

// --- List of Suggested Questions ---
// These questions will be shown initially as suggestions
const suggestedQuestions = [
    "Tell me about your experience.",
    "What are your key skills?",
    "Describe one of your projects.",
    "How was this chatbot built?",
    "What are your future project ideas?",
    "What is your education background?",
    "Tell me about your role as a Research Assistant.",
    "What is your experience with PyTorch?",
    "List some cloud or DevOps tools you've used.",
    "What is your visa status?", // Added visa status for easier access
];


// --- Chatbot Component ---
const ChatbotComponent = ({ showBot, setShowBot }) => {
    const [messages, setMessages] = useState([{
        type: 'ai',
        text: 'Hi! I can answer questions about my portfolio. Ask me anything!' // Initial welcome message
    }]);
    const [input, setInput] = useState(''); // State for the current input text
    const [isLoading, setIsLoading] = useState(false); // Overall loading state
    const messagesEndRef = useRef(null); // Ref for auto-scrolling messages

    // --- State for suggested questions ---
    // Use a Set to easily filter suggestions after click
    const [visibleSuggestions, setVisibleSuggestions] = useState(new Set(suggestedQuestions)); // Set of questions still visible
    // State to control the visibility of the entire suggestion *bar* initially
    const [showInitialSuggestions, setShowInitialSuggestions] = useState(true); // True initially
    const sessionIdRef = useRef(getOrCreateSessionId());
    const [showIntroSpotlight, setShowIntroSpotlight] = useState(false);

    // --- State for per-message typing indicator ---
    // This is handled by the isTyping flag on the message object

    const toggleBot = () => {
        setShowBot(false);
        // Optional: Clear messages and reset suggestions when closing
        // setMessages([{ type: 'ai', text: 'Hi! I can answer questions about my portfolio. Ask me anything!' }]);
        // setVisibleSuggestions(new Set(suggestedQuestions)); // Reset suggestions when closing
        // setShowInitialSuggestions(true); // Reset suggestion bar visibility when closing
    };

    const clearConversationHistory = async () => {
        try {
            await fetch(CLEAR_HISTORY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionIdRef.current }),
            });
        } catch (error) {
            console.error('Error clearing conversation history:', error);
        }
    };

    const handleClearChat = async () => {
        await clearConversationHistory();
        setMessages([{
            type: 'ai',
            text: 'Hi! I can answer questions about my portfolio. Ask me anything!'
        }]);
        setVisibleSuggestions(new Set(suggestedQuestions));
        setShowInitialSuggestions(true);
    };

    // Effect to auto-scroll to the latest message whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Spotlight intro on load/reload to guide users to the chatbot.
    useEffect(() => {
        const showTimer = setTimeout(() => {
            setShowIntroSpotlight(true);
        }, 900);

        const hideTimer = setTimeout(() => {
            setShowIntroSpotlight(false);
        }, 8500);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    useEffect(() => {
        if (showBot) {
            setShowIntroSpotlight(false);
        }
    }, [showBot]);

    // Modified handleSend to accept an optional query string (used by suggestions)
    const handleSend = async (query = input) => { // Default query to current input
        const userQuestion = query.trim(); // Use the provided query or current input

        if (!userQuestion || isLoading) return;

        // --- Hide suggestions after the first user message ---
        // Check if the current messages state only contains the initial AI message (length 1)
        if (messages.length === 1 && messages[0].type === 'ai' && !messages[0].isTyping) {
            setShowInitialSuggestions(false); // Hide the suggestions bar
        }
        // --- End Hide suggestions logic ---


        const userMessage = { type: 'user', text: userQuestion };

        // Clear input ONLY if sending from the input field (not clicking suggestion)
        if (query === input) {
           setInput('');
        }

        setMessages(prev => [...prev, userMessage]); // Add user message

        setIsLoading(true); // Set overall loading state

        // Add a placeholder message for the AI's response that we will update via streaming
        setMessages(prev => [...prev, { type: 'ai', text: '', isTyping: true }]); // Add isTyping flag


        try {
            // Use fetch to initiate the POST request
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userQuestion,
                    session_id: sessionIdRef.current
                }),
            });

            if (!response.ok) {
                 let errorDetails = `Request failed (${response.status})`;
                 try {
                     const errorJson = await response.json();
                     if(errorJson && errorJson.error) errorDetails = `Request failed (${response.status}): ${errorJson.error}`;
                     else if (errorJson && errorJson.answer) errorDetails = `Request failed (${response.status}): ${errorJson.answer}`;
                 } catch (e) {
                      try {
                           const errorText = await response.text();
                           if(errorText) errorDetails = `Request failed (${response.status}): ${errorText.substring(0, 300)}...`;
                      } catch (e2) {
                           errorDetails = `Request failed (${response.status})`;
                      }
                 }

                 // Update the last message placeholder with the error details
                 setMessages(prev => {
                     const typingMessageIndex = prev.findIndex(msg => msg.type === 'ai' && msg.isTyping);
                     if (typingMessageIndex === -1) return prev;

                      const messageToUpdate = { ...prev[typingMessageIndex] };
                      messageToUpdate.text = `Error: ${errorDetails}`;
                      messageToUpdate.isTyping = false;

                     const newMessages = [...prev];
                     newMessages[typingMessageIndex] = messageToUpdate;
                     return newMessages;
                 });
                 return; // Stop here if initial response not OK
            }

            if (!response.body) {
                 console.error('Response body is null. Cannot stream.');
                 setMessages(prev => {
                      const typingMessageIndex = prev.findIndex(msg => msg.type === 'ai' && msg.isTyping);
                      if (typingMessageIndex === -1) return prev;

                     const messageToUpdate = { ...prev[typingMessageIndex] };
                     messageToUpdate.text = "Error: Response body is empty.";
                     messageToUpdate.isTyping = false;
                     const newMessages = [...prev];
                     newMessages[typingMessageIndex] = messageToUpdate;
                     return newMessages;
                 });
                 return; // Stop if no response body
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let receivedText = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                receivedText += chunk;

                setMessages(prev => {
                    const typingMessageIndex = prev.findIndex(msg => msg.type === 'ai' && msg.isTyping);
                     if (typingMessageIndex === -1) {
                         console.warn("Typing message placeholder not found during stream update.");
                         return [...prev, { type: 'ai', text: receivedText, isTyping: true }];
                     }

                    const messageToUpdate = { ...prev[typingMessageIndex] };
                    messageToUpdate.text = receivedText;
                    // isTyping remains true until stream is done

                    const newMessages = [...prev];
                    newMessages[typingMessageIndex] = messageToUpdate;
                    return newMessages;
                });
            }

            setMessages(prev => {
                 const typingMessageIndex = prev.findIndex(msg => msg.type === 'ai' && msg.isTyping);
                 if (typingMessageIndex === -1) return prev;

                 const messageToUpdate = { ...prev[typingMessageIndex] };
                 messageToUpdate.isTyping = false;
                 if (!messageToUpdate.text) messageToUpdate.text = "AI response finished with no text.";

                 const newMessages = [...prev];
                 newMessages[typingMessageIndex] = messageToUpdate;
                 return newMessages;
            });


        } catch (error) {
            console.error('Error fetching AI response stream:', error);

             setMessages(prev => {
                 const typingMessageIndex = prev.findIndex(msg => msg.type === 'ai' && msg.isTyping);

                 if (typingMessageIndex !== -1) {
                      const messageToUpdate = { ...prev[typingMessageIndex] };
                       if (!messageToUpdate.text) {
                           messageToUpdate.text = `Error: ${error.message || 'Could not start streaming response.'}`;
                       } else {
                           messageToUpdate.text = messageToUpdate.text + `\n\nError: ${error.message || 'Streaming failed.'}`;
                       }
                      messageToUpdate.isTyping = false;
                      const newMessages = [...prev];
                      newMessages[typingMessageIndex] = messageToUpdate;
                      return newMessages;

                 } else {
                      return [...prev, { type: 'ai', text: `Error: ${error.message || 'An unexpected error occurred.'}` }];
                 }
             });

        } finally {
            setIsLoading(false); // Turn off overall loading state
        }
    };

    // Handle input field changes
    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    // Handle key presses (like 'Enter' to send)
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !isLoading) {
            event.preventDefault();
            handleSend(); // Call handleSend without arguments, it will use current input
        }
    };

    // --- Handler for Suggested Questions ---
    const handleSuggestedQuestionClick = (question) => {
        // Optional: Set input field (handleSend uses the passed question)
        // setInput(question);

        // Remove the clicked question from the visible set
        setVisibleSuggestions(prevSuggestions => {
            const newSuggestions = new Set(prevSuggestions);
            newSuggestions.delete(question);
            return newSuggestions;
        });

        // Send the question
        handleSend(question);
    };


    // --- Styling ---
    const aiMessageBubbleStyle = 'bg-gray-700 text-neutral-300 rounded-xl rounded-bl-none';
    const userMessageBubbleStyle = 'bg-cyan-700 text-white rounded-xl rounded-br-none';
    const headerStyle = 'bg-slate-800 text-cyan-400 p-4 rounded-t-lg flex justify-between items-center shadow-md';
    const chatHistoryAreaStyle = 'flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-900 text-sm';
    const inputAreaStyle = 'border-t border-gray-700 p-3 flex items-center gap-2 bg-gray-800';
    const inputFieldStyle = 'flex-grow p-2 rounded-lg bg-gray-700 text-white border-none focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 placeholder-neutral-400 text-sm';
    const sendButtonStyle = 'p-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none flex items-center justify-center';
    const chatWindowStyle = 'absolute bottom-16 right-0 w-80 md:w-96 rounded-lg overflow-hidden shadow-2xl bg-gray-800 flex flex-col border border-gray-700';


    // --- Animation for the floating button ---
    const floatingButtonAnimation = showBot ? {} : {
        y: [0, -5, 0, 0, 0, 0, 0, 0, 0, 0],
        scale: [1, 1.05, 1, 1, 1, 1, 1, 1, 1, 1],
        boxShadow: [
            '0px 0px 8px rgba(6, 182, 212, 0)',
            '0px 0px 16px rgba(6, 182, 212, 0.5)',
            '0px 0px 8px rgba(6, 182, 212, 0)'
        ]
    };

    const floatingButtonTransition = showBot ? {} : {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.5,
        times: [0, 0.8, 1]
    };


    return (
        <>
        <AnimatePresence>
            {showIntroSpotlight && !showBot && (
                <motion.div
                    className="fixed inset-0 z-40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    onClick={() => setShowIntroSpotlight(false)}
                    aria-hidden="true"
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(circle at calc(100% - 40px) calc(100% - 40px), rgba(15, 23, 42, 0.05) 0, rgba(15, 23, 42, 0.05) 46px, rgba(2, 6, 23, 0.72) 64px)',
                        }}
                    />
                    <motion.div
                        className="absolute bottom-[74px] right-[14px] h-14 w-14 rounded-full border border-cyan-300/60"
                        animate={{ scale: [1, 1.42, 1], opacity: [0.8, 0.2, 0.8] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute bottom-24 right-24 max-w-[230px] rounded-xl border border-cyan-400/40 bg-slate-900/85 px-4 py-3 text-xs uppercase tracking-[0.18em] text-cyan-200 shadow-lg backdrop-blur"
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.45, delay: 0.15 }}
                    >
                        Ask my AI assistant
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="fixed bottom-4 right-4 z-50">
            {/* Chatbot toggle button with enhanced animation when hidden */}
            <motion.button
                onClick={() => setShowBot(!showBot)}
                className={`flex items-center justify-center p-4 rounded-full shadow-lg ${
                  showBot ? 'bg-red-600' : 'bg-cyan-600'
                } text-white transition-all duration-300 focus:outline-none z-50`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={floatingButtonAnimation}
                transition={floatingButtonTransition}
                aria-label={showBot ? "Close chatbot" : "Open chatbot"}
            >
                <AnimatePresence mode="wait">
                   <motion.div
                      key={showBot ? "close" : "open"}
                      initial={{ rotate: showBot ? -180 : 180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: showBot ? 180 : -180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                   >
                     {showBot ? <FaTimes size={20} /> : <FaComment size={20} />}
                   </motion.div>
                </AnimatePresence>
            </motion.button>

            {/* Chatbot window container */}
            <AnimatePresence>
            {showBot && (
                <motion.div
                    className={chatWindowStyle}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{ height: 'calc(80vh - 64px)', maxHeight: '600px' }}
                >
                    {/* Chat header */}
                    <div className={headerStyle}>
                        <div className="flex items-center">
                            <FaComment className="mr-2 text-cyan-400" size={20} />
                            <span className="font-medium">Ask Nihal</span>
                        </div>
                         <button
                            onClick={handleClearChat}
                            className="mr-2 text-gray-400 hover:text-white focus:outline-none"
                            aria-label="Clear conversation history"
                            title="Clear conversation"
                        >
                            <FaTrash />
                        </button>
                        <button
                            onClick={toggleBot}
                            className="text-gray-400 hover:text-white focus:outline-none"
                            aria-label="Close chatbot"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Message history area */}
                    <div className={chatHistoryAreaStyle}>
                        {messages.map((msg, index) => (
                           <motion.div
                              key={index}
                              initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.1 }}
                              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                           >
                              {/* Message Bubble */}
                              <div className={`max-w-[85%] p-3 rounded-lg whitespace-pre-wrap ${
                                  msg.type === 'user' ? userMessageBubbleStyle : aiMessageBubbleStyle
                              }`}>
                                  {msg.text}
                              </div>
                           </motion.div>
                        ))}
                        {/* Loading indicator message */}
                         {isLoading && !messages.some(msg => msg.isTyping) && (
                            <div className="flex justify-start">
                               <div className={`max-w-[85%] p-3 rounded-lg ${aiMessageBubbleStyle} flex items-center`}>
                                  <div className="dot-flashing-small" />
                                  <span className="ml-2 text-sm italic text-gray-400">Thinking...</span>
                               </div>
                            </div>
                         )}
                        {/* Scroll reference */}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions Area - Horizontal, Hover-to-Scroll, Disappears after first message */}
                    {showInitialSuggestions && visibleSuggestions.size > 0 && ( // Render only if bar should be shown and there are visible suggestions
                       <div className="p-3 border-t border-gray-700 bg-gray-800 text-sm text-neutral-400 flex overflow-x-hidden hover:overflow-x-auto gap-2 whitespace-nowrap custom-scrollbar"> {/* Modified classes for horizontal scroll on hover */}
                           <span className="flex-shrink-0 text-sm italic text-neutral-500">Try asking:</span> {/* Title - make non-shrinking, adjusted color */}
                           {[...visibleSuggestions].map((q, index) => ( // Iterate over the Set
                               <button
                                   key={index}
                                   onClick={() => handleSuggestedQuestionClick(q)}
                                   disabled={isLoading}
                                   // Modified styling for purple theme and sleekness
                                   className="flex-shrink-0 px-3 py-1 border border-purple-600 text-purple-400 rounded-full hover:bg-purple-900 hover:border-purple-500 transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                               >
                                   {q}
                               </button>
                           ))}
                       </div>
                    )}


                    {/* Input Area */}
                    <div className={inputAreaStyle}>
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your question..."
                            disabled={isLoading}
                            className={inputFieldStyle}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || input.trim() === ''}
                            className={sendButtonStyle}
                        >
                           {isLoading ? (
                              <motion.div
                                 animate={{ rotate: 360 }}
                                 transition={{ duration: 1, loop: Infinity, ease: "linear" }}
                                 style={{ display: 'flex', alignItems: 'center' }}
                              >
                                 <FaPaperPlane size={18} className="opacity-70" />
                              </motion.div>
                           ) : (
                              <FaPaperPlane size={18} />
                           )}
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
        </>
    );
};

export default ChatbotComponent;
