import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
const { GoogleGenerativeAI } = require("@google/generative-ai");

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Load messages from localStorage when the component mounts
  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('messages'));
    if (savedMessages) {
      setMessages(savedMessages);
    }
  }, []);

  // Scroll to the bottom when the messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Store the updated messages in localStorage
    if (messages.length > 0) {
      localStorage.setItem('messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleMessageSend = async () => {
    if (input.trim() !== '') {
      const newMessage = { text: input, sender: 'user' };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInput('');

      // Safety and generation configurations
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ];
      const generationConfig = {
        stopSequences: ["red"],
        maxOutputTokens: 200,
        temperature: 0.9,
        topP: 0.1,
        topK: 16,
      };

      try {
        const genAI = new GoogleGenerativeAI("AIzaSyBJylVYTnYcqqzdOd4BuDO4M_xclNiyqrg");
        const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings, generationConfig });
        const chat = model.startChat();
        const result = await chat.sendMessage(input);
        const response = await result.response;
        const text = response.text();
        const botMessage = { text: text, sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Error sending message to bot:", error);
      }
    }
  };

  const handleResetChat = () => {
    // Reset the state and clear messages from localStorage
    setMessages([]);
    localStorage.removeItem('messages');
  };

  return (
    <div className="chat-container">
      <h1>AI Chatbot </h1>
      <div className="chat-box">
        {messages.length === 0 ? (
          <div className="empty-message">No messages yet...</div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.sender === 'bot' ? (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              ) : (
                message.text
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-box">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleMessageSend();
            }
          }}
        />
        <button onClick={handleMessageSend}>Send</button>
      </div>
      <button onClick={handleResetChat} className="reset-button">Reset Chat</button>
    </div>
  );
}

export default Chatbot;
