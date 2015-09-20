// This is an Academic Project, and was published after finishing the lecture.
// @author Joao Elvas @ FCT/UNL


// -----------------------------------------------------------------------------
/*      Gold!!!      

01234567890123456789012345678901234567890123456789012345678901234567890123456789
*/

// -----------------------------------------------------------------------------
//  OUR COMMENTS
// -----------------------------------------------------------------------------
//
//	Respeitamos a modularidade e extensibilidade do codigo.
//
//	Adicionamos ainda uma classe MainActor para o caso de num futuro proximo
//	querer-mos adicionar outro tipo de actor principal que nao a bola.
//	Fize-mos isto apenas por uma melhor leitura de codigo. 
//	
//	Por uma questao de beleza criamos uma classe Timer que toma todas as acoes
//	relativas ao tempo de jogo.
//
//	Comforme discutido com o professor AMD ha uma funcao na classe timer que
//	nao e possivel chamar o this. e por esta razao e chamado o time.
//	Por esta razao nao nos foi possivel inserir o timer dentro do GameControl,
//	o que neste caso faria todo o sentido.
//
//	A opcoes tomadas foram:
//	- que quando o jogo acaba o jogador recebe uma mensagem que informa que o 
//	jogo acabou e qual o score obtido.
//	- quando o tempo acaba e se o jogador tiver vidas, este perde uma vida e
//	recebe mais 1 minuto para completar o jogo.
//	- nao adicionamos um botao de pausa do jogo no canvas pois diminuiria a sua
//	dificuldade, no entanto o jogador pode parar a bola baixando o seu speed,
//	mas nunca pode parar o tempo.
//
//
//
//
//	EXTRAS: Adicionamos mono sons a versao que ficamos do nosso projeto, nao
//			enviamos essa versao pois nao tivemos oportunidade de testar no
//			laboratorio e queriamos ter a certeza que cumpria todos os
//			requisitos.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
//  GLOBAL VARIABLES
// -----------------------------------------------------------------------------

var ctx, empty, ball, world, control, time, speed_interval;

// -----------------------------------------------------------------------------
//  PRIZES
// -----------------------------------------------------------------------------

var BRICK_PRIZE = 2;
var KEY_LOCK_PRIZE = 4;
var GOLD_PRIZE = 6;
var UNUSED_TIME_PRIZE = 1;
var UNUSED_LIVES_PRIZE = 200;

// -----------------------------------------------------------------------------
//  TIMES
// -----------------------------------------------------------------------------

var GAME_TIME_IN_SECONDS = 120;
var GAME_TIME_FOR_SECOND_CHANCE = 60;

// -----------------------------------------------------------------------------
//  ACTORS
// -----------------------------------------------------------------------------

var Actor = EXTENDS(JSRoot, {
	x: 0, y: 0,
	kind: null,
	color: null,
	INIT: function(x, y, kind, color) {
		this.x = x;
		this.y = y;
		this.kind = kind;
		this.color = color;
		this.show();
	},
	setColor: function(color) {
		this.color = color;
	},
	getColor: function() {
		return this.color;
	},
	show: function() {
		var image = GameImage.get(this.kind, this.color).image;
		world[this.x][this.y] = this;
		ctx.drawImage(image, this.x * ACTOR_PIXELS_X, this.y * ACTOR_PIXELS_Y);
	},
	hide: function() {
		var image = GameImage.get("Empty", "").image;
		world[this.x][this.y] = empty;
		ctx.drawImage(image, this.x * ACTOR_PIXELS_X, this.y * ACTOR_PIXELS_Y);
	},
	// Returns if the Actor is a brick
	isBrick: function() {
		return false;
	},
	// Reurns if the actor as any prize
	hasPrize: function() {
		return false;
	},
	// Returns if the Actor changes the color of the main actor
	isColorChanger: function() {
		return false;
	},
	// Returns if the Actor is Evil
	isEvil: function() {
		return false;
	},
	// Returns if the Actor changes anyting in the Main Actor commands
	isInverter: function() {
		return false;
	},
	// Returns if the Actor is related to the path locks
	opensPath: function() {
		return false;
	},
	// Returns if the Actor opens the locks
	opensLock: function() {
		return false;
	},
	// Returns if the Actor is a Gold prize
	isGoldPrize: function() {
		return false;
	},
	// Returns the worth in points of the prize Actors
	worth: function() {},
	// The Main Actor asks the Actor to kill himself
	killYourself: function() {}
});

// -----------------------------------------------------------------------------
//  EMPTY
// -----------------------------------------------------------------------------

var Empty = EXTENDS(Actor, {
	INIT: function() {
		this.SUPER(Actor.INIT, -1, -1, "Empty", "");
	},
	show: function() {},
	hide: function() {}
});

// -----------------------------------------------------------------------------
//  BOUNDARY
//
//	These are indestructible obstacles, which can not be captured by Ball.
// -----------------------------------------------------------------------------

var Boundary = EXTENDS(Actor, {
	INIT: function(x, y, color) {
		this.SUPER(Actor.INIT, x, y, "Boundary", color);
	}
});

// -----------------------------------------------------------------------------
//  BRICK
//
//	The Bouncing Ball captures a Brick if, at the time of the collision, both 
//	have the same color. In this case, the Brick disappears from the screen, 
//	and the score of the Ball is incremented.
// -----------------------------------------------------------------------------

var Brick = EXTENDS(Actor, {
	INIT: function(x, y, color) {
		this.SUPER(Actor.INIT, x, y, "Brick", color);
	},
	isBrick: function() {
		return true;
	},
	hasPrize: function() {
		return true;
	},
	worth: function() {
		return BRICK_PRIZE;
	},
	killYourself: function() {
		this.hide();
	}
});

// -----------------------------------------------------------------------------
//  BUCKET
//
//	If the Ball hits a Bucket, the Ball takes the color of the Bucket. 
//	The Bucket is not destroyed and remains in the scenario.
// -----------------------------------------------------------------------------

var Bucket = EXTENDS(Actor, {
	INIT: function(x, y, color) {
		this.SUPER(Actor.INIT, x, y, "Bucket", color);
	},
	isColorChanger: function() {
		return true;
	}
});

// -----------------------------------------------------------------------------
//  DEVIL
//
//	The Ball dies by colliding with a Devil. The Devil is not destroyed 
//	and remains in the scenario. The Ball loses a life.
// -----------------------------------------------------------------------------

var Devil = EXTENDS(Actor, {
	INIT: function(x, y, color) {
		this.SUPER(Actor.INIT, x, y, "Devil", color);
	},
	isEvil: function() {
		return true;
	}
});

// -----------------------------------------------------------------------------
//  INVERTER
//
//	When the Ball collides with an Inverter, the roles of the keyboard controls
//	"left" and "right" is exchanged and this complicates the control of the 
//	Ball. The Inverter disappears from the scene, being captured by Ball. 
//	If the Ball already has an Inverter then the two Inverters cancels out 
//	mutually and no Inverter remains in the inventory..
// -----------------------------------------------------------------------------

var Inverter = EXTENDS(Actor, {
	INIT: function(x, y, color) {
		this.SUPER(Actor.INIT, x, y, "Inverter", color);
	},
	isInverter: function() {
		return true;
	},
	killYourself: function() {
		this.hide();
	}
});

// -----------------------------------------------------------------------------
//  KEY
//
//	The Ball captures a Key if, at the time of the collision, (1) the Ball is 
//	orange and (2) does not own any Key yet. In this case, the Key disappears 
//	from the screen, the Ball adds the Key to its inventory, and the score of 
//	the Ball is incremented.
// -----------------------------------------------------------------------------

var Key = EXTENDS(Actor, {
	INIT: function(x, y, color) {
		this.SUPER(Actor.INIT, x, y, "Key", color);
	},
	hasPrize: function() {
		return true;
	},
	worth: function() {
		return KEY_LOCK_PRIZE;
	},
	opensPath: function() {
		return true;
	},
	killYourself: function() {
		this.hide();
	},
	opensLock: function() {
		return true;
	}

});

// -----------------------------------------------------------------------------
//  LOCK
//
//	The Ball captures a Lock if, at the time of the collision, (1) the Ball is
//	orange and (2) has a Key stored. In this case, the Lock disappears from the
//	screen, the Key is removed from the inventory of the Ball, and the score of
//	the Ball is incremented.
// -----------------------------------------------------------------------------

var Lock = EXTENDS(Actor, {
	INIT: function(x, y, color) {
		this.SUPER(Actor.INIT, x, y, "Lock", color);
	},
	hasPrize: function() {
		return true;
	},
	worth: function() {
		return KEY_LOCK_PRIZE;
	},
	opensPath: function() {
		return true;
	},
	killYourself: function() {
		this.hide();
	}
});

// -----------------------------------------------------------------------------
//  GOLD
//
//	The Ball captures a Gold piece if, at the time of the collision, the Ball 
//	has already caught all Colored bricks. In this case, the Gold piece 
//	disappears from the scene and the score of the Ball is incremented. 
//	The color of the Ball is not relevant at the time of capturing gold.
// -----------------------------------------------------------------------------

var Gold = EXTENDS(Actor, {
	INIT: function(x, y, color) {
		this.SUPER(Actor.INIT, x, y, "Gold", color);
	},
	hasPrize: function() {
		return true;
	},
	worth: function() {
		return GOLD_PRIZE;
	},
	isGoldPrize: function() {
		return true;
	},
	killYourself:function() {
		this.hide();
	}
});

// -----------------------------------------------------------------------------
//  MAIN ACTOR
//
//	Main Actor is the class for every main character with this we can change
//	the ball without calling ball to another object that is not a ball.
// -----------------------------------------------------------------------------

var MainActor = EXTENDS(Actor, {
	deltaX: 0,
	deltaY: 0,
	color: "",
	// MORE FIELDS NEEDED (DONE)
	dying: false,
	lives: 3,
	points: 0,
	inverter: false,
	key: false,
	lastLiveAddedAt:0,


	INIT: function(x, y, kind, color) {
		this.SUPER(Actor.INIT, x, y, kind, color);
		this.reset();
		this.show();
		document.getElementById('lives_val').innerHTML = this.lives;
	},
	reset: function() {	// for starting/restarting a level
		this.x = INICIAL_BALL_X;
		this.y = INICIAL_BALL_Y;
		this.deltaY = -1;
		this.deltaX = 0;
		this.setColor("lightBlue");
	},
	show: function() {
		var image = GameImage.get(this.kind, this.color).image;
		ctx.drawImage(image, this.x * BALL_PIXELS_X, this.y * BALL_PIXELS_Y);
	},
	hide: function() {
		var image = GameImage.get(this.kind, "white").image;
		ctx.drawImage(image, this.x * BALL_PIXELS_X, this.y * BALL_PIXELS_Y);
	},
	move: function(dx, dy) {
		this.hide();
		this.x += dx;
		this.y += dy;
		this.show();		
	},
	setDeltaX: function(dx) {
		if(this.inverter) {
			this.deltaX = (-1 * dx);
		} else {
			this.deltaX = dx;
		}
	},
	getDeltaX: function(dx) {
		return this.deltaX;
	},
	checkHit: function(dx, dy) {

		var nextX = div(this.x + dx, FACTOR_X);
		var nextY = div(this.y + dy, FACTOR_Y);
		var hit = world[nextX][nextY] != empty;
		if( hit ) this.collision(world[nextX][nextY]);
		return hit;
	},
	animation: function() {

		var dx = this.getDeltaX();
		var dy = this.deltaY;
		if(this.dying == true) {
			this.dying = false;
			dx = 0;
			dy = 0;
		}
		var hitX = false;
		var hitY = this.checkHit(0, dy);
		if( dx != 0 ) {
			hitX = this.checkHit(dx, 0);
			if( !hitX && !hitY )
				hitY = this.checkHit(dx, dy);
		}
		if( hitX ) dx *= -1;
		if( hitY ) dy = this.deltaY *= -1;
		if (!this.dying)
			this.move(dx, dy);
	},
	// Handle's every colision of the main actor
	collision: function(hit) {
		// Checks if hit has any prize
		if(hit.hasPrize()) {
			// Evaluates if the color is the same
			// or if is a gold price and there are no more bricks  
			if (this.color == hit.getColor() 
						|| (hit.isGoldPrize() && !control.hasBricks())) {
				
				// Handle's keys and locks
				if (hit.opensPath()) {
					// If it opens locks
					if(hit.opensLock()) {
						if(!this.key) {
							this.key = true;
							hit.killYourself();
						};
					} else {
						if(this.key) {
							this.key = false;
							hit.killYourself();
						};
					};

				} else {
					// Handle's bricks and gold
					hit.killYourself();
					this.addPrize(hit.worth());
					if (hit.isBrick()) {
						control.oneBrickTaken();
					} else if (hit.isGoldPrize()) {
						control.oneGoldTaken();

						if(!control.hasGold()) {
						control.endLevel();
						};
					};
				};
			};
			this.checkForNewLives();
		} else if (hit.isColorChanger()) {
			// Changes the color of the ball
			this.color = hit.getColor();
		} else if (hit.isEvil()) {
			this.dying = true;
			this.deathByEvilActor();
		} else if (hit.isInverter()) {
			// Inverts the ball controls
			hit.killYourself();
			this.invertControls();
		};
	},
	// Adds a prize to the Main Actor
	addPrize: function(p) {
		this.points += p;
		document.getElementById('points_val').innerHTML = this.points;

	},
	// Returns if the ball controls are inverted
	isInverted: function() {
		return this.inverter;
	},
	// Inverts the controls of the Main Actor
	invertControls: function() {
		if (this.inverter == true) {
			this.inverter = false;
		} else {
			this.inverter = true;
		};
	},
	// Takes one life from the Main Actor
	takeOneLife: function() {
		this.lives -= 1;
		document.getElementById('lives_val').innerHTML = this.lives;
	},
	// Adds one life to the Main Actor
	addOneLife: function() {
		this.lives += 1;
		document.getElementById('lives_val').innerHTML = this.lives;
	},
	// Checks if the Main Actor has enoght points to win a life
	checkForNewLives: function() {
		var i = this.points - this.lastLiveAddedAt;
		if (i >= 200) {
			this.lives += 1;
			this.lastLiveAddedAt += 200;
		};
		document.getElementById('lives_val').innerHTML = this.lives;
	},
	// Returns if the Main Actor as lifes left
	hasLives: function() {
		return this.lives > 0;
	},
	// Returns tge score of the Main Actor
	getScore: function() {
		return this.points;
	},
	// Takes evil actors actions against the ball
	deathByEvilActor: function() {
		

		if(this.lives > 0) {
			mesg("AH! AH! AH! THE DEVIL GOT YOU!")
			this.setDeltaX(0);
			this.hide();
			this.dying = true;
			ball.takeOneLife();
			this.reset();
		} else { 
			var answer = confirm("AH! AH! AH! THE DEVIL GOT YOU!\n\nRestart?");
			if(answer) {
				control.restartGame();
			} else {
				control.pauseTheGame();
			}
		}
	},
	getLives: function() {
		return this.lives;
	},
	setDyingState: function() {
		this.dying = true;
	}
});

// -----------------------------------------------------------------------------
//  BALL
//
//	The Ball begins at a fixed position near the bottom right of the picture.
//
//	At the beginning of each level, the Ball is light blue. Since there are no
//	Buckets of this color, the Ball needs to capture all the light blue bricks
//	before changing its color for the first time. The Ball changes its color 
//	by colliding with a Bucket of paint with the desired color.
//
//	When the Ball collides with another actor, it always bounces back, no 
//	matter if there is a catch or not.
// -----------------------------------------------------------------------------

var Ball = EXTENDS(MainActor, {
	
	INIT: function(x, y, color) {
		this.SUPER(MainActor.INIT, x, y, "Ball", "lightBlue");
	},

});

// -----------------------------------------------------------------------------
//  GAME CONTROL
//
//	Everything related to game, controls and world
// -----------------------------------------------------------------------------

var GameControl = EXTENDS(JSRoot, {
	nrOfBricks: 0,
	nrOfGold: 0,
	currentLvl: 0,
	currentSpeed: 0,

	INIT: function() {
		ctx = document.getElementById("canvas1").getContext("2d");
		empty = NEW(Empty);	// only one empty actor needed
		world = this.createWorld();
		time = NEW(Timer);
		this.currentLvl = 1;
		this.loadLevel(this.currentLvl);
		ball = NEW(Ball);
		this.setupEvents();
		control = this;
		this.currentSpeed = DEFL_SPEED
	},
	createWorld: function () { // stored by columns
		var matrix = new Array(WORLD_WIDTH);
		for( var x = 0 ; x < WORLD_WIDTH ; x++ ) {
			var a = new Array(WORLD_HEIGHT);
			for( var y = 0 ; y < WORLD_HEIGHT ; y++ )
				a[y] = empty;
			matrix[x] = a;
		}
		return matrix;
	},
	loadLevel: function (level) {
		// Initializes the counters at the begining of each level
		this.nrOfBricks = 0;
		this.nrOfGold = 0;
		this.invertedControls = false;
		time.resetTime();

		if( level < 1 || level > MAPS.length )
			fatalError("Invalid level " + level)
		var map = MAPS[level-1];  // -1 because levels start at 1
		// Loads the level matrix
		for( var x = 0 ; x < WORLD_WIDTH ; x++ ) {
			for( var y = 0 ; y < WORLD_HEIGHT ; y++ ) {
				world[x][y].hide();
				var code = map[y][x];
				var gi = GameImage.getByCode(code);
				if( gi )
			NEW(globalByName(gi.kind), x, y, gi.color);

			// Counts the number of bricks and gold
			if(world[x][y].isBrick()) {
				this.nrOfBricks += 1;
				
			} else if (world[x][y].isGoldPrize()) {
				this.nrOfGold += 1;
				
			};
			}
			document.getElementById('bricks_val').innerHTML = this.nrOfBricks;
			document.getElementById('gold_val').innerHTML = this.nrOfGold;
		}
	},
	setupEvents: function() {
		this.setSpeed(DEFL_SPEED);
		addEventListener("keydown", this.keyDownEvent, false);
		addEventListener("keyup", this.keyUpEvent, false);
	},
	animationEvent: function () {
		if(!this.paused) {
			ball.animation();
		};
		if(time.timesUp()) {
			control.gameTimeEnded();
		};
	},
	keyDownEvent: function(k) {
		// http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
		var code = k.keyCode
		switch(code) {
			case 37: case 79: case 74:
				ball.setDeltaX(-1); break;	// LEFT, O, J
			case 38: case 81: case 73:
				/* ignore */ break;			// UP, Q, I
			case 39: case 80: case 76:
				ball.setDeltaX(1);  break;	// RIGHT, P, L
			case 40: case 65: case 75:
				/* ignore */ break;			// DOWN, A, K
			default: break;
		}
	},
	keyUpEvent: function(k) {
		ball.setDeltaX(0);
	},
	setSpeed: function (speed) {
		if(speed < MIN_SPEED)
			speed = MIN_SPEED;
		if(MAX_SPEED < speed)
			speed = MAX_SPEED;
		speed_interval = setInterval(this.animationEvent, (MAX_SPEED + 1 - speed) * 30);
	},
	// Checks if there are bricks left in the scene
	hasBricks: function() {
		return this.nrOfBricks > 0;
	},
	// Takes one brick from the scene
	oneBrickTaken: function() {
		this.nrOfBricks -= 1;
		document.getElementById('bricks_val').innerHTML = this.nrOfBricks;
	},
	// Takes one gold from the scene
	oneGoldTaken: function() {
		this.nrOfGold -= 1;
		document.getElementById('gold_val').innerHTML = this.nrOfGold;
	},
	// Checks if there are gold left in the scene
	hasGold: function() {
		return this.nrOfGold > 0;
	},
	// Finishes the level
	endLevel: function() {
		ball.addPrize(time.getSecondsLeft() * UNUSED_TIME_PRIZE);
		if(this.currentLvl < 5) {
		// If the player wants to continue the game starts at next level
		// otherwise it keeps paused
			var answer1 = confirm("GRATZZ! lvl done!\n\nJump to next level?");
			if(answer1) {
				ctx = document.getElementById("canvas1").getContext("2d");
				ball.hide();
				ball.setDyingState();
				ball.reset();
				ball.show();
				
				this.currentLvl += 1;
				control.loadLevel(this.currentLvl);
			} else {
				this.pauseTheGame();
			};
		} else {
		// If the player wants to play the game from the beggining the game
		// will restart otherwise it keeps paused
			var answer2 = confirm("YOU WIN!\n\nYOUR SCORE IS: " 
				+ ball.getScore() + "\n\nRestart the game?");
			if(answer2) {
				this.restartGame();
			} else {
				this.pauseTheGame();
			};
		};
	},
	// Restarts the current level
	restartLvl: function() {
		ctx = document.getElementById("canvas1").getContext("2d");
		ball.hide();
		ball = NEW(Ball);
		control.loadLevel(this.currentLvl);
	},
	// Jumpt to desired level
	jumpToLvl: function(l) {
		this.currentLvl = l;
		ctx = document.getElementById("canvas1").getContext("2d");
		ball.hide();
		ball = NEW(Ball);
		control.loadLevel(l);
	},
	// Restarts the game from beggining
	restartGame: function() {
		ctx = document.getElementById("canvas1").getContext("2d");
		ball.hide();
		ball = NEW(Ball);
		this.currentLvl = 1;
		control.loadLevel(this.currentLvl);
	},
	// Pauses the game
	pauseTheGame: function() {
		time.pauseTime();
		this.paused = true;
	},
	// Continues the game
	continueTheGame: function() {
		time.continueTime();
		this.paused = false;
	},
	// Handles the actions when game time ends
	gameTimeEnded: function() {
		if(ball.hasLives()) {
			ball.hide();
			ball.reset();

			ball.show();
			ball.takeOneLife();
			mesg("TIME's UP!\n\n YOU LOST A LIFE");
			time.addSecondsToClock(GAME_TIME_FOR_SECOND_CHANCE);
		} else {
			var answer = confirm("TIME's UP!\n\nWant to start again?");
			if(answer) {
				this.restartGame();
			} else {
				this.pauseTheGame();
			};
		};
	},
	speedDown: function() {
		clearInterval(speed_interval);
		if (this.currentSpeed > MIN_SPEED) {
			this.currentSpeed -= 1;
			this.setSpeed(this.currentSpeed);
		};
	},
	speedUp: function() {
		clearInterval(speed_interval);
		if (this.currentSpeed < MAX_SPEED) {
			this.currentSpeed += 1;
			this.setSpeed(this.currentSpeed);
		};
	}
});

// -----------------------------------------------------------------------------
//  TIMER
//
//	Handles every timer related functions
// -----------------------------------------------------------------------------

var Timer = EXTENDS(JSRoot, {
	seconds: 0,
	paused: false,

	INIT: function() {
		this.seconds = 120;
		setInterval(this.spendsOneSecond, 1000);
		document.getElementById('time_val').innerHTML = this.seconds;
	},
	// Resets the time
	resetTime: function() {
		this.seconds = GAME_TIME_IN_SECONDS;
	},
	// Takes one second from the clock
	spendsOneSecond: function() {
		if(time.seconds > 0) {
			if(!time.paused) {
				time.seconds -= 1;
				document.getElementById('time_val').innerHTML = time.seconds;
			};
		};
	},
	// Add s seconds to the clock
	addSecondsToClock: function(s) {
		this.seconds += s;
	},
	// Returns how many seconds are left
	getSecondsLeft: function() {
		return this.seconds;
	},
	// Pauses the game clock
	pauseTime: function() {
		this.paused = true;
	},
	// Continues the game clock
	continueTime: function() {
		this.paused = false;
	},
	// Returns if there is time to play
	timesUp: function() {
		return this.seconds == 0;
	}
});

// -----------------------------------------------------------------------------
//  HTML FORM
//
//	Every HTML related code
// -----------------------------------------------------------------------------

function onLoad() {
  // load images an then run the game
	GameImage.loadImages(function() {NEW(GameControl);});

}

// -----------------------------------------------------------------------------
//  BUTTONS
// -----------------------------------------------------------------------------

// Reset the game (Starts at level 1)
function restartTheGameButton() { 
	control.restartGame();

	mesg("STAY THERE AND RELAX \n\nTHE GAME WILL RESTART NOW!");
}

// Starts at level 2
function lvlTwoButton() {
	var answer = confirm("THIS IS A DEBUG FUNCTION\n\n ARE YOU SURE?!");
	if(answer) {
		control.jumpToLvl(2);
	};
}

// Starts at level 3
function lvlThreeButton() { 
	var answer = confirm("THIS IS A DEBUG FUNCTION\n\n ARE YOU SURE?!");
	if(answer) {
		control.jumpToLvl(3);
	};
}

// Starts at level 4
function lvlFourButton() { 
	var answer = confirm("THIS IS A DEBUG FUNCTION\n\n ARE YOU SURE?!");
	if(answer) {
		control.jumpToLvl(4);
	};
}

// Starts at level 5
function lvlFiveButton() { 
	var answer = confirm("THIS IS A DEBUG FUNCTION\n\n ARE YOU SURE?!");
	if(answer) {
		control.jumpToLvl(5);
	};
}

// Speeds down the ball
function speedUpButton() {
	control.speedUp();
}

// Speeds up the ball
function speedDownButton() {
	control.speedDown();
}




