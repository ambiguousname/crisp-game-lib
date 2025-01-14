title = "Geometry Flash";

description = `
[Click]
`;

characters = [
  `
lllll
 lll
  l
`,
  `
  l
 lll
lllll
`,
  `
   l
 lll
llll
 lll
   l
`,
];

options = {};

let player;

class Player {
  position;
  velocity;
  jumping;

  constructor() {
    this.position = vec(25, 75);
    this.velocity = vec(0, 0);
    this.jumping = false;
  }

  update() {
    color("black");
    box(this.position, 10);

    if (this.jumping && this.position.y >= 75) {
      this.jumping = false;
      this.velocity = vec(this.velocity.x, 0);
    }

    if (!this.jumping && input.isJustPressed) {
      this.velocity.add(vec(0, -2));
      play("jump");
      this.jumping = true;
    }

    this.position.add(this.velocity);

    if (this.position.y < 75) {
      this.velocity.add(vec(0, 0.1));
    } else if (this.position.y > 75) {
      this.velocity = vec(this.velocity.x, 0);
      this.position = vec(this.position.x, 75);
    }
  }
}

class Obstacle {
  position;
  width = 0;
  constructor() {
    this.position = vec(120, 75);
    if (this.constructor == Obstacle) {
      throw new Error("Abstract Obstacle class must have an implementation.");
    }
  }
  // Should return collision info.
  update() {
    this.position.sub(vec(1, 0));
  }

  offscreen() {
    return false;
  }
}

class Box extends Obstacle {
  
  update() {
    super.update();
    color("red");
    return box(this.position, 5);
  }
  offscreen() {
    if (this.position.x + this.width/2 < 0) {
      addScore(10);
      return true;
    }
    super.offscreen();
  }
}

class PlayerGravitySwitch extends Player {
  switchUpdate() {
    // Get rid of any floating points for smooth movement:
    this.position = vec(this.position.x, round(this.position.y));
    if (this.desiredPosY == undefined) {
      if (this.jumping) {
        this.desiredPosY = 35;
      } else {
        this.desiredPosY = 75;
      }
    } else if (input.isJustPressed) {
      if (this.desiredPosY == 75) {
        this.desiredPosY = 35;
      } else {
        this.desiredPosY = 75;
      }
    }
    if (this.position.y != this.desiredPosY) {
      let diff = Math.sign(this.desiredPosY - this.position.y);
      this.position.add(0, diff);
    }
    color("black"); // Player character was sometimes rendered red. Make sure the player is always rendered black.
    box(this.position, 10);
  }
}

class GravitySwitcher extends Obstacle {
  triggered = false;
  inert = false;
  width = 100;

  spikes = [];
  constructor() {
    super();
    this.position.add(this.width, 0);

    let numSpikes = Math.floor(Math.random() * 4) + 2;
    for (var i = 0; i < numSpikes; i++) {
      let bottom = 72;
      if (Math.random() > 0.5) {
        bottom = 35;
      }

      let x = (i * this.width) / numSpikes - this.width / 2;
      if (x >= this.width / 2) {
        x = this.width / 2 + 7;
      } else if (x <= -this.width / 2) {
        x = this.width / 2 - 7;
      }
      this.spikes.push(vec(x, bottom));
    }
  }
  update() {
    super.update();
    if (
      !this.triggered &&
      player.position.x >= this.position.x - this.width / 2
    ) {
      player.update = PlayerGravitySwitch.prototype.switchUpdate;
      this.triggered = true;
    }
    if (!this.inert && player.position.x >= this.position.x + this.width / 2) {
      this.inert = true;
      player.update = Player.prototype.update;
      player.velocity = vec(player.velocity.x, 0);
      player.desiredPosY = undefined;

      addScore(10);
    }

    color("red");
    box(this.position.x, 85, this.width, 10);
    box(this.position.x, 25, this.width, 10);
    color("black");

    let collision;
    this.spikes.forEach((s) => {
      let newPos = vec(s.x + this.position.x, s.y);
      let charName = "b";
      if (s.y <= 35) {
        charName = "a";
      }
      let c = char(charName, newPos, {
        scale: {
          x: 2,
          y: 5,
        },
      });
      if (c.isColliding.rect.black) {
        collision = c;
        return;
      }
    });
    return collision;
  }

  offscreen() {
    return this.position.x + this.width / 2 <= 0;
  }
}

class PlayerJumpHold extends Player {
  HoldUpdate() {
    if (input.isJustPressed) {
      play("jump");
    }

    if (input.isPressed && this.position.y >= 35) {
      this.position.y -= 1;
    } else {
      if (this.position.y <= 75) {
        this.position.y += 0.5;
      }
    }
    box(this.position, 10);
  }
}

class JetPackObstacle extends Obstacle {
  width = 100;
  height = 60;
  projectiles = [vec(0, 75)]; //pushed this one here by default, making sure the player does something incase bad random
  triggered = false;
  inert = false;

  constructor() {
    super();
    this.position.add(this.width, 0);

    let numProjectiles = Math.floor(rnd(6, 8));
    for (let i = 0; i < numProjectiles; i++) {
      let y = rnd(30, 80);
      let x = (i * this.width) / numProjectiles - this.width / 2;
      if (x >= this.width / 2) {
        x = this.width / 2 + 7;
      } else if (x <= -this.width / 2) {
        x = this.width / 2 - 7;
      }
      this.projectiles.push(vec(x, y));
    }
  }

  update() {
    if (
      !this.triggered &&
      player.position.x >= this.position.x - this.width / 2
    ) {
      player.update = PlayerJumpHold.prototype.HoldUpdate;
      this.triggered = true;
    }
    if (!this.inert && player.position.x >= this.position.x + this.width / 2) {
      this.inert = true;
      player.update = Player.prototype.update;
      player.velocity = vec(player.velocity.x, 0);

      addScore(10);
    }

    color("red");
    box(this.position.x, 85, this.width, 10);
    box(this.position.x, 25, this.width, 10);
    this.position.x -= 1;

    let collision;
    color("black");

    this.projectiles.forEach((p) => {
      let newPos = vec(p.x + this.position.x, p.y);
      let c = box(newPos, 2);
      if (c.isColliding.rect.black) {
        collision = c;
        return;
      }
    });
    return collision;
  }

  offscreen() {
    return this.position.x + this.width / 2 <= 0;
  }
}

class DirectionPlayer extends Player {
  switch;
  jumping;
  DirectionSwitch() {
    this.position = vec(this.position.x, round(this.position.y));

    if (input.isJustPressed) {
      if (!this.switch) {
        this.position.add(30, 0);
        this.switch = true;
      } else {
        this.position.sub(30, 0);
        this.switch = false;
      }
    }
    // Jumping logic
    if (this.jumping && this.position.y >= 75) {
      this.jumping = false;
      this.velocity = vec(this.velocity.x, 0);
    }
    if (!this.jumping && input.isJustPressed) {
      this.velocity.add(vec(0, -2));
      play("jump");
      this.jumping = true;
    }

    this.position.add(this.velocity);

    if (this.position.y < 75) {
      this.velocity.add(vec(0, 0.1));
    } else if (this.position.y > 75) {
      this.velocity = vec(this.velocity.x, 0);
      this.position = vec(this.position.x, 75);
    }
    box(this.position, 10);
  }
}
class DirectionObstacle extends Obstacle {
  width = 100;
  spikes = [];
  triggered = false;
  inert = false;
  constructor() {
    super();
    this.position.add(this.width, 0);
    let numSpikes = Math.floor(Math.random() * 3) + 2;
    for (var i = 0; i < numSpikes; i++) {
      let bottom = 72;
      if (Math.random() > 0.5) {
        bottom = 35;
      }

      let x = (i * this.width) / numSpikes - this.width / 2;
      if (x >= this.width / 2) {
        x = this.width / 2 + 7;
      } else if (x <= -this.width / 2) {
        x = this.width / 2 - 7;
      }
      this.spikes.push(vec(x, bottom));
    }
  }
  update() {
    super.update();

    if (!this.triggered && player.position.x >= this.position.x - this.width / 2) {
      player.update = DirectionPlayer.prototype.DirectionSwitch;
      this.triggered = true;
    }
    
    if (!this.inert && player.position.x >= this.position.x + this.width/2) {
      this.inert = true;
      player.update = Player.prototype.update;
      
      player.position = vec(25, player.position.y);

      addScore(10);
    }

    color("blue");
    box(this.position.x, 85, this.width, 10);
    box(this.position.x, 25, this.width, 10);
    color("black");

    if (this.inert) {
      return;
    }
    let collision;
    this.spikes.forEach((s) => {
      let newPos = vec(s.x + this.position.x, s.y);
      let charName = "b";
      if (s.y <= 35) {
        charName = "a";
      }
      let c = char(charName, newPos, {
        scale: {
          x: 2,
          y: 5,
        },
      });
      if (c.isColliding.rect.black) {
        collision = c;
        return;
      }
    });
    return collision;
  }
}

class PlayerColorGauntlet extends Player {
  switchUpdate() {
    color("black");
    box(this.position, 10);

    if (input.isJustPressed || input.isPressed) {
      ++this.chargeTicks;
      this.inputBuffer = Math.floor(this.chargeTicks / 15) % 3;

      for (let i = 0; i <= this.inputBuffer; ++i) {
        // Use a non-black color for indicator to avoid unfair game loss due to indicator
        // overlapping with existing obstacles.
        color("light_black");
        box(15 + i * 35, 30, 25, 5);
      }
    }
    else if (input.isJustReleased) {
      this.inputColorIndex = this.inputBuffer;
    }
    else {
      this.inputColorIndex = -1;
      this.chargeTicks = 0;
    }
  }
}

class ColorGauntlet extends Obstacle {
  static palette = ["red", "green", "blue", "yellow"];
  
  constructor() {
    super();
    this.position = vec(80, 0);

    this.ticksSinceSpawn = 0;
    
    let colorSet = new Set();
    while (colorSet.size < 3) {
      colorSet.add(ColorGauntlet.palette[rndi(0, ColorGauntlet.palette.length)]);
    }

    this.colorChoices = Array.from(colorSet);
    
    // 2 to 4 bars per color gauntlet
    let barCount = rndi(2, 5);
    let offset = 0;
    this.colorBars = [];
    while (this.colorBars.length < barCount) {
      offset += rndi(50, 76);
      let barInfo = [this.colorChoices[rndi(0, this.colorChoices.length)], offset];
      this.colorBars.push(barInfo);
    }

    player.inputBuffer = 0;
    player.chargeTicks = 0;
    player.inputColorIndex = -1;
    
    // Allow 180 ticks to let the player memorize the colors
    this.width = 180 + offset + 10;
  }
  

  update() {
    let collision;

    // Give the player a 180-tick advance notice to allow memorization
    if (this.ticksSinceSpawn >= 180) {
      super.update();
      
      if (player.update != PlayerColorGauntlet.prototype.switchUpdate) {
        player.update = PlayerColorGauntlet.prototype.switchUpdate;
      }

      if (this.colorBars.length > 0 && player.inputColorIndex >= 0 &&
          this.colorChoices[player.inputColorIndex] == this.colorBars[0][0]) {
            this.colorBars.shift();
            addScore(5);
      }

      this.colorBars.forEach((barInfo) => {
        color(barInfo[0]);
        let bar = rect(this.position.x + barInfo[1], 45, 10, 40);
        if (bar.isColliding.rect.black) collision = bar;
      });
    }

    color("black");
    text("HOLD AND RELEASE", vec(5, 10));
    for (let i = 1; i <= this.colorChoices.length; ++i) {
      color(this.ticksSinceSpawn < 180 ? this.colorChoices[i - 1] : "black");
      text(`${i}`, 15 + 35 * (i - 1), 20);
    }

    ++this.ticksSinceSpawn;

    return collision;
  }

  offscreen() {
    if (this.colorBars.length == 0) {
      player.update = Player.prototype.update;
      return true;
    }
    return false;
  }
}

class PhasePlayer extends Player {
  switchUpdate()
  {
    if (input.isPressed)
    {
       color("blue");
       
    }
    else
    {
      color("black");
      
    }
    box(this.position, 10);
  }
}

class PhaseObstacle extends Obstacle {
  width = 100;
  finished = false;
  triggered = false;
  blueSpikes = [];
  blackSpikes = [];

  constructor() {
    super();
    this.position.add(this.width, 0);

    let numSpikes = 3;

    for (var i = 0; i < numSpikes; i++) {
      let bottom = 72;
      if (Math.random() > 0.5) {
        bottom = 35;
      }

      let x = (i * this.width) / numSpikes - this.width / 2;
      if (x >= this.width / 2) {
        x = this.width / 2 + 7;
      } else if (x <= -this.width / 2) {
        x = this.width / 2 - 7;
      }

      if (rnd(0, 10) >= 5){
        this.blueSpikes.push(vec(x, bottom));
      }
      else{
        this.blackSpikes.push(vec(x, bottom));
      }
    }
  }

  update()
  {
    super.update();
    if (
      !this.triggered &&
      player.position.x >= this.position.x - this.width / 2 - 5
    ) {
      player.update = PhasePlayer.prototype.switchUpdate;
      this.triggered = true;
    }
    if (!this.finished && player.position.x >= this.position.x + this.width / 2 + 5) {
      this.finished = true;
      player.update = Player.prototype.update;

      addScore(10);
    }

    if(!this.finished)
    {
      color("black");
      text("HOLD TO SWAP", vec(5, 10));
      text("MATCH COLOR", vec(5, 20));
    }

      color("green");
      box(this.position.x, 85, this.width, 10);
      box(this.position.x, 25, this.width, 10);
      
      color("blue");
      this.blueSpikes.forEach((s) => {
        let newPos = vec(s.x + this.position.x, this.position.y - 5);
        let charName = "b";
        let c = char(charName, newPos, {
          scale: {
            x: 2,
            y: 5,
          },
        });
        if (c.isColliding.rect.black) {
          play("hit");
          end("You lose.");
        }
    });

    color("black");
    this.blackSpikes.forEach((s) => {
      let newPos = vec(s.x + this.position.x, this.position.y - 5);
      let charName = "b";
      let c = char(charName, newPos, {
        scale: {
          x: 2,
          y: 5,
        },
      });
      if (c.isColliding.rect.blue) {
        play("hit");
        end("You lose.");
      }
  });
}
}


let obstacleSpawnTimer;
let timerTarget = 100;

let obstaclesToSpawn = [JetPackObstacle, GravitySwitcher, DirectionObstacle, ColorGauntlet, PhaseObstacle, Box];
let obstacles;

function update() {
  if (!ticks) {
    player = new Player();
    obstacleSpawnTimer = -timerTarget;
    obstacles = [];
  }

  if (ticks - obstacleSpawnTimer > timerTarget) {
    let o = new obstaclesToSpawn[rndi(0, obstaclesToSpawn.length)]();
    obstacles.push(o);
    obstacleSpawnTimer = ticks;
    timerTarget = o.width + 100;
  }
  player.update();
  remove(obstacles, (o) => {
    if (o.offscreen()) {
      return true;
    }
    let c = o.update();
    if (c && c.isColliding.rect.black) {
      play("hit");
      end("You lose.");
    }
  });
}
