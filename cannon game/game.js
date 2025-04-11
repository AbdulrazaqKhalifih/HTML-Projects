// Set up the canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    speed: 5,
    color: 'blue',
    dx: 0,
    dy: 0
};

// Bullet object
const bullets = [];
const bulletSpeed = 7;

// Game loop function
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayer();
    drawPlayer();
    drawBullets();
    requestAnimationFrame(gameLoop);
}

// Update player position
function movePlayer() {
    player.x += player.dx;
    player.y += player.dy;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

// Draw player on the canvas
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Draw bullets on the canvas
function drawBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        ctx.fillStyle = 'red';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Remove bullets when they go off-screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
            i--;
        }
    }
}

// Handle keypresses for player movement
function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        player.dx = player.speed;
    }
    else if (e.key == "Left" || e.key == "ArrowLeft") {
        player.dx = -player.speed;
    }
    else if (e.key == "Up" || e.key == "ArrowUp") {
        player.dy = -player.speed;
    }
    else if (e.key == "Down" || e.key == "ArrowDown") {
        player.dy = player.speed;
    }
}

// Handle key releases to stop player movement
function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight" || e.key == "Left" || e.key == "ArrowLeft") {
        player.dx = 0;
    }
    else if (e.key == "Up" || e.key == "ArrowUp" || e.key == "Down" || e.key == "ArrowDown") {
        player.dy = 0;
    }
}

// Shoot a bullet from the player's position
function shootBullet() {
    const bullet = {
        x: player.x + player.width / 2,
        y: player.y,
        width: 10,
        height: 20,
        dx: 0,
        dy: -bulletSpeed
    };
    bullets.push(bullet);
}

// Event listeners for player controls
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("click", shootBullet, false);

// Start the game loop
gameLoop();
