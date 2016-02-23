var exampleSelect, confirmButton, quiltedTestImage;
var imageQuilter;
var activeSet;
var sourceImages = [];

var reviewSelected       = false;
var performImageQuilting = false;

// Use to toggle whether the background is drawn.
var drawBackground = true;

// TODO: Use when user uploads images.
var draggingImages = true;

function setup() {
  var c = createCanvas(735, 500); // 650 tall is better
  c.parent('quilter_block')
  stroke(0); 
  fill(150);

  setupExampleButtons();

  // If the user drag/drops images onto the canvas.
  c.drop(processDraggedFile)
}

function draw() {
  if (drawBackground) {
    background("#efefef");
  }

  if (reviewSelected) {
    for (var i = 0; i < sourceImages.length; i++) {
        image(sourceImages[i],0,0,150,150,10 + (i*155),10,150,150);
      }
    }

    if (performImageQuilting){
      if (drawBackground) {
        background("#efefef");
        drawBackground = false;
      }
      if (imageQuilter.completed) {
        performImageQuilting = false;
      // TODO: Move to next state here. Function that adds a button, etc.
    } else {
      sample = imageQuilter.nextQuiltingSample();
      image(sample.image,sample.x,sample.y);
    }
  }
}



function setupExampleButtons(){
  // Establish the drop down of examples
  var sampleSelectDiv = document.getElementById('sample_select');
  exampleSelect       = createSelect();
  exampleSelect.addClass('form-control input-sm');
  exampleSelect.parent(sampleSelectDiv);
  
  var keys = Object.keys(exampleDict);

  for(k in keys){
    exampleSelect.option(keys[k]);
  }
  exampleSelect.changed(exampleChangedEvent);

  // After selection of an image set, this will advance to quilting
  var buttonDiv = document.getElementById('sample_select_button');
  confirmButton = createButton('Confirm and Quilt Image');
  confirmButton.addClass('btn btn-primary btn-sm');
  confirmButton.parent(buttonDiv);
  confirmButton.mousePressed(confirmQuiltButtonClicked);
  confirmButton.hide();
}


function exampleChangedEvent(){
  var item  = exampleSelect.value();
  activeSet = exampleDict[item];

    // Empty current source images
    while (sourceImages.length > 0) {
      sourceImages.pop();
    }

    // Add selected examples to the sourceImages array
    if (activeSet === null) {
      reviewSelected = false;
      confirmButton.hide();
      draggingImages = false;
      return;
    } else {
      for (var i = 0; i < activeSet.length; i++) {
        var img = loadImage(activeSet[i]);
        sourceImages.push(img);
      }
      reviewSelected = true;
      confirmButton.show();
      draggingImages = false;
    }
  }

  function processDraggedFile(file){
    // Empty current source images if we're transitioning
    if(!draggingImages){
      while (sourceImages.length > 0) {
        sourceImages.pop();
      }
      draggingImages = true;
        // TODO: What to do with the draggingImages variable?
      }
      var img = loadImage(file.data);
      sourceImages.push(img);
      reviewSelected = true;
      confirmButton.show();
    }

    function confirmQuiltButtonClicked(){
      exampleSelect.remove();
      confirmButton.remove();
      reviewSelected       = false;
      performImageQuilting = true;
      createQuiltedImage();

    }

    function createQuiltedImage(){
  // TODO: Allow the user to change parameters.
  imageQuilter = new ImageQuilter(sourceImages, 60, 60,0.3,width,height, false);
}

















