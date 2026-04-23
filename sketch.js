//firebase configs
const firebaseConfig = {
  apiKey: "AIzaSyAy5NFOTKJDtu_jeeic6-bpSA20iGYsLiU",
  authDomain: "gt-campus-transportation.firebaseapp.com",
  projectId: "gt-campus-transportation",
  storageBucket: "gt-campus-transportation.firebasestorage.app",
  messagingSenderId: "819859740404",
  appId: "1:819859740404:web:a93015b80167c220a930a1"
};

//firebase init
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const docRef = db.collection("survey").doc("results");

//data
let data = {
  Bicycles: 0,
  GT_Stinger_Buses: 0,
  Pedestrians: 0,
  Rented_Scooters: 0,
  Personal_Scooters: 0,
  Cars: 0
};

// UI labels
let options = [
  "Bicycles",
  "GT Stinger Buses",
  "Pedestrians",
  "Rented Scooters",
  "Personal Scooters",
  "Cars"
];

// mapping to firebase fields
let mapToField = {
  "Bicycles": "Bicycles",
  "GT Stinger Buses": "GT_Stinger_Buses",
  "Pedestrians": "Pedestrians",
  "Rented Scooters": "Rented_Scooters",
  "Personal Scooters": "Personal_Scooters",
  "Cars": "Cars"
};


//global variable
let selectedOption = null;
let labelThreshold = 70;
let screen = "results";
let legendWidth = 200;
let padding = 40;
let bubbles = [];
let selectedBubble = null;
let bubbleColors = [
  [255, 99, 132],   // pink-red
  [54, 162, 235],   // blue
  [255, 206, 86],   // yellow
  [75, 192, 192],   // teal
  [153, 102, 255],  // purple
  [139, 94, 60]    // brown
];

function setup() {
  createCanvas(600, 600);
  textAlign(CENTER, CENTER);
  
  updateBubbles();
  
  viewBtn = {
    x: width/2 - 200,
    y: 450,
    w: 150,
    h: 40
  };

  submitBtn = {
    x: width/2 + 100,
    y: 450,
    w: 120,
    h: 40
  };
  
  //data live updates 
  docRef.onSnapshot((doc) => {
    if (doc.exists) {
      data = doc.data();
      updateBubbles();
    }
  });  
}

//create bubbles
function updateBubbles() {
  bubbles = [];

  let values = options.map(opt => {
    let field = mapToField[opt];
    return Number(data[field]) || 0;
  });

  let maxVal = Math.max(...values, 1);
  let allZero = values.every(v => v === 0);

  for (let i = 0; i < options.length; i++) {
    let key = options[i];
    let field = mapToField[key];
    let val = Number(data[field]) || 0;

    let baseSize = 15;

    let size = baseSize + Math.sqrt(val) * 20;
    //not an exponential growth
    size = constrain(size, 30, 140);

    bubbles.push({
      key,
      value: val,
      x: random(80, width - legendWidth - padding),
      y: random(140, height - 160),
      r: size / 2,
      targetR: size / 2,
      color: bubbleColors[i % bubbleColors.length]
    });
  }
}

function draw() {
  drawGradientBG();
  
  if (screen === "results"){
    drawResultScreen();
  } else if (screen === "vote") {
    drawVoteScreen();
  }
}

function drawVoteScreen() {
  //title
  textSize(18);
  fill(0);
  textStyle(BOLD);
  text("Which mode causes the most issues on campus?", width/2, 40);
  textStyle(NORMAL);
  
  //options
  for(let i = 0; i < options.length; i++) {
    let y = 80 + i * 60;
    
    //highlight the selected option
    if (selectedOption === options[i]) {
      fill(180, 220, 255);
    } else {
      fill(255);
    }
    stroke(200);
    rect(150, y, 300, 40, 10);
    
    fill(0);
    noStroke();
    text(options[i], width/2, y + 20);
  }
  
  //submit button
  fill(54, 162, 235);
  rect(submitBtn.x, submitBtn.y, submitBtn.w, submitBtn.h, 10);
  
  fill(255);
  noStroke();
  text("Submit", submitBtn.x + submitBtn.w/2, submitBtn.y + 20);
  
  //view the results button w/ voting
  fill(0);
  rect(viewBtn.x, viewBtn.y, viewBtn.w, viewBtn.h, 10);
  fill(255)
  textSize(16);
  text("View Results", viewBtn.x + viewBtn.w/2, viewBtn.y + 20);
}

function drawResultScreen() {
  fill(20);
  textSize(28);
  textStyle(BOLD);
  text("Live Campus Risk", width / 2, 40);
  textStyle(NORMAL);
  
  textSize(16);
  text("(Click a Bubble to view the vote count)", width/2, 70);

  //no collision
  for (let i = 0; i < bubbles.length; i++) {
    for (let j = i + 1; j < bubbles.length; j++) {
      let b1 = bubbles[i];
      let b2 = bubbles[j];

      let dx = b2.x - b1.x;
      let dy = b2.y - b1.y;
      let d = sqrt(dx * dx + dy * dy);
      let minDist = b1.r + b2.r + 25;

      if (d < minDist) {
        let angle = atan2(dy, dx);
        let move = (minDist - d) / 2;

        b1.x -= cos(angle) * move;
        b1.y -= sin(angle) * move;

        b2.x += cos(angle) * move;
        b2.y += sin(angle) * move;
      }
    }
  }
  
  // draw bubbles
  for (let b of bubbles) {
    b.r = b.targetR;

    drawGlow(b.x, b.y, b.r * 2, b.color);
    fill(b.color[0], b.color[1], b.color[2], alpha);
    noStroke();
    ellipse(b.x, b.y, b.r * 2);

  }
  
  drawLegend();

  //selected bubble info
  if (selectedBubble) {
    fill(0);
    textSize(14);
    text(
      selectedBubble.value + " votes",
      mouseX,
      mouseY
    );
  }

  // back button
  fill(0);
  rect(200, 480, 200, 40, 10);

  fill(255);
  textSize(16);
  text("Share your opinion!", width / 2, 500);
}

function drawLegend() {
  let x = width - 180;
  let y = 120;

  textAlign(LEFT, CENTER);
  textSize(14);

  for (let i = 0; i < options.length; i++) {
    let key = options[i];
    let field = mapToField[key];
    let val = Number(data[field]) || 0;

    fill(bubbleColors[i % bubbleColors.length]);
    noStroke();
    rect(x, y + i * 30, 12, 12, 3);

    fill(0);
    text(key, x + 20, y + i * 30 + 6);
  }

  textAlign(CENTER, CENTER);
}

function drawGlow(x, y, baseSize, col) {
  noStroke();

  for (let i = 6; i > 0; i--) {
    let alpha = map(i, 6, 0, 0, 80);
    fill(col[0], col[1], col[2], alpha);

    ellipse(x, y, baseSize + i * 2);
  }
}

function drawGradientBG() {
  for (let y = 0; y < height; y++) {

    let t = map(y, 0, height, 0, 1);

    let topColor = color(220, 235, 255);   // soft blue
    let bottomColor = color(250, 250, 255); // near white

    let c = lerpColor(topColor, bottomColor, t);

    stroke(c);
    line(0, y, width, y);
  }
}

function mousePressed() {
  if(screen === "vote") {
      //select option
    for(let i = 0; i < options.length; i++) {
      let y = 80 + i * 60;
      if(mouseX > 150 && mouseX < 450 && mouseY > y && mouseY < y + 40) {
        selectedOption = options[i];
      }
    }
  
    //submit
    if(mouseX > width/2 + 40 && mouseX < width/2 + 160 && mouseY > 450 && mouseY < 490) {
      if (selectedOption) {
        vote(selectedOption);
        selectedOption = null;
        screen = "results";
      }
    }
    
    //view results
    if(mouseX > width/2 - 200 && mouseX < width/2 - 50 && mouseY > 450 && mouseY < 490) {
      screen = "results";
    }
  }
  
  else if (screen === "results") {
    selectedBubble = null;

    for (let b of bubbles) {
      let d = dist(mouseX, mouseY, b.x, b.y);
      if (d < b.r) {
        selectedBubble = b;
      }
    }
    
    //share your opinion button
    if (mouseX > 200 && mouseX < 400 && mouseY > 480 && mouseY < 520) {
      screen = "vote";
      selectedBubble = null;
    }
  }
}

//firebase write
function vote(option) {
  const field = mapToField[option];

  docRef.get().then((doc) => {
    let current = doc.exists ? doc.data()[field] || 0 : 0;

    docRef.set(
      {
        [field]: current + 1
      },
      { merge: true }
    );
  });
}