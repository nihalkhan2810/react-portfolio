class MessageParser {
    constructor(actionProvider) {
      this.actionProvider = actionProvider;
    }
  
    parse(message) {
      const lowercase = message.toLowerCase();
      if (lowercase.includes("skills")) {
        this.actionProvider.handleSkills();
      } else if (lowercase.includes("contact")) {
        this.actionProvider.handleContact();
      } else if (lowercase.includes("projects")) {
        this.actionProvider.handleProjects();
      } else {
        this.actionProvider.handleDefault();
      }
    }
  }
  
  export default MessageParser;