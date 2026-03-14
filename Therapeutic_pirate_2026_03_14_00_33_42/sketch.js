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

