import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface IMessage {
  sender: string;
  text: string;
}

interface ChatWindowProps {
  messages: IMessage[];
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  scrollAreaRef,
}) => {
  return (
    <ScrollArea className="mt-[20px] max-h-fit md:max-h-[80vh]  md:min-w-[700px] rounded-md border overflow-y-scroll bg-zinc-100">
      {messages.map((message, index) =>
        message.sender === "assistant" ? (
          <div className="mb-[25px] ml-[25px] mt-[20px]" key={index}>
            <Card className="w-[350px]">
              <CardHeader>
                <CardTitle>ChatGPT</CardTitle>
                <CardDescription>{message.text}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <div
            className="mb-[25px] mr-[25px] mt-[20px] flex items-end justify-end"
            key={index}
          >
            <Card className="w-[350px]">
              <CardHeader>
                <CardTitle>User</CardTitle>
                <CardDescription>{message.text}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        )
      )}
      <div ref={scrollAreaRef} />
    </ScrollArea>
  );
};
