import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logging from './logging';
dotenv.config();

const NAMESPACE = 'DATABASE';

const databaseUrl: string = process.env.DB_URL!;
const connectToDB = () => {
  mongoose
    .connect(databaseUrl)
    .then(() => {
      logging.info(NAMESPACE, 'connected to Database at', databaseUrl);
    })
    .catch((error) => {
      logging.error(NAMESPACE, 'error connecting to database', error);
      process.exit(1);
    });
};

export default connectToDB;
