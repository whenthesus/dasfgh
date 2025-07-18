// Main initialization and event handling
window.addEventListener('load', () => {
    const menuManager = new MenuManager();
    let currentGame = null;
    
    // Initialize menu event handlers
    menuManager.setupMainMenu(() => {
        // Start new game callback - pass true to indicate new game
        currentGame = new Game();
    }, (saveSlot) => {
        // Load game callback
        currentGame = new Game(saveSlot);
    });
});