let particles = [];
let state = 0;
let stateTimer = 0;
const sceneDuration = 450; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 180; i++) {
    particles.push(new Particle(random(width), random(height)));
  }
}

function draw() {
  handleBackground(state);
  
  updateStateMachine();
  displaySceneLabel(); 

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
  
  if (state === 1) {
    drawFieldLines(mouseX, mouseY, 200);
  }
}

function updateStateMachine() {
  stateTimer++;
  if (stateTimer > sceneDuration) {
    state = (state + 1) % 6; 
    stateTimer = 0;
  }
}

function handleBackground(s) {
  
  if (s === 2) background(15, 20, 40, 40); 
  else if (s === 3) background(40, 15, 15, 40); 
  else if (s === 4) background(255, 30); 
  else background(10, 15, 30, 40); 
}

function drawFieldLines(x, y, radius) {
  push();
  noFill();
  stroke(255, 70);
  let pulse = sin(frameCount * 0.1) * 20;
  for (let r = 50; r < radius; r += 40) {
    ellipse(x, y, r + pulse, r + pulse);
  }
  pop();
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    this.maxSpeed = random(2, 5);
    this.maxForce = 0.2;
    this.charge = random([-1, 1]); 
    this.size = random(4, 10);
    this.history = []; 
  }

  applyBehaviors(s) {
    if (s === 0) { // Entropy
      let drift = p5.Vector.random2D().mult(0.5);
      this.applyForce(drift);
    } 
    else if (s === 1) { // Induction (Mouse)
      let target = createVector(mouseX, mouseY);
      this.applyForce(this.seek(target).mult(1.2));
    }
    else if (s === 2) { // Alignment (Flow)
      let flow = createVector(cos(this.pos.y * 0.01), sin(this.pos.x * 0.01));
      this.applyForce(flow.mult(1.5));
    }
    else if (s === 4) { // High Tension (Center)
      let center = createVector(width/2, height/2);
      this.applyForce(this.seek(center).mult(2.5));
    }
    else if (s === 5) { // Residual (Friction)
      this.vel.mult(0.92);
    }
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }
