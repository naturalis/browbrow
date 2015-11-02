var UI = function() {

    // configure the evolver canvas
    var evolverCanvas = document.getElementById('evolver');
    this.ctx = evolverCanvas.getContext("2d");
    this.ctx.canvas.width  = window.innerWidth;
    this.ctx.canvas.height = window.innerHeight;
    this.ctx.translate(0.5, 0.5);
    console.log("Configured evolver canvas context");

    // configure the heatmap canvas
    var heatmapCanvas = document.getElementById('heatmap');
    this.configHeatmap(heatmapCanvas,evolverCanvas);
    console.log("Configured heatmap canvas context");

    // configure the svg
    this.svgns = "http://www.w3.org/2000/svg";
    this.svg = document.createElementNS(this.svgns, "svg");
    document.getElementById('controls').appendChild(this.svg);
    console.log("Instantiated SVG");

    // syntax sugar to make input values increment with arrow keys
    document.onkeydown = this.incrementor;
    console.log("Added in-/decrement syntax sugar");
};

UI.prototype.configHeatmap = function (canvas,surface) {
    var heatmap = createWebGLHeatmap({canvas: canvas, intensityToAlpha:true});
    document.body.appendChild(heatmap.canvas);

    // callback to paint heatmap peaks
    var paintAtCoord = function(x, y){
        var count = 0;
        while(count < 200){
            var xoff = Math.random()*2-1;
            var yoff = Math.random()*2-1;
            var l = xoff*xoff + yoff*yoff;
            if(l > 1){
                continue;
            }
            var ls = Math.sqrt(l);
            xoff/=ls; yoff/=ls;
            xoff*=1-l; yoff*=1-l;
            count += 1;
            heatmap.addPoint(x+xoff*50, y+yoff*50, 30, 2/300);
        }
    };

    // event handling
    var onTouchMove = function(evt){
        evt.preventDefault();
        var touches = evt.changedTouches;
        for(var i=0; i<touches.length; i++){
            var touch = touches[i];
            paintAtCoord(touch.pageX, touch.pageY);
        }
    };
    surface.addEventListener("touchmove", onTouchMove, false);
    surface.onmousemove = function(event){
        var x = event.offsetX || event.clientX;
        var y = event.offsetY || event.clientY;
        paintAtCoord(x, y);
    };
    surface.onclick = function(){
        heatmap.clear();
    };

    // vendor prefix handling
    var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    var update = function(){
        //heatmap.addPoint(100, 100, 100, 10/255);
        heatmap.adjustSize(); // can be commented out for statically sized heatmaps, resize clears the map
        heatmap.update(); // adds the buffered points
        heatmap.display(); // adds the buffered points
        //heatmap.multiply(0.9995);
        //heatmap.blur();
        //heatmap.clamp(0.0, 1.0); // depending on usecase you might want to clamp it
        raf(update);
    };
    raf(update);
};

UI.prototype.incrementor = function (e) {

    // find the input element that is focused, if any
    var inputs = document.getElementsByTagName('input');
    var focusInput;
    for ( var i = 0; i < inputs.length; i++ ) {
        if ( inputs[i] === document.activeElement ) {
            focusInput = inputs[i];
        }
    }

    // proceed if any is focused
    if ( focusInput ) {
        var increment;
        var decimals;
        if ( focusInput.className === 'tenths' ) {
            increment = 0.01;
            decimals = 2;
        }
        else {
            increment = 0.001;
            decimals = 3;
        }
        var val = parseFloat(focusInput.value);

        // arrow up is pressed
        if ( e.keyCode == '38' ) {
            if ( focusInput.value < 1 ) {
                focusInput.value = ( val + increment ).toFixed(decimals);
            }
        }

        // arrow down is pressed
        else if ( e.keyCode == '40' ) {
            if ( focusInput.value > 0 ) {
                focusInput.value = ( val - increment ).toFixed(decimals);
            }
        }
    }
};

UI.prototype.fade = function() {
    var imgData = this.ctx.getImageData(0,0,window.innerWidth,window.innerHeight);
    var pix = imgData.data;
    for ( var i = 0; i < pix.length; i += 4 ) {
        pix[i+3] *= 0.9;
    }
    this.ctx.putImageData(imgData,0,0);
};

UI.prototype.getParam = function(id) {
    return document.getElementById(id).value
};

UI.prototype.drawTree = function(node,depth) {

    // make local reference of SVG,
    // for correct scoping in closure
    var svg = this.svg;
    var svgns = this.svgns;

    // clear the current tree
    var lines = svg.getElementsByTagName('line');
    for ( var i = 0; i < lines.length; i++ ) {
        svg.removeChild(lines[i]);
    }

    // dimensions to divide up
    var width  = svg.clientWidth;
    var height = svg.clientHeight;

    // calculate seen leaves in pre- and post-order
    var map = {};
    var leaves = 0;
    node.traverse(

        // pre-order
        function(node){
            map[node.id] = { pre: leaves };
            if ( node.isLeaf() ) {
                leaves++;
            }
        },

        // post-order
        function(node){
            map[node.id].post = leaves;
        }
    );

    // distance between leaves
    var dist = height / leaves;

    // do the drawing
    node.traverse(function(node) {
        var id = node.id;
        map[id].x = width * node.gen / depth;
        map[id].y = ( map[id].post - map[id].pre ) / 2 * dist + map[id].pre * dist;
        if ( node.parent ) {
            var pid = node.parent.id;
            if ( map[pid] ) {

                // draw horizontal
                var hline = document.createElementNS(svgns, 'line');
                hline.setAttributeNS(null,'x1',Math.floor(map[id].x));
                hline.setAttributeNS(null,'y1',Math.floor(map[id].y));
                hline.setAttributeNS(null,'x2',Math.floor(map[pid].x));
                hline.setAttributeNS(null,'y2',Math.floor(map[id].y));
                hline.setAttributeNS(null,'stroke',node.getRGB());
                hline.setAttributeNS(null,'stroke-linecap','round');
                hline.setAttributeNS(null,'stroke-width','3');
                svg.appendChild(hline);

                // draw vertical
                var vline = document.createElementNS(svgns, 'line');
                vline.setAttributeNS(null,'x1',Math.floor(map[pid].x));
                vline.setAttributeNS(null,'y1',Math.floor(map[id].y));
                vline.setAttributeNS(null,'x2',Math.floor(map[pid].x));
                vline.setAttributeNS(null,'y2',Math.floor(map[pid].y));
                vline.setAttributeNS(null,'stroke',node.parent.getRGB());
                vline.setAttributeNS(null,'stroke-linecap','round');
                vline.setAttributeNS(null,'stroke-width','3');
                svg.appendChild(vline);
            }
            else {
                console.log(pid);
            }
        }
    });
};

UI.prototype.drawLineage = function(l) {
    this.ctx.beginPath();
    this.ctx.arc( l.pos[0], l.pos[1], l.radius, 0, 2 * Math.PI, false );
    this.ctx.fillStyle = l.getRGB();
    this.ctx.fill();
    this.ctx.lineWidth = 0.1;
    this.ctx.strokeStyle = '#000000';
    this.ctx.stroke();
};