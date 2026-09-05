#include <functional>
#include <iostream>
#include <queue>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int vertexCount;
    int edgeCount;
    if (!(std::cin >> vertexCount >> edgeCount)) return 1;

    std::vector<std::vector<int>> graph(vertexCount + 1);
    std::vector<int> indegree(vertexCount + 1, 0);

    for (int edge = 0; edge < edgeCount; ++edge) {
        int from;
        int to;
        std::cin >> from >> to;
        graph[from].push_back(to);
        ++indegree[to];
    }

    std::priority_queue<int, std::vector<int>, std::greater<int>> available;
    for (int vertex = 1; vertex <= vertexCount; ++vertex) {
        if (indegree[vertex] == 0) available.push(vertex);
    }

    std::vector<int> order;
    order.reserve(vertexCount);
    while (!available.empty()) {
        int vertex = available.top();
        available.pop();
        order.push_back(vertex);

        for (int neighbor : graph[vertex]) {
            if (--indegree[neighbor] == 0) available.push(neighbor);
        }
    }

    if (static_cast<int>(order.size()) != vertexCount) {
        std::cout << "IMPOSSIBLE\n";
        return 0;
    }

    for (int index = 0; index < vertexCount; ++index) {
        if (index > 0) std::cout << ' ';
        std::cout << order[index];
    }
    std::cout << '\n';
    return 0;
}
