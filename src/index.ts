import dotenv from 'dotenv'
import axios from 'axios'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import apiRouter from './routes/webhooks';
import connectToDB from './config/db';
import './models/User';
import './models/Docroom';
import './models/Shareoints';
dotenv.config();

const app = express();
connectToDB();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api',apiRouter);
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})  

app.listen(process.env.PORT,()=>{
    console.log('server is running ',process.env.PORT)
})  