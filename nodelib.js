// object ID counter
var idCounter = 1;

// simple node object
var Node = function (args) {

    // copy color or instantiate
    if ( args && args.color ) {
        this.color = args.color.slice(0);
    }
    else {
        this.color = [ 128, 128, 128 ];
    }

    // copy radius or instantiate
    if ( args && args.radius ) {
        this.radius = args.radius;
    }
    else {
        this.radius = 10;
    }

    // copy position or instantiate
    if ( args && args.pos ) {
        this.pos = args.pos.slice(0);
    }
    else {
        this.pos = [ window.innerWidth / 2, window.innerHeight / 2 ];
    }

    // copy generation or instantiate
    if ( args && args.gen ) {
        this.gen = args.gen;
    }
    else {
        this.gen = 1;
    }

    // copy children or instantiate
    if ( args && args.children ) {
        this.children = args.children;
    }
    else {
        this.children = [];
    }

    // copy parent
    if ( args && args.parent ) {
        this.parent = args.parent;
    }
    this.id = idCounter++;

    // initialize fitness
    this.fitness = 0;

    console.log("Instantiated node");
};

Node.prototype.updateFitness = function(ui) {
    var pixel = ui.getPixelValue(this.pos[0],this.pos[1]);
    var hslB = ui.rgbToHsl(pixel[0],pixel[1],pixel[2]); // background
    var hslP = ui.rgbToHsl(this.color[0],this.color[1],this.color[2]); // phenotype
    this.fitness = Math.abs(hslB[0]-hslP[0]) + Math.abs(hslB[2]-hslP[2]);
};

Node.prototype.getFitness = function () {
    return this.fitness;
};

Node.prototype.traverse = function(preFunc,postFunc) {
    if ( preFunc ) {
        preFunc(this);
    }
    var children = this.children;
    for ( var i = 0; i < children.length; i++ ) {
        children[i].traverse(preFunc,postFunc);
    }
    if ( postFunc ) {
        postFunc(this);
    }
};

Node.prototype.iterate = function(func) {
    for ( var i = 0; i < this.children.length; i++ ) {
        func(this.children[i]);
    }
};

Node.prototype.getLeaves = function () {
    var leaves = [];
    this.traverse(function(node){
        if ( node.isLeaf() ) {
            leaves.push(node);
        }
    });
    return leaves;
};

Node.prototype.speciate = function(generation) {

    // create first child
    var child1 = new Node(this);
    child1.gen = generation;
    child1.parent = this;

    // create second child
    var child2 = new Node(this);
    child2.gen = generation;
    child2.parent = this;

    // assign children
    this.children = [ child1, child2 ];
    return this.children;
};

Node.prototype.extinguish = function () {

    // only non-root leaves can be extinguished
    if ( this.parent ) {
        var id = this.id;

        // collect the sister species, which must
        // be re-attached to the grandparent
        var otherChild;
        this.parent.iterate(function(node){
            if ( node.id != id ) {
                otherChild = node;
            }
        });

        if ( this.parent.parent ) {
            var pid = this.parent.id;

            // collect the sister of the parent
            var otherSibling;
            this.parent.parent.iterate(function(node){
                if ( node.id != pid ) {
                    otherSibling = node;
                }
            });
            this.parent.parent.children = [ otherChild, otherSibling ];
            otherChild.parent = this.parent.parent;
            otherSibling.parent = this.parent.parent;
            return true;
        }
    }
    return false;
};

Node.prototype.getLength = function () {
    if ( this.parent ) {
        return this.gen - this.parent.gen;
    }
    else {
        return 0;
    }
};

Node.prototype.getRoot = function () {
    if ( this.parent ) {
        var parent = this.parent;
        while(parent) {
            if ( parent.isRoot() ) {
                return parent;
            }
            parent = parent.parent;
        }
    }
    else {
        return this;
    }
};

Node.prototype.isRoot = function () {
    if ( this.parent ) {
        return true;
    }
    else {
        return false;
    }
};

Node.prototype.isLeaf = function () {
    if ( this.children.length == 0 ) {
        return true;
    }
    else {
        return false;
    }
};

Node.prototype.getRGB = function () {
    return 'rgb('+this.color[0]+','+this.color[1]+','+ this.color[2]+')';
};

Node.prototype.getTraitValue = function (trait) {
    if ( trait == 'radius' ) {
        return this.radius;
    }
    else if ( trait == 'pos_x' ) {
        return this.pos[0];
    }
    else if ( trait == 'pos_y' ) {
        return this.pos[1];
    }
    else if ( trait == 'color_r' ) {
        return this.color[0];
    }
    else if ( trait == 'color_g' ) {
        return this.color[1];
    }
    else if ( trait == 'color_b' ) {
        return this.color[2];
    }
};

// simple tree object
var Tree = function(root) {
    if ( root ) {
        this.root = root;
        console.log("Instantiated tree with root parameter");
    }
    else {
        this.root = new Node();
        console.log("Instantiated tree without root parameter");
    }
};
