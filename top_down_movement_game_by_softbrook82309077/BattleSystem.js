class BattleSystem {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        
        this.enemy = {
            name: 'Field Monster',
            health: 60,
            maxHealth: 60
        };
        
        this.state = 'menu'; // 'menu', 'attack', 'defend', 'fadeIn', 'fadeOut'
        this.fadeAlpha = 0;
        this.fadeSpeed = 0.05;
        
        // Attack system
        this.attackLine = {
            x: 0,
            speed: 3,
            direction: 1,
            active: false
        };
        
        this.attackZones = [
            { start: 50, end: 80, color: '#FF0000', damage: 5 },   // Red
            { start: 80, end: 120, color: '#FFFF00', damage: 10 }, // Yellow
            { start: 120, end: 160, color: '#008000', damage: 20 }, // Dark Green
            { start: 160, end: 190, color: '#00FF00', damage: 30 }, // Bright Green
            { start: 190, end: 230, color: '#008000', damage: 20 }, // Dark Green
            { start: 230, end: 270, color: '#FFFF00', damage: 10 }, // Yellow
            { start: 270, end: 300, color: '#FF0000', damage: 5 }   // Red
        ];
        
        // Defend system
        this.heart = {
            x: 400,
            y: 300,
            width: 20,
            height: 20
        };
        
        this.dodgeBox = {
            x: 250,
            y: 200,
            width: 300,
            height: 200
        };
        
        this.rainAttacks = [];
        this.defendTimer = 0;
        this.maxDefendTime = 15000; // 15 seconds
        
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        
        // Smooth movement for defend phase
        this.movementKeys = {
            w: false,
            s: false,
            a: false,
            d: false,
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.game.inBattle) {
                this.handleClick(e);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.game.inBattle && this.state === 'defend') {
                this.movementKeys[e.key] = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.game.inBattle && this.state === 'defend') {
                this.movementKeys[e.key] = false;
            }
        });
    }
    
    startBattle() {
        this.state = 'fadeIn';
        this.fadeAlpha = 0;
        this.enemy.health = this.enemy.maxHealth;
    }
    
    update() {
        if (this.state === 'fadeIn') {
            this.fadeAlpha += this.fadeSpeed;
            if (this.fadeAlpha >= 1) {
                this.fadeAlpha = 1;
                this.state = 'menu';
            }
        } else if (this.state === 'fadeOut') {
            this.fadeAlpha -= this.fadeSpeed;
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.game.endBattle(true);
            }
        } else if (this.state === 'attack') {
            this.updateAttack();
        } else if (this.state === 'defend') {
            this.updateDefend();
        }
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTimer -= 16.67; // Assuming 60 FPS
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    updateAttack() {
        if (this.attackLine.active) {
            this.attackLine.x += this.attackLine.speed * this.attackLine.direction;
            
            if (this.attackLine.x <= 0 || this.attackLine.x >= 350) {
                this.attackLine.direction *= -1;
            }
        }
    }
    
    updateDefend() {
        this.defendTimer += 16.67; // Assuming 60 FPS
        
        // Handle smooth movement
        const moveSpeed = 2;
        if (this.movementKeys['w'] || this.movementKeys['ArrowUp']) {
            this.heart.y = Math.max(this.dodgeBox.y, this.heart.y - moveSpeed);
        }
        if (this.movementKeys['s'] || this.movementKeys['ArrowDown']) {
            this.heart.y = Math.min(this.dodgeBox.y + this.dodgeBox.height - this.heart.height, this.heart.y + moveSpeed);
        }
        if (this.movementKeys['a'] || this.movementKeys['ArrowLeft']) {
            this.heart.x = Math.max(this.dodgeBox.x, this.heart.x - moveSpeed);
        }
        if (this.movementKeys['d'] || this.movementKeys['ArrowRight']) {
            this.heart.x = Math.min(this.dodgeBox.x + this.dodgeBox.width - this.heart.width, this.heart.x + moveSpeed);
        }
        
        // Spawn rain attacks (slower rate)
        if (Math.random() < 0.025) {
            this.rainAttacks.push({
                x: this.dodgeBox.x + Math.random() * this.dodgeBox.width,
                y: this.dodgeBox.y,
                width: 5,
                height: 15,
                speed: 1 + Math.random() * 1 // Slower speed
            });
        }
        
        // Update rain attacks
        this.rainAttacks = this.rainAttacks.filter(attack => {
            attack.y += attack.speed;
            
            // Check collision with heart
            if (!this.invulnerable && this.checkCollision(this.heart, attack)) {
                this.game.player.health -= 15;
                this.invulnerable = true;
                this.invulnerabilityTimer = 2000; // 2 seconds
                
                if (this.game.player.health <= 0) {
                    this.game.endBattle(false);
                    return false;
                }
            }
            
            return attack.y < this.dodgeBox.y + this.dodgeBox.height;
        });
        
        // End defend phase after timer
        if (this.defendTimer >= this.maxDefendTime) {
            this.state = 'menu';
            this.defendTimer = 0;
            this.rainAttacks = [];
        }
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        if (this.state === 'menu') {
            // Check if clicked on Fight button (moved to bottom)
            if (clickX >= 350 && clickX <= 450 && clickY >= 520 && clickY <= 570) {
                this.state = 'enemySelect';
            }
        } else if (this.state === 'enemySelect') {
            // Check if clicked on enemy (at top)
            if (clickX >= 350 && clickX <= 450 && clickY >= 50 && clickY <= 100) {
                this.startAttack();
            }
        } else if (this.state === 'attack') {
            if (this.attackLine.active) {
                this.executeAttack();
            }
        }
    }
    
    handleDefendMovement(e) {
        // This method is now handled by the key event listeners above
    }
    
    startAttack() {
        this.state = 'attack';
        this.attackLine.x = 0;
        this.attackLine.active = true;
        this.attackLine.direction = 1;
    }
    
    executeAttack() {
        let damage = 0;
        
        // Find which zone the line is in
        for (const zone of this.attackZones) {
            if (this.attackLine.x >= zone.start && this.attackLine.x <= zone.end) {
                damage = zone.damage;
                break;
            }
        }
        
        this.enemy.health -= damage;
        this.attackLine.active = false;
        
        if (this.enemy.health <= 0) {
            this.state = 'fadeOut';
        } else {
            this.state = 'defend';
            this.defendTimer = 0;
            this.rainAttacks = [];
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    render(ctx) {
        // Draw fade overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.fadeAlpha < 1) return;
        
        // Draw battle UI
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw enemy sprite at the top
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(350, 50, 100, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.enemy.name, 400, 80);
        ctx.textAlign = 'left';
        
        if (this.state === 'menu') {
            this.renderMenu(ctx);
        } else if (this.state === 'enemySelect') {
            this.renderEnemySelect(ctx);
        } else if (this.state === 'attack') {
            this.renderAttack(ctx);
        } else if (this.state === 'defend') {
            this.renderDefend(ctx);
        }
        
        // Draw player health
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`HP: ${this.game.player.health}/${this.game.player.maxHealth}`, 50, 550);
        
        // Draw enemy health
        ctx.fillText(`${this.enemy.name} HP: ${this.enemy.health}/${this.enemy.maxHealth}`, 50, 580);
    }
    
    renderMenu(ctx) {
        // Draw Fight button at bottom
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(350, 520, 100, 50);
        ctx.font = '20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FIGHT', 400, 550);
        ctx.textAlign = 'left';
    }
    
    renderEnemySelect(ctx) {
        // Enemy is already drawn at the top
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Click on the enemy to attack!', 400, 450);
        ctx.textAlign = 'left';
    }
    
    renderAttack(ctx) {
        // Draw attack zones at bottom
        const baseY = 450;
        const height = 30;
        
        for (const zone of this.attackZones) {
            ctx.fillStyle = zone.color;
            ctx.fillRect(zone.start + 200, baseY, zone.end - zone.start, height);
        }
        
        // Draw attack line
        if (this.attackLine.active) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.attackLine.x + 200, baseY - 10, 3, height + 20);
        }
        
        // Draw instructions
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Click to stop the line!', 400, 430);
        ctx.textAlign = 'left';
    }
    
    renderDefend(ctx) {
        // Draw dodge box
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.dodgeBox.x, this.dodgeBox.y, this.dodgeBox.width, this.dodgeBox.height);
        
        // Draw heart
        const heartColor = this.invulnerable ? '#FF69B4' : '#FF0000';
        ctx.fillStyle = heartColor;
        ctx.fillRect(this.heart.x, this.heart.y, this.heart.width, this.heart.height);
        
        // Draw rain attacks
        ctx.fillStyle = '#87CEEB';
        for (const attack of this.rainAttacks) {
            ctx.fillRect(attack.x, attack.y, attack.width, attack.height);
        }
        
        // Draw timer at bottom
        const timeLeft = Math.max(0, (this.maxDefendTime - this.defendTimer) / 1000);
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Time: ${timeLeft.toFixed(1)}s`, 400, 500);
        ctx.fillText('Use WASD or Arrow Keys to move', 400, 520);
        ctx.textAlign = 'left';
    }
}