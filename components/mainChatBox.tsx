"use client";
import * as React from "react";
import { ChatWindow } from "./ChatWindow";
import { useCallback, useState, useRef, useEffect } from "react";
//@ts-ignore
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { GoTerminal } from "react-icons/go";
const openAiKey = process.env.NEXT_PUBLIC_OPEN_AI_KEY;

export function MainChatBox() {
  const [messages, setMessages] = useState([
    { sender: "assistant", text: "Hello! What can I do for you today?" },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() !== "" && !isLoading) {
      setIsLoading(true);
      setInputText("");

      const userMessage = { sender: "user", text: inputText.trim() };
      const gptMessage = { sender: "assistant", text: "" };

      setMessages([...messages, userMessage, gptMessage]);

      const userMessages = messages
        .filter((msg) => msg.sender === "user")
        .map((msg) => msg.text);
      userMessages.push(inputText.trim());
      const gptMessages = messages
        .filter((msg) => msg.sender === "assistant")
        .map((msg) => msg.text);

      try {
        let currentStreamedText = "";

        await fetchEventSource("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            key: openAiKey,
            chatModel: "gpt-4",
            PROMPT: "You are an ai assistant.",
            a: JSON.stringify(gptMessages),
            u: JSON.stringify(userMessages),
          }),
          headers: { "Content-Type": "application/json" },
          onmessage(ev) {
            if (ev.data) {
              currentStreamedText += ev.data;
            } else {
              currentStreamedText += "\n";
            }

            setMessages((prevMessages) => {
              const newMessages = [...prevMessages];
              const lastMessageIndex = newMessages.length - 1;

              newMessages[lastMessageIndex] = {
                ...newMessages[lastMessageIndex],
                text: currentStreamedText,
              };

              return newMessages;
            });
          },
          onerror(err) {
            console.error("EventSource failed:", err);
            setIsLoading(false);
          },
          onclose() {
            setMessages((prevMessages) => {
              const newMessages = [...prevMessages];
              const lastMessageIndex = newMessages.length - 1;

              newMessages[lastMessageIndex] = {
                ...newMessages[lastMessageIndex],
              };
              setIsLoading(false);
              return newMessages;
            });
          },
        });
      } catch (error) {
        console.error("Error:", error);
        setIsLoading(false);
      }
    }
  }, [inputText, isLoading, messages]);

  //@ts-ignore
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSendMessage();
      event.preventDefault();
    }
  };

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading && scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <section>
      <div className="mt-[25px] flex items-center justify-center">
        <GoTerminal className={" w-8 h-8 mr-4"} />
        <h1 className="text-3xl font-bold">ChatGPT App</h1>
      </div>
      <ChatWindow messages={messages} scrollAreaRef={scrollAreaRef} />
      <div className="flex items-center justify-center mt-4">
        <Textarea
          className="w-[100%]"
          placeholder="Type your prompt here."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Button
          className="ml-[20px] w-[15%]"
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          Send
        </Button>
      </div>
    </section>
  );
}
