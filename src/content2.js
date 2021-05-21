// INDICATING LOADING OF CONTENT SCRIPT
console.log('content script2 loaded ')

let
html = document.documentElement,
bod = document.body,
head = document.head;



//inject page/script to get device access
ifr = document.createElement('iframe');
ifr.setAttribute('allow', 'microphone; camera');
ifr.style.display = 'none';
ifr.src = get_url('content-get-device-access.html');
bod.appendChild(ifr);

//get assets/page URL - if extension (rather than static testing) this goes via chrome.runtime.getURL
function get_url(uri) { return chrome.runtime.getURL(uri)}

// (() => {
//     // console.log('Inside immidiately declared function');

//     let
//     html = document.documentElement,
//     bod = document.body,
//     head = document.head;



//     //inject page/script to get device access
//     ifr = document.createElement('iframe');
//     ifr.setAttribute('allow', 'microphone; camera');
//     ifr.style.display = 'none';
//     ifr.src = get_url('content-get-device-access.html');
//     bod.appendChild(ifr);

//     //get assets/page URL - if extension (rather than static testing) this goes via chrome.runtime.getURL
//     function get_url(uri) { return chrome.runtime.getURL(uri)}

// })();



