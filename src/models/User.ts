import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  phoneNumber: string;
  docrooms: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  docrooms: [{ type: Schema.Types.ObjectId, ref: 'Docroom' }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
