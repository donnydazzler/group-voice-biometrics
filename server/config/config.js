module.exports = {
  VOICEIT_DEV_ID: process.env.VOICEIT_DEV_ID,
  email: process.env.VOICEIT_EMAIL,
  password: process.env.VOICEIT_PWD,
  accuracy: 0, // recommended 0-2, but can be 3-5
  confidence: 90, // recommended 90-92, but can be 88-89
  accuracyPasses: 5,
  accuracyPassIncrement: 2,
  voiceprintTextConfidenceThreshold: 0.5
};
