#include <cstring>
#include <vector>

int main() {
    std::vector<char*> retained;
    while (true) {
        char* block = new char[1024 * 1024];
        std::memset(block, 1, 1024 * 1024);
        retained.push_back(block);
    }
}
