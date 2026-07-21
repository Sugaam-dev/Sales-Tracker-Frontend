import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Paperclip, Mic, Sparkles, Bot } from 'lucide-react';
import './AiAssistant.css';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hi there! I am your AI Sales Assistant. Ask me anything about your leads, reports, pipeline, or follow-ups.',
      time: 'Just now'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputVal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      let aiText = "I'm analyzing your CRM data. You can ask me about 'hot leads', 'overdue tasks', or 'pipeline summary' for instant stats!";
      const query = userMsg.text.toLowerCase();

      if (query.includes('hot') || query.includes('priority') || query.includes('leads')) {
        aiText = "Based on our current data, Horizon Retail (Score: 65, Proposal stage), Zenith Financial (Score: 85, Negotiation), and Quantum Tech (Score: 95, Urgent priority) are your hot leads. I recommend prioritizing a follow-up with Quantum Tech.";
      } else if (query.includes('overdue') || query.includes('task') || query.includes('action')) {
        aiText = "You have 4 overdue actions: 1) Call NovaMed Healthcare, 2) Send proposal to EcoLogistics, 3) Follow-up Call with Horizon Retail, 4) Draft contract for Acme Corp.";
      } else if (query.includes('pipeline') || query.includes('summary') || query.includes('value')) {
        aiText = "Your Total Pipeline is $6,705,000 across 44 open deals. The Expected Value is $3,325,250 based on weighted close probability percentages.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  return (
    <>
      {/* Floating AI Action Button */}
      <button 
        className={`ai-floating-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        <div className="btn-glow-layer"></div>
        <Bot size={28} className="chatbot-icon" />
        <span className="online-indicator"></span>
      </button>

      {/* Slide-in Chat Panel */}
      <div className={`ai-chat-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="header-info">
            <div className="bot-avatar">
              <Sparkles size={16} className="sparkle-svg" />
            </div>
            <div>
              <h4>PMRG AI Assistant</h4>
              <span className="online-label">
                <span className="dot"></span> Online
              </span>
            </div>
          </div>
          <div className="header-controls">
            <button className="minimize-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-body">
          {messages.length === 0 ? (
            <div className="empty-state">
              <Bot size={48} className="empty-icon" />
              <p>Welcome! How can I assist you today?</p>
            </div>
          ) : (
            <div className="message-history">
              {messages.map((msg) => (
                <div key={msg.id} className={`msg-row ${msg.sender}`}>
                  <div className="bubble">
                    <p>{msg.text}</p>
                    <span className="time">{msg.time}</span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="msg-row ai">
                  <div className="bubble typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <form className="chat-input-wrapper" onSubmit={handleSend}>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="Ask me anything about your sales..." 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <div className="mock-actions">
              <button type="button" className="action-btn" title="Add attachment (UI Only)">
                <Paperclip size={16} />
              </button>
              <button type="button" className="action-btn" title="Voice Input (UI Only)">
                <Mic size={16} />
              </button>
            </div>
          </div>
          <button type="submit" className="send-btn" disabled={!inputVal.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
