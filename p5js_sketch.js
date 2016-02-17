var exampleSelect, confirmButton, quiltedImage;
var activeSet;
var sourceImages   = [];

var reviewSelected = false;
var drawQuilted    = false;

// TODO: Use when user uploads images.
var draggingImages = true;

function setup() {
  var c = createCanvas(1000, 450); // 650 tall is better
  stroke(0); 
  fill(150);

  // What is our pixel density? Retina screen?
  console.log(pixelDensity());

  // Establish the drop down of examples
  exampleSelect = createSelect();
  exampleSelect.position(10,10);
  var keys = Object.keys(exampleDict);
  for(k in keys){
    exampleSelect.option(keys[k]);
  }
  exampleSelect.changed(exampleChangedEvent);

  // After selection of an image set, this will advance to quilting
  confirmButton = createButton('Confirm and Quilt Image');
  confirmButton.position(165, 10);
  confirmButton.mousePressed(confirmQuiltButtonClicked);
  confirmButton.hide();

  // If the user drag/drops images onto the canvas.
  c.drop(processDraggedFile)
}

function draw() {
  background("#efefef");
  if (reviewSelected) {
    for (var i = 0; i < sourceImages.length; i++) {
        // TODO: Fix this so that it's showing the proper resolution of the sample
        // At the moment, it is cramming the whole thing into 150x150
        // image(img,[sx=0],[sy=0],[sWidth=img.width],[sHeight=img.height],[dx=0],[dy=0],[dWidth],[dHeight])
        // Doesn't look great - consider scaling
        image(sourceImages[i],0,0,150,150,10 + (i*155),30,150,150);
    }
  }

  if (drawQuilted){
    if(quiltedImage === null){
      console.log("null quilted image");
    } else {
      image(quiltedImage.image, 0, 0);
    }
  }
}

function exampleChangedEvent(){
    var item = exampleSelect.value();
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
    reviewSelected = false;
    drawQuilted    = true;

    testImageQuilter();
}

function testImageQuilter(){
    // TESTING
    var imageQuilter = new ImageQuilter(sourceImages, 70, 70, 100,0.2);
    quiltedImage     = imageQuilter.getRandomImageSample();
}























