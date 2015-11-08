var UI = function() {

    // configure the evolver canvas
    var evolverCanvas = document.getElementById('evolver');
    this.evoCtx = evolverCanvas.getContext("2d");
    evolverCanvas.width  = window.innerWidth;
    evolverCanvas.height = window.innerHeight;
    this.evoCtx.translate(0.5, 0.5);
    console.log("Configured evolver canvas context");

    // configure the fitness landscape canvas
    var self = this;
    var landscapeCanvas = document.getElementById('landscape');
    this.landscapeCtx = landscapeCanvas.getContext("2d");
    landscapeCanvas.width  = window.innerWidth;
    landscapeCanvas.height = window.innerHeight;
    evolverCanvas.addEventListener("mousemove", function (e) {self.findxy('move',e)}, false);
    evolverCanvas.addEventListener("mousedown", function (e) {self.findxy('down',e)}, false);
    evolverCanvas.addEventListener("mouseup", function (e) {self.findxy('up',e)}, false);
    evolverCanvas.addEventListener("mouseout", function (e) {self.findxy('out', e)}, false);
    this.flag = false;
    this.currX = 0, this.currY = 0;
    this.blobRadius = 20;

    // configure the svg
    this.svgns = "http://www.w3.org/2000/svg";
    this.svg = document.createElementNS(this.svgns, "svg");
    document.getElementById('controls').appendChild(this.svg);
    console.log("Instantiated SVG");

    // syntax sugar to make input values increment with arrow keys
    //document.onkeydown = this.incrementor;
    console.log("Added in-/decrement syntax sugar");
    var inputs = $('input');
    for ( var i = 0; i < inputs.length; i++ ) {
    	var increments = inputs[i].className === 'tenths' ? 0.01 : 0.001;
    	inputs[i].tagName = 'div';
    	$(inputs[i]).slider({
    		min: 0,
    		max: 1,
    		step: increments
    	});
    }
};

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
 UI.prototype.hslToRgb = function (h, s, l){
    var r, g, b;
    if (s == 0 ) {
        r = g = b = l; // achromatic
    }
    else {
        var hue2rgb = function (p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
};

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
 UI.prototype.rgbToHsl = function (r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if ( max == min ) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
};

UI.prototype.draw = function () {
    var grd = this.landscapeCtx.createRadialGradient(
        this.currX,
        this.currY,
        0,
        this.currX,
        this.currY,
        this.blobRadius / 2
    );
    grd.addColorStop(0, "rgba(255,150,100,0.05)");
    grd.addColorStop(1, "rgba(255,150,100,0)");
    this.landscapeCtx.beginPath();
    this.landscapeCtx.arc( this.currX, this.currY, this.blobRadius, 0, 2 * Math.PI, false );
    this.landscapeCtx.fillStyle = grd;
    this.landscapeCtx.fill();
};

UI.prototype.findxy = function (res, e) {
    if (res == 'down') {
        this.currX = e.offsetX || e.clientX;
        this.currY = e.offsetY || e.clientY;
        this.flag = true;
    }
    if (res == 'up' || res == "out") {
        this.flag = false;
        this.blobRadius = 20;
    }
    if (res == 'move') {
        this.currX = e.offsetX || e.clientX;
        this.currY = e.offsetY || e.clientY;
        if (this.flag) {
            if ( this.blobRadius < 160 )
                this.blobRadius += 1;
            this.draw();
    	    var imgData = this.landscapeCtx.getImageData(0,0,window.innerWidth,window.innerHeight);
			this.pixels = imgData.data;            
        }
    }
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
    var imgData = this.evoCtx.getImageData(0,0,window.innerWidth,window.innerHeight);
    var pix = imgData.data;
    for ( var i = 0; i < pix.length; i += 4 ) {
        pix[i+3] *= 0.9;
    }
    this.evoCtx.putImageData(imgData,0,0);
};

UI.prototype.getParam = function(id) {
    //return document.getElementById(id).value
    return $('#'+id).slider('value');
};

UI.prototype.getFitness = function(x,y) {
	if ( this.pixels ) {
		var index = x * y * 4 + 3;  
		var fitness = this.pixels[index]/255;      
    	return fitness;
    }
    else {
    	return 0;
    }
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
    this.evoCtx.beginPath();
    this.evoCtx.arc( l.pos[0], l.pos[1], l.radius, 0, 2 * Math.PI, false );
    this.evoCtx.fillStyle = l.getRGB();
    this.evoCtx.fill();
    this.evoCtx.lineWidth = 0.1;
    this.evoCtx.strokeStyle = '#000000';
    this.evoCtx.stroke();
};
