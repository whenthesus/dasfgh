class Game {
    constructor(saveSlot = null) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.saveManager = new SaveManager(saveSlot);
        this.player = {
            x: 50,
            y: 300,
            width: 30,
            height: 30,
            speed: 1.67,
            health: 100,
            maxHealth: 100
        };
        this.keys = {};
        this.currentRoom = 0;
        this.totalRooms = 10;
        this.pathwayWidth = 200;
        this.pathwayY = 200;
        this.showCheckpointMenu = false;
        
        // Enemy properties
        this.enemy = {
            x: 400,
            y: 300,
            width: 40,
            height: 40,
            defeated: false
        };
        
        // Battle system
        this.battleSystem = new BattleSystem(this);
        this.inBattle = false;
        
        // Rain effect properties
        this.rainDrops = [];
        this.initRain();
        
        // Dialogue system
        this.dialogue = {
            active: false,
            currentLine: 0,
            currentChar: 0,
            displayText: '',
            typingSpeed: 50, // milliseconds per character
            lastTypeTime: 0,
            lines: [
                "Um where am i lol",
                "A Hallway thats long and purple, sounds familular"
            ],
            speaker: "Nathan"
        };
        
        this.typingSound = new Audio('typescript-sound.mp3');
        this.typingSound.volume = 0.3;
        
        // Check if this is a new game
        this.isNewGame = !saveSlot;
        
        // Load save data if available
        if (saveSlot) {
            this.loadGame();
        }
        
        // Start dialogue for new games
        if (this.isNewGame) {
            this.startDialogue();
        }
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Handle dialogue advancement
            if (this.dialogue.active && (e.key === ' ' || e.key === 'Enter')) {
                this.advanceDialogue();
            }
            
            // Handle E key for checkpoint
            if (e.key.toLowerCase() === 'e' && this.isAtCheckpoint()) {
                this.showCheckpointMenu = !this.showCheckpointMenu;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Add click event listener for checkpoint menu
        this.canvas.addEventListener('click', (e) => {
            if (this.showCheckpointMenu) {
                this.handleCheckpointClick(e);
            }
        });
    }
    
    update() {
        // Update dialogue
        this.updateDialogue();
        
        // Don't allow movement when dialogue is active, checkpoint menu is open or in battle
        if (this.dialogue.active || this.showCheckpointMenu || this.inBattle) {
            return;
        }
        
        // Handle WASD movement
        if (this.keys['w']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['s']) {
            this.player.y += this.player.speed;
        }
        if (this.keys['a']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['d']) {
            this.player.x += this.player.speed;
        }
        
        // Different movement constraints based on room
        if (this.currentRoom < this.totalRooms) {
            // Keep player within pathway bounds for rooms 1-10
            this.player.y = Math.max(this.pathwayY, Math.min(this.pathwayY + this.pathwayWidth - this.player.height, this.player.y));
        } else {
            // In the field, allow movement anywhere but keep within canvas bounds
            this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
        }
        
        // Keep player within canvas horizontal bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        
        // Handle room transitions
        if (this.player.x >= this.canvas.width - this.player.width) {
            // Move to next room
            if (this.currentRoom < this.totalRooms) {
                this.currentRoom++;
                this.player.x = 0;
            }
        } else if (this.player.x <= 0) {
            // Move to previous room (only if not in the field)
            if (this.currentRoom > 0 && this.currentRoom < this.totalRooms) {
                this.currentRoom--;
                this.player.x = this.canvas.width - this.player.width;
            } else {
                this.player.x = 0;
            }
        }
        
        // Update rain drops if in the field
        if (this.currentRoom >= this.totalRooms) {
            this.updateRain();
        }
        
        // Check enemy collision in the field
        if (this.currentRoom >= this.totalRooms && !this.enemy.defeated) {
            if (this.checkCollision(this.player, this.enemy)) {
                this.startBattle();
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    startBattle() {
        this.inBattle = true;
        this.battleSystem.startBattle();
    }
    
    endBattle(won) {
        this.inBattle = false;
        if (won) {
            this.enemy.defeated = true;
        } else {
            // Return to last save
            this.loadGame();
        }
    }
    
    updateRain() {
        for (let drop of this.rainDrops) {
            drop.y += drop.speed;
            if (drop.y > this.canvas.height) {
                drop.y = -drop.length;
                drop.x = Math.random() * this.canvas.width;
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.currentRoom >= this.totalRooms ? '#228B22' : '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentRoom < this.totalRooms) {
            // Draw dark purple pathway for rooms 1-10
            this.ctx.fillStyle = '#4B0082';
            this.ctx.fillRect(0, this.pathwayY, this.canvas.width, this.pathwayWidth);
            
            // Draw save checkpoint at the end of room 10
            if (this.currentRoom === this.totalRooms - 1) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(this.canvas.width - 40, this.pathwayY + this.pathwayWidth/2 - 20, 30, 40);
            }
        } else {
            // Draw green field background (already set above)
            // Draw rain effect
            this.renderRain();
            
            // Draw enemy if not defeated
            if (!this.enemy.defeated) {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(this.enemy.x, this.enemy.y, this.enemy.width, this.enemy.height);
            }
        }
        
        // Draw player as a simple square
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw room indicator
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Noto Sans';
        if (this.currentRoom < this.totalRooms) {
            this.ctx.fillText(`Room ${this.currentRoom + 1}/${this.totalRooms}`, 10, 30);
        } else {
            this.ctx.fillText('The Field', 10, 30);
        }
        
        // Draw checkpoint prompt if at checkpoint
        if (this.isAtCheckpoint()) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Noto Sans';
            this.ctx.fillText('Press E to save', this.canvas.width - 120, this.pathwayY - 10);
        }
        
        // Draw checkpoint menu if open
        if (this.showCheckpointMenu) {
            this.saveManager.drawCheckpointMenu(this.ctx, this.canvas.width, this.canvas.height);
        }
        
        // Draw dialogue box
        if (this.dialogue.active) {
            this.renderDialogue();
        }
        
        // Draw battle system if in battle
        if (this.inBattle) {
            this.battleSystem.render(this.ctx);
        }
    }
    
    renderDialogue() {
        const boxWidth = 600;
        const boxHeight = 150;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = this.canvas.height - boxHeight - 50;
        
        // Draw outer border (white)
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(boxX - 6, boxY - 6, boxWidth + 12, boxHeight + 12);
        
        // Draw inner border (black)
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(boxX - 3, boxY - 3, boxWidth + 6, boxHeight + 6);
        
        // Draw dialogue background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Draw speaker name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px "Courier New", monospace';
        this.ctx.fillText(this.dialogue.speaker + ':', boxX + 20, boxY + 30);
        
        // Draw dialogue text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px "Courier New", monospace';
        
        // Word wrap the text
        const words = this.dialogue.displayText.split(' ');
        const maxWidth = boxWidth - 40;
        let line = '';
        let y = boxY + 60;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                this.ctx.fillText(line, boxX + 20, y);
                line = words[i] + ' ';
                y += 25;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, boxX + 20, y);
        
        // Draw continue prompt
        if (this.dialogue.currentChar >= this.dialogue.lines[this.dialogue.currentLine].length) {
            this.ctx.fillStyle = '#888';
            this.ctx.font = '14px "Courier New", monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText('Press SPACE to continue', boxX + boxWidth - 20, boxY + boxHeight - 20);
            this.ctx.textAlign = 'left';
        }
    }
    
    isAtCheckpoint() {
        return this.currentRoom === this.totalRooms - 1 && 
               this.player.x > this.canvas.width - 80;
    }
    
    handleCheckpointClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const result = this.saveManager.handleCheckpointClick(clickX, clickY);
        if (result.action === 'save') {
            this.saveToSlot(result.slot);
            this.showCheckpointMenu = false;
        } else if (result.action === 'cancel') {
            this.showCheckpointMenu = false;
        }
    }
    
    saveToSlot(slotNumber) {
        const saveData = {
            currentRoom: this.currentRoom,
            playerX: this.player.x,
            playerY: this.player.y,
            playerHealth: this.player.health,
            enemyDefeated: this.enemy.defeated,
            timestamp: Date.now()
        };
        this.saveManager.saveToSlot(slotNumber, saveData);
    }
    
    loadGame() {
        const saveData = this.saveManager.loadGame();
        if (saveData) {
            this.currentRoom = saveData.currentRoom;
            this.player.x = saveData.playerX;
            this.player.y = saveData.playerY;
            this.player.health = saveData.playerHealth || 100;
            this.enemy.defeated = saveData.enemyDefeated || false;
        }
    }
    
    gameLoop() {
        this.update();
        if (this.inBattle) {
            this.battleSystem.update();
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    initRain() {
        // Create rain drops for the field
        for (let i = 0; i < 100; i++) {
            this.rainDrops.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: Math.random() * 3 + 2,
                length: Math.random() * 10 + 5
            });
        }
    }
    
    startDialogue() {
        this.dialogue.active = true;
        this.dialogue.currentLine = 0;
        this.dialogue.currentChar = 0;
        this.dialogue.displayText = '';
        this.dialogue.lastTypeTime = Date.now();
    }
    
    advanceDialogue() {
        if (this.dialogue.currentChar < this.dialogue.lines[this.dialogue.currentLine].length) {
            // Skip to end of current line
            this.dialogue.displayText = this.dialogue.lines[this.dialogue.currentLine];
            this.dialogue.currentChar = this.dialogue.lines[this.dialogue.currentLine].length;
        } else {
            // Move to next line
            this.dialogue.currentLine++;
            if (this.dialogue.currentLine >= this.dialogue.lines.length) {
                this.dialogue.active = false;
            } else {
                this.dialogue.currentChar = 0;
                this.dialogue.displayText = '';
            }
        }
    }
    
    updateDialogue() {
        if (!this.dialogue.active) return;
        
        const currentTime = Date.now();
        const currentLine = this.dialogue.lines[this.dialogue.currentLine];
        
        if (this.dialogue.currentChar < currentLine.length && 
            currentTime - this.dialogue.lastTypeTime >= this.dialogue.typingSpeed) {
            
            this.dialogue.displayText += currentLine[this.dialogue.currentChar];
            this.dialogue.currentChar++;
            this.dialogue.lastTypeTime = currentTime;
            
            // Play typing sound every few characters
            if (this.dialogue.currentChar % 2 === 0) {
                this.typingSound.currentTime = 0;
                this.typingSound.play().catch(() => {}); // Ignore audio errors
            }
        }
    }
}