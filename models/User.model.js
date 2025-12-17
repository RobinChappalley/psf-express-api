import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  role: {
    type: [String],
    enum: ["admin", "accompagnant", "parent", "enfant"],
    required: true,
  },
  lastname: {
    type: String,
    trim: true,
  },
  firstname: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phoneNumber: String,
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
  },
  parentId: {
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
  participationInfo: {
    birthDate: Date,
    tshirtInfo: {
      size: String,
      gender: String,
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
  },
});

//const User = mongoose.model("User", userSchema);

//export default User;
