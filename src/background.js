import 'babel-polyfill';
// import * as tf from '@tensorflow/tfjs';
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import * as handpose from "@tensorflow-models/handpose";
const handpose = require('@tensorflow-models/handpose');
const tfCore = require('@tensorflow/tfjs-core');
require('@tensorflow/tfjs-backend-webgl');

var srcUrl ;
var tabId;
var model;
var videoAnalyzer;
var video;
var video2;
var video3;
var model2;
var tabId;
var tL, bR, tx, ty, bx, by, cx, cy, right_x, left_x, sx, start, stop, movement;


// create right click menu
chrome.contextMenus.create({
  title: 'Classify image with TensorFlow.js ',
  "contexts": ["page", "selection", "image", "link"],
  // onclick: clickMenuCallback,
  onclick: clickMenuCallback2
});

// DETECTING RIGHT CLICK ON VIDEO
function clickMenuCallback(info, tab) {
  srcUrl = info.srcUrl;
  tabId = tab.id;
  let message = {action: 'VIDEO_CLICK_DETECTED', url : info.srcUrl};
  console.log('Inside rightClick function')
  // EXECUTING CONTENT SCRIPT
  // chrome.tabs.executeScript(tabId, {file: './content.js'}, function() {
  //   console.log('Content script execute successfull !!!!');
  //   // EXECUTING SEND RIGHT CLICK DETECTED MESSAGE TO CONTENT AFTER SUCCESSFULL EXECUION OF CONTENT SCRIPT
  //   // chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
  //   //   chrome.tabs.sendMessage(tabId, message, function(response) {
  //   //       console.log(response);
  //   //   });
  //   // });
  // })

  // EXECUTING SEND RIGHT CLICK DETECTED MESSAGE TO CONTENT AFTER SUCCESSFULL EXECUION OF CONTENT SCRIPT
  chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
    chrome.tabs.sendMessage(tabId, message, function(response) {
        console.log(response);
    });
  });
}

async function setupCamera() {
  console.log('inside setupCamera')
  video2 = document.createElement('video');
  video2.height = 600;
  video2.width = 800;

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': { facingMode: 'user' },
  });
  console.log('stream')
  console.log(stream)
  video2.srcObject = stream;

  return new Promise((resolve) => {
    video2.onloadedmetadata = () => {
      resolve(video2);
    };
  });
}


// DETECTING RIGHT CLICK TO START CAMERA STREAM
async function clickMenuCallback2(info, tab) {
  console.log('Inside clickMenuCallback2');
  tabId = tab.id;
  chrome.tabs.executeScript(tab.id, {file: 'src/content2.js'});

  const message = {
    action: 'GET-DEVICE-ACCESS',
  }

  chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
    chrome.tabs.sendMessage(tab.id, message, function(response) {
        console.log(response);
    });
  });
}

async function getStream() {
  console.log("Inside getStream ")
  await setupCamera()
  console.log('playing video now')
  video2.play();

  await tfCore.setBackend('webgl');

  model = await handpose.load()
  console.log('Model loaded')
  console.log(model)
  // renderPrediction2()
  renderPredictionHand();
}

async function renderPredictionHand() {
  // console.log('Inside renderPredictionHand')
  const predictions = await model.estimateHands(video2);
  // console.log(predictions);
  if (predictions.length > 0) {
  // if (false) {
    const bbox = predictions[0].boundingBox
    tL = bbox.topLeft
    bR = bbox.bottomRight
    tx = tL[0]
    ty = tL[1]
    bx = bR[0]
    by = bR[1]
    const size = [bx - tx, by - ty];
    cx = (tx + bx) / 2
    cy = (ty + by) / 2
    right_x = video2.width * 0.7 // Right to Left will be detected in the last 30% of the window.
    left_x = video2.width * 0.3  //Left to Right will be detected in the first 30% of the window.
    if (cx > right_x) {
      // console.log('Entering Right')
      sx = cx
      start = new Date().getTime();
      movement = 'NEXT SLIDE'
    }
    if (cx < left_x) {
      // console.log('Entering left')
      sx = cx
      start = new Date().getTime();
      movement = 'PREVIOUS SLIDE'
    }
    stop = new Date().getTime();
    // console.log(Math.abs(start - stop) < 700 );
    // console.log(Math.abs(sx - cx) > (1920 * 0.125));

    if (Math.abs(start - stop) < 700 && (Math.abs(sx - cx) > (video2.width * 0.125))) { //Trigger event.
      console.log('Working')
      console.log(movement);
      sx = undefined;
      // notifying dom about the swipe
      const message = {
        action: 'MOVEMENT-DETECTED',
        data: movement
      }
      chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
        chrome.tabs.sendMessage(tabId, message, function(response) {
            console.log(response);
        });
      });
    }
    else {
      console.log('inside else')
    }
  }
  // requestAnimationFrame(renderPrediction);
  setTimeout(function() {
    renderPredictionHand();
  }, 25); // 40 Hz.
};


// LISTENING FOR MESSAGES FROM CONTENT
chrome.runtime.onConnect.addListener(function(port) {
  // SENDING DATA VIA CHROME MESSAGING SIMPLE
  if(port.name == 'knockknock') {
    port.onMessage.addListener(function(msg) {
      console.log('inside main listener');
      console.log(msg);
      // CALLING VIDEO ANALYZER FUNCTIONS
      // videoAnalyzer.analyzeVideo(msg)
    });
  }

  // RECEIVING DATA VIA WEBRTC
  else if(port.name == 'tabCaptureSDP') {
    port.onMessage.addListener(function(remoteDescription) {
        onReceiveOfferSDP(setRemoteDescription, function(sdp) {
            port.postMessage(sdp);
        });
    });
  }

  // RECEIVING IMAGE DATA VIA CANVAS CREATED OBJECT SENT EVERY VIDEO FRAME
  else if(port.name == 'imageData') {
    port.onMessage.addListener(function(imgData) {
        console.log('Inside imageData listener in');
        console.log(imgData);
        let d2 = imgData.d2;
        d2 = {
          data : JSON.parse(d2.data),
          width: d2.width,
          height: d2.height
        }
        console.log(imgData.d1)
        console.log(d2)
        videoAnalyzer.analyzeVideo2(d2);
    });
  }

  // RECEIVING CONFIRMATION FROM GET MEDIA ACcESS
  else if(port.name == 'GET-CONTENT-SUCCESS') {
    port.onMessage.addListener(async function(message) {
        console.log('Inside GET-CONTENT-SUCCESS listener ');
        console.log(message);
        await getStream();
    });
  }
});


class VideoAnalyzer {
  model;
	canvas;

	constructor() {
    // CREATING VIDEO ELEMENT TO ATTACH RECEIVED STREAM FROM CONTENT TO
    video = document.createElement('video');
    video.style.border = '1px solid black';
    document.body.insertBefore(video, document.body.firstChild);
    video.setAttribute("autoplay", "true");
    video.setAttribute("playsinline", "true");

    // CREATING CANVAS TO DRAW PREDICTIONS FOR THE VIDEO ATTACHED WITH INCOMING STREAM
    this.canvas = document.createElement('canvas');
    document.body.insertBefore(this.canvas, document.body.firstChild);
    this.canvas.width = 640;
    this.canvas.height = 360;
  }

  // TAKES VIDEO & MODEL AS INPUT AND EXECUTES renderPredictions()
	detectVideo = (video, model) => {
    console.log('inside detectVideo. Video received is printed below');
    console.log(video)
    model.detect(video).then(predictions => {
      console.log('predictions');
      console.log(predictions)
			// Pass the predictions received from model to renderPredictions
      this.renderPredictions(predictions, this.canvas);
			// Browser stuff to refresh the rendered overlay or something similar
      requestAnimationFrame(this.detectVideo);
    });
  };

  //  RENDERS PREDICTIONS FOR STREAM ATTACHED VIDEO ONTO THE CREATED CANVAS IN CONSTRUCTOR
  renderPredictions = (predictions, canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
    // FOR MAIN BOX AROUND THE OBJECT
    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];
      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });

    // FOR TEXT ONTO THE BOX
    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });
  };

  // CALLS THE detectVideo() & INITIALIZES THE CANVAS FOR PREDICTIONS TO BE DRAWN
	analyzeVideo(video) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.detectVideo(video, model);
	}

  analyzeVideo2(imageData) {
    console.log('inside detectVideo22. Video received is printed below');
    console.log(imageData)
    model.detect(imageData).then(predictions => {
      console.log('predictions');
      console.log(predictions)
      // Pass the predictions received from model to renderPredictions
      // this.renderPredictions(predictions, this.canvas);
      // Browser stuff to refresh the rendered overlay or something similar
      // requestAnimationFrame(this.detectVideo);
    });
  }
}


// ATTACHING THE STREAM TO THE VIDEO ELEMENT FOR PREDICTION, CALLED INSIDE RECEIVE STREAM FUNCTION
function onReceiveStream(stream) {
    // video = document.createElement('video');
    // video.style.border = '1px solid black';
    video.srcObject = stream;
    videoAnalyzer.analyzeVideo(video3);

    // video.onloadedmetadata = () => {
    //   console.log('Inside onloadedmetadata for the stream attached video %%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
    // }
}

// FUNCTION FOR RECEIVING MEDIA STREAM FROM CONTENT
function onReceiveOfferSDP(sdp, sendResponse) {
    var pc = new RTCPeerConnection({iceServers:[]});
    pc.onaddstream = function(event) {
        onReceiveStream(event.stream);
    };
    pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(function() {
        pc.createAnswer().then(function(answer) {
            pc.setLocalDescription(answer).then(() => {
              sendResponse(pc.localDescription);
            });
        });
    });
}


// LOADING THE MODAL AND OTHER CLASS FUNCTIONS
// handpose.load()
//   .then((modelRes) => {
//     model = modelRes;
//     console.log('MODEL LOADED !!!!!!!!!!!!!!!!!!');
//     console.log(model)
//     videoAnalyzer =  new VideoAnalyzer();
//   })
