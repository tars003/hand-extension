import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from "@tensorflow-models/coco-ssd";


function clickMenuCallback(info, tab) {
	imageClassifier.analyzeVideo(info, tab.id);
}

chrome.contextMenus.create({
  title: 'Classify image with TensorFlow.js ',
  contexts: ['video'],
  onclick: clickMenuCallback
});


class VideoAnalyzer {
	modelPromise;
	canvas;

	constructor() {
    modelPromise = cocoSsd.load();

		this.canvas = document.createElement('canvas');
		this.canvas.width = 600;
		this.canvas.height = 500;
		this.canvas.id = "output"
  }

	detectVideo = (video, model) => {
		// Pass the video to model
    model.detect(video).then(predictions => {

			// Pass the predictions received from model to renderPredictions
      this.renderPredictions(predictions);

			// Browser stuff to refresh the rendered overlay or something similar
      requestAnimationFrame(this.detectVideo);
    });
  };

	renderPredictions = predictions => {
		// Getting context fro canvas initialized in the constructor
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
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

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });
  };

	analyzeVideo(info, tabId) {
		console.log('info');
		console.log(info);
		
		// wait for the model to load and pass video(info) along with model to function
		this.modelPromise.then((model) => {
			this.detectVideo(info, model)
		})
	}
}	

const videoAnalyzer = new VideoAnalyzer();