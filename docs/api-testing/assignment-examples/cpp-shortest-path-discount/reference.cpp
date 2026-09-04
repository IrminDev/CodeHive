#include <functional>
#include <iostream>
#include <limits>
#include <queue>
#include <tuple>
#include <vector>

struct Edge {
    int to;
    long long weight;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int cities;
    int edges;
    if (!(std::cin >> cities >> edges)) return 0;

    std::vector<std::vector<Edge>> graph(cities + 1);
    for (int i = 0; i < edges; ++i) {
        int from;
        int to;
        long long weight;
        std::cin >> from >> to >> weight;
        graph[from].push_back({to, weight});
    }

    const long long infinity = std::numeric_limits<long long>::max() / 4;
    std::vector<std::vector<long long>> distance(2, std::vector<long long>(cities + 1, infinity));
    using State = std::tuple<long long, int, int>; // distance, city, coupon used
    std::priority_queue<State, std::vector<State>, std::greater<>> queue;

    distance[0][1] = 0;
    queue.push({0, 1, 0});

    while (!queue.empty()) {
        auto [cost, city, usedCoupon] = queue.top();
        queue.pop();
        if (cost != distance[usedCoupon][city]) continue;

        for (const Edge& edge : graph[city]) {
            const long long normalCost = cost + edge.weight;
            if (normalCost < distance[usedCoupon][edge.to]) {
                distance[usedCoupon][edge.to] = normalCost;
                queue.push({normalCost, edge.to, usedCoupon});
            }
            if (!usedCoupon) {
                const long long discountedCost = cost + edge.weight / 2;
                if (discountedCost < distance[1][edge.to]) {
                    distance[1][edge.to] = discountedCost;
                    queue.push({discountedCost, edge.to, 1});
                }
            }
        }
    }

    const long long answer = std::min(distance[0][cities], distance[1][cities]);
    std::cout << (answer == infinity ? -1 : answer) << '\n';
    return 0;
}
