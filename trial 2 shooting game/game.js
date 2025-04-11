// Select DOM elements
const fileInput = document.getElementById('svg-upload');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let walls = []; // Array to store wall coordinates

// Handle file upload
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'image/svg+xml') {
    const svgText = await file.text(); // Read the SVG file as text
    parseSVG(svgText); // Parse the SVG content
    renderGame(); // Start rendering the game
  } else {
    alert('Please upload a valid SVG file.');
  }
});

// Parse the SVG content
function parseSVG(svgText) {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  const paths = svgDoc.querySelectorAll('path, rect, circle, polygon');

  walls = []; // Reset walls array

  paths.forEach((path) => {
    const type = path.tagName.toLowerCase();
    switch (type) {
      case 'path':
        const d = path.getAttribute('d');
        const pathCommands = parsePathData(d);
        walls.push(...pathCommands);
        break;
      case 'rect':
        const x = parseFloat(path.getAttribute('x'));
        const y = parseFloat(path.getAttribute('y'));
        const width = parseFloat(path.getAttribute('width'));
        const height = parseFloat(path.getAttribute('height'));
        walls.push({ type: 'rect', x, y, width, height });
        break;
      case 'circle':
        const cx = parseFloat(path.getAttribute('cx'));
        const cy = parseFloat(path.getAttribute('cy'));
        const r = parseFloat(path.getAttribute('r'));
        walls.push({ type: 'circle', cx, cy, r });
        break;
      case 'polygon':
        const points = path.getAttribute('points').split(' ').map((p) => {
          const [x, y] = p.split(',').map(parseFloat);
          return { x, y };
        });
        walls.push({ type: 'polygon', points });
        break;
      default:
        console.warn(`Unsupported SVG element: ${type}`);
    }
  });

  console.log('Parsed walls:', walls);
}

// Helper function to parse SVG path data
function parsePathData(d) {
  const commands = [];
  const tokens = d.match(/[a-df-z]|[-+]?\d*\.?\d+/gi); // Split into commands and numbers
  let currentX = 0, currentY = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (/[a-df-z]/i.test(token)) {
      const command = token.toLowerCase();
      const args = [];
      while (i + 1 < tokens.length && !/[a-df-z]/i.test(tokens[i + 1])) {
        args.push(parseFloat(tokens[++i]));
      }

      if (command === 'm' || command === 'l') {
        const x = args[0] + (command === 'm' ? currentX : 0);
        const y = args[1] + (command === 'm' ? currentY : 0);
        commands.push({ type: command === 'm' ? 'move' : 'line', x, y });
        currentX = x;
        currentY = y;
      } else if (command === 'h') {
        currentX = args[0];
        commands.push({ type: 'line', x: currentX, y: currentY });
      } else if (command === 'v') {
        currentY = args[0];
        commands.push({ type: 'line', x: currentX, y: currentY });
      }
    }
  }

  return commands;
}

// Render the game
function renderGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw walls
  walls.forEach((wall) => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    if (wall.type === 'rect') {
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    } else if (wall.type === 'circle') {
      ctx.beginPath();
      ctx.arc(wall.cx, wall.cy, wall.r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (wall.type === 'polygon') {
      ctx.beginPath();
      ctx.moveTo(wall.points[0].x, wall.points[0].y);
      wall.points.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    } else if (wall.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(wall.x, wall.y);
      ctx.stroke();
    }
  });

  // Add game logic here (e.g., player movement, collision detection)
  requestAnimationFrame(renderGame);
}

// Set canvas size to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player settings
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: 30,
  height: 30,
  speed: 5,
  health: 100, // Player health
};

// Mouse position
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// Bullets array
const bullets = [];

// Villain settings
const villains = [];
const villainSpeed = 3;
const villainHealth = 50;

// Bombs array and cooldown tracking
const bombs = [];
let lastBombTime = 0; // Track the last time a bomb was planted



// Key states for movement and shooting
const keys = {};

// Offset for the environment (background and walls)
const offset = { x: 0, y: 0 };

// Event listeners for key presses
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;

  // Plant a bomb when 'Z' is pressed
  if (e.key.toLowerCase() === 'z') {
    const currentTime = Date.now();
    if (currentTime - lastBombTime >= 5000) { // 5-second cooldown
      bombs.push({
        x: player.x,
        y: player.y,
        plantedTime: currentTime, // Track when the bomb was planted
      });
      lastBombTime = currentTime; // Update the last bomb planting time
    }
  }

  // Shooting when spacebar is pressed
  if (e.code === 'Space') {
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * 10,
      dy: Math.sin(angle) * 10,
      width: 5,
      height: 5,
      isPlayerBullet: true,
    });
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Event listener for mouse movement
window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Check if two rectangles collide
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Add a villain
function addVillain(x, y) {
  villains.push({
    x,
    y,
    width: 30,
    height: 30,
    health: villainHealth,
    lastShotTime: 0, // Track time of last shot
    dx: Math.random() < 0.5 ? -villainSpeed : villainSpeed, // Initial random horizontal direction
    dy: Math.random() < 0.5 ? -villainSpeed : villainSpeed, // Initial random vertical direction
  });
}

// Draw health bar
function drawHealthBar(x, y, health, maxHealth) {
  ctx.fillStyle = 'red';
  ctx.fillRect(x - 20, y - 20, 40, 5); // Background bar
  ctx.fillStyle = 'green';
  ctx.fillRect(x - 20, y - 20, (health / maxHealth) * 40, 5); // Health bar
}

// Update function
function update() {
  // Temporary offsets for collision detection
  let tempOffsetX = offset.x;
  let tempOffsetY = offset.y;

  // Collision detection for horizontal movement (A/D keys)
  if (keys['a'] || keys['d']) {
    if (keys['a']) {
      tempOffsetX += player.speed;
    }
    if (keys['d']) {
      tempOffsetX -= player.speed;
    }
    const playerRect = {
      x: player.x - player.width / 2,
      y: player.y - player.height / 2,
      width: player.width,
      height: player.height,
    };
    let horizontalCollisionDetected = false;
    walls.forEach((wall) => {
      const wallRect = {
        x: wall.x + tempOffsetX,
        y: wall.y + offset.y, // Use current vertical offset
        width: wall.width,
        height: wall.height,
      };
      if (checkCollision(playerRect, wallRect)) {
        horizontalCollisionDetected = true;
      }
    });
    if (!horizontalCollisionDetected) {
      offset.x = tempOffsetX;
    } else {
      tempOffsetX = offset.x; // Reset horizontal offset to prevent diagonal sliding
    }
  }

  // Collision detection for vertical movement (W/S keys)
  if (keys['w'] || keys['s']) {
    if (keys['w']) tempOffsetY += player.speed;
    if (keys['s']) tempOffsetY -= player.speed;
    const playerRect = {
      x: player.x - player.width / 2,
      y: player.y - player.height / 2,
      width: player.width,
      height: player.height,
    };
    let verticalCollisionDetected = false;
    walls.forEach((wall) => {
      const wallRect = {
        x: wall.x + offset.x, // Use current horizontal offset
        y: wall.y + tempOffsetY,
        width: wall.width,
        height: wall.height,
      };
      if (checkCollision(playerRect, wallRect)) {
        verticalCollisionDetected = true;
      }
    });
    if (!verticalCollisionDetected) {
      offset.y = tempOffsetY;
    } else {
      tempOffsetY = offset.y; // Reset vertical offset to prevent diagonal sliding
    }
  }

  bullets.forEach((bullet, index) => {
    if (keys['a'] || keys['w'] || keys['s'] || keys['d']) {
      if (keys['a']) {
        bullet.x += player.speed;
      }
      if (keys['d']) {
        bullet.x -= player.speed;
      }
      if (keys['w']) {
        bullet.y += player.speed;
      }
      if (keys['s']) {
        bullet.y -= player.speed;
      }
}});
  
  // Update bombs
  const currentTime = Date.now();
  bombs.forEach((bomb, index) => {
    if (currentTime - bomb.plantedTime >= 3000) { // 3 seconds to explode
      // Explode the bomb
      const explosionRange = 20;

      // Damage player if in range
      const distanceToPlayer = Math.hypot(player.x - bomb.x, player.y - bomb.y);
      if (distanceToPlayer <= explosionRange) {
        player.health = Math.max(0, player.health / 2); // Reduce player health by half
      }

      // Damage villains if in range
      villains.forEach((villain, vIndex) => {
        const distanceToVillain = Math.hypot(villain.x - bomb.x, villain.y - bomb.y);
        if (distanceToVillain <= explosionRange) {
          villain.health = Math.max(0, villain.health / 2); // Reduce villain health by half
          if (villain.health <= 0) {
            villains.splice(vIndex, 1); // Remove dead villain
          }
        }
      });

      // Remove the bomb after explosion
      bombs.splice(index, 1);
    }


    

  });


  
  // Update bullets
  bullets.forEach((bullet, index) => {
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;

    // Check collision with walls
    walls.forEach((wall) => {
      const wallX = wall.x + offset.x;
      const wallY = wall.y + offset.y;
      if (
        bullet.x < wallX + wall.width &&
        bullet.x + bullet.width > wallX &&
        bullet.y < wallY + wall.height &&
        bullet.y + bullet.height > wallY
      ) {
        bullets.splice(index, 1); // Remove bullet on collision
      }
    });

    // Check collision with villains
    villains.forEach((villain, vIndex) => {
      const villainRect = {
        x: villain.x + offset.x,
        y: villain.y + offset.y,
        width: villain.width,
        height: villain.height,
      };
      if (
        bullet.isPlayerBullet &&
        bullet.x < villainRect.x + villainRect.width &&
        bullet.x + bullet.width > villainRect.x &&
        bullet.y < villainRect.y + villainRect.height &&
        bullet.y + bullet.height > villainRect.y
      ) {
        villain.health -= 10; // Damage villain
        bullets.splice(index, 1); // Remove bullet
        if (villain.health <= 0) {
          villains.splice(vIndex, 1); // Remove dead villain
        }
      }
    });

    // Remove bullets that go off-screen
    if (
      bullet.x < 0 ||
      bullet.x > canvas.width ||
      bullet.y < 0 ||
      bullet.y > canvas.height
    ) {
      bullets.splice(index, 1);
    }
  });

  villains.forEach((villain) => {
    // Randomly choose a direction if no direction is set
    if (!villain.direction) {
        const directions = ['up', 'down', 'left', 'right'];
        villain.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    // Track the time since the villain last hit a wall
    const currentTime = Date.now();
    if (!villain.lastWallHitTime) {
        villain.lastWallHitTime = currentTime;
        villain.lastDirectionChangeTime = currentTime; // Set the initial direction change time
    }

    // Calculate the new position based on the current direction
    let newX = villain.x;
    let newY = villain.y;
    switch (villain.direction) {
        case 'up':
            newY -= villainSpeed;
            break;
        case 'down':
            newY += villainSpeed;
            break;
        case 'left':
            newX -= villainSpeed;
            break;
        case 'right':
            newX += villainSpeed;
            break;
    }

    // Create the villain's bounding box at the new position
    const newVillainRect = {
        x: newX + offset.x,
        y: newY + offset.y,
        width: villain.width,
        height: villain.height,
    };

    // Check for collisions with walls
    let collisionDetected = false;
    walls.forEach((wall) => {
        const wallRect = {
            x: wall.x + offset.x,
            y: wall.y + offset.y,
            width: wall.width,
            height: wall.height,
        };
        if (checkCollision(newVillainRect, wallRect)) {
            collisionDetected = true;
        }
    });

    // If no collision, move the villain
    if (!collisionDetected) {
        villain.x = newX;
        villain.y = newY;

        // If no collision for 1 second, change direction every 500ms
        if (currentTime - villain.lastWallHitTime > 1000) {
            if (currentTime - villain.lastDirectionChangeTime > 500) {
                // Change direction to a perpendicular one
                const perpendicularDirections = {
                    up: ['left', 'right'],
                    down: ['left', 'right'],
                    left: ['up', 'down'],
                    right: ['up', 'down'],
                };

                // Get the perpendicular directions based on the current direction
                const possibleDirections = perpendicularDirections[villain.direction];
                villain.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                villain.lastDirectionChangeTime = currentTime;
            }
        }
    } else {
        // If a collision is detected, update last hit time
        villain.lastWallHitTime = currentTime;

        // Choose a new random direction when a collision occurs
        const directions = ['up', 'down', 'left', 'right'];
        villain.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    // Shoot at player every 0.5 seconds
    if (currentTime - villain.lastShotTime > 500) {
        // Adjust both player and villain positions by the offset
        const adjustedPlayerX = player.x + offset.x;
        const adjustedPlayerY = player.y + offset.y;
        const adjustedVillainX = villain.x + offset.x;
        const adjustedVillainY = villain.y + offset.y;

        // Calculate the direction from the villain to the player
        const dx = adjustedPlayerX - adjustedVillainX;
        const dy = adjustedPlayerY - adjustedVillainY;
        const distance = Math.hypot(dx, dy); // Distance between villain and player

        // Avoid division by zero
        if (distance > 0) {
            // Normalize the direction vector
            const directionX = dx / distance;
            const directionY = dy / distance;

            // Create a bullet heading towards the player
            bullets.push({
                x: adjustedVillainX,
                y: adjustedVillainY,
                dx: directionX * 5, // Bullet speed in the x-direction
                dy: directionY * 5, // Bullet speed in the y-direction
                width: 5,
                height: 5,
                isPlayerBullet: false,
            });

            // Update the last shot time
            villain.lastShotTime = currentTime;
        }
    }
});


  // Check if player is hit by villain bullets
  bullets.forEach((bullet, index) => {
    if (!bullet.isPlayerBullet) {
      const playerRect = {
        x: player.x - player.width / 2,
        y: player.y - player.height / 2,
        width: player.width,
        height: player.height,
      };
      if (
        bullet.x < playerRect.x + playerRect.width &&
        bullet.x + bullet.width > playerRect.x &&
        bullet.y < playerRect.y + playerRect.height &&
        bullet.y + bullet.height > playerRect.y
      ) {
        player.health -= 10; // Damage player
        bullets.splice(index, 1); // Remove bullet
      }
    }
  });
}

// Draw function
function draw() {
  // Draw grass background
  const grassGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grassGradient.addColorStop(0, '#4CAF50'); // Light green
  grassGradient.addColorStop(1, '#2E7D32'); // Dark green
  ctx.fillStyle = grassGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw walls with offset
  ctx.fillStyle = 'brown';
  walls.forEach((wall) => {
    const wallX = wall.x + offset.x;
    const wallY = wall.y + offset.y;
    ctx.fillRect(wallX, wallY, wall.width, wall.height);
  });

  // Draw bombs
  ctx.fillStyle = 'orange';
  bombs.forEach((bomb) => {
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, 10, 0, Math.PI * 2); // Draw bomb as a circle
    ctx.fill();
  });

  // Draw bullets
  ctx.fillStyle = 'red';
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  

  // Draw player (centered)
  ctx.fillStyle = 'blue';
  ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  // Draw player health bar
  drawHealthBar(player.x, player.y - 20, player.health, 100);

  // Draw villains
  ctx.fillStyle = 'purple';
  villains.forEach((villain) => {
    const villainX = villain.x + offset.x;
    const villainY = villain.y + offset.y;
    ctx.fillRect(villainX, villainY, villain.width, villain.height);

    // Draw villain health bar
    drawHealthBar(villainX + villain.width / 2, villainY - 10, villain.health, villainHealth);

  });

  // Draw dashed gun pointing towards mouse
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]); // Dashed line pattern
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(mouseX, mouseY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset to solid line for other drawings
}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start the game loop
addVillain(200, 200); // Add a villain
addVillain(200, 150); // Add a villain
addVillain(400, 200); // Add a villain
addVillain(400, 150); // Add a villain
addVillain(400, 150); // Add a villain
gameLoop();