// SECURITY TEST: Fork bomb via child_process
// Expected: sandbox must limit process count
const { spawn } = require('child_process');

function bomb() {
    while (true) {
        spawn(process.execPath, [__filename], { detached: true });
    }
}

bomb();
