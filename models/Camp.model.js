import mongoose from "mongoose";
const { Schema } = mongoose;

//A quoi sert sparse ? Pour permettre les valeurs null dans les champs uniques
//Le problème vient de ces lignes dans ton schéma :
// Dans stageSchema et fundraisingSchema
//index({ number: 1, year: 1 }, { unique: true });
//MongoDB traite null comme une valeur.

//Tu crées le Camp A sans stage. Pour MongoDB, le couple (number, year) est considéré comme "absent" (ou parfois null selon comment Mongoose le cast).
//Tu crées le Camp B sans stage. MongoDB voit un deuxième "vide" ou null, et comme l'index est unique, il crache une erreur : "Doublon détecté !".

//La solution magique est l'option sparse: true.
//Cela dit à MongoDB : "Si le champ n'existe pas ou est null, ne l'indexe pas. N'applique la contrainte d'unicité que si les données existent vraiment."

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

infoEveningSchema.index({ dateTime: 1 }, { unique: true, sparse: true });

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
  gpsTrack: {
    type: { type: String },
    coordinates: [[Number]],
  },
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

fundraisingSchema.index({ number: 1, year: 1 }, { unique: true, sparse: true });

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

generalMeetingSchema.index({ dateTime: 1 }, { unique: true, sparse: true });

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

stageSchema.index({ number: 1, year: 1 }, { unique: true, sparse: true });

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

campSchema.index({ "trainings.gpsTrack": "2dsphere" });

// Hook PRE-SAVE sur le MAIN schema pour traiter les sous-documents
campSchema.pre("save", function (next) {
  // Traiter les trainings
  if (this.trainings && this.trainings.length > 0) {
    this.trainings.forEach((training, index) => {
      if (training.date) {
        training.year = new Date(training.date).getFullYear();
      }
    });
  }

  // Traiter les fundraisings
  if (this.fundraisings && this.fundraisings.length > 0) {
    this.fundraisings.forEach((fundraising, index) => {
      if (fundraising.dateTime) {
        fundraising.year = new Date(fundraising.dateTime).getFullYear();
      }
    });
  }

  // Traiter les stages
  if (this.stages && this.stages.length > 0) {
    this.stages.forEach((stage, index) => {
      if (stage.date) {
        stage.year = new Date(stage.date).getFullYear();
      }
    });
  }

  next();
});

campSchema.methods.getNextTrainingNumber = function () {
  if (this.trainings.length === 0) return 1;
  const maxNumber = Math.max(...this.trainings.map((t) => t.number || 0));
  return maxNumber + 1;
};

const CampModel = mongoose.model("Camp", campSchema);
export default CampModel;
//module.exports = CampModel;
