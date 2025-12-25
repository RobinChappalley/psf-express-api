import mongoose from "mongoose";
const { Schema } = mongoose;

const addressSchema = new Schema({
  street: String,
  city: String,
  postalCode: Number,
  country: String,
});

const participationInfoSchema = new Schema({
  birthDate: Date,
  tshirtInfo: {
    size: {
      type: String,
      enum: ["xxs", "xs", "s", "m", "l", "xl", "xxl"],
    },
    gender: {
      type: String,
      enum: ["m", "f"],
    },
  },
  allergies: [String],
  medication: [String],
  insuranceNumber: String,
  insuranceName: String,
  idExpireDate: Date,
  publicTransportPass: {
    type: String,
    enum: ["AG", "demi-tarif", "aucun"],
  },
  isCASMember: Boolean,
  isHelicopterInsured: Boolean,
  hasPhotoConsent: Boolean,
  hasPaid: Boolean,
});

const userSchema = new Schema({
  role: {
    type: [String],
    enum: ["admin", "accompagnant", "parent", "enfant"],
    default: "enfant",
    required: true,
  },
  lastname: {
    type: String,
    trim: true,
    min: 1,
    max: 50,
    required: true,
  },
  firstname: {
    type: String,
    trim: true,
    min: 1,
    max: 50,
    required: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
  },
  phoneNumber: { type: String },
  address: addressSchema,
  parent: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  children: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  camps: [
    {
      type: Schema.Types.ObjectId,
      ref: "Camp",
    },
  ],
  participationInfo: participationInfoSchema,
});

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
//module.exports = UserModel;
