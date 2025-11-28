"use client";
import { useState, useRef, useEffect } from "react";
import {
  MdChat,
  MdClose,
  MdSend,
  MdPerson,
  MdSmartToy,
  MdMinimize,
} from "react-icons/md";

interface Message {
  id: number;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: "Hi there! Welcome to Aurora Leads support. How can I help you today?",
    sender: "agent",
    timestamp: new Date(),
  },
];

const AUTO_RESPONSES: { [key: string]: string } = {
  pricing:
    "We offer three plans: Free (20 scrapes), Standard ($29/mo for 500 scrapes), and Pro ($79/mo for 1,000 scrapes). Would you like more details about any specific plan?",
  upgrade:
    "You can upgrade your plan anytime from the Settings page. Just go to Settings > Billing & Subscription and select your desired plan. The changes take effect immediately!",
  scrape:
    "To start scraping, go to the 'New Search' page, enter your business type and location, then click 'Start Scraping'. The results will appear below the search form.",
  export:
    "You can export your leads as CSV from the Lead Lists page. Just click the 'Export CSV' button in the top right corner. Pro users also get JSON and API export options!",
  help: "I can help you with:\n- Pricing and plans\n- How to scrape leads\n- Exporting data\n- Account settings\n- Technical issues\n\nJust let me know what you need!",
  default:
    "Thanks for your message! Our team typically responds within a few hours. In the meantime, you can check our FAQ or try rephrasing your question. Is there anything specific I can help you with regarding pricing, scraping, or exporting?",
};

export const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAutoResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("plan")) {
      return AUTO_RESPONSES.pricing;
    }
    if (lowerMessage.includes("upgrade") || lowerMessage.includes("subscription")) {
      return AUTO_RESPONSES.upgrade;
    }
    if (lowerMessage.includes("scrape") || lowerMessage.includes("search") || lowerMessage.includes("lead")) {
      return AUTO_RESPONSES.scrape;
    }
    if (lowerMessage.includes("export") || lowerMessage.includes("download") || lowerMessage.includes("csv")) {
      return AUTO_RESPONSES.export;
    }
    if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
      return AUTO_RESPONSES.help;
    }

    return AUTO_RESPONSES.default;
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate agent typing and response
    setTimeout(() => {
      const agentResponse: Message = {
        id: Date.now() + 1,
        text: getAutoResponse(userMessage.text),
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary-dark text-white rounded-full shadow-lg hover:bg-gray-900 transition-all hover:scale-105 z-50"
        aria-label="Open chat"
      >
        <MdChat className="h-6 w-6" />
        <span className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transition-all ${
        isMinimized ? "h-14" : "h-[500px]"
      } flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="bg-primary-dark text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MdSmartToy className="h-6 w-6" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-primary-dark"></span>
          </div>
          <div>
            <h3 className="font-semibold">Aurora Support</h3>
            <p className="text-xs text-white/70">Online | Typically replies instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            <MdMinimize className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[80%] ${
                    message.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === "user"
                        ? "bg-primary-dark text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <MdPerson className="h-5 w-5" />
                    ) : (
                      <MdSmartToy className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        message.sender === "user"
                          ? "bg-primary-dark text-white rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <p
                      className={`text-xs text-gray-400 mt-1 ${
                        message.sender === "user" ? "text-right" : ""
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <MdSmartToy className="h-5 w-5" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-gray-100 bg-white">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["Pricing", "How to scrape?", "Export data", "Help"].map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    setInputValue(action);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-2 bg-primary-dark text-white rounded-full hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <MdSend className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
