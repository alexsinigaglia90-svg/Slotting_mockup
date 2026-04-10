"""Warehouse graph model — NetworkX graph for distance and routing calculations."""

import networkx as nx

from slotting.models.warehouse import Warehouse


class WarehouseGraph:
    """Graph representation of a warehouse for shortest-path calculations."""

    def __init__(self, warehouse: Warehouse) -> None:
        self._warehouse = warehouse
        self._graph = nx.Graph()
        self._build_graph()

    def _build_graph(self) -> None:
        wh = self._warehouse
        self._graph.add_node("depot", pos=wh.depot_position)

        for aisle in wh.aisles:
            front_id = f"{aisle.id}_front"
            back_id = f"{aisle.id}_back"
            front_pos = (aisle.x_position, wh.cross_aisle_positions[0])
            back_pos = (aisle.x_position, wh.cross_aisle_positions[-1])

            self._graph.add_node(front_id, pos=front_pos)
            self._graph.add_node(back_id, pos=back_pos)
            self._graph.add_edge(front_id, back_id, weight=aisle.length_m)

        sorted_aisles = sorted(wh.aisles, key=lambda a: a.x_position)
        for i in range(len(sorted_aisles) - 1):
            a1, a2 = sorted_aisles[i], sorted_aisles[i + 1]
            spacing = abs(a2.x_position - a1.x_position)
            self._graph.add_edge(f"{a1.id}_front", f"{a2.id}_front", weight=spacing)
            self._graph.add_edge(f"{a1.id}_back", f"{a2.id}_back", weight=spacing)

        depot_x, depot_y = wh.depot_position
        for aisle in wh.aisles:
            front_id = f"{aisle.id}_front"
            front_pos = self._graph.nodes[front_id]["pos"]
            dist = abs(depot_x - front_pos[0]) + abs(depot_y - front_pos[1])
            self._graph.add_edge("depot", front_id, weight=dist)

    @property
    def node_count(self) -> int:
        return self._graph.number_of_nodes()

    @property
    def edge_count(self) -> int:
        return self._graph.number_of_edges()

    def has_node(self, node_id: str) -> bool:
        return self._graph.has_node(node_id)

    def distance(self, from_node: str, to_node: str) -> float:
        return nx.shortest_path_length(self._graph, from_node, to_node, weight="weight")

    def shortest_path(self, from_node: str, to_node: str) -> list[str]:
        return nx.shortest_path(self._graph, from_node, to_node, weight="weight")

    def distance_matrix(self, nodes: list[str]) -> dict[str, dict[str, float]]:
        matrix: dict[str, dict[str, float]] = {}
        for src in nodes:
            matrix[src] = {}
            for dst in nodes:
                matrix[src][dst] = 0.0 if src == dst else self.distance(src, dst)
        return matrix
