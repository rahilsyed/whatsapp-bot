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

export async function sendInteractiveList(to: string, bodyText: string, buttonText: string, sections: string) {
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


export async function sendMessage(to: string, text: string) {
    await axios.post(
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
            },
        }
    )
};

export const getTimeStamps = () => {
    return new Date().toISOString();
};
