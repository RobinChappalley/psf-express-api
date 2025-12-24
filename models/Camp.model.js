import mongoose from "mongoose";
const { Schema } = mongoose;

const itemSchema = new Schema({
  item: {
    type: Schema.Types.ObjectId,
    ref: "Item",
  },
  quantity: Number,
});

const infoEveningSchema = new Schema({
  dateTime: Date,
  location: String,
  participants: [
    {
      email: {
        type: String,
        lowercase: true,
        trim: true,
        required: true,
      },
      nbOfParticipants: Number,
    },
  ],
});

const trainingSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  date: Date,
  trainGoingTime: String,
  trainReturnTime: String,
  meetingTime: String,
  meetingPoint: String,
  returnTime: String,
  distance: Number,
  elevationGain: Number,
  elevationLoss: Number,
  responsiblePerson: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  itemsList: [
    {
      itemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
      },
      quantity: Number,
    },
  ],
  remark: String,
});

const fundraisingSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  dateTime: Date,
  location: String,
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const generalMeetingSchema = new Schema({
  dateTime: Date,
  location: String,
  participants: [
    {
      email: {
        type: String,
        lowercase: true,
        trim: true,
        required: true,
      },
      nbOfParticipants: Number,
    },
  ],
});

const stageSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  date: Date,
  startPoint: String,
  endPoint: String,
  distance: Number,
  elevationGain: Number,
  elevationLoss: Number,
  routeDescription: String,
});

const campSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: Date,
  endDate: Date,
  subStartDatetime: Date,
  subEndDatetime: Date,
  gpsTrack: {},
  itemsList: [itemSchema],
  infoEvening: infoEveningSchema,
  trainings: [trainingSchema],
  fundraisings: [fundraisingSchema],
  generalMeeting: generalMeetingSchema,
  stages: [stageSchema],
});

const CampModel = mongoose.model("Camp", campSchema);
module.exports = CampModel;
