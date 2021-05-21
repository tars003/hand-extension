// INDICATING LOADING OF CONTENT SCRIPT
console.log('content script2 loaded ')


navigator.mediaDevices.getUserMedia({
  'audio': false,
  'video': { facingMode: 'user' },
})
  .then(stream => {
    console.log('Inside first then');
    alert('Thanks for granting access!  ');
    var port = chrome.runtime.connect({name: "GET-CONTENT-SUCCESS"});
    port.postMessage({
      status: "success"
    });
  });


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
            console.log('Inside 2nd then');
            alert('Thanks for granting access!');
        });
  }

  setTimeout(function() {
    sendResponse({status: true, });
  }, 1);
  return true;
});
