import { sendInteractiveButtons, sendMessage } from "../helpers/utils";
import { errorResponse, successResponse } from "../logging/api-responses";
import { Request, Response } from "express";
import User from "../models/User";
import Docroom from "../models/Docroom";
const WA_TOKEN = "EAAoZAui5YPmABQtTh4V9lDX9DlkoHUMD5dWGZCqLUfKLoZArnuKKkCh4jeD5CK4DLCrxfQuCif2XDIo9JETYipfT78kRCdptDgjq4tF2xVoyg0agB0ASiGrUZBotenrmMrAE5flAhKvYHMNUVpB2NYmn0hDfVZBM0x7wmyFndgNe18kWXm2xeCOJsP1lcWgip9Jr3VIQtRpW2BdDTH8QPVqBKVjwM6HZCOpDmQWweXptxHf4h3utOgBAZDZD";
const PHONE_ID = 993638643831659;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const BASE_URL = process.env.BASE_URL;


const whatsappLinks: any = {};
const sessions: any = {};


export const getWebHooks = async (req: Request, res: Response) => {
    try {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("✅ Webhook verified");
            return res.status(200).send(challenge);
        }

        console.log("Verification failed");
        res.sendStatus(403);
    } catch (error: any) {
        return errorResponse(res, error.message)
    }
}




export const postWebHooks = async (req: Request, res: Response) => {
    try {
        console.log("reqq",req.header);
        console.log("reqq2",req.headers);
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

        console.log('whatsappLinks[phone]', whatsappLinks[phone]);

        if (session.state === "DOCROOM") {
            const buttonReply = msg.interactive?.button_reply?.id;
            const listReply = msg.interactive?.list_reply?.id;
            const selectedId = buttonReply || listReply;

            const userDocrooms = session.userDocrooms || [];
            let selectedRoom = userDocrooms.find((d: any) => d._id.toString() === selectedId);

            if (!selectedRoom) {
                const index = parseInt(text) - 1;
                if (!isNaN(index)) {
                    selectedRoom = userDocrooms[index];
                }
            }

            if (!selectedRoom) {
                await sendMessage(phone, "Invalid choice.");
                return res.sendStatus(200);
            }

            session.docroomId = selectedRoom._id;
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

                const userDocrooms = session.userDocrooms || [];
                const buttons = userDocrooms.map((d: any) => ({
                    type: "reply",
                    reply: { id: d._id.toString(), title: d.name },
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

A: Apple showed solid growth from Q1 to Q2, with sales increasing from $92 billion in Q1 to $98 billion in Q2, reflecting a 6.5% improvement. The rise was mainly driven by strong iPhone sales and growth in services.`;

            await sendMessage(phone, answer);
            return res.sendStatus(200);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}


export const linkWhatsApp = async (req: Request, res: Response) => {
    try {
        const { phone, email } = req.body;

        let user = await User.findOne({ $or: [{ email }, { phoneNumber: phone }] }).populate('docrooms');
        
        if (!user) {
            user = await User.create({ email, phoneNumber: phone, docrooms: [] });
        }

        whatsappLinks[phone] = {
            userId: user._id,
            email: user.email,
            jwt: "fake_jwt_token",
        };

        const userDocrooms = user.docrooms;
        sessions[phone] = { 
            state: "DOCROOM",
            userDocrooms 
        };

        const buttons = userDocrooms.map((d: any) => ({
            type: "reply",
            reply: { id: d._id.toString(), title: d.name },
        }));

        await sendInteractiveButtons(
            phone,
            "*Select a Docroom:*",
            buttons
        );

        res.json({ success: true });
    } catch (error: any) {
        return errorResponse(res, error.message);
    }
}


