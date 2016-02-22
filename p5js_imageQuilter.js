// Quilts an image based on samples from one or more sources.
var testNode;

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
        sampIndex = parseInt(random(0,this.sourceImages.length - 0.01)); // -0.01 to prevent a bug with random hitting a number out of range
        samp      = this.sampleMaker.makeSample(this.sourceImages[sampIndex]);
        this.imageSamples.push(samp);
    }
}
ImageQuilter.prototype.getRandomImageSample = function(){
    x = parseInt(random(0, this.imageSamples.length - 1))
    return this.imageSamples[x];
}
ImageQuilter.prototype.nextQuiltingSample = function(){
    var thisSample, canvasSample;

    // These are the cases for the different quilting positions
    if (this.currentRow == 0 && this.currentColumn == 0) {
        // Unmodified sample for upper left corner
        thisSample   = this.getRandomImageSample();

    } else if (this.currentRow == 0) {
        thisSample   = this.getRandomImageSample();
        thisSample.y = 0;
        thisSample.x = (this.currentColumn*thisSample.w) - (this.currentColumn * this.overlapW);
        canvasSample = new ImageSample(get(thisSample.x - this.overlapW, thisSample.y,this.overlapW,thisSample.h));
        thisSample   = this.findLeftSeamFor(thisSample,canvasSample);

    } else if (this.currentColumn == 0) {
        thisSample   = this.getRandomImageSample();
        thisSample.x = 0;
        thisSample.y = (this.currentRow*thisSample.h) - (this.currentRow * this.overlapH);
        canvasSample = new ImageSample(get(thisSample.x, thisSample.y - this.overlapH,thisSample.w,this.overlapH));
        thisSample   = this.findTopSeamFor(thisSample,canvasSample);

    } else {
        thisSample   = this.getRandomImageSample();
        thisSample.x = (this.currentColumn*thisSample.w) - (this.currentColumn * this.overlapW);
        thisSample.y = (this.currentRow*thisSample.h)    - (this.currentRow * this.overlapH);
        canvasSample = new ImageSample(get(thisSample.x - this.overlapW, thisSample.y - this.overlapH,thisSample.w,thisSample.h));
        thisSample   = this.findCompleteSeamFor(thisSample,canvasSample);
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
    }

    return thisSample;
};
ImageQuilter.prototype.findLeftSeamFor = function(sample, canvasSample){
    // This handles the top row only.

    var graphData = [];

    for (var y = 0; y < this.sampleH; y++) {
        var thisRow = [];
        for (var x = 0; x < this.overlapW; x++) {
            var p1 = sample.get(x,y);
            var p2 = canvasSample.get(x,y); // 
            var n  = new ImageOverlapNode(p1,p2);
            thisRow.push(n);
        }
        graphData.push(thisRow);
    }

    var seam = new ImageOverlapGraph(graphData);

    

    return sample;
};
ImageQuilter.prototype.findTopSeamFor = function(sample, canvasSample){
    return sample;
};
ImageQuilter.prototype.findCompleteSeamFor = function(sample, canvasSample){
    return sample;
};

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

    // The position of the upper left corner
    this.x     = 0;
    this.y     = 0;
    this.image.loadPixels();
}
ImageSample.prototype.get = function(x,y) {
    return this.image.get(x,y);
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




function ImageOverlapGraph(data){
    this.graphData = data; // nested array of ImageOverlapNodes
    // TODO make an alternate constructor for dummy nodes
    this.startNode         = new ImageOverlapNode([0,0,0,0],[0,0,0,0]);
    this.goalNode          = new ImageOverlapNode([0,0,0,0],[0,0,0,0]);
    this.startNode.isStart = true;
    this.startNode.relX    = -1;
    this.startNode.relY    = -1;
    this.goalNode.isGoal   = true;
    this.goalNode.relX     = 999;
    this.goalNode.relY     = 999;

    // Tree structure from the start node
    //            n       start node
    //          / | \
    //        n   n   n   nodes
    //        | X | X |
    //        1   2   3   ...
    //        | X | X |
    //        n   n   n   ...
    //         \  |  /
    //            n       goal node

    // Deal with the start node neighbors: y=0 row in the graph
    for (var x = 0; x < this.graphData[0].length; x++) {
        this.startNode.neighbors.push(this.graphData[0][x]);
    }

    // Deal with all of the nested nodes except the last row
    for (var y = 0; y < this.graphData.length - 1; y++) {
        for (var x = 0; x < this.graphData[y].length; x++) {
            node = this.graphData[y][x];
            node.relX = x;
            node.relY = y;

            if (x > 0) {
                node.neighbors.push(this.graphData[y+1][x-1]);
            }

            var rowLength = this.graphData[y].length;
            if (x < (rowLength - 1)) {
                node.neighbors.push(this.graphData[y+1][x+1]);
            } 

            node.neighbors.push(this.graphData[y+1][x]);
        }
    }

    var lastY = this.graphData.length - 1;
    // Deal with the last full set of nodes before the goal
    for (var x = 0; x < this.graphData[lastY].length; x++) {
        node = this.graphData[lastY][x];
        node.relX = x;
        node.relY = lastY;
        node.neighbors.push(this.goalNode);
    }

    // Now we have the best path in relative pixel coordinates.
    this.bestpath = this.shortestPath();
    
    return this.bestpath;

}
ImageOverlapGraph.prototype.shortestPath = function(){
    // Use this for a HashMap: https://github.com/flesler/hashmap

    // At this point we have a complete graph
    // Use Dijkstra's Algorithm - maybe A* in the future.
    // http://www.redblobgames.com/pathfinding/a-star/introduction.html
    var frontier = new PriorityQueue({ comparator: function(a, b) { return a.cost - b.cost; }}); // Correct?
    frontier.queue(this.startNode);

    var came_from   = new HashMap();
    came_from.set(this.startNode,"start"); 

    var cost_so_far = new HashMap();

    cost_so_far.set(this.startNode,0);

    while (frontier.length > 0) {
        current = frontier.dequeue();
        if (current.isGoal) {
            break;
        } 
        for (var i = 0; i < current.neighbors.length; i++) {
            next = current.neighbors[i];
            new_cost = cost_so_far.get(current) + next.cost;
            if (!cost_so_far.has(next) || new_cost < cost_so_far.get(next)) {
                cost_so_far.set(next,new_cost);
                next.cost = new_cost;
                frontier.queue(next);
                came_from.set(next,current);
            }
        }
    }

    // The seam is stored in came_from by using goalNode as the key
    // and getting the node returned as the value for where it came from.
    var working = true;
    current = this.goalNode;

    var path = [];

    while(true){
        if (!current.isGoal && !current.isStart) {
            coords = [current.relX,current.relY];
            path.push(coords);
        }       
        // console.log(s + ", " + cost_so_far.get(current));
        if (current.isStart) {
            working = false;
            break;
        }
        current = came_from.get(current);
    }
    return path;
}


function ImageOverlapNode(pixelOne, pixelTwo){
    this.isStart   = false;
    this.isGoal    = false;
    this.cost      = 0;
    this.neighbors = [];
    // this.cameFrom  = null; // If null, then we are at the starting node.

    // When this is set to true, then we will retain this on the seam. 
    // False means we will show the underlying pixel from the canvas.
    this.keep     = false;
    this.pixelOne = pixelOne;
    this.pixelTwo = pixelTwo;

    // TODO: Don't ignore transparency
    for (var i = 0; i < 3; i++) {
        this.cost += Math.abs(this.pixelOne[i] - this.pixelTwo[i]);
    }
}
ImageOverlapNode.prototype.testDesc = function(){
    return "(x,y): " + this.relX + ", " + this.relY;
}

function ImageOverlapPathfinder(){

}