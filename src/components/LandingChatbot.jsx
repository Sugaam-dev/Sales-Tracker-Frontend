import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bot,
  Sparkles,
  X,
  Send,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  DollarSign,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import "./LandingChatbot.css";

// Knowledge base responses and action triggers
const KNOWLEDGE_BASE = [
  {
    keywords: ["feature", "capability", "capabilities", "function", "analytics", "estimator", "commercial", "kanban", "pipeline", "lead"],
    reply: "Key capabilities of PMRG Sales Tracker include:\n\n1. **Intelligent Pipeline**: Visual deal boards with weighted deal stage metrics.\n2. **AI Revenue Forecasting**: Machine learning predictions comparing target plans against projected closed revenue.\n3. **Commercial Estimator**: Build accurate line-item quotes with margin and tax calculations.\n4. **Role-Based Access (RBAC)**: Fine-grained permissions for Sales Reps, Managers, and Admins.\n5. **Audit Logs & Activity History**: Track every stage change, call log, and deal update in real-time.",
    actions: [
      { label: "Explore Bento Features", type: "scroll", target: "#features" },
      { label: "Explore Solutions", type: "scroll", target: "#solutions" }
    ]
  },
  {
    keywords: ["solution", "solutions", "who is this for", "industry", "team", "b2b", "agency", "revops", "sales team"],
    reply: "PMRG Sales Tracker is purpose-built for:\n\n• **High-Velocity B2B Sales**: Eliminate manual data entry and track buyer velocity.\n• **Revenue Operations (RevOps)**: Unify quota targets, commissions, and revenue pipeline projections.\n• **Enterprise Sales Organizations**: Multi-regional compliance, secure SSO, and custom audit records.\n• **Agencies & Consultancies**: Faster deal turnaround with built-in commercial estimation.",
    actions: [
      { label: "View Solutions Section", type: "scroll", target: "#solutions" },
      { label: "Login to Platform", type: "link", target: "/login" }
    ]
  },
  {
    keywords: ["security", "soc2", "gdpr", "safe", "encrypt", "compliance", "privacy", "data", "protect", "mfa"],
    reply: "Enterprise-grade security is foundational at PMRG:\n\n• **SOC 2 Type II & ISO 27001 Certified**\n• **256-Bit AES Encryption** at rest and TLS 1.3 in transit\n• **Multi-Factor Authentication (MFA)** with OTP & SMS verification\n• **Strict RBAC**: Enforce granular permissions and complete audit trail logs.",
    actions: [
      { label: "Learn More on Features", type: "scroll", target: "#features" },
      { label: "Sign In", type: "link", target: "/login" }
    ]
  },
  {
    keywords: ["forecast", "ai", "machine learning", "prediction", "accuracy", "algorithm"],
    reply: "Our AI Revenue Forecasting engine models historical deal velocities, stage conversion ratios, rep performance, and weighted values to project quarter-end revenue within **98.4% accuracy**.",
    actions: [
      { label: "See Live Forecast Chart", type: "scroll", target: "#hero" },
      { label: "Go to Dashboard Login", type: "link", target: "/login" }
    ]
  },
  {
    keywords: ["import", "export", "csv", "excel", "migrate", "migration", "crm"],
    reply: "Migrating to PMRG is effortless! We provide one-click **CSV/Excel bulk import** for Leads, Contacts, and Deals, complete with column mapping and duplicate detection.",
    actions: [
      { label: "Login to Import Data", type: "link", target: "/login" }
    ]
  },
  {
    keywords: ["login", "sign in", "account", "already have", "existing", "start", "demo"],
    reply: "Ready to access your PMRG Sales Tracker workspace? You can sign in directly to your CRM dashboard.",
    actions: [
      { label: "Go to Login Page", type: "link", target: "/login" }
    ]
  },
  {
    keywords: ["testimonial", "testimonials", "review", "reviews", "customer", "clients"],
    reply: "PMRG Sales Tracker is loved by fast-growing revenue teams at StratEdge, Synerzo, Quantix, and EuroSync.",
    actions: [
      { label: "Read Testimonials", type: "scroll", target: "#testimonials" }
    ]
  },
  {
    keywords: ["contact", "support", "help", "email", "phone", "talk to human", "sales rep"],
    reply: "Need personalized assistance? Our enterprise sales architects and 24/7 support team are ready to help:\n\n• **Email**: support@pmrgsolution.com\n• **Response Time**: Under 15 minutes\n• **Live Onboarding**: Included for all enterprise teams.",
    actions: [
      { label: "Login to Support", type: "link", target: "/login" }
    ]
  },
  {
    keywords: ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "howdy"],
    reply: "Hello there! 👋 I am your PMRG AI Assistant. How can I help you today? Ask me about our CRM features, tailored solutions, AI forecasting, or signing into your workspace!",
    actions: [
      { label: "⚡ Key Features", type: "scroll", target: "#features" },
      { label: "🏢 Solutions by Role", type: "scroll", target: "#solutions" },
      { label: "🔑 Login to Workspace", type: "link", target: "/login" }
    ]
  }
];

const SUGGESTED_QUERIES = [
  "⚡ Key Features",
  "🏢 Tailored Solutions",
  "⭐ Client Testimonials",
  "🔒 Security & MFA",
  "📈 AI Sales Forecasting",
  "🔑 Login to CRM"
];

export default function LandingChatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "👋 Welcome to **PMRG Sales Tracker**! I am your AI Website Assistant. How can I help accelerate your sales workflow today?",
      time: "Just now",
      actions: [
        { label: "⚡ Core Features", type: "scroll", target: "#features" },
        { label: "🏢 Solutions by Role", type: "scroll", target: "#solutions" },
        { label: "🔑 Login", type: "link", target: "/login" }
      ]
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasOpenedBefore(true);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages, isTyping]);

  const processAIResponse = (userText) => {
    const lower = userText.toLowerCase();
    
    // Find matching knowledge base item
    let matched = KNOWLEDGE_BASE.find(kb => 
      kb.keywords.some(kw => lower.includes(kw))
    );

    if (matched) {
      return {
        text: matched.reply,
        actions: matched.actions || []
      };
    }

    // Default intelligent fallback response
    return {
      text: "PMRG Sales Tracker is an intelligent CRM and revenue forecasting platform designed to help B2B sales teams close deals faster with automated lead intelligence and real-time deal stage tracking.\n\nWould you like to explore our features, check out pricing plans, or test-drive the platform with a 14-day free trial?",
      actions: [
        { label: "Explore Features", type: "scroll", target: "#features" },
        { label: "View Pricing", type: "scroll", target: "#pricing" },
        { label: "Start Free Trial", type: "modal" }
      ]
    };
  };

  const handleSendMessage = (textToSend) => {
    const content = (textToSend || inputVal).trim();
    if (!content) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: content,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiReply = processAIResponse(content);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: aiReply.text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actions: aiReply.actions
        }
      ]);
    }, 700);
  };

  const handleActionClick = (action) => {
    if (action.type === "scroll" && action.target) {
      const element = document.querySelector(action.target);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (action.type === "modal") {
      if (onOpenTrialModal) {
        onOpenTrialModal();
      }
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: "ai",
        text: "👋 Chat reset! I'm here to help with any questions about PMRG Sales Tracker. What would you like to know?",
        time: "Just now",
        actions: [
          { label: "💰 Pricing Plans", type: "scroll", target: "#pricing" },
          { label: "⚡ Core Features", type: "scroll", target: "#features" },
          { label: "🚀 Start Free Trial", type: "modal" }
        ]
      }
    ]);
  };

  // Helper to format basic markdown (bold text and bullet points)
  const renderFormattedText = (text) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Format bold text **word**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={idx}>
          {formattedLine}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="landing-chatbot-root">
      {/* Floating Trigger Button */}
      <button
        type="button"
        className={`chatbot-trigger-btn ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle PMRG AI Assistant"
        title="Chat with PMRG AI Assistant"
      >
        <div className="trigger-pulse-ring"></div>
        {isOpen ? (
          <X size={24} className="trigger-icon" />
        ) : (
          <div className="trigger-content">
            <Sparkles size={16} className="sparkle-badge" />
            <Bot size={26} className="trigger-icon" />
            {!hasOpenedBefore && <span className="unread-dot"></span>}
          </div>
        )}
      </button>

      {/* Slide-Up Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-brand-group">
              <div className="chatbot-avatar">
                <Bot size={20} />
                <span className="live-status-dot"></span>
              </div>
              <div>
                <div className="chatbot-title">
                  PMRG AI Assistant <Sparkles size={13} className="sparkle-gold" />
                </div>
                <div className="chatbot-status">Online • Instant Answers</div>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="btn-header-tool"
                onClick={resetChat}
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="btn-header-tool"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                {msg.sender === "ai" && (
                  <div className="msg-avatar-ai">
                    <Bot size={15} />
                  </div>
                )}
                
                <div className="message-content-wrap">
                  <div className="message-bubble">
                    <p className="message-text">{renderFormattedText(msg.text)}</p>
                    <span className="message-timestamp">{msg.time}</span>
                  </div>

                  {/* Interactive Action Badges */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="msg-actions-row">
                      {msg.actions.map((act, aIdx) => {
                        if (act.type === "link") {
                          return (
                            <Link
                              key={aIdx}
                              to={act.target}
                              className="chat-action-btn"
                              onClick={() => setIsOpen(false)}
                            >
                              {act.label} <ExternalLink size={12} />
                            </Link>
                          );
                        }
                        return (
                          <button
                            key={aIdx}
                            type="button"
                            className="chat-action-btn"
                            onClick={() => handleActionClick(act)}
                          >
                            {act.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message-row ai">
                <div className="msg-avatar-ai">
                  <Bot size={15} />
                </div>
                <div className="message-bubble typing-bubble">
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="chatbot-suggestions">
            {SUGGESTED_QUERIES.map((query, qIdx) => (
              <button
                key={qIdx}
                type="button"
                className="suggestion-pill"
                onClick={() => handleSendMessage(query)}
              >
                {query}
              </button>
            ))}
          </div>

          {/* Input Footer Form */}
          <form
            className="chatbot-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input-field"
              placeholder="Ask anything about PMRG Sales Tracker..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!inputVal.trim()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Mini Footer note */}
          <div className="chatbot-footer-badge">
            Powered by PMRG Intelligent Sales Engine
          </div>
        </div>
      )}
    </div>
  );
}
