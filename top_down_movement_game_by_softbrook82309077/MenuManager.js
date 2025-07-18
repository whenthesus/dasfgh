class MenuManager {
    constructor() {
        this.isNewGameMode = false;
        this.saveManager = new SaveManager();
    }
    
    setupMainMenu(newGameCallback, loadGameCallback) {
        const loadButton = document.getElementById('load-button');
        const mainMenu = document.getElementById('main-menu');
        const loadMenu = document.getElementById('load-menu');
        const gameContainer = document.getElementById('game-container');
        const backButton = document.getElementById('back-button');
        const newGameButton = document.getElementById('new-game-button');
        const saveSlots = document.querySelectorAll('.save-slot');
        
        loadButton.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            loadMenu.style.display = 'block';
            this.updateSaveSlots();
        });
        
        backButton.addEventListener('click', () => {
            loadMenu.style.display = 'none';
            mainMenu.style.display = 'block';
            this.isNewGameMode = false;
            this.removeNewGameMessage();
        });
        
        newGameButton.addEventListener('click', () => {
            this.isNewGameMode = true;
            this.updateSaveSlots();
            this.showNewGameMessage();
        });
        
        saveSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const slotNumber = slot.dataset.slot;
                const saveData = this.saveManager.getSaveData(slotNumber);
                
                if (this.isNewGameMode && saveData) {
                    this.showOverwriteConfirmation(slotNumber, () => {
                        this.startNewGame(newGameCallback);
                    });
                } else {
                    this.startGame(saveData, slotNumber, newGameCallback, loadGameCallback);
                }
            });
        });
    }
    
    startGame(saveData, slotNumber, newGameCallback, loadGameCallback) {
        const loadMenu = document.getElementById('load-menu');
        const gameContainer = document.getElementById('game-container');
        
        loadMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        
        if (saveData && !this.isNewGameMode) {
            loadGameCallback(slotNumber);
        } else {
            newGameCallback();
        }
        
        this.isNewGameMode = false;
        this.removeNewGameMessage();
    }
    
    startNewGame(newGameCallback) {
        const loadMenu = document.getElementById('load-menu');
        const gameContainer = document.getElementById('game-container');
        
        loadMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        newGameCallback();
        
        this.isNewGameMode = false;
        this.removeNewGameMessage();
    }
    
    showNewGameMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'new-game-message';
        messageDiv.textContent = 'Choose what save to start a new game';
        messageDiv.style.cssText = `
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            text-align: center;
            margin-bottom: 20px;
            letter-spacing: 1px;
        `;
        
        this.removeNewGameMessage();
        
        const saveSlotContainer = document.getElementById('save-slots');
        saveSlotContainer.insertBefore(messageDiv, saveSlotContainer.firstChild);
    }
    
    removeNewGameMessage() {
        const messageDiv = document.getElementById('new-game-message');
        if (messageDiv) {
            messageDiv.remove();
        }
    }
    
    showOverwriteConfirmation(slotNumber, callback) {
        const dialog = document.createElement('div');
        dialog.id = 'confirmation-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #000;
            color: white;
            border: 4px solid #fff;
            padding: 30px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            text-align: center;
            z-index: 1000;
            min-width: 300px;
        `;
        
        const overlay = document.createElement('div');
        overlay.id = 'dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 999;
        `;
        
        dialog.innerHTML = `
            <div style="margin-bottom: 20px; letter-spacing: 1px;">Are You Sure?</div>
            <div style="margin-bottom: 30px; font-size: 14px; color: #ccc;">This will overwrite your existing save.</div>
            <div style="display: flex; justify-content: center; gap: 20px;">
                <button id="confirm-yes" style="
                    background-color: #000;
                    color: white;
                    border: 2px solid #fff;
                    padding: 10px 20px;
                    font-family: 'Courier New', monospace;
                    font-size: 16px;
                    cursor: pointer;
                    letter-spacing: 1px;
                ">YES</button>
                <button id="confirm-no" style="
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
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        document.getElementById('confirm-yes').addEventListener('click', () => {
            this.saveManager.deleteSave(slotNumber);
            callback();
            overlay.remove();
            dialog.remove();
        });
        
        document.getElementById('confirm-no').addEventListener('click', () => {
            overlay.remove();
            dialog.remove();
        });
    }
    
    updateSaveSlots() {
        const saveSlots = document.querySelectorAll('.save-slot');
        saveSlots.forEach(slot => {
            const slotNumber = slot.dataset.slot;
            const saveData = this.saveManager.getSaveData(slotNumber);
            if (saveData) {
                const date = new Date(saveData.timestamp).toLocaleDateString();
                slot.textContent = `Save Slot ${slotNumber} - Room ${saveData.currentRoom + 1} (${date})`;
            } else {
                slot.textContent = `Save Slot ${slotNumber} - Empty`;
            }
        });
    }
}

