import mongoose from "mongoose";
const { Schema } = mongoose;

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
  date: Date,
  trainGoingTime: String,
  meetingTime: String,
  meetingPoint: String,
  returnTime: String,
  trainReturnTime: String,
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
  date: Date,
  number: Number,
  startPoint: String,
  endPoint: String,
  distance: Number,
  elevationGain: Number,
  elevationLoss: Number,
  routeDescription: String,
});

const campSchema = new Schema({
  title: String,
  startDate: Date,
  endDate: Date,
  subscriptionStartDatetime: Date,
  subscriptionEndDatetime: Date,
  gpsTrack: {},
  itemsList: [
    {
      itemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
      },
      quantity: Number,
    },
  ],
  infoEvening: infoEveningSchema,
  trainings: [trainingSchema],
  fundraising: [fundraisingSchema],
  generalMeeting: generalMeetingSchema,
  stages: [stageSchema],
});
