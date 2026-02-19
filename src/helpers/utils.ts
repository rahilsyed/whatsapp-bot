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
    
  } catch (err:any) {
    console.error("Mark as read failed:", err?.response?.data || err.message);
  }
}
export async function sendMessage(to: string, text: string, customHeaders?: any) {
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
    
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const askAI = async (question: string, docroom?: string) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response: any = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant", // or mixtral / gemma / etc
          messages: [
            {
              role: "system",
              content: `You are AI helping inside docroom: ${docroom || "General"}`
            },
            {
              role: "user",
              content: question
            }
          ],
          max_tokens: 200,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      return response?.data?.choices?.[0]?.message?.content || "No response";
    } catch (err: any) {
      if (err.response?.status === 429) {
        const retryAfter =
          Number(err.response.headers?.["retry-after"]) * 1000 ||
          Math.pow(2, attempt) * 1000;

        await sleep(retryAfter);
        continue;
      }

      console.error("Groq error:", err.response?.data || err.message);
      return "AI error";
    }
  }

  return "AI failed after retries";
};

export const getTimeStamps = () => {
    return new Date().toISOString();
};

export const downloadAudioLocally = async (audioId: string, phone: string): Promise<string> => {
    const fs = require('fs');
    const path = require('path');
    
    const mediaUrl = await getMediaUrl(audioId);
    const audioBuffer = await downloadMedia(mediaUrl);
    
    const audioDir = path.join(process.cwd(), 'audio_files');
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const fileName = `${phone}_${timestamp}.ogg`;
    const filePath = path.join(audioDir, fileName);
    
    fs.writeFileSync(filePath, audioBuffer);
    return filePath;
};

export const transcribeAudio = async (audioId: string): Promise<string> => {
    const mediaUrl = await getMediaUrl(audioId);
    const audioBuffer = await downloadMedia(mediaUrl);
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioBuffer, 'audio.ogg');
    form.append('model', 'whisper-large-v3');
    
    const response:any = await axios.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        form,
        {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`
            }
        }
    );
    
    return response?.data?.text;
};

const getMediaUrl = async (mediaId: string): Promise<string> => {
    const response:any = await axios.get(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.WA_TOKEN}`
            }
        }
    );
    return response.data.url;
};

const downloadMedia = async (url: string): Promise<Buffer> => {
    const response :any= await axios.get(url, {
        headers: {
            Authorization: `Bearer ${process.env.WA_TOKEN}`
        },
        responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
};
