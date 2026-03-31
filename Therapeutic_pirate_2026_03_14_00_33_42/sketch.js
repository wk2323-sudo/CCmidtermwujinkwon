let particles = [];
let state = 0;
let stateTimer = 0;


const sceneDurations = [800, 1020, 900, 1200, 800];


let bonds = [];
const SNAP_DIST = 72;  
const BOND_LIFE = 90;  

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);

  for (let i = 0; i < 180; i++) {
    particles.push(new Particle(random(width), random(height)));
  }
}

function draw() {
  handleBackground(state);
  updateStateMachine();

  
  if (state === 3) {
    updateBonds();
    drawBonds();
  } else {
    bonds = [];
  }

  
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    p.applyBehaviors(state);

    if (state === 3) {
      for (let j = i + 1; j < particles.length; j++) {
        p.interact(particles[j]);
      }
    }

    p.update();
    p.display(state);
  }

  if (state === 1) drawFieldLines(mouseX, mouseY, 220);

  displaySceneLabel();
}


function updateStateMachine() {
  stateTimer++;
  if (stateTimer > sceneDurations[state]) {
    state = (state + 1) % 5;
    stateTimer = 0;
    bonds = [];
  }
}


function handleBackground(s) {
  if (s === 2)      background(15, 20, 40, 40);
  else if (s === 3) background(40, 15, 15, 40);
  else if (s === 4) background(255, 255, 255, 30);
  else              background(10, 15, 30, 40);
}


function drawFieldLines(x, y, radius) {
  push();
  noFill();
  let pulse   = sin(frameCount * 0.07) * 22;
  let numRings = 5;

  for (let r = 0; r < numRings; r++) {
    let rr = 45 + r * 38 + pulse;
   
    let a  = map(r, 0, numRings - 1, 170, 25);
    let sw = map(r, 0, numRings - 1, 1.8, 0.3);
    stroke(180, 220, 255, a);
    strokeWeight(sw);
    ellipse(x, y, rr, rr);
  }


  for (let a = 0; a < TWO_PI; a += TWO_PI / 12) {
    let x2 = x + cos(a) * (radius + pulse * 0.4);
    let y2 = y + sin(a) * (radius + pulse * 0.4);
    stroke(180, 220, 255, 30);
    strokeWeight(0.5);
    line(x, y, x2, y2);
  }
  pop();
}

function updateBonds() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let a = particles[i];
      let b = particles[j];
      if (a.charge === b.charge) continue; 

      let d = dist(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
      if (d < SNAP_DIST) {
        let existing = bonds.find(
          bd => (bd.a === a && bd.b === b) || (bd.a === b && bd.b === a)
        );
        if (!existing) {
          bonds.push({ a, b, life: BOND_LIFE, maxLife: BOND_LIFE });
        } else {
          existing.life = min(existing.life + 4, BOND_LIFE); 
        }
        
        let pull = p5.Vector.sub(b.pos, a.pos).normalize().mult(0.38);
        a.applyForce(pull);
        b.applyForce(pull.copy().mult(-1));
      }
    }
  }

  
  for (let i = bonds.length - 1; i >= 0; i--) {
    bonds[i].life--;
    if (bonds[i].life <= 0) bonds.splice(i, 1);
  }
}

function drawBonds() {
  push();
  noFill();
  for (let bd of bonds) {
    let t  = bd.life / bd.maxLife; 
    let sw = map(t, 0, 1, 0.2, 2.6);
    let a  = map(t, 0, 1, 0, 210);

    
    stroke(180, 80, 200, a);
    strokeWeight(sw);
    line(bd.a.pos.x, bd.a.pos.y, bd.b.pos.x, bd.b.pos.y);

    
    let mx = (bd.a.pos.x + bd.b.pos.x) * 0.5;
    let my = (bd.a.pos.y + bd.b.pos.y) * 0.5;
    let haloR = map(t, 0, 1, 0, 10) + sin(frameCount * 0.18) * 3;
    stroke(220, 140, 255, a * 0.5);
    strokeWeight(sw * 2.5);
    point(mx, my);
    noFill();
    strokeWeight(0.6);
    stroke(220, 140, 255, a * 0.25);
    ellipse(mx, my, haloR, haloR);
  }
  pop();
}

class Particle {
  constructor(x, y) {
    this.pos      = createVector(x, y);
    this.vel      = p5.Vector.random2D();
    this.acc      = createVector(0, 0);
    this.maxSpeed = random(2, 5);
    this.maxForce = 0.2;
    this.charge   = random([-1, 1]); 
    this.size     = random(4, 10);
    this.history  = [];

    
    this.forceMag = 0;
  }

  applyBehaviors(s) {
    if (s === 0) {
      let drift = p5.Vector.random2D().mult(0.5);
      this.applyForce(drift);
    }
    else if (s === 1) {
      let target = createVector(mouseX, mouseY);
      this.applyForce(this.seek(target).mult(1.2));
    }
    else if (s === 2) {
      let flow = createVector(
        cos(this.pos.y * 0.01),
        sin(this.pos.x * 0.01)
      );
      this.applyForce(flow.mult(1.5));
    }
    else if (s === 4) {
      let center = createVector(width / 2, height / 2);
      this.applyForce(this.seek(center).mult(2.5));
    }
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  interact(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    if (d < 100 && d > 0) {
      let force = p5.Vector.sub(this.pos, other.pos);
      force.normalize();

      if (this.charge === other.charge) {
        force.mult(1.2 / (d * 0.1));   
      } else {
        force.mult(-1.8 / (d * 0.1));  
      }

      this.applyForce(force);
      this.forceMag = force.mag(); 
    }
  }

  applyForce(f) {
    this.acc.add(f);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.edges();

    this.history.push(this.pos.copy());
    if (this.history.length > 14) this.history.shift();

    this.forceMag *= 0.88; 
  }

  display(s) {
    
    let r, g, b;
    if (this.charge > 0) { r = 30;  g = 160; b = 255; } 
    else                  { r = 255; g = 50;  b = 100; } 
    if (s === 4)          { r = 20;  g = 20;  b = 30;  } 

    let speed     = this.vel.mag();
    let intensity = constrain(speed / this.maxSpeed, 0, 1);
    let forceBoost = constrain(this.forceMag * 18, 0, 100);

   
    let alpha = constrain(120 + intensity * 80 + forceBoost, 60, 255);

  
    let sw = map(intensity, 0, 1, 0.6, 2.2) +
             map(this.forceMag, 0, 5, 0, 1.5);

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

  
    noFill();
    stroke(r, g, b, alpha * 0.4);
    strokeWeight(sw * 0.7);
    beginShape();
    for (let i = 0; i < this.history.length; i++) {
      let offset = p5.Vector.sub(this.history[i], this.pos);
      vertex(offset.x, offset.y);
    }
    endShape();

    // Body
    fill(r, g, b, alpha);
    noStroke();
    let bodyLen = this.size * (1 + intensity * 0.6);
    rect(-bodyLen, -1.2, bodyLen * 2, 2.4);

    
    let dotR = this.size * 0.55 + map(this.forceMag, 0, 5, 0, 3);
    if (this.charge > 0) {
      fill(r, g, b, alpha);
      noStroke();
      ellipse(bodyLen, 0, dotR, dotR);
    } else {
      noFill();
      stroke(r, g, b, alpha);
      strokeWeight(sw);
      ellipse(bodyLen, 0, dotR, dotR);
    }

    pop();
  }

  edges() {
    if (this.pos.x > width)  this.pos.x = 0;
    if (this.pos.x < 0)      this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0)      this.pos.y = height;
  }
}


function mousePressed() {
  for (let p of particles) {
    if (dist(mouseX, mouseY, p.pos.x, p.pos.y) < 250) {
      p.charge *= -1;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


function displaySceneLabel() {
  let barWidth = map(stateTimer, 0, sceneDurations[state], 0, width);
  noStroke();
  fill(255, 255, 255, 80);
  rect(0, height - 4, barWidth, 4);
}
