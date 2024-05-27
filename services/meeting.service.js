const meeting = require("../models/meeting.model");
const meetingUser = require("../models/meetingUser.model");

async function getAllMeetingUsers(meetId, callback) {
  meetingUser
    .find({ meetingId: meetId })
    .then((response) => callback(null, response))
    .catch((error) => callback(error));
}
async function startMeeting(params, callback) {
  const meetingSchema = new meeting(params);

  meetingSchema
    .save()
    .then((response) => callback(null, response))
    .catch((error) => callback(error));
}
async function joinMeeting(params, callback) {
  const meetingUserModel = new meetingUser(params);

  meetingUserModel
    .save()
    .then(async (response) => {
      await meeting.findOneAndUpdate({ id: params.meetingId }, { $addToSet: { meetingUsers: meetingUserModel } });
      return callback(null, response);
    })
    .catch((error) => callback(error));
}

async function isMeetingPresent(meetingId, callback) {
  meeting
    .findById(meetingId)
    .populate("meetingUsers", "MeetingUser")
    .then((response) => {
      if (!response) callback("invalid meeting id");
      else callback(null, response);
    })
    .catch((error) => callback(error, false));
}

async function checkMeetingExists(meetingId, callback) {
  meeting
    .findById(meetingId)
    .populate("meetingUsers", "MeetingUser")
    .then((response) => {
      if (!response) callback("invalid meeting id");
      else callback(null, response);
    })
    .catch((error) => callback(error, false));
}

async function getMeetingUser(params, callback) {
  const { meetingId, userId } = params;
  meetingUser
    .find({ meetingId, userId })
    .then((response) => callback(null, response))
    .catch((error) => callback(error));
}

async function updateMeetingUser(params, callback) {
  meetingUser
    .updateOne({ userId: params.userId }, { $set: params }, { new: true })
    .then((response) => callback(null, response))
    .catch((error) => callback(error));
}

async function getUserBySocketId(params, callback) {
  const { meetingId, socketId } = params;
  meetingUser
    .find({ meetingId, socketId })
    .limit(1)
    .then((response) => callback(null, response))
    .catch((error) => callback(error));
}

module.exports = {
  startMeeting,
  joinMeeting,
  getAllMeetingUsers,
  isMeetingPresent,
  checkMeetingExists,
  getUserBySocketId,
  updateMeetingUser,
  getMeetingUser,
};
