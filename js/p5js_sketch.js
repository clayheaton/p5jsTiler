var exampleSelect, confirmButton, quiltedTestImage;
var sliderSampleWidth,sliderSampleHeight,sliderHOverlapPercent,sliderWOverlapPercent;
var imageQuilter;
var iqo;
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
  setupOptions();

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

function setupOptions(){

  // sliderSampleWidth,sliderSampleHeight,sliderHOverlapPercent,sliderWOverlapPercent
  sliderSampleWidth = createSlider(20,100,50);
  sliderSampleWidth.parent('sliderSampleWidth');
  sliderSampleWidth.changed(function() {select('#span_sampleWidth').html(sliderSampleWidth.value());});

  sliderSampleHeight = createSlider(20,100,50);
  sliderSampleHeight.parent('sliderSampleHeight');
  sliderSampleHeight.changed(function() {select('#span_sampleHeight').html(sliderSampleHeight.value());});

  sliderWOverlapPercent = createSlider(10,60,20);
  sliderWOverlapPercent.parent('sliderWOverlapPercent');
  sliderWOverlapPercent.changed(function() {select('#span_widthPercent').html(sliderWOverlapPercent.value());});

  sliderHOverlapPercent = createSlider(10,60,20);
  sliderHOverlapPercent.parent('sliderHOverlapPercent');
  sliderHOverlapPercent.changed(function() {select('#span_heightPercent').html(sliderHOverlapPercent.value());});
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
  iqo = {
    "sampleW" : parseInt(sliderSampleWidth.value()),
    "sampleH" : parseInt(sliderSampleHeight.value()),
    "overlapW": parseFloat(sliderWOverlapPercent.value()) / 100,
    "overlapH": parseFloat(sliderHOverlapPercent.value()) / 100
  }

  exampleSelect.hide();
  confirmButton.hide();
  select('#sliderSampleWidth').hide();
  select('#sliderSampleHeight').hide();
  select('#sliderWOverlapPercent').hide();
  select('#sliderHOverlapPercent').hide();

  reviewSelected       = false;
  performImageQuilting = true;
  
  imageQuilter = new ImageQuilter(sourceImages, iqo["sampleW"], iqo["sampleH"],iqo["overlapW"],iqo["overlapH"],width,height, false);
}















