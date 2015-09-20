// This is an Academic Project, and was published after finishing the lecture.
// @author AMD @ FCT/UNL

// Gold0.js - AMD/2015
// You are not allowed to change ths file.

// JAVA EMULATION

var JSRoot = {
    SUPER: function(method) {
        return method.apply(this,
            Array.prototype.slice.apply(arguments).slice(1));
    },
    INIT: function() {
        throw "*** MISSING INITIALIZER ***";
    }
};

function NEW(clazz) { // Create an object and applies INIT(...) to it
    function F() {}
    F.prototype = clazz;
    var obj = new F();
    obj.INIT.apply(obj, Array.prototype.slice.apply(arguments).slice(1));
    return obj;
};

function EXTENDS(clazz, added) { // Creates a subclass of a given class
    function F() {}
    F.prototype = clazz;
    var subclazz = new F();
    for(prop in added)
        subclazz[prop] = added[prop];
    return subclazz;
};

// "print" é opcional, mas introduz compatibilidade com o Node.js
var print = typeof(console) !== 'undefined' ? console.log : print;


// MISCELLANEOUS FUNCTIONS

function rand(n) {		// random number generator
	return Math.floor(Math.random() * n);
}

function distance(x1, y1, x2, y2) {
	var distx = Math.abs(x1 - x2);
	var disty = Math.abs(y1 - y2);
	return Math.ceil(Math.sqrt(distx*distx + disty*disty));
}

function mesg(m) {
	return alert(m);
}

function fatalError(m) {
	mesg("Fatal Error: " + m + "!");
	throw "Fatal Error!";
}

function objectLength(obj) {	// number of fields of an object
	return Object.keys(obj).length;
}

function globalByName(name) { // access global space entity by name (string)
	return this[name];
}

function div(a, b) {		// integer division
	return Math.floor(a/b);
}


// GAME CONSTANTS

const N_LIVES = 3;

const INICIAL_BALL_X = 37;
const INICIAL_BALL_Y = 25;

const MIN_SPEED = 0;
const MAX_SPEED = 10;
const DEFL_SPEED = 7;


// GAME IMAGES

const ACTOR_PIXELS_X = 45;
const ACTOR_PIXELS_Y = 30;

const BALL_PIXELS_X = 15;
const BALL_PIXELS_Y = 15;

const FACTOR_X = div(ACTOR_PIXELS_X, BALL_PIXELS_X);
const FACTOR_Y = div(ACTOR_PIXELS_Y, BALL_PIXELS_Y);

var GameImage = EXTENDS(JSRoot, {
	kind: "",
	color: "",
	code: '',
	image: null,
	prefix: "http://ctp.di.fct.unl.pt/miei/lap/projs/proj2015-3/resources/",
	//prefix: "../resources/",
	next: function() { mesg("GameImage.next default"); },
	loading: 0,      // static, controls async loadng
	byCode: {},      // static, dictionary
	byKindColor: {}, // static, dictionary
	INIT: function(kind, color, url, code) {
		GameImage.loading++;
		this.kind = kind;
		this.color = color;
		this.code = code;
		this.image = new Image();
		if( url[0] == '@' )
			url = this.prefix + url.slice(1);
		this.image.src = url;
		this.image.onload =
			function() { if( --GameImage.loading == 0 ) GameImage.next(); }
		GameImage.byCode[code] = this;
		GameImage.byKindColor[kind+color] = this;
	},
	loadImages: function(next) {  // load is asynchronous
		GameImage.next = next;     // next is the action to start after loading
		NEW(GameImage, "Empty", "", "@empty.png", '');
		NEW(GameImage, "Ball", "white", "@ballWhite.png", '');
		NEW(GameImage, "Ball", "lightBlue", "@ballLightBlue.png", '');
		NEW(GameImage, "Ball", "blue", "@ballBlue.png", '');
		NEW(GameImage, "Ball", "brown", "@ballBrown.png", '');
		NEW(GameImage, "Ball", "green", "@ballGreen.png", '');
		NEW(GameImage, "Ball", "purple", "@ballPurple.png", '');
		NEW(GameImage, "Ball", "red", "@ballRed.png", '');
		NEW(GameImage, "Ball", "orange", "@ballOrange.png", '');
		NEW(GameImage, "Ball", "yellow", "@ballYellow.png", '');
		NEW(GameImage, "Boundary", "", "@boundary.png", 'z');
		NEW(GameImage, "Brick", "lightBlue", "@brickLightBlue.png", 'l');
		NEW(GameImage, "Brick", "blue", "@brickBlue.png", 'b');
		NEW(GameImage, "Brick", "brown", "@brickBrown.png", 'n');
		NEW(GameImage, "Brick", "green", "@brickGreen.png", 'g');
		NEW(GameImage, "Brick", "purple", "@brickPurple.png", 'p');
		NEW(GameImage, "Brick", "red", "@brickRed.png", 'r');
		NEW(GameImage, "Bucket", "blue", "@bucketBlue.png", 'B');
		NEW(GameImage, "Bucket", "brown", "@bucketBrown.png", 'N');
		NEW(GameImage, "Bucket", "green", "@bucketGreen.png", 'G');
		NEW(GameImage, "Bucket", "purple", "@bucketPurple.png", 'P');
		NEW(GameImage, "Bucket", "red", "@bucketRed.png", 'R');
		NEW(GameImage, "Bucket", "orange", "@bucketOrange.png", 'K');
		NEW(GameImage, "Devil", "", "@devil.png", '+');
		NEW(GameImage, "Inverter", "", "@inverter.png", '<');
		NEW(GameImage, "Key", "orange", "@key.png", '^');
		NEW(GameImage, "Lock", "orange", "@lock.png", '#');
		NEW(GameImage, "Gold", "", "@gold.png", '@');
	},
	get: function(kind, color) {
		return GameImage.byKindColor[kind+color];
	},
	getByCode: function(code) {
		return GameImage.byCode[code];
	}
});


// GAME MAPS

const WORLD_WIDTH = 14;
const WORLD_HEIGHT = 14;

const MAPS = Object.freeze([
[
	"zzzzzzzzzzzzzz",
	"z............z",
	"z....llll....z",
	"z...lrrrrl...z",
	"z..lRbbbbBl..z",
	"z.+rb@@@@br+.z",
	"z.+rb@@@@br+.z",
	"z.+rb@@@@br+.z",
	"z.+rb@@@@br+.z",
	"z..lBbbbbRl..z",
	"z...lrrrrl...z",
	"z....llll....z",
	"z............z",
	"zzzzzzzzzzzzzz"
], [
	"zzzzzzzzzzzzzz",
	"zzzzzzz..lgn^z",
	"z....z+.Glgnnz",
	"z....z+..lKggz",
	"z@@@@zz..lll.z",
	"z.++.#....N..z",
	"z.++.z.......z",
	"z.++.z.......z",
	"z.++.#....n..z",
	"z@@@@zz..z.z.z",
	"z....z+......z",
	"z....z+......z",
	"zzzzzzz......z",
	"zzzzzzzzzzzzzz"
], [
	"zzzzzzzzzzzzzz",
	"zKl........l^z",
	"zll........llz",
	"z..rrrrrrrr..z",
	"z..r+pppp+r..z",
	"z..rpP++Ppr..z",
	"z..rpg@@gpr..z",
	"z..rpg@@gpr..z",
	"z..rpggggpr..z",
	"z..r+p#pp+r..z",
	"z..rrG..Rrr..z",
	"zll..........z",
	"zll..........z",
	"zzzzzzzzzzzzzz",
], [
	"zzzzzzzzzzzzzz",
	"z++<......<++z",
	"z+...llll...+z",
	"z+...l@@l...+z",
	"z+...l@@l...+z",
	"z+.^<zzzz<K.+z",
	"z+.++@@@@++.+z",
	"z+.Rzz##zzB..z",
	"z+.lbbbbbbl..z",
	"z+.lrrrrrrl..z",
	"z+.llllllll..z",
	"z+...........z",
	"z+...........z",
	"zzzzzzzzzzzzzz",
], [
	"zzzzzzzzzzzzzz",
	"z.p.p..+.lPz+z",
	"z......z.llz.z",
	"zp.p.p.K.zzz.z",
	"z#zzzz.z.....z",
	"z.r@@z.zzzz.lz",
	"z.r@@z.z...z.z",
	"z.zzz^.z...+lz",
	"z.+....#.<.z.z",
	"z.+....zp<.zlz",
	"z.+.RzGzpz.p.z",
	"zg+.....#z.p.z",
	"zg+......z^z.z",
	"zzzzzzzzzzzzzz"
] ]);
