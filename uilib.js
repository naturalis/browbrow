var UI = function() {

    // configure the canvas
    var canvas = document.getElementById('evolver');
    this.ctx = canvas.getContext("2d");
    this.ctx.canvas.width  = window.innerWidth;
    this.ctx.canvas.height = window.innerHeight;
    this.ctx.translate(0.5, 0.5);
    console.log("Configured canvas context");

    // configure the svg
    this.svgns = "http://www.w3.org/2000/svg";
    this.svg = document.createElementNS(this.svgns, "svg");
    document.getElementById('controls').appendChild(this.svg);
    console.log("Instantiated SVG");

    // syntax sugar to make input values increment with arrow keys
    document.onkeydown = this.incrementor;
    console.log("Added in-/decrement syntax sugar");
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
    this.ctx.beginPath();
    this.ctx.rect(0,0,window.innerWidth,window.innerHeight);
    this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
    this.ctx.fill();
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