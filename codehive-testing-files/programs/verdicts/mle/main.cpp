#include <cstring>
#include <vector>
int main() { std::vector<char*> blocks; for (;;) { char *block = new char[1024 * 1024]; std::memset(block, 0, 1024 * 1024); blocks.push_back(block); } }
