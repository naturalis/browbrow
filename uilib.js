var UI = function() {

    // configure the evolver canvas
    var evolverCanvas = document.getElementById('evolver');
    this.evoCtx = evolverCanvas.getContext("2d");
    evolverCanvas.width  = window.innerWidth;
    evolverCanvas.height = window.innerHeight;
    this.evoCtx.translate(0.5, 0.5);
    console.log("Configured evolver canvas context");

    // configure the svg
    this.svgns = "http://www.w3.org/2000/svg";
    this.svg = document.getElementById("svg");
    console.log("Instantiated SVG");

    // turn text inputs into sliders
    console.log("Added in-/decrement syntax sugar");
    var inputs = $('input');
    for ( var i = 0; i < inputs.length; i++ ) {
    	var increments = inputs[i].className === 'tenths' ? 0.01 : 0.001;
    	if ( inputs[i].className === 'ones' ) 
	    	increments = 1;
    	var id  = inputs[i].id;
    	var min = parseFloat($(inputs[i]).attr('min'));
    	var max = parseFloat($(inputs[i]).attr('max'));
    	$(inputs[i]).replaceWith('<div id="'+id+'">');
    	$('#'+id).slider({
    		min: min,
    		max: max,
    		step: increments
    	});
    }
    
    // add callbacks to landscape sliders
    var lsc = [ '#patchiness', '#habitatColors' ];
    var landscapeCanvas = document.getElementById('landscape');
    var self = this;
    landscapeCanvas.width  = window.innerWidth;
    landscapeCanvas.height = window.innerHeight;    
    var ctx = landscapeCanvas.getContext("2d");
    for ( var i = 0; i < 2; i++ ) {
    	$(lsc[i]).on("slidechange",function(event,ui){
    		self.drawLandscape(landscapeCanvas,ctx);
    		self.colorLandscape(landscapeCanvas,ctx);
    	});
    }
    
    // collect all controls in an accordion
    $("#controls").accordion({ collapsible: true, active: false });
};

UI.prototype.drawLandscape = function(canvas,ctx){
	var image = ctx.createImageData(canvas.width, canvas.height);
	var data = image.data;
	noise.seed(Math.random());
	var scale = this.getParam('patchiness');
	for ( var x = 0; x < canvas.width; x++ ) {
		for ( var y = 0; y < canvas.height; y++ ) {
			var value = Math.abs(noise.simplex2(x / scale, y / scale));
			value *= 256;
			var cell = (x + y * canvas.width) * 4;
			data[cell + 0] = data[cell + 1] = data[cell + 2] = value;
			data[cell + 3] = 255; // alpha.			
		}
	}	
	ctx.fillColor = 'black';
	ctx.fillRect(0, 0, 100, 100);
	ctx.putImageData(image, 0, 0);
};

UI.prototype.colorLandscape = function(canvas,ctx){

};

UI.prototype.colorArea = function(canvas,ctx,startX,startY,rgb){

    // adapted from http://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
    var colorLayer = ctx.getImageData(0,0,canvasWidth,canvasHeight);
    var drawingBoundTop = 0;
	var pixelStack = [[startX, startY]];
	while(pixelStack.length) {
		var newPos, x, y, pixelPos, reachLeft, reachRight;
		newPos = pixelStack.pop();
		x = newPos[0];
		y = newPos[1];
  		pixelPos = (y*canvasWidth + x) * 4;
		while( y-- >= drawingBoundTop && matchStartColor(pixelPos) ) {
			pixelPos -= canvasWidth * 4;
		}
		pixelPos += canvasWidth * 4;
		++y;
		reachLeft = false;
		reachRight = false;
		while( y++ < canvasHeight - 1 && matchStartColor(pixelPos) ){
			colorPixel(pixelPos);
			if( x > 0 ) {
				if( matchStartColor(pixelPos - 4) ) {
					if( !reachLeft ) {
						pixelStack.push( [ x - 1, y ] );
						reachLeft = true;
					}
				}
				else if(reachLeft) {
					reachLeft = false;
				}
			}	
			if( x < canvasWidth - 1 ) {
				if( matchStartColor( pixelPos + 4 ) ) {
					if( !reachRight ) {
						pixelStack.push([x + 1, y]);
						reachRight = true;
					}
				}
				else if(reachRight) {
					reachRight = false;
				}
			}			
			pixelPos += canvasWidth * 4;
		}
	}
	ctx.putImageData(colorLayer, 0, 0);
  
	function matchStartColor(pixelPos) {
		var r = colorLayer.data[pixelPos+0];
		var g = colorLayer.data[pixelPos+1];	
		var b = colorLayer.data[pixelPos+2];
        return (r == 0 && g == 0 && b == 0);
		//return (r == startR && g == startG && b == startB);
	}

	function colorPixel(pixelPos) {
		colorLayer.data[pixelPos+0] = rgb[0];
		colorLayer.data[pixelPos+1] = rgb[1];
		colorLayer.data[pixelPos+2] = rgb[2];
		colorLayer.data[pixelPos+3] = 255;
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

UI.prototype.fade = function() {
    var imgData = this.evoCtx.getImageData(0,0,window.innerWidth,window.innerHeight);
    var pix = imgData.data;
    for ( var i = 0; i < pix.length; i += 4 ) {
        pix[i+3] *= 0.9;
    }
    this.evoCtx.putImageData(imgData,0,0);
};

UI.prototype.getParam = function(id) {
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
