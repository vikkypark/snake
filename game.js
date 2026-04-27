// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const speedElement = document.getElementById('speed');

// Game constants
const GRID_SIZE = 20;
const GRID_WIDTH = canvas.width / GRID_SIZE;
const GRID_HEIGHT = canvas.height / GRID_SIZE;

// Game state
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameSpeed = 150; // Normal speed in ms
let gameLoop;

// Colors
const SNAKE_HEAD_COLOR = '#00dbde';
const SNAKE_BODY_COLOR = '#0099ff';
const FOOD_COLOR = '#ff416c';
const GRID_COLOR = 'rgba(255, 255, 255, 0.05)';

// Initialize game
function init() {
    // Set high score
    highScoreElement.textContent = highScore;

    // Initialize snake
    snake = [
        {x: 5, y: 10},
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];

    // Generate first food
    generateFood();

    // Draw initial state
    draw();
}

// Generate food at random position
function generateFood() {
    let newFood;
    let foodOnSnake;

    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };

        // Check if food would be on snake
        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);

    food = newFood;
}

// Draw grid
function drawGrid() {
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw snake
function drawSnake() {
    // Draw body
    for (let i = 1; i < snake.length; i++) {
        const segment = snake[i];
        ctx.fillStyle = SNAKE_BODY_COLOR;
        ctx.fillRect(
            segment.x * GRID_SIZE,
            segment.y * GRID_SIZE,
            GRID_SIZE - 1,
            GRID_SIZE - 1
        );

        // Add some shine to body segments
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(
            segment.x * GRID_SIZE + 2,
            segment.y * GRID_SIZE + 2,
            4,
            4
        );
    }

    // Draw head
    const head = snake[0];
    ctx.fillStyle = SNAKE_HEAD_COLOR;
    ctx.fillRect(
        head.x * GRID_SIZE,
        head.y * GRID_SIZE,
        GRID_SIZE - 1,
        GRID_SIZE - 1
    );

    // Draw eyes on head
    ctx.fillStyle = 'white';
    const eyeSize = 3;
    const eyeOffset = 5;

    // Determine eye positions based on direction
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

    switch(direction) {
        case 'right':
            leftEyeX = head.x * GRID_SIZE + GRID_SIZE - eyeOffset;
            leftEyeY = head.y * GRID_SIZE + eyeOffset;
            rightEyeX = head.x * GRID_SIZE + GRID_SIZE - eyeOffset;
            rightEyeY = head.y * GRID_SIZE + GRID_SIZE - eyeOffset;
            break;
        case 'left':
            leftEyeX = head.x * GRID_SIZE + eyeOffset;
            leftEyeY = head.y * GRID_SIZE + eyeOffset;
            rightEyeX = head.x * GRID_SIZE + eyeOffset;
            rightEyeY = head.y * GRID_SIZE + GRID_SIZE - eyeOffset;
            break;
        case 'up':
            leftEyeX = head.x * GRID_SIZE + eyeOffset;
            leftEyeY = head.y * GRID_SIZE + eyeOffset;
            rightEyeX = head.x * GRID_SIZE + GRID_SIZE - eyeOffset;
            rightEyeY = head.y * GRID_SIZE + eyeOffset;
            break;
        case 'down':
            leftEyeX = head.x * GRID_SIZE + eyeOffset;
            leftEyeY = head.y * GRID_SIZE + GRID_SIZE - eyeOffset;
            rightEyeX = head.x * GRID_SIZE + GRID_SIZE - eyeOffset;
            rightEyeY = head.y * GRID_SIZE + GRID_SIZE - eyeOffset;
            break;
    }

    ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
    ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
}

// Draw food
function drawFood() {
    ctx.fillStyle = FOOD_COLOR;
    ctx.beginPath();
    const centerX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = food.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 2;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add shine to food
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX - radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2);
    ctx.fill();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Draw snake
    drawSnake();

    // Draw food
    drawFood();
}

// Update game state
function update() {
    // Update direction
    direction = nextDirection;

    // Create new head position
    const head = {...snake[0]};

    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        gameOver();
        return;
    }

    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    // Add new head to snake
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        score += 10;
        scoreElement.textContent = score;

        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }

        // Generate new food
        generateFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);

    // Draw game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff416c';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 60);

    // Update button states
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-redo"></i> Restart Game';
    document.getElementById('startBtn').disabled = false;
}

// Start game
function startGame() {
    if (gameRunning) return;

    // Reset game state
    snake = [
        {x: 5, y: 10},
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    gamePaused = false;

    // Update button
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> Game Running';
    document.getElementById('startBtn').disabled = true;

    // Generate food
    generateFood();

    // Start game loop
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        if (!gamePaused) {
            update();
            draw();
        }
    }, gameSpeed);
}

// Pause/resume game
function togglePause() {
    if (!gameRunning) return;

    gamePaused = !gamePaused;

    const pauseBtn = document.getElementById('pauseBtn');
    if (gamePaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';

        // Draw pause message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00dbde';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
}

// Reset game
function resetGame() {
    gameRunning = false;
    gamePaused = false;
    clearInterval(gameLoop);

    // Reset score
    score = 0;
    scoreElement.textContent = score;

    // Update button
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> Start Game';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';

    // Reinitialize
    init();
}

// Set game speed
function setSpeed(speed, speedName) {
    gameSpeed = speed;
    speedElement.textContent = speedName;

    // Update active button
    document.querySelectorAll('.btn-speed').forEach(btn => {
        btn.classList.remove('active');
    });

    if (speed === 200) {
        document.getElementById('slowBtn').classList.add('active');
    } else if (speed === 150) {
        document.getElementById('normalBtn').classList.add('active');
    } else if (speed === 100) {
        document.getElementById('fastBtn').classList.add('active');
    }

    // Restart game loop if game is running
    if (gameRunning) {
        clearInterval(gameLoop);
        gameLoop = setInterval(() => {
            if (!gamePaused) {
                update();
                draw();
            }
        }, gameSpeed);
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case ' ':
            // Space bar toggles pause
            togglePause();
            e.preventDefault();
            break;
        case 'Enter':
            // Enter starts/restarts game
            if (!gameRunning) startGame();
            break;
    }
});

// Button event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('slowBtn').addEventListener('click', () => setSpeed(200, 'Slow'));
document.getElementById('normalBtn').addEventListener('click', () => setSpeed(150, 'Normal'));
document.getElementById('fastBtn').addEventListener('click', () => setSpeed(100, 'Fast'));

// Initialize the game
init();