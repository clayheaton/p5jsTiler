var exampleSelect, confirmButton;
var activeSet;
var sourceImages   = [];

var reviewSelected = false;

// TODO: Use when user uploads images.
var draggingImages = true;

function setup() {
  var c = createCanvas(1000, 450); // 650 tall is better
  stroke(0); 
  fill(150);

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
        image(sourceImages[i],10 + (i*155),30,150,150);
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
}

function confirmQuiltButtonClicked(){
    exampleSelect.remove();
    confirmButton.remove();
}