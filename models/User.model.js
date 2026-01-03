import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const { Schema } = mongoose;

const hashRounds = 12;

console.log("📦 User.model.js is being loaded...");

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
    sparse: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, hashRounds);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.pre("save", function (next) {
  if (this.phoneNumber) {
    this.phoneNumber = this.phoneNumber
      .replace(/^00/, "+")
      .replace(/[\s\-\(\)]/g, "");
  }
  next();
});

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
