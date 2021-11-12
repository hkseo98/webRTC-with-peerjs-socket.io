// node 서버 켜기
// peerjs 서버 켜기

const socket = io("/");
const videoGrid = document.getElementById("video-grid");
// 첫 번째 인자로 undefined를 주면 peer 서버가 알아서 userId를 생성해준다.
const myPeer = new Peer(undefined, {
  // peer 서버에 대한 정보

  host: "localhost",
  port: 3001,
});
const myVideo = document.createElement("video");
myVideo.muted = true;

// 현재 연결된 peer들 map<userId, call>
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    // video 객체에 stream 추가해줌
    addVideoStream(myVideo, stream);

    // 만약 누군가 나에게 콜을 날린다면 상대방에게 나의 스트림을 전송해줌.
    myPeer.on("call", (call) => {
      call.answer(stream);
      // 그리고 상대방의 스트림을 나의 화면에 추가해줌
      const video = document.createElement("video");
      video.muted = true;

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

// 유저의 연결이 끊어졌을 때
socket.on("user-disconnected", (userId) => {
  // 나간 peer의 call 객체 삭제
  if (peers[userId]) peers[userId].close();
});

// peer 서버에 연결이 된 경우
myPeer.on("open", (userId) => {
  socket.emit("join-room", ROOM_ID, userId);
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
  // 새로운 유저 아이디에 내 비디오 스트림 넣어서 전송하면 call 객체를 받을 수 있음.
  // 이 객체를 통해 새로운 유저의 스트림을 재생할 수 있고 상대방에게도 나의 스트림이 재생될 수 있음.
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  video.muted = true;

  // 상대방의 스트림을 받아서 재생
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}
