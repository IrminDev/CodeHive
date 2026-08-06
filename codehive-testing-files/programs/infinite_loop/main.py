# SECURITY TEST: Infinite loop - CPU spin
# Expected: sandbox must enforce wall-clock / CPU time limit
x = 0
while True:
    x += 1
