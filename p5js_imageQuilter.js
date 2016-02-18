// Quilts an image based on samples from one or more sources.

function ImageQuilter(sourceImagesArray, sampleW, sampleH, numSamples, overlapPercent,widthToQuilt,heightToQuilt){
    this.sourceImages   = sourceImagesArray;
    this.imageSamples   = [];
    this.overlapPercent = overlapPercent;
    this.widthToQuilt   = widthToQuilt;
    this.heightToQuilt  = heightToQuilt;
    this.sampleW        = sampleW;
    this.sampleH        = sampleH;
    this.columns        = 0;
    this.rows           = 0;
    this.currentRow     = 0;
    this.currentColumn  = 0;
    this.completed      = false;

    // Assuming square samples at the moment
    // Keep overlapPercent below 0.5
    this.overlapW = parseInt(sampleW * overlapPercent);
    this.overlapH = parseInt(sampleH * overlapPercent);

    // Calculate the number of rows and columns we need. 
    this.columns = Math.ceil(this.widthToQuilt / (this.sampleW - (this.overlapW)));
    this.rows    = Math.ceil(this.heightToQuilt / (this.sampleH - (this.overlapH)));
    console.log("Columns = " + this.columns + ", Rows = " + this.rows);
    console.log("this.overlapW = " + this.overlapW + ", this.overlapH = " + this.overlapH);

    // TODO: The images might not all be the same dimensions. Check and set w and h accordingly.
    this.sampleMaker  = new ImageSampleMaker(sampleW, sampleH);
    this.numSamples   = numSamples;

    for (var i = 0; i < this.numSamples; i++) {
        sampIndex = parseInt(random(0,this.sourceImages.length - 1));
        samp = this.sampleMaker.makeSample(this.sourceImages[sampIndex]);
        this.imageSamples.push(samp);
    }
}
ImageQuilter.prototype.getRandomImageSample = function(){
    x = parseInt(random(0, this.imageSamples.length - 1))
    return this.imageSamples[x];
}
ImageQuilter.prototype.nextQuiltingSample = function(){
    var thisSample;
    // These are the cases for the different quilting positions
    if (this.currentRow == 0 && this.currentColumn == 0) {
        // console.log("Upper left corner: (" + this.currentColumn + ", " + this.currentRow + ")");
        // Get a random sample and put it in the upper left corner. 
        thisSample = this.getRandomImageSample();
    } else if (this.currentRow == 0) {
        // console.log("Top row: (" + this.currentColumn + ", " + this.currentRow + ")");
        thisSample   = this.getRandomImageSample();
        thisSample.y = 0;
        thisSample.x = (this.currentColumn*thisSample.w) - (this.currentColumn * this.overlapW);
    } else if (this.currentColumn == 0) {
        // console.log("Left column: (" + this.currentColumn + ", " + this.currentRow + ")");
        thisSample   = this.getRandomImageSample();
        thisSample.x = 0;
        thisSample.y = (this.currentRow*thisSample.h) - (this.currentRow * this.overlapH);
    } else {
        // console.log("Filling: (" + this.currentColumn + ", " + this.currentRow + ")");
        thisSample   = this.getRandomImageSample();
        thisSample.x = (this.currentColumn*thisSample.w) - (this.currentColumn * this.overlapW);
        thisSample.y = (this.currentRow*thisSample.h)    - (this.currentRow * this.overlapH);
    }

    // console.log("    (" + thisSample.x + ", " + thisSample.y + ")");

    // Increment our position, working across columns then down rows
    if (this.currentColumn == this.columns - 1) {
        this.currentColumn = 0;
        this.currentRow += 1;
    } else {
        this.currentColumn += 1;
    }

    // Check if we're finished (the row number will be too high)
    if (this.currentRow == this.rows) {
        this.completed = true;
        console.log("Quilting complete.");
    }
    return thisSample;
}


// TESTING
ImageQuilter.prototype.getTestSample = function(){
    var testSample = this.sampleMaker.makeSample(this.sourceImages[0]);
    return testSample;
}



// Classes below here are required for the ImageQuilter
function ImageSample(theImage){
    this.image = theImage; // Assumption is this will be a p5.Image object.
    this.w     = this.image.width;
    this.h     = this.image.height;
    this.x     = 0;
    this.y     = 0;
}




// This class makes ImageSample objects. 
function ImageSampleMaker(sampleW, sampleH){
    this.w = sampleW;
    this.h = sampleH;
}
ImageSampleMaker.prototype.makeSample = function(sourceImage){
    // Assumption is sourceImage will be a p5.Image object.
    var xMax    = sourceImage.width  - this.w;
    var yMax    = sourceImage.height - this.h;
    var sampleX = parseInt(random(0, xMax));
    var sampleY = parseInt(random(0, yMax));
    img         = sourceImage.get(sampleX, sampleY, this.w, this.h);
    sample      = new ImageSample(img);

    return sample;
}




function ImageOverlapGraph(){

}

function ImageOverlapNode(){

}

function ImageOverlapPathfinder(){

}