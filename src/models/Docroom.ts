import mongoose, { Schema, Document } from 'mongoose';

export interface IDocroom extends Document {
  name: string;
  description?: string;
  createdAt: Date;
}

const DocroomSchema = new Schema<IDocroom>({
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDocroom>('Docroom', DocroomSchema);
