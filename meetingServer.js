const meetingHelper = require("./utils/meetingHelper");
const { meetingPayloadEnum } = require("./utils/meetingPayload.enum");

function parseMessage(message) {
  try {
    const payload = JSON.parse(message);
    return payload;
  } catch (error) {
    return { type: meetingPayloadEnum.UNKNOWN };
  }
}

function listenMessage(meetingId, socket, meetingServer) {
  socket.on("message", (message) => handleMessage(meetingId, socket, meetingServer));
}

function handleMessage(meetingId, socket, message, meetingServer) {
  let payload;
  if (typeof message === "string") {
    payload = parseMessage(message);
  } else {
    payload = message;
  }
  switch (payload.type) {
    case meetingPayloadEnum.JOINED_MEETING:
      meetingHelper.joinMeeting(meetingId, socket, meetingServer, payload);
      break;
    case meetingPayloadEnum.CONNECTION_REQUEST:
      meetingHelper.forwardConnectionRequest(meetingId, socket, meetingServer, payload);
      break;
    case meetingPayloadEnum.OFFER_SDP:
      meetingHelper.forwardOfferSDP(meetingId, socket, meetingServer, payload);
      break;
    case meetingPayloadEnum.ANSWER_SDP:
      meetingHelper.forwardAnswerSDP(meetingId, socket, meetingServer, payload);
      break;
    case meetingPayloadEnum.ICECANDIDATE:
      meetingHelper.forwardIceCandidate(meetingId, socket, meetingServer, payload);
      break;
    case meetingPayloadEnum.LEAVE_MEETING:
      meetingHelper.userLeft(meetingId, socket, meetingServer, payload);
      break;
    case meetingPayloadEnum.END_MEETING:
      meetingHelper.endMeeting(meetingId, socket, meetingServer, payload);
      break;
    case meetingPayloadEnum.VIDEO_TOGGLE:
    case meetingPayloadEnum.AUDIO_TOGGLE:
      meetingHelper.forwardEvent(meetingId, socket, meetingServer, payload);
      break;
    case meetingPayloadEnum.UNKNOWN:
      break;
    default:
      break;
  }
}

function initMeetingServer(server) {
  const meetingServer = require("socket.io")(server);

  meetingServer.on("connection", (socket) => {
    const meetingId = socket.handshake.query.id;
    listenMessage(meetingId, socket, meetingServer);
  });
}

module.exports = { initMeetingServer };
