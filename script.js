/* ============================================
   SMART TRAFFIC MANAGEMENT SYSTEM - SCRIPT
   ============================================ */

/* ============================================
   1. TRAFFIC SYSTEM STATE MANAGER
   ============================================ */

const trafficSystem = (() => {
    // Private state
    let state = {
        mode: 'NORMAL',                    // NORMAL | PUBLIC_PRIORITY | EMERGENCY
        currentSignal: 'RED',              // RED | YELLOW | GREEN
        signalRunning: false,              // Whether the signal is active
        signalTimer: 0,                    // Time remaining in current signal
        publicPriorityTimer: 0,            // Time remaining for public priority mode
        emergencyActive: false,            // Emergency mode status
        signalCycleInterval: null,         // Store interval ID for signal cycle
        publicPriorityInterval: null,      // Store interval ID for public priority timeout
        emergencyCycleInterval: null,      // Store interval ID for emergency cycling
    };

    // Signal timings (in milliseconds)
    const signalTimings = {
        RED: 5000,
        YELLOW: 2000,
        GREEN: 5000
    };

    const publicPriorityDuration = 15000; // 15 seconds
    const emergencyCycleTiming = 300;     // Fast cycle for emergency (300ms each)

    // ============================================
    // 2. SIGNAL CYCLE LOGIC
    // ============================================

    function startSignalCycle() {
        if (state.signalCycleInterval) {
            clearInterval(state.signalCycleInterval);
        }

        state.signalRunning = true;
        state.currentSignal = 'RED';
        state.signalTimer = signalTimings.RED;

        // Update signal immediately
        updateSignalDisplay();

        // Start the cycle
        state.signalCycleInterval = setInterval(() => {
            // Don't cycle if in public priority or emergency mode
            if (state.mode === 'PUBLIC_PRIORITY' || state.mode === 'EMERGENCY') {
                return;
            }

            // Decrease timer
            state.signalTimer -= 100;

            if (state.signalTimer <= 0) {
                // Move to next signal
                switch (state.currentSignal) {
                    case 'RED':
                        state.currentSignal = 'YELLOW';
                        state.signalTimer = signalTimings.YELLOW;
                        break;
                    case 'YELLOW':
                        state.currentSignal = 'GREEN';
                        state.signalTimer = signalTimings.GREEN;
                        break;
                    case 'GREEN':
                        state.currentSignal = 'RED';
                        state.signalTimer = signalTimings.RED;
                        break;
                }
            }

            updateSignalDisplay();
        }, 100);
    }

    function stopSignalCycle() {
        state.signalRunning = false;
        if (state.signalCycleInterval) {
            clearInterval(state.signalCycleInterval);
            state.signalCycleInterval = null;
        }
        updateSignalDisplay();
    }

    function resetSignal() {
        stopSignalCycle();
        state.currentSignal = 'RED';
        state.signalTimer = signalTimings.RED;
        updateSignalDisplay();
    }

    // ============================================
    // 3. PUBLIC PRIORITY MODE LOGIC
    // ============================================

    function activatePublicPriority() {
        // Don't activate if emergency is active
        if (state.mode === 'EMERGENCY') {
            console.warn('Cannot activate public priority while in emergency mode');
            return;
        }

        state.mode = 'PUBLIC_PRIORITY';
        state.currentSignal = 'GREEN';
        state.publicPriorityTimer = publicPriorityDuration;

        // Clear the signal cycle timer if running
        if (state.signalCycleInterval) {
            clearInterval(state.signalCycleInterval);
        }

        // Set up public priority timeout
        if (state.publicPriorityInterval) {
            clearInterval(state.publicPriorityInterval);
        }

        state.publicPriorityInterval = setInterval(() => {
            state.publicPriorityTimer -= 100;

            if (state.publicPriorityTimer <= 0) {
                deactivatePublicPriority();
            }

            updateSignalDisplay();
        }, 100);

        updateSignalDisplay();
    }

    function deactivatePublicPriority() {
        state.mode = 'NORMAL';
        state.publicPriorityTimer = 0;

        if (state.publicPriorityInterval) {
            clearInterval(state.publicPriorityInterval);
            state.publicPriorityInterval = null;
        }

        // Restart signal cycle if it was running before
        if (state.signalRunning) {
            startSignalCycle();
        }

        updateSignalDisplay();
    }

    // ============================================
    // 4. EMERGENCY MODE LOGIC
    // ============================================

    function triggerEmergency() {
        state.mode = 'EMERGENCY';
        state.emergencyActive = true;

        // Stop previous intervals
        if (state.signalCycleInterval) {
            clearInterval(state.signalCycleInterval);
        }
        if (state.publicPriorityInterval) {
            clearInterval(state.publicPriorityInterval);
        }

        state.signalRunning = true;

        // Start rapid cycling for emergency
        const signalSequence = ['RED', 'YELLOW', 'GREEN'];
        let sequenceIndex = 0;

        if (state.emergencyCycleInterval) {
            clearInterval(state.emergencyCycleInterval);
        }

        // Initial signal
        state.currentSignal = signalSequence[0];
        updateSignalDisplay();

        // Rapid cycle
        state.emergencyCycleInterval = setInterval(() => {
            sequenceIndex = (sequenceIndex + 1) % signalSequence.length;
            state.currentSignal = signalSequence[sequenceIndex];
            updateSignalDisplay();
        }, emergencyCycleTiming);

        updateSignalDisplay();
    }

    function resolveEmergency() {
        state.mode = 'NORMAL';
        state.emergencyActive = false;

        if (state.emergencyCycleInterval) {
            clearInterval(state.emergencyCycleInterval);
            state.emergencyCycleInterval = null;
        }

        state.currentSignal = 'RED';
        state.signalRunning = false;

        // Restart normal cycle if desired
        updateSignalDisplay();
    }

    // ============================================
    // 5. STATE GETTERS
    // ============================================

    function getState() {
        return {
            ...state,
            // Additional computed properties
            signalTimings: signalTimings,
            publicPriorityDuration: publicPriorityDuration
        };
    }

    function updateSignalDisplay() {
        // This is called to trigger UI updates
        // The pages use this indirectly by calling getState() periodically
    }

    // ============================================
    // 6. PUBLIC API
    // ============================================

    return {
        // Signal control
        startSignal: () => startSignalCycle(),
        stopSignal: () => stopSignalCycle(),
        resetSignal: () => resetSignal(),

        // Public priority control
        activatePublicPriority: () => activatePublicPriority(),
        deactivatePublicPriority: () => deactivatePublicPriority(),

        // Emergency control
        triggerEmergency: () => triggerEmergency(),
        resolveEmergency: () => resolveEmergency(),

        // State getter
        getState: () => getState(),

        // Debugging
        debugState: () => console.table(getState())
    };
})();

/* ============================================
   7. INITIALIZATION & GLOBAL HELPERS
   ============================================ */

// Initialize system on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Smart Traffic Management System initialized');
    console.log('Initial state:', trafficSystem.getState());
});

// Global error handler for demonstration purposes
window.addEventListener('error', (event) => {
    console.error('Error detected:', event.error);
});

console.log('Traffic System Ready!');
console.log('Available methods:');
console.log('- trafficSystem.startSignal()');
console.log('- trafficSystem.stopSignal()');
console.log('- trafficSystem.resetSignal()');
console.log('- trafficSystem.activatePublicPriority()');
console.log('- trafficSystem.deactivatePublicPriority()');
console.log('- trafficSystem.triggerEmergency()');
console.log('- trafficSystem.resolveEmergency()');
console.log('- trafficSystem.getState()');
