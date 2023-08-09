import { ChatOpenAI } from "langchain/chat_models/openai";
import { CallbackManager } from "langchain/callbacks";
import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, SystemMessage, AIMessage } from "langchain/schema";

export const runtime = "edge";
export const preferredRegion = "auto";

export async function POST(req: NextRequest) {
  try {
    if (req.method !== "POST") {
      return new NextResponse(
        JSON.stringify({ message: "Only POST requests are allowed" }),
        { status: 405 }
      );
    }

    const data = await req.json();

    const { key, chatModel, PROMPT, a, u } = data;

    const userList = JSON.parse((u as string) || "[]");
    const gptList = JSON.parse((a as string) || "[]");

    const formatted = formatMessages(userList, gptList, PROMPT as string);

    const streaming = req.headers.get("accept") === "text/event-stream";
    if (streaming) {
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      const model = new ChatOpenAI({
        modelName: chatModel as string,
        openAIApiKey: key as string,
        verbose: true,
        streaming,
        callbackManager: CallbackManager.fromHandlers({
          handleLLMNewToken: async (token: string) => {
            await writer.ready;
            await writer.write(encoder.encode(`data: ${token}\n\n`));
          },
          handleLLMEnd: async () => {
            await writer.ready;
            await writer.close();
          },
          handleLLMError: async (e: Error) => {
            await writer.ready;
            await writer.abort(e);
          },
        }),
      });

      model.call(formatted).catch((e: Error) => console.error(e));

      return new NextResponse(stream.readable, {
        headers: { "Content-Type": "text/event-stream" },
      });
    } else {
      const model = new ChatOpenAI({
        modelName: chatModel as string,
        openAIApiKey: key as string,
        verbose: true,
        streaming,
      });

      try {
        const completion = await model.call(formatted);
        return new NextResponse(JSON.stringify(completion), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        return new NextResponse(JSON.stringify({ error: (e as any).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: (e as any).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function formatMessages(
  userList: string[],
  assistantList: string[],
  PROMPT: string
) {
  const formatted_messages: (HumanMessage | SystemMessage | AIMessage)[] = [
    new SystemMessage(PROMPT),
  ];

  for (let i = 0; i < assistantList.length; i++) {
    formatted_messages.push(new AIMessage(assistantList[i]));
    if (i < userList.length) {
      formatted_messages.push(new HumanMessage(userList[i]));
    }
  }

  if (userList.length > assistantList.length) {
    formatted_messages.push(new HumanMessage(userList[userList.length - 1]));
  }

  return formatted_messages;
}
