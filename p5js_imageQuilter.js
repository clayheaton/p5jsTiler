// Quilts an image based on samples from one or more sources.
var testNode;

function ImageQuilter(sourceImagesArray, sampleW, sampleH, numSamples, overlapPercent,widthToQuilt,heightToQuilt){
    this.sourceImages    = sourceImagesArray;
    this.imageSamples    = [];
    this.overlapPercent  = overlapPercent;
    this.widthToQuilt    = widthToQuilt;
    this.heightToQuilt   = heightToQuilt;
    this.sampleW         = sampleW;
    this.sampleH         = sampleH;
    this.columns         = 0;
    this.rows            = 0;
    this.currentRow      = 0;
    this.currentColumn   = 0;
    this.completed       = false;
    this.maxErrorPercent = 10;

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

}
ImageQuilter.prototype.getRandomImageSample = function(){
    x = parseInt(random(0, this.imageSamples.length - 1))
    return this.imageSamples[x];
}
ImageQuilter.prototype.nextQuiltingSample = function(){
    var thisSample, canvasSample;

    // Make a sample
    var sampIndex = parseInt(random(0,this.sourceImages.length - 0.01));
    thisSample    = this.sampleMaker.makeSample(this.sourceImages[sampIndex]);

    // These are the cases for the different quilting positions
    if (this.currentRow == 0 && this.currentColumn == 0) {
        // Unmodified sample for upper left corner

    } else if (this.currentRow == 0) {
        thisSample.y = 0;
        thisSample.x = (this.currentColumn*thisSample.w) - (this.currentColumn * this.overlapW);
        canvasSample = new ImageSample(get(thisSample.x - this.overlapW, thisSample.y,this.overlapW,thisSample.h));
        thisSample   = this.findLeftSeamFor(thisSample,canvasSample, this.maxErrorPercent);

    } else if (this.currentColumn == 0) {
        thisSample.x = 0;
        thisSample.y = (this.currentRow*thisSample.h) - (this.currentRow * this.overlapH);
        canvasSample = new ImageSample(get(thisSample.x, thisSample.y - this.overlapH,thisSample.w,this.overlapH));
        thisSample   = this.findTopSeamFor(thisSample,canvasSample, this.maxErrorPercent);

    } else {
        thisSample.x = (this.currentColumn*thisSample.w) - (this.currentColumn * this.overlapW);
        thisSample.y = (this.currentRow*thisSample.h)    - (this.currentRow * this.overlapH);
        canvasSample = new ImageSample(get(thisSample.x - this.overlapW, thisSample.y - this.overlapH,thisSample.w,thisSample.h));

        
        thisSample   = this.findLeftSeamFor(thisSample,canvasSample, this.maxErrorPercent);
        thisSample   = this.findTopSeamFor(thisSample,canvasSample, this.maxErrorPercent);

        // TESTING - REMOVE
        //thisSample   = this.findCompleteSeamFor(thisSample,canvasSample, this.maxErrorPercent);
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
ImageQuilter.prototype.findLeftSeamFor = function(sample, canvasSample, errPercentAllowed){
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

    var graph = new ImageOverlapGraph(graphData,"left");
    var seam  = graph.findSeam();

    // TODO: Fix the last row; some pixels are off screen so the error is higher.
    if (graph.errorPercentage > errPercentAllowed) {
        sampIndex = parseInt(random(0,this.sourceImages.length - 0.01));
        newsample = this.sampleMaker.makeSample(this.sourceImages[sampIndex]);
        newsample.y = (this.currentRow*newsample.h)   - (this.currentRow * this.overlapH);
        newsample.x = (this.currentColumn*newsample.w) - (this.currentColumn * this.overlapW);
        newErrorPercentAllowed = errPercentAllowed + 0.5;
        console.log("LEFT error " + graph.errorPercentage + ". New errPercentAllowed: " + newErrorPercentAllowed);
        // console.log("newsample.x: " + newsample.x + ", newsample.y: " + newsample.y);
        return this.findLeftSeamFor(newsample, canvasSample, newErrorPercentAllowed);
    }

    for (var i = 0; i < seam.length; i++) {
        var x = seam[i][0];
        var y = seam[i][1];
        for (var p = 0; p < x; p++) {
            // Set the pixel transparent
            sample.image.set(p,y,color(0,0,255,150));
        }
    }
    sample.image.updatePixels();

    return sample;
};
ImageQuilter.prototype.findTopSeamFor = function(sample, canvasSample, errPercentAllowed){
    var graphData = [];

    for (var y = 0; y < this.overlapH; y++) {
        var thisRow = [];
        for (var x = 0; x < this.sampleW; x++) {
            var p1 = sample.get(x,y);
            var p2 = canvasSample.get(x,y); // 
            var n  = new ImageOverlapNode(p1,p2);
            thisRow.push(n);
        }
        graphData.push(thisRow);
    }

    var graph = new ImageOverlapGraph(graphData,"top");
    var seam  = graph.findSeam();

        // TODO: Fix the last row; some pixels are off screen so the error is higher.
    if (graph.errorPercentage > errPercentAllowed) {
        sampIndex = parseInt(random(0,this.sourceImages.length - 0.01));
        newsample = this.sampleMaker.makeSample(this.sourceImages[sampIndex]);
        newsample.y = (this.currentRow*newsample.h)   - (this.currentRow * this.overlapH);
        newsample.x = (this.currentColumn*newsample.w) - (this.currentColumn * this.overlapW);
        newErrorPercentAllowed = errPercentAllowed + 0.5;
        console.log("TOP error " + graph.errorPercentage + ". New errPercentAllowed: " + newErrorPercentAllowed);
        // console.log("newsample.x: " + newsample.x + ", newsample.y: " + newsample.y);
        return this.findTopSeamFor(newsample, canvasSample, newErrorPercentAllowed);
    }

    for (var i = 0; i < seam.length; i++) {
        var x = seam[i][0];
        var y = seam[i][1];
        for (var p = 0; p < y; p++) {
            // Set the pixel transparent
            sample.image.set(x,p,color(255,0,0,150));
        }
    }
    sample.image.updatePixels();

    return sample;
};
ImageQuilter.prototype.findCompleteSeamFor = function(sample, canvasSample, errPercentAllowed){
    var graphData = [];

    for (var y = 0; y < this.sampleH; y++){
        var thisRow = [];
        for (var x = 0; x < this.sampleW; x++) {
            if (y < this.overlapH || (y >= this.overlapH && x < this.overlapW)) {
                var p1 = sample.get(x,y);
                var p2 = canvasSample.get(x,y);
                var n  = new ImageOverlapNode(p1,p2);
                thisRow.push(n);
            }
        }
        graphData.push(thisRow);
    }
    console.log("complete seam");
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




function ImageOverlapGraph(data,leftTopComplete){
    this.graphData = data; // nested array of ImageOverlapNodes
    this.whichSeam = leftTopComplete;
    // TODO make an alternate constructor for dummy nodes
    this.startNode         = new ImageOverlapNode([0,0,0,0],[0,0,0,0]);
    this.goalNode          = new ImageOverlapNode([0,0,0,0],[0,0,0,0]);
    this.startNode.isStart = true;
    this.startNode.relX    = -1;
    this.startNode.relY    = -1;
    this.goalNode.isGoal   = true;
    this.goalNode.relX     = 999;
    this.goalNode.relY     = 999;
    this.maxErrorValue     = 0;
    this.errorValue        = 0;
    this.errorPercentage   = 0;
}
ImageOverlapGraph.prototype.findSeam = function(){

    if (this.whichSeam == "left"){
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
    } else if (this.whichSeam == "top"){
        // Deal with the start node neighbors: x=0 column in the graph
        for (var y = 0; y < this.graphData.length; y++) {
            this.startNode.neighbors.push(this.graphData[y][0]);
        }

        // Deal with all of the nested nodes except the last row
        for (var x = 0; x < this.graphData[0].length - 1; x++) {
            for (var y = 0; y < this.graphData.length; y++) {
                node = this.graphData[y][x];
                node.relX = x;
                node.relY = y;

                if (y > 0) {
                    node.neighbors.push(this.graphData[y-1][x+1]);
                }

                if (y < (this.graphData.length - 1)) {
                    node.neighbors.push(this.graphData[y+1][x+1]);
                } 

                node.neighbors.push(this.graphData[y][x+1]);
            }
        }

        var lastX = this.graphData[0].length - 1;
        // Deal with the last full set of nodes before the goal
        for (var y = 0; y < this.graphData.length; y++) {
            node = this.graphData[y][lastX];
            node.relX = lastX;
            node.relY = y;
            node.neighbors.push(this.goalNode);
        }
    } else if (this.whichSeam == "complete") {

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
    this.errorValue = cost_so_far.get(this.goalNode);

    // A bit of a hack, but reasonable.
    this.maxErrorValue = path.length * (256*3);
    this.errorPercentage = 100 * (this.errorValue / this.maxErrorValue);

    // console.log("errorPercentage: " + parseInt(this.errorPercentage * 100));

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