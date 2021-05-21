// INDICATING LOADING OF MAIN CONTENT SCRIPT
console.log('content main script loaded ')


// LISTENERS TO LISTEN FOR EVENTS FROM BACKGROUND
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // RIGHT CLICK DETECTED IN BACKGROUND
  if (message && message.action == 'GET-DEVICE-ACCESS' ) {
    console.log('Inside get device access');
    navigator.mediaDevices.getUserMedia({
      'audio': false,
      'video': { facingMode: 'user' },
    })
      .then(stream => {
        console.log('Stream loaded on content main ');
        console.log(stream);

        // CREATING A VIDEO ELEMENT TO SEND TO CONTENT FOR ABOVE CREATED STREAM TO BE ATTTACHED TO
        video1 = document.createElement('video');
        video1.width = 1920;
        video1.height = 1080;
        video1.style.border = '1px solid black';
        video1.srcObject = stream
        video1.setAttribute("playsinline", "true");
        document.body.insertBefore(video1, document.body.firstChild);
        video1.play();
      });
  }

  // IF MOVEMENT IS DETECTED IN BACKGROUND
  else if (message && message.action == 'MOVEMENT-DETECTED') {
    console.log('MOVEMENT DETECTED');
    console.log(message.data)
  }

  setTimeout(function() {
    sendResponse({status: true, });
  }, 1);
  return true;
});
