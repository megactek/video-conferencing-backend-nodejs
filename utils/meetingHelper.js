const meetingServices = require("../services/meeting.service");
const { meetingPayloadEnum } = require("./meetingPayload.enum");

async function joinMeeting(meetingId, socket, meetingServer, payload) {
  const { userId, name } = payload.data;
  meetingServices.isMeetingPresent(meetingId, async (error, results) => {
    if (error && !results) {
      sendMessage(socket, {
        type: meetingPayloadEnum.NOT_FOUND,
      });
    }
    if (results) {
      addUser(socket, { meetingId, userId, name }).then((result) => {
        if (result) {
          sendMessage(socket, {
            type: meetingPayloadEnum.JOINED_MEETING,
            data: { userId },
          });
          broadcastUsers(meetingId, socket, meetingServer, {
            type: meetingPayloadEnum.USER_JOINED,
            data: {
              userId,
              name,
              ...payload,
            },
          });
        }
      });
    }
  });
}
function forwardConnectionRequest(meetingId, socket, meetingServer, payload) {
  const { userId, otherUserId, name } = payload.data;
  let model = { meetingId, userId: otherUserId };
  meetingServices.getMeetingUser(model, (error, results) => {
    if (error) {
      return next(error);
    }
    if (results) {
      let sendPayload = JSON.stringify({
        type: meetingPayloadEnum.CONNECTION_REQUEST,
        data: {
          userId,
          name,
          ...payload,
        },
      });
      meetingServer.to(results.socketId).emit("message", sendPayload);
    }
  });
}
function forwardIceCandidate(meetingId, socket, meetingServer, payload) {
  const { userId, otherUserId, candidate } = payload.data;

  let model = { meetingId, userId: otherUserId };

  meetingServices.getMeetingUser(model, (error, results) => {
    if (error) {
      return next(error);
    }
    if (results) {
      let sendPayload = JSON.stringify({
        type: meetingPayloadEnum.ICECANDIDATE,
        data: {
          userId,
          candidate,
        },
      });
      meetingServer.to(results.socketId).emit("message", sendPayload);
    }
  });
}
function forwardOfferSDP(meetingId, socket, meetingServer, payload) {
  const { userId, otherUserId, sdp } = payload.data;

  let model = { meetingId, userId: otherUserId };

  meetingServices.getMeetingUser(model, (error, results) => {
    if (error) {
      return next(error);
    }
    if (results) {
      let sendPayload = JSON.stringify({
        type: meetingPayloadEnum.OFFER_SDP,
        data: {
          userId,
          sdp,
        },
      });
      meetingServer.to(results.socketId).emit("message", sendPayload);
    }
  });
}
function forwardAnswerSDP(meetingId, socket, meetingServer, payload) {
  const { userId, otherUserId, sdp } = payload.data;

  let model = { meetingId, userId: otherUserId };

  meetingServices.getMeetingUser(model, (error, results) => {
    if (error) {
      return next(error);
    }
    if (results) {
      let sendPayload = JSON.stringify({
        type: meetingPayloadEnum.ANSWER_SDP,
        data: {
          userId,
          sdp,
        },
      });
      meetingServer.to(results.socketId).emit("message", sendPayload);
    }
  });
}
function userLeft(meetingId, socket, meetingServer, payload) {
  const { userId } = payload.data;
  broadcastUsers(meetingId, socket, meetingServer, {
    type: meetingPayloadEnum.USER_LEFT,
    data: { userId },
  });
}
function endMeeting(meetingId, socket, meetingServer, payload) {
  const { userId } = payload.data;
  broadcastUsers(meetingId, socket, meetingServer, {
    type: meetingPayloadEnum.MEETING_ENDED,
    data: { userId },
  });
  meetingServices.getAllMeetingUsers(meetingId, (error, results) => {
    for (let i = 0; i < results.length; i++) {
      const meetingUser = results[i];
      meetingServer.sockets.connected[meetingUser.socketId].disconnect();
    }
  });
}

function forwardEvent(meetingId, socket, meetingServer, payload) {
  const { userId } = payload.data;
  broadcastUsers(meetingId, socket, meetingServer, {
    type: payload.type,
    data: { userId, ...payload.data },
  });
}
function sendMessage(socket, payload) {
  socket.send(JSON.stringify(payload));
}

function addUser(socket, { meetingId, userId, name }) {
  let promise = new Promise((resolve, reject) => {
    meetingServices.getMeetingUser({ meetingId, userId }, (error, results) => {
      if (!results) {
        let model = {
          socketId: socket.id,
          meetingId,
          userId,
          joined: true,
          name,
          isAlive: true,
        };
        meetingServices.joinMeeting(model, (error, results) => {
          if (error) {
            reject(error);
          }
          if (results) {
            resolve(true);
          }
        });
      } else {
        meetingServices.updateMeetingUser({ userId, socketId: socket.id }, (error, results) => {
          if (error) {
            reject(error);
          }
          if (results) {
            resolve(true);
          }
        });
      }
    });
  });
  return promise;
}

function broadcastUsers(meetingId, socket, meetingServer, payload) {
  socket.broadcast.emit("message", JSON.stringify("payload"));
}

module.exports = {
  joinMeeting,
  forwardConnectionRequest,
  forwardIceCandidate,
  forwardAnswerSDP,
  forwardOfferSDP,
  userLeft,
  endMeeting,
  forwardEvent,
};
