import { askAI, markAsRead, sendInteractiveButtons, sendInteractiveList, sendMessage, transcribeAudio, downloadAudioLocally } from "../helpers/utils";
import { errorResponse, successResponse } from "../logging/api-responses";
import { Request, Response } from "express";
import User from "../models/User";
import Sharepoints from "../models/Shareoints";
import jwt from 'jsonwebtoken';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const BASE_URL = process.env.BASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';


const whatsappLinks: any = {};
const sessions: any = {};
const processedMessages = new Set<string>();


export const getWebHooks = async (req: Request, res: Response) => {
    try {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("Webhook verified");
            return res.status(200).send(challenge);
        }

        console.log("Verification failed");
        res.sendStatus(403);
    } catch (error: any) {
        return errorResponse(res, error.message)
    }
}


export const postWebHooks = async (req: Request, res: Response) => {
    res.sendStatus(200);
    try {
            
        const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!msg || !msg.id) return;

        if (processedMessages.has(msg.id)) return;
        processedMessages.add(msg.id);

        setTimeout(() => processedMessages.delete(msg.id), 60000);

        const phone = msg.from;
        let text = msg.text?.body?.trim() || "";

        await markAsRead(msg.id);

        if (msg.type === "audio" && msg.audio?.id) {
            await sendMessage(phone, "Downloading your audio...");
            const filePath = await downloadAudioLocally(msg.audio.id, phone);
            await sendMessage(phone, `Audio saved: ${filePath}`);
            return;
        }

        let session = sessions[phone];


        if (!whatsappLinks[phone]) {
            const link = `${BASE_URL}/wa-link?phone=${phone}`;

            await sendMessage(
                phone,
                `Welcome to *Graice Bot*\n\nPlease login:\n${link}`,
                { "X-Custom": "rahil1234" }
            );
            return;
        }


        if (!session) {
            session = { state: "DOCROOM" };
            sessions[phone] = session;
        }

        if (session.state === "DOCROOM") {

            if (text.toLowerCase() === "logout") {
                delete whatsappLinks[phone];
                delete sessions[phone];

                const link = `${BASE_URL}/wa-link?phone=${phone}`;
                await sendMessage(
                    phone,
                    `You have been logged out.\n\nPlease login again:\n${link}`,
                    { "X-Custom": "value" }
                );
                return;
            }
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
                return;
            }

            session.docroomId = selectedRoom._id;
            session.docroomName = selectedRoom.name;
            session.state = "QUERY";

            await sendMessage(
                phone,
                `Entered *${session.docroomName}* \n Type *@* to choose connectors \n\nAsk question.\nType *exit* to change room.`
            );
            return;
        }
        if (session.state === "QUERY") {
            const listReply = msg.interactive?.list_reply?.id;

            if (listReply) {
                const sharepoints = await Sharepoints.find();
                const selectedSharepoint = sharepoints.find((s: any) => s._id.toString() === listReply);

                if (selectedSharepoint) {
                    session.selectedSharepoint = selectedSharepoint._id;
                    await sendMessage(phone, `Sharepoint *${selectedSharepoint.name}* selected`);
                    return;
                }
            }

            if (text.startsWith("@")) {
                const query = text.slice(1).toLowerCase();
                const sharepoints = await Sharepoints.find();

                if (query === "") {
                    const sections = [{
                        title: "Sharepoints",
                        rows: sharepoints.slice(0, 10).map((s: any) => ({
                            id: s._id.toString(),
                            title: s.name.substring(0, 24),
                            description: s.description?.substring(0, 72) || ""
                        }))
                    }];

                    await sendInteractiveList(
                        phone,
                        "*Available Sharepoints:*",
                        "Select",
                        sections
                    );
                } else {
                    const filtered = sharepoints.filter((s: any) =>
                        s.name.toLowerCase().includes(query)
                    );

                    if (filtered.length > 0) {
                        const list = filtered.map((s: any, i: number) =>
                            `${i + 1}. ${s.name}`
                        ).join("\n");

                        await sendMessage(
                            phone,
                            `*Filtered Sharepoints:*\n\n${list}`
                        );
                    } else {
                        await sendMessage(phone, "No sharepoints found.");
                    }
                }
                return;
            }
            if (text.toLowerCase() === "exit") {
                session.state = "DOCROOM";

                const userDocrooms = session.userDocrooms || [];
                const sections = [{
                    title: "Docrooms",
                    rows: userDocrooms.map((d: any) => ({
                        id: d._id.toString(),
                        title: d.name.substring(0, 24),
                        description: d.description?.substring(0, 72) || ""
                    }))
                }];

                await sendInteractiveList(
                    phone,
                    "*Select a Docroom:*",
                    "Select",
                    sections
                );
                console.log("docroom list sent");

                return;
            }

            const answer = await askAI(text, session.docroomName);
            //             const answer = `*Graice AI Response*

            // Docroom: ${session.docroomName}

            // Q: ${text}

            // A: Apple showed solid growth from Q1 to Q2, with sales increasing from $92 billion in Q1 to $98 billion in Q2, reflecting a 6.5% improvement. The rise was mainly driven by strong iPhone sales and growth in services.`;

            await sendMessage(phone, answer);
            return;
        }
    } catch (err) {
        console.error(err);
    }
}


export const linkWhatsApp = async (req: Request, res: Response) => {
    try {
        const { phone, email } = req.body;

        let user = await User.findOne({ $or: [{ email }, { phoneNumber: phone }] }).populate('docrooms');

        if (!user) {
            user = await User.create({ email, phoneNumber: phone, docrooms: [] });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, phone },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        whatsappLinks[phone] = {
            userId: user._id,
            email: user.email,
            jwt: token,
        };

        const userDocrooms = user.docrooms;
        sessions[phone] = {
            state: "DOCROOM",
            userDocrooms
        };

        const sections = [{
            title: "Docrooms",
            rows: userDocrooms.map((d: any) => ({
                id: d._id.toString(),
                title: d.name.substring(0, 24),
                description: d.description?.substring(0, 72) || ""
            }))
        }];

        await sendInteractiveList(
            phone,
            "*Select a Docroom:*",
            "Select",
            sections
        );

        res.json({ success: true });
    } catch (error: any) {
        return errorResponse(res, error.message);
    }
}


