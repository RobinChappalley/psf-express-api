import mongoose from "mongoose";
const { Schema } = mongoose;

//console.log("📦 Camp.model.js is being loaded...");

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
  number: { type: Number, required: true },
  year: { type: Number },
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

trainingSchema.index({ number: 1, year: 1 }, { unique: true, sparse: true });

const fundraisingSchema = new Schema({
  number: { type: Number, required: true },
  year: { type: Number },
  dateTime: Date,
  location: String,
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

fundraisingSchema.index({ number: 1, year: 1 }, { unique: true });

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
  number: { type: Number, required: true },
  year: { type: Number },
  date: Date,
  startPoint: String,
  endPoint: String,
  distance: Number,
  elevationGain: Number,
  elevationLoss: Number,
  routeDescription: String,
});

stageSchema.index({ number: 1, year: 1 }, { unique: true });

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

// Hook PRE-SAVE sur le MAIN schema pour traiter les sous-documents
campSchema.pre("save", function (next) {
  console.log("🔴 MAIN SCHEMA PRE-SAVE triggered");

  // Traiter les trainings
  if (this.trainings && this.trainings.length > 0) {
    console.log("Processing trainings...");
    this.trainings.forEach((training, index) => {
      console.log(`  Training ${index}: date =`, training.date);
      if (training.date) {
        training.year = new Date(training.date).getFullYear();
        console.log(`  Training ${index}: year set to`, training.year);
      }
    });
  }

  // Traiter les fundraisings
  if (this.fundraisings && this.fundraisings.length > 0) {
    console.log("Processing fundraisings...");
    this.fundraisings.forEach((fundraising, index) => {
      console.log(`  Fundraising ${index}: dateTime =`, fundraising.dateTime);
      if (fundraising.dateTime) {
        fundraising.year = new Date(fundraising.dateTime).getFullYear();
        console.log(`  Fundraising ${index}: year set to`, fundraising.year);
      }
    });
  }

  // Traiter les stages
  if (this.stages && this.stages.length > 0) {
    console.log("Processing stages...");
    this.stages.forEach((stage, index) => {
      console.log(`  Stage ${index}: date =`, stage.date);
      if (stage.date) {
        stage.year = new Date(stage.date).getFullYear();
        console.log(`  Stage ${index}: year set to`, stage.year);
      }
    });
  }

  next();
});

const CampModel = mongoose.model("Camp", campSchema);
export default CampModel;
//module.exports = CampModel;
