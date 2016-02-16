// Quilts an image based on samples from one or more sources.

function ImageQuilter(sourceImagesArray, sampleW, sampleH){
    this.imageSamples = sourceImagesArray;
    this.sampleMaker  = new ImageSampleMaker(sampleW, sampleH);
}

ImageQuilter.prototype.getTestSample = function(){
    var testSample = this.sampleMaker.makeSample(this.imageSamples[0]);
    return testSample;
}



// Classes below here are required for the ImageQuilter
function ImageSample(){
    this.image = null; // Assumption is this will be a p5.Image object.
    w = 0;
    h = 0;

}




function ImageSampleMaker(sampleW, sampleH){
    w = sampleW;
    h = sampleH;
}

ImageSampleMaker.prototype.makeSample = function(sourceImage){
    // Assumption is sourceImage will be a p5.Image object.
    var xMax = sourceImage.width  - w;
    var yMax = sourceImage.height - h;

    var sampleX = random(0, xMax);
    var sampleY = random(0, yMax);

    this.image = sourceImage.get(sampleX, sampleY, w, h);

    return this.image;
}




function ImageOverlapGraph(){

}

function ImageOverlapNode(){

}

function ImageOverlapPathfinder(){

}