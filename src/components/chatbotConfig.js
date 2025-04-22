import { createChatBotMessage } from "react-chatbot-kit";

const config = {
  initialMessages: [createChatBotMessage("Hello! How can I assist you today?")],
  customStyles: {
    botMessageBox: {
      backgroundColor: "#1e293b",
    },
    chatButton: {
      backgroundColor: "#0ea5e9",
    },
  },
};

export default config;