// Quilts an image based on samples from one or more sources.
var testNode, testErrors, testErrorsMin, testErrorsMax, testRequiltCount;

function ImageQuilter(sourceImagesArray, sampleW, sampleH, overlapPercent,widthToQuilt,heightToQuilt, debugMode){
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
    this.maxErrorPercent = 3;
    this.debug           = debugMode;
    this.allowedDepth    = 10;

    // TODO: Remove
    testErrors       = [];
    this.testErrorsMin    = 999;
    this.testErrorsMax    = -999;
    this.testRequiltCount = 0;

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
        thisSample.adjustError();
        canvasSample = new ImageSample(get(thisSample.x - this.overlapW, thisSample.y,this.overlapW,thisSample.h));
        thisSample   = this.findLeftSeamFor(thisSample,canvasSample, this.maxErrorPercent, 0);

    } else if (this.currentColumn == 0) {
        thisSample.x = 0;
        thisSample.y = (this.currentRow*thisSample.h) - (this.currentRow * this.overlapH);
        thisSample.adjustError();
        canvasSample = new ImageSample(get(thisSample.x, thisSample.y - this.overlapH,thisSample.w,this.overlapH));
        thisSample   = this.findTopSeamFor(thisSample,canvasSample, this.maxErrorPercent, 0);

    } else {
        thisSample.x = (this.currentColumn*thisSample.w) - (this.currentColumn * this.overlapW);
        thisSample.y = (this.currentRow*thisSample.h)    - (this.currentRow * this.overlapH);
        thisSample.adjustError();
        canvasSample = new ImageSample(get(thisSample.x - this.overlapW, thisSample.y - this.overlapH,thisSample.w,thisSample.h));
        thisSample   = this.findCompleteSeamFor(thisSample,canvasSample, this.maxErrorPercent, 0);
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
        // Remove
        for (var i = 0; i < testErrors.length; i++){
            this.testErrorsMax = testErrors[i] > this.testErrorsMax ? testErrors[i] : this.testErrorsMax;
            this.testErrorsMin = testErrors[i] < this.testErrorsMin ? testErrors[i] : this.testErrorsMin;
        }
        console.log("testErrorsMin: " + this.testErrorsMin + ", testErrorsMax: " + this.testErrorsMax + ", testRequiltCount: " + this.testRequiltCount);
    }

    return thisSample;
};
ImageQuilter.prototype.findLeftSeamFor = function(sample, canvasSample, errPercentAllowed, depth){
    // This handles the top row only.
    // depth is for managing recursion that can be too deep.

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

    var graph = new ImageOverlapGraph(graphData,"left", this.overlapH, this.overlapW);
    var seam  = graph.findSeam();

    var adjustedError = graph.errorPercentage;
    if (this.currentColumn == this.columns - 1) {
        adjustedError = adjustedError * sample.dangleRightErrorMultiplier;
    } 
    
    // Try another sample if the error is too high. 
    if (depth < this.allowedDepth){
        if (adjustedError > errPercentAllowed) {
            sampIndex = parseInt(random(0,this.sourceImages.length - 0.01));
            newsample = this.sampleMaker.makeSample(this.sourceImages[sampIndex]);
            newsample.y = (this.currentRow*newsample.h)   - (this.currentRow * this.overlapH);
            newsample.x = (this.currentColumn*newsample.w) - (this.currentColumn * this.overlapW);
            newsample.adjustError();
            newErrorPercentAllowed = errPercentAllowed + 0.5;
            this.testRequiltCount += 1;
            return this.findLeftSeamFor(newsample, canvasSample, newErrorPercentAllowed, depth + 1);
        }
    }

    for (var i = 0; i < seam.length; i++) {
        var x = seam[i][0];
        var y = seam[i][1];
        for (var p = 0; p < x; p++) {
            // Set the pixel transparent
            if (this.debug) {
                sample.image.set(p,y,color(0,0,255,150));
            } else {
                sample.image.set(p,y,color(0,0,255,0));
            }
        }
    }
    sample.image.updatePixels();

    return sample;
};
ImageQuilter.prototype.findTopSeamFor = function(sample, canvasSample, errPercentAllowed, depth){
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

    var graph = new ImageOverlapGraph(graphData,"top", this.overlapH, this.overlapW);
    var seam  = graph.findSeam();

        // TODO: Fix the last row; some pixels are off screen so the error is higher.
    if (depth < this.allowedDepth){
        if (graph.errorPercentage > errPercentAllowed) {
            sampIndex = parseInt(random(0,this.sourceImages.length - 0.01));
            newsample = this.sampleMaker.makeSample(this.sourceImages[sampIndex]);
            newsample.y = (this.currentRow*newsample.h)   - (this.currentRow * this.overlapH);
            newsample.x = (this.currentColumn*newsample.w) - (this.currentColumn * this.overlapW);
            newsample.adjustError();
            newErrorPercentAllowed = errPercentAllowed + 0.5;
            this.testRequiltCount += 1;
            return this.findTopSeamFor(newsample, canvasSample, newErrorPercentAllowed, depth + 1);
        }
    }

    for (var i = 0; i < seam.length; i++) {
        var x = seam[i][0];
        var y = seam[i][1];
        for (var p = 0; p < y; p++) {
            // Set the pixel transparent
            if (this.debug) {
                sample.image.set(x,p,color(255,0,0,150));   
            } else {
                sample.image.set(x,p,color(255,0,0,0));
            }
        }
    }
    sample.image.updatePixels();

    return sample;
};
ImageQuilter.prototype.findCompleteSeamFor = function(sample, canvasSample, errPercentAllowed, depth){
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

    var graph = new ImageOverlapGraph(graphData,"complete", this.overlapH, this.overlapW);
    var seam  = graph.findSeam();

    var adjustedError = graph.errorPercentage;
    if (this.currentColumn == this.columns - 1) {
        adjustedError = adjustedError * sample.dangleRightErrorMultiplier;
        // TODO: Adjust the errPercentAllowed?
    }
    if (this.currentRow == this.rows - 1) {
        adjustedError = adjustedError * sample.dangleBottomErrorMultiplier;
    }

    // Skip error checking and put something in place if we are beyond allowed depth.
    if (depth < this.allowedDepth){
        if (adjustedError > errPercentAllowed) {
            sampIndex = parseInt(random(0,this.sourceImages.length - 0.01));
            newsample = this.sampleMaker.makeSample(this.sourceImages[sampIndex]);
            newsample.y = (this.currentRow*newsample.h)   - (this.currentRow * this.overlapH);
            newsample.x = (this.currentColumn*newsample.w) - (this.currentColumn * this.overlapW);
            newsample.adjustError();
            newErrorPercentAllowed = errPercentAllowed + 0.5;
            this.testRequiltCount += 1;
            return this.findCompleteSeamFor(newsample, canvasSample, newErrorPercentAllowed, depth + 1);
        }
    } else {
        console.log("exceeded max depth for complete seam finding.")
    }


    // Replace pixels with transparent color
    for (var i = 0; i < seam.length; i++){
        var x = seam[i][0];
        var y = seam[i][1];

        // The left side
        if (y >= this.overlapH) {
            for (var p = 0; p < x; p++){
                if (this.debug) {
                    sample.image.set(p,y,color(255,0,255,150));
                } else {
                    sample.image.set(p,y,color(255,0,255,0));
                }
            }
        } 

        // The top
        if (x >= this.overlapW) {
            for (var p = 0; p < y; p++){
                if (this.debug) {
                    sample.image.set(x,p,color(255,0,255,150));
                } else {
                    sample.image.set(x,p,color(255,0,255,0));
                }
            }
        }

        // The corner - improve detection here. Paths might be funkier
        if (x <= this.overlapW && y <= this.overlapH) {
            for (var px = 0; px < x; px++){
                for (var py = 0; py < y; py++) {
                    if (this.debug) {
                        sample.image.set(px,py,color(255,0,255,150));
                    } else {
                        sample.image.set(px,py,color(255,0,255,0));
                    }
                }
            }
        }
    }
    sample.image.updatePixels();
    return sample;
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

    // These reduce the graph error value when the samples hang off of the canvas.
    this.dangleRightErrorMultiplier  = 1;
    this.dangleBottomErrorMultiplier = 1;
}
ImageSample.prototype.get = function(x,y) {
    return this.image.get(x,y);
}
ImageSample.prototype.adjustError = function (){
    if (this.x + this.w > width) {
        var percent = (this.w - (this.x + this.w - width)) / this.w;
        this.dangleRightErrorMultiplier = percent;
    }

    if (this.y + this.h > height) {
        var percent = (this.h - (this.y + this.h - height)) / this.h;
        this.dangleBottomErrorMultiplier = percent;
    }
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




function ImageOverlapGraph(data, leftTopComplete, overlapH, overlapW){
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
    this.overlapH          = overlapH;
    this.overlapW          = overlapW;
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
        // Deal with the bottom row of nodes on the lower-left: the start
        lastrow = this.graphData.length - 1;
        nodesInLastRow = this.graphData[lastrow].length;
        for (var x = 0; x < nodesInLastRow; x++) {
            this.startNode.neighbors.push(this.graphData[lastrow][x]);
        }

        // Deal with the nested nodes on the left
        for (var y = this.overlapH; y < this.graphData.length; y++) {
            // graphData[y].length below instead of this.overlapH?
            for (var x = 0; x < this.overlapH; x++) {
                node      = this.graphData[y][x];
                node.relX = x;
                node.relY = y;

                if (x > 0) {
                    node.neighbors.push(this.graphData[y-1][x-1]);
                }

                var rowLength = this.graphData[y].length;
                if (x < (rowLength - 1)) {
                    node.neighbors.push(this.graphData[y-1][x+1]);
                } 

                node.neighbors.push(this.graphData[y-1][x]);
            }
        }

        // Deal with the overlapping corner nodes in the upper-left
        for (var x = 0; x < this.overlapW; x++) {
            for (var y = 0; y < this.overlapH; y++){
                node = this.graphData[y][x];
                node.relX = x;
                node.relY = y;

                if (y == 0) {
                    // TODO: Add a condition requiring the overlapW and overlapH to be at least 2 each.
                    node.neighbors.push(this.graphData[y][x+1]);
                    node.neighbors.push(this.graphData[y+1][x]);
                    node.neighbors.push(this.graphData[y+1][x+1]);
                    continue;
                }

                if (y == this.overlapH - 1 && y > 0) {
                    node.neighbors.push(this.graphData[y-1][x]);
                    node.neighbors.push(this.graphData[y-1][x+1]);
                    node.neighbors.push(this.graphData[y][x+1]);
                    if (x > 0) {
                        node.neighbors.push(this.graphData[y-1][x-1]);
                    }
                    continue;
                }

                if (x == this.overlapW - 1 && y > 0) {
                    if (y < this.overlapH - 1) {
                        node.neighbors.push(this.graphData[y+1][x+1]);
                    }
                    node.neighbors.push(this.graphData[y-1][x+1]);
                    node.neighbors.push(this.graphData[y][x+1]);
                    continue;
                }

                if (x == 0 && y > 0 && y < this.overlapH - 1){
                    node.neighbors.push(this.graphData[y-1][x+1]);
                    node.neighbors.push(this.graphData[y][x+1]);
                    node.neighbors.push(this.graphData[y+1][x+1]);
                    continue;
                }

                // Filling in the middle nodes
                if (x > 0 && y > 0 && x < this.overlapW - 1 && y < this.overlapH - 1) {
                    // node.neighbors.push(this.graphData[y-1][x-1]);
                    node.neighbors.push(this.graphData[y-1][x]);
                    node.neighbors.push(this.graphData[y-1][x+1]);
                    node.neighbors.push(this.graphData[y][x+1]);
                    node.neighbors.push(this.graphData[y+1][x+1]);
                    node.neighbors.push(this.graphData[y+1][x]);
                    // node.neighbors.push(this.graphData[y+1][x-1]);
                    // node.neighbors.push(this.graphData[y][x-1]);
                    continue;
                }
            }
        }


        // Deal with the nested nodes on the top
        for (var x = this.overlapW; x < this.graphData[0].length - 1; x++) {
            for (var y = 0; y < this.overlapH; y++) {
                node = this.graphData[y][x];
                node.relX = x;
                node.relY = y;

                if (y > 0) {
                    node.neighbors.push(this.graphData[y-1][x+1]);
                }

                if (y < (this.overlapH - 1)) {
                    node.neighbors.push(this.graphData[y+1][x+1]);
                } 

                node.neighbors.push(this.graphData[y][x+1]);
            }
        }

        // Deal with the final column of nodes at the upper-right: the end
        var lastX = this.graphData[0].length - 1;
        for (var y = 0; y < this.overlapH; y++){
            node = this.graphData[y][lastX];
            node.relX = lastX;
            node.relY = y;
            node.neighbors.push(this.goalNode);
        }
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
    // this.maxErrorValue = path.length * (256*3);
    this.maxErrorValue   = path.length * Math.sqrt(Math.pow(100,2) + Math.pow(255,2) + Math.pow(255,2));
    this.errorPercentage = 100 * (this.errorValue / this.maxErrorValue);
    testErrors.push(this.errorPercentage);

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

    this.pixelOneLAB = this.rgbToLAB(this.pixelOne);
    this.pixelTwoLAB = this.rgbToLAB(this.pixelTwo);

    var sum = 0;
    for (var i = 0; i < 3; i++) {
        sum += Math.pow(this.pixelOneLAB[i] - this.pixelTwoLAB[i],2);
    }
    this.cost = Math.sqrt(sum);
}
ImageOverlapNode.prototype.testDesc = function(){
    return "(x,y): " + this.relX + ", " + this.relY;
}
ImageOverlapNode.prototype.rgbToLAB = function(c){
    // paramenter c in the form [r,g,b]
    // return the LAB color
    // http://stackoverflow.com/questions/15408522/rgb-to-xyz-and-lab-colours-conversion
    // http://www.easyrgb.com/index.php?X=MATH&H=02#text2

    var_RGB = [];
    for (var i = 0; i < 3; i++){
        new_channel = ((c[i]/255)>0.04045) ? Math.pow((((c[i]/255)+0.055)/1.055),2.4)*100 : (c[i]/255)/12.92*100;
        var_RGB.push(new_channel);
    }

    //Observer. = 2°, Illuminant = D65
    x = var_RGB[0] * 0.4124 + var_RGB[1] * 0.3576 + var_RGB[2] * 0.1805
    y = var_RGB[0] * 0.2126 + var_RGB[1] * 0.7152 + var_RGB[2] * 0.0722
    z = var_RGB[0] * 0.0193 + var_RGB[1] * 0.1192 + var_RGB[2] * 0.9505

    // Now convert from XYZ to LAB
    //Observer. = 2°, Illuminant = D65
    var ref_X =  95.047;
    var ref_Y = 100.000;
    var ref_Z = 108.883;

    var_XYZ   = [x/ref_X, y/ref_Y, z/ref_Z];
    mut_XYZ   = [];

    for (var i = 0; i < var_XYZ.length; i++){
        new_val = (var_XYZ[i]>0.008856) ? Math.pow(var_XYZ[i],1/3) : ((7.787*var_XYZ[i]) + (16/116));
        mut_XYZ.push(new_val);
    }

    CIE_L = ( 116 * mut_XYZ[1] ) - 16;
    CIE_a = 500 * ( mut_XYZ[0] - mut_XYZ[1] );
    CIE_b = 200 * ( mut_XYZ[1] - mut_XYZ[2] );

    return [CIE_L, CIE_a, CIE_b];
}

function ImageOverlapPathfinder(){

}