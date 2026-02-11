require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


const WA_TOKEN = "EAAoZAui5YPmABQtTh4V9lDX9DlkoHUMD5dWGZCqLUfKLoZArnuKKkCh4jeD5CK4DLCrxfQuCif2XDIo9JETYipfT78kRCdptDgjq4tF2xVoyg0agB0ASiGrUZBotenrmMrAE5flAhKvYHMNUVpB2NYmn0hDfVZBM0x7wmyFndgNe18kWXm2xeCOJsP1lcWgip9Jr3VIQtRpW2BdDTH8QPVqBKVjwM6HZCOpDmQWweXptxHf4h3utOgBAZDZD";
const PHONE_ID = 993638643831659;
const VERIFY_TOKEN = "graice_verify_123";
const BASE_URL = `http://localhost:3001`;


const whatsappLinks = {};   
const sessions = {};

const fakeDocrooms = [
  { id: "r1", name: "HR Policies" },
  { id: "r2", name: "Engineering Docs" },
  { id: "r3", name: "Product Knowledge" },
];


app.get("/webhook", (req, res) => { 
  
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log(" Webhook verified");
    return res.status(200).send(challenge);
  }
  
  console.log("Verification failed");
  res.sendStatus(403);
});


app.post("/webhook", async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const phone = msg.from;
    const text = msg.text?.body?.trim() || "";

    let session = sessions[phone];


    if (!whatsappLinks[phone]) {
      const link = `${BASE_URL}/wa-link?phone=${phone}`;

      await sendMessage(
        phone,
        `Welcome to *Graice Bot*\n\nPlease login:\n${link}`
      );
      return res.sendStatus(200);
    }


    if (!session) {
      session = { state: "DOCROOM" };
      sessions[phone] = session;
    }

    console.log('whatsappLinks[phone]',whatsappLinks[phone]);
    
    if (session.state === "DOCROOM") {
      const buttonReply = msg.interactive?.button_reply?.id;
      const listReply = msg.interactive?.list_reply?.id;
      const selectedId = buttonReply || listReply;

      let selectedRoom = fakeDocrooms.find((d) => d.id === selectedId);

      if (!selectedRoom) {
        const index = parseInt(text) - 1;
        if (!isNaN(index)) {
          selectedRoom = fakeDocrooms[index];
        }
      }

      if (!selectedRoom) {
        await sendMessage(phone, "Invalid choice.");
        return res.sendStatus(200);
      }

      session.docroomId = selectedRoom.id;
      session.docroomName = selectedRoom.name;
      session.state = "QUERY";

      await sendMessage(
        phone,
        `Entered *${session.docroomName}*\n\nAsk question.\nType *exit* to change room.`
      );

      return res.sendStatus(200);
    }




    if (session.state === "QUERY") {
      if (text.toLowerCase() === "exit") {
        session.state = "DOCROOM";
        
        const buttons = fakeDocrooms.map((d) => ({
          type: "reply",
          reply: { id: d.id, title: d.name },
        }));

        await sendInteractiveButtons(
          phone,
          "*Select a Docroom:*",
          buttons
        );
        return res.sendStatus(200);
      }

      await new Promise((r) => setTimeout(r, 1200));

      const answer = `*Graice AI Response*

Docroom: ${session.docroomName}

Q: ${text}

A: This answer is generated from Graice knowledge base using AI retrieval system. (POC Mock)`;

      await sendMessage(phone, answer);
      return res.sendStatus(200);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post("/link-whatsapp", async (req, res) => {
  const { phone, email } = req.body;

  whatsappLinks[phone] = {
    userId: "user_" + phone,
    email,
    jwt: "fake_jwt_token",
  };

  sessions[phone] = { state: "DOCROOM" };

  const buttons = fakeDocrooms.map((d) => ({
    type: "reply",
    reply: { id: d.id, title: d.name },
  }));

  await sendInteractiveButtons(
    phone,
    "*Select a Docroom:*",
    buttons
  );

  res.json({ success: true });
});

/* ---------------- SEND MESSAGE ---------------- */

async function sendMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function sendInteractiveButtons(to, bodyText, buttons) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
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
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function sendInteractiveList(to, bodyText, buttonText, sections) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
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
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WhatsApp POC Bot running on port ${PORT}`);
  console.log(`Webhook URL: ${BASE_URL}/webhook`);
  console.log(`Verify token: ${VERIFY_TOKEN}`);
});
