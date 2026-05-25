// SECURITY TEST: Infinite loop - CPU spin
// Expected: sandbox must enforce wall-clock / CPU time limit
let x = 0n;
while (true) {
    x++;
}
