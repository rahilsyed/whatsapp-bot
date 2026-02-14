import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function sendInteractiveButtons(to: string, bodyText: string, buttons: any) {
    await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.PHONE_ID}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: bodyText },
                action: { buttons },
            },
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.WA_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );
}

export async function sendInteractiveList(to: string, bodyText: string, buttonText: string, sections: any) {
    await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.PHONE_ID}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "interactive",
            interactive: {
                type: "list",
                body: { text: bodyText },
                action: {
                    button: buttonText,
                    sections,
                },
            },
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.WA_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );
}

export async function markAsRead(messageId: string) {
  try {
    const a= await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WA_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("a is here",a);
    
  } catch (err:any) {
    console.error("Mark as read failed:", err?.response?.data || err.message);
  }
}
export async function sendMessage(to: string, text: string, customHeaders?: any) {
    await sendTypingIndicator(to);
    console.log("Custom headers:", customHeaders);
    const x = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.PHONE_ID}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            text: { body: text },
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.WA_TOKEN}`,
                "Content-Type": "application/json",
                ...customHeaders
            },
        }
    )
    console.log("here is data",x);
    
};

async function sendTypingIndicator(to: string, isTyping: boolean = true) {
    try {
        console.log("Sending typing indicator to:", to);
        await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to,
                typing: isTyping ? "typing_on" : "typing_off",
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WA_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (err) {
        console.error("Typing indicator error:", err);
    }
}



export const askAI = async (question: string, docroom?: string) => {
  try {
    console.log("making request to GPT");   
    const response :any = await axios       .post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Graice AI helping inside docroom: ${docroom || "General"}`,
          },
          { role: "user", content: question },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("response from GPT",response);
    
    return response?.data?.choices[0]?.message?.content;
  } catch (err: any) {
    console.error("AI Error:", err.message);
    if (err.response?.status === 429) {
      return "Rate limit reached. Please try again in a moment.";
    }
    return "Sorry, AI is currently unavailable.";
  }
};

export const getTimeStamps = () => {
    return new Date().toISOString();
};
