class ActionProvider {
    constructor(createChatBotMessage, setStateFunc) {
      this.createChatBotMessage = createChatBotMessage;
      this.setState = setStateFunc;
    }
  
    handleDefault = () => {
      const botMessage = this.createChatBotMessage("I’m here to help! Ask about my skills, projects, or contact info.");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
      }));
    };
  
    handleSkills = () => {
      const botMessage = this.createChatBotMessage("I specialize in Python, TensorFlow, PyTorch, React, AWS, Docker, Git, and PostgreSQL for AI and web development.");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
      }));
    };
  
    handleContact = () => {
      const botMessage = this.createChatBotMessage(`You can reach me at ${CONTACT.email} or call ${CONTACT.phoneNo}.`);
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
      }));
    };
  
    handleProjects = () => {
      const botMessage = this.createChatBotMessage("Check out my projects: ASL Hand Gesture Analysis, Fish-Species Identification, and Brain Tumor Detection—details on the Projects tab!");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
      }));
    };
  }
  
  export default ActionProvider;