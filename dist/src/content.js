// INDICATING LOADING OF CONTENT SCRIPT
console.log('content script loaded !!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

// SENDING THE VIDEO STREAM TO BACKGROUND AFTER RIGHT CLICK MSG IS DETECTED
function sendStreamToTab(stream, video1) {
    console.log('Inside sendStream');
    console.log(stream);
    var pc = new RTCPeerConnection({iceServers:[]});
    pc.addStream(stream);
    pc.createOffer().then((offer) => {
      pc.setLocalDescription(offer, function() {
          var port = chrome.runtime.connect({name: "tabCaptureSDP"});

          port.onDisconnect.addListener(function() {
              stopStream(stream);
          });

          port.onMessage.addListener(function(sdp) {
              console.log('isnide message change')
              console.log(sdp)
              pc.setRemoteDescription(new RTCSessionDescription(sdp));
          });

          port.postMessage(pc.localDescription);
      });
    })
}
// STOP THE STREAM WHEN EXITING CONTENT
function stopStream(stream) {
    var tracks = stream.getTracks();
    for (var i = 0; i < tracks.length; ++i) {
        tracks[i].stop();
    }
}

const startDrawing = (stream, canvas, video) => {
  // videoElement.crossOrigin = "anonymous";
  // const video = videoElement;

  const ctx = canvas.getContext("2d");
  let width = canvas.width;
  let height = canvas.height;

  let track = stream.getVideoTracks()[0]
  let imageCapture = new ImageCapture(track)

  // CALLED EVERY FRAME OF THE VIDEO
  const updateCanvas = async (now, metadata) => {
    console.log('Inside updateCanvas');
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.createImageData(width, height);

    // console.log(imageData)
    // console.log(JSON.stringify(imageData.data))
    let arr32 = new Uint32Array(imageData.data);
    // console.log(JSON.stringify(arr32));

    var port = chrome.runtime.connect({name: "imageData"});
    port.postMessage({
      d1 : imageData,
      d2: {
        data : arr32,
        width: imageData.width,
        height: imageData.height
      }
    });

    // console.log('Inside updateCanvas')
    // let ib = await imageCapture.grabFrame();
    // console.log(ib);
    // console.log(typeof ib)

    video.requestVideoFrameCallback(updateCanvas);
  };
  video.requestVideoFrameCallback(updateCanvas);
};

const renderPredictions = (predictions, canvas) => {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const font = "16px sans-serif";
  ctx.font = font;
  ctx.textBaseline = "top";
  predictions.forEach(prediction => {
    const x = prediction.bbox[0];
    const y = prediction.bbox[1];
    const width = prediction.bbox[2];
    const height = prediction.bbox[3];
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = "#00FFFF";
    const textWidth = ctx.measureText(prediction.class).width;
    const textHeight = parseInt(font, 10); // base 10
    ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
  });
  predictions.forEach(prediction => {
    const x = prediction.bbox[0];
    const y = prediction.bbox[1];
    ctx.fillStyle = "#000000";
    ctx.fillText(prediction.class, x, y);
  });
};

// GET VIDEO ELEMENT BASED ON SRCURL FROM ACUTUAL DOM AND PASSING THE STREAM/VIDEO TO BACKGROUND
function getVideoElement(src) {
  const videoArr = Array.from(document.getElementsByTagName('video'));
  const filterArr = videoArr.filter(x => x.src === src);
  console.log('returning ')
  console.log(filterArr[0]);
  return filterArr[0];
}

var mainCanvas;


// LISTENERS TO LISTEN FOR EVENTS FROM BACKGROUND
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // RIGHT CLICK DETECTED ON A VIDEO
  if (message && message.action == 'VIDEO_CLICK_DETECTED' && message.url) {
    console.log('inside message received')
    var videoElement = getVideoElement(message.url);
    var stream = videoElement.captureStream();

    // CREATING A VIDEO ELEMENT TO SEND TO CONTENT FOR ABOVE CREATED STREAM TO BE ATTTACHED TO
    // video1 = document.createElement('video');
    // video1.style.border = '1px solid black';
    // video1.srcObject = stream
    // video1.setAttribute("autoplay", "true");
    // video1.setAttribute("playsinline", "true");
    // document.body.insertBefore(video1, document.body.firstChild);

    // INVOKING SEND STREAM FUNCTION
    // sendStreamToTab(stream, video1);
    mainCanvas = document.createElement('canvas');
    mainCanvas.width = videoElement.width;
    mainCanvas.height = videoElement.height;
    startDrawing(stream, mainCanvas, videoElement);
    // var port = chrome.runtime.connect({name: "receiveTrack"});
    // port.postMessage(stream);


    // var port = chrome.runtime.connect({name: "knockknock"});
    // port.postMessage(stream);
    // videoElement.play();
    // startDrawing(videoElement, mainCanvas);
  }

  // PREDICTIONS ARRAY RECEIVED FROM BACKGROUND AFTER RUNNING MODEL ON B64 IMAGE SENT IN startDrawing()
  else if (message && message.action == 'VIDEO_PREDICTIONS' && message.predictions) {
    console.log('inside VIDEO_PREDICTIONS')
    console.log(message);
    renderPredictions(message.predictions, mainCanvas);
  }

  setTimeout(function() {
    sendResponse({status: true, });
  }, 1);
  return true;
});



