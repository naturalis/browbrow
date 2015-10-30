var Evolver = function (tree,ui) {
    this.generation = 1;
    this.tree = tree;
    this.ui = ui;
    console.log("Instantiated evolver");
};

// draws from an approximately normal distribution with mean 0. to alter
// the stdev, multiply the output. then add the target mean. the normal
// distribution is approximated by adding 3 draws from uniform distributions,
// thereby approaching the Central Limit Theorem.
Evolver.prototype.rnd = function () {
    var value = (Math.random()*2-1) + (Math.random()*2-1) + (Math.random()*2-1);
    return value;
};

// mutates a parameter
Evolver.prototype.mutate = function ( value, min, max, muratSelector ) {
    var rate = this.ui.getParam(muratSelector);
    var stdev = ( max - min ) * ( rate );
    var newValue = this.rnd() * stdev + value;

    // bounce back from upper
    if ( newValue > max ) {
        newValue = max - ( newValue - max );
    }

    // bounce back from lower
    if ( newValue < min ) {
        newValue = min + ( min - newValue );
    }

    return Math.round(newValue);
};

// evolve one generation
Evolver.prototype.evolve = function () {
    var leaves = this.tree.root.getLeaves();

    // decide whether to speciate
    if ( Math.random() < this.ui.getParam('speciationRate') ) {
        var i = Math.floor( Math.random() * leaves.length );
        var children = leaves[i].speciate(this.generation);
        leaves.splice(i,1);
        leaves.push(children[0]);
        leaves.push(children[1]);
    }

    // decide whether to extinguish
    if ( Math.random() < this.ui.getParam('extinctionRate') ) {
        if ( leaves.length > 1 ) {
            var i = Math.floor( Math.random() * leaves.length );
            if ( leaves[i].extinguish() ) {
                leaves.splice(i,1);
            }
        }
    }

    // fade the previous generation
    this.ui.fade();

    // iterate over lineages, mutate
    for ( var i = 0; i < leaves.length; i++ ) {
        var l = leaves[i];
        l.gen = this.generation; // update

        // mutate colors
        l.color[0] = this.mutate(l.color[0],0,255,'colorHeritability');
        l.color[1] = this.mutate(l.color[1],0,255,'colorHeritability');
        l.color[2] = this.mutate(l.color[2],0,255,'colorHeritability');

        // mutate radius
        l.radius = this.mutate(l.radius,5,40,'radiusHeritability');

        // mutate position
        l.pos[0] = this.mutate(l.pos[0],0,window.innerWidth,'positionHeritability');
        l.pos[1] = this.mutate(l.pos[1],0,window.innerHeight,'positionHeritability');

        // draw the lineage
        this.ui.drawLineage(l);
    }
    this.ui.drawTree(this.tree.root,this.generation);
    this.generation++;
};
