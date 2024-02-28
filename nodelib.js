/*
This library specifies two OO-classes: one for a phylogenetic tree node, and the other for a tree. Instances of these
classes are manipulated by evolvelib.js to mutate their trait values and trigger their reproduction and death, thereby
achieving evolution by natural selection. In addition, instances of these classes are also interrogated by uilib.js,
in order to draw the tree shape as SVG and the current generation in its landscape using HTML5 canvas.
*/

// object ID counter
var idCounter = 1;

/*
This node object serves three functions:
1. it is used to help represent the tree shape and color the branches. As such it needs to be recursive data structure
   with reference to the parent (in the this.parent field) and the children (the this.children array). In addition it
   holds a slot for color, which is an array of three elements for the RGB values, and a slot for the generation at
   which the node was instantiated, which is used to calculate the branch length.
2. it holds the values with which it is plotted on the landscape. For this it has a value for the circle radius (not
   really used other than the default value of 10 pixels) and the position, which is a two-element array for X and Y.
3. it has some of the tooling with which to compute the fitness and to make it participate in the evolutionary process.
   For this it has the this.fitness field, to which the computed fitness is applied by the evolvelib.
In addition, the object has a field for the unique ID of the object, which is assigned upon instantiation by
incrementing the global idCounter. The object can be cloned by passing it into the constructor as an argument.
*/
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

    // assigns unique ID as an int
    this.id = idCounter++;

    // initialize fitness
    this.fitness = 0;

    //console.log("Instantiated node");
};

/*
Computes the raw fitness value of the node object. The fitness is simply the sum of the absolute differences between
the object's RGB values and that of the underlying canvas.
*/
Node.prototype.computeRawFitness = function(landscape) {
    var bgP = landscape.getPixelValue(this.pos[0],this.pos[1]);
    var phP = [ this.color[0], this.color[1], this.color[2] ];
    return Math.abs(bgP[0]-phP[0]) + Math.abs(bgP[1]-phP[1]) + Math.abs(bgP[2]-phP[2]);
};

/*
Setter and getter for the fitness value.
*/
Node.prototype.setFitness = function(fitness) {
    this.fitness = fitness;
};

Node.prototype.getFitness = function () {
    return this.fitness;
};

/*
Depth-first traversal with pre- and post-order processing function slots
*/
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

/*
Apply function to all the node's children
*/
Node.prototype.iterate = function(func) {
    for ( var i = 0; i < this.children.length; i++ ) {
        func(this.children[i]);
    }
};

/*
Get all terminal descendants of node
*/
Node.prototype.getLeaves = function () {
    var leaves = [];
    this.traverse(function(node){
        if ( node.isLeaf() ) {
            leaves.push(node);
        }
    });
    return leaves;
};

/*
Makes the focal node split into two.
TODO: the overall logical could be refactored in a number of ways:
- by breeding tips with each other, requiring (at least) diploid genomes
- by incorporating mate choice in this, e.g. scaled by fitness
- but then where to graft the children. Probably onto the fittest parent.
*/
Node.prototype.reproduce = function(generation) {

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

/*
Kills the focal node. Because we don't want unbranched internal nodes in our bifurcating tree, killing a child means
that its parent, left with only the other child, must also be removed. That other child must then be attached to the
grandparent.
*/
Node.prototype.die = function (tree) {

    // only non-root leaves can be extinguished
    if ( this.parent ) {
        var id = this.id;

        /* lookup the sister, which must be grafted to the grandparent
        so that the parent can also be extinguished and we avoid
        unbranched internal nodes */
        var otherChild;
        this.parent.iterate(function(node){
            if ( node.id != id ) {
                otherChild = node;
            }
        });

        // there is a grandparent to which we can graft
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
            otherSibling.parent = this.parent.parent; // TODO: check if necessary
            return true;
        }

        // there is no grandparent, so the sibling becomes the root
        else {
            this.parent.children = [];
            otherChild.parent = undefined;
            tree.root = otherChild;
            return true;
        }
    }
    return false;
};

/*
Returns the length of the lineage. As the simulation proceeds, the generation counter for the extant nodes is updated.
Hence, the 'length' increases with every generation, so that the tree can be drawn ultrametrically.
*/
Node.prototype.getLength = function () {
    if ( this.parent ) {
        return this.gen - this.parent.gen;
    }
    else {
        return 0;
    }
};

/*
Finds the root of the tree from the focal node by traversing up until parent.isRoot() is reached.
*/
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

/*
Checks if focal node is root, which it is assumed to be if it has no parent.
*/
Node.prototype.isRoot = function () {
    if ( this.parent ) {
        return true;
    }
    else {
        return false;
    }
};

/*
Check if focal node is a leaf, which it is assumed to be if it has no children.
*/
Node.prototype.isLeaf = function () {
    if ( this.children.length == 0 ) {
        return true;
    }
    else {
        return false;
    }
};

/*
Looks up the values in the color array and reformats as an rgb(*, *, *) string.
*/
Node.prototype.getRGB = function () {
    return 'rgb('+this.color[0]+','+this.color[1]+','+ this.color[2]+')';
};

/*
Looks up whichever trait value is requested. This is used to mutate them.
*/
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

/*
Simple tree object, which simply wraps around a root object.
*/
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
