class SaveManager {
    constructor(saveSlot = null) {
        this.saveSlot = saveSlot;
        this.saveSlotButtons = null;
        this.cancelButton = null;
    }
    
    saveToSlot(slotNumber, saveData) {
        localStorage.setItem(`airballland_save_${slotNumber}`, JSON.stringify(saveData));
        this.saveSlot = slotNumber;
    }
    
    loadGame() {
        if (!this.saveSlot) return null;
        
        const saveData = localStorage.getItem(`airballland_save_${this.saveSlot}`);
        return saveData ? JSON.parse(saveData) : null;
    }
    
    getSaveData(slotNumber) {
        const saveData = localStorage.getItem(`airballland_save_${slotNumber}`);
        return saveData ? JSON.parse(saveData) : null;
    }
    
    deleteSave(slotNumber) {
        localStorage.removeItem(`airballland_save_${slotNumber}`);
    }
    
    drawCheckpointMenu(ctx, canvasWidth, canvasHeight) {
        // Draw semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw main menu box with Undertale-style border
        const menuWidth = 450;
        const menuHeight = 280;
        const menuX = (canvasWidth - menuWidth) / 2;
        const menuY = (canvasHeight - menuHeight) / 2;
        
        // Outer border (white)
        ctx.fillStyle = '#fff';
        ctx.fillRect(menuX - 6, menuY - 6, menuWidth + 12, menuHeight + 12);
        
        // Inner border (black)
        ctx.fillStyle = '#000';
        ctx.fillRect(menuX - 3, menuY - 3, menuWidth + 6, menuHeight + 6);
        
        // Menu background (dark gray)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
        
        // Draw menu title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SAVE', menuX + menuWidth/2, menuY + 40);
        
        // Draw save slot buttons
        const buttonWidth = 380;
        const buttonHeight = 40;
        const buttonX = menuX + (menuWidth - buttonWidth) / 2;
        let buttonY = menuY + 70;
        
        this.saveSlotButtons = [];
        
        for (let i = 1; i <= 3; i++) {
            const saveData = this.getSaveData(i);
            
            // Button background
            ctx.fillStyle = '#333';
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Button border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Button text
            ctx.fillStyle = '#fff';
            ctx.font = '16px "Courier New", monospace';
            ctx.textAlign = 'left';
            
            let slotText = `Slot ${i}`;
            if (saveData) {
                const date = new Date(saveData.timestamp).toLocaleDateString();
                slotText += ` - Room ${saveData.currentRoom + 1} (${date})`;
            } else {
                slotText += ' - Empty';
            }
            
            ctx.fillText(slotText, buttonX + 15, buttonY + 25);
            
            // Store button bounds for click detection
            this.saveSlotButtons.push({
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                slot: i
            });
            
            buttonY += 50;
        }
        
        // Draw cancel button
        ctx.fillStyle = '#444';
        ctx.fillRect(buttonX, buttonY + 10, buttonWidth, buttonHeight);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX, buttonY + 10, buttonWidth, buttonHeight);
        
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Cancel', buttonX + buttonWidth/2, buttonY + 35);
        
        // Store cancel button bounds
        this.cancelButton = {
            x: buttonX,
            y: buttonY + 10,
            width: buttonWidth,
            height: buttonHeight
        };
        
        ctx.textAlign = 'left';
    }
    
    handleCheckpointClick(clickX, clickY) {
        // Check save slot buttons
        if (this.saveSlotButtons) {
            for (const button of this.saveSlotButtons) {
                if (clickX >= button.x && clickX <= button.x + button.width &&
                    clickY >= button.y && clickY <= button.y + button.height) {
                    return new Promise((resolve) => {
                        this.showSaveConfirmation(button.slot, resolve);
                    });
                }
            }
        }
        
        // Check cancel button
        if (this.cancelButton &&
            clickX >= this.cancelButton.x && clickX <= this.cancelButton.x + this.cancelButton.width &&
            clickY >= this.cancelButton.y && clickY <= this.cancelButton.y + this.cancelButton.height) {
            return { action: 'cancel' };
        }
        
        return { action: 'none' };
    }
    
    showSaveConfirmation(slotNumber, callback) {
        // Create confirmation dialog overlay
        const overlay = document.createElement('div');
        overlay.id = 'save-confirmation-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: #000;
            color: white;
            border: 4px solid #fff;
            padding: 30px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            text-align: center;
            min-width: 300px;
        `;
        
        dialog.innerHTML = `
            <div style="margin-bottom: 20px; letter-spacing: 1px;">Are You Sure?</div>
            <div style="margin-bottom: 30px; font-size: 14px; color: #ccc;">Save to slot ${slotNumber}?</div>
            <div style="display: flex; justify-content: center; gap: 20px;">
                <button id="save-confirm-yes" style="
                    background-color: #000;
                    color: white;
                    border: 2px solid #fff;
                    padding: 10px 20px;
                    font-family: 'Courier New', monospace;
                    font-size: 16px;
                    cursor: pointer;
                    letter-spacing: 1px;
                ">YES</button>
                <button id="save-confirm-no" style="
                    background-color: #000;
                    color: white;
                    border: 2px solid #fff;
                    padding: 10px 20px;
                    font-family: 'Courier New', monospace;
                    font-size: 16px;
                    cursor: pointer;
                    letter-spacing: 1px;
                ">NO</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Handle button clicks
        document.getElementById('save-confirm-yes').addEventListener('click', () => {
            callback({ action: 'save', slot: slotNumber });
            overlay.remove();
        });
        
        document.getElementById('save-confirm-no').addEventListener('click', () => {
            callback({ action: 'cancel' });
            overlay.remove();
        });
    }
}