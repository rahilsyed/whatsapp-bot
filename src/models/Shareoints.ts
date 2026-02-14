import mongoose, { Schema, Document } from 'mongoose';

export interface ISharePoint extends Document {
  name: string;
  provider?: string;
  createdAt: Date;
}

const SharePointSchema = new Schema<ISharePoint>({
  name: { type: String, required: true },
  provider: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Sharepoints = mongoose.model<ISharePoint>('sharepoints', SharePointSchema);
export default Sharepoints;