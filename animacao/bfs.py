# Animação do algoritmo BFS para encontrar o menor caminho em um grid 8x8

from manim import Scene, GREEN, FadeOut, WHITE, RED, YELLOW, BLUE, Graph, ORIGIN


class BFSGridAnimation(Scene):
    def construct(self):
        # Definição de constantes
        COLOR_START = GREEN
        COLOR_TARGET = RED
        COLOR_FRONTIER = YELLOW
        COLOR_VISITED = YELLOW
        COLOR_PATH = BLUE

        rows = 8
        cols = 8

        vertices = []
        edges = []
        layout = {}

        # Coordenadas dos vértices que serão removidos
        obstacles = {(0, 1), (1, 1), (2, 1), (3, 1), (6, 1), (6, 2), (5, 2), (5, 4),
                     (4, 4), (3, 4), (2, 4), (7, 6), (6, 6), (5, 6), (4, 6), (3, 6)}

        for r in range(rows):
            for c in range(cols):
                v = (r, c)

                # Se encontrar as coordenadas selecionadas em obstacles, pula
                if v in obstacles:
                    continue

                vertices.append(v)
                layout[v] = [c, r, 0]

                # Verifica se o vizinho da direita existe E não é um obstáculo
                if c + 1 < cols:
                    neighbor_right = (r, c + 1)
                    if neighbor_right not in obstacles:
                        edges.append((v, neighbor_right))

                # Verifica se o vizinho de cima existe E não é um obstáculo
                if r + 1 < rows:
                    neighbor_up = (r + 1, c)
                    if neighbor_up not in obstacles:
                        edges.append((v, neighbor_up))

        # Constroi lista de adjacências
        adj = {v: [] for v in vertices}
        for u, v in edges:
            adj[u].append(v)
            adj[v].append(u)

        # Cria o Grafo Manim
        g = Graph(
            vertices,
            edges,
            layout=layout,
            labels=False,
            vertex_config={"radius": 0.2},
            edge_config={"stroke_width": 4, "color": WHITE}
        )
        g.scale_to_fit_height(7).move_to(ORIGIN)
        self.add(g)  # Adiciona o grafo base estaticamente

        # 5. Definir Início e Alvo
        start_node = (0, 0)
        target_node = (rows - 1, cols - 1)  # Canto (7, 7)

        # Animar o início e o alvo
        self.play(
            g[start_node].animate.set_color(COLOR_START),
            g[target_node].animate.set_color(COLOR_TARGET)
        )
        self.wait(0.5)

        queue = [start_node]
        visited = {start_node}
        parent = {start_node: None}

        found = False

        # Loop de Animação do BFS
        while queue:
            current = queue.pop(0)

            if current == target_node:
                found = True
                break

            step_animations = []

            # Colorir o nó atual como "visitado"
            if current != start_node:
                step_animations.append(
                    g[current].animate.set_color(COLOR_VISITED)
                )

            # Olhar todos os vizinhos do nó atual
            for neighbor in adj[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    parent[neighbor] = current
                    queue.append(neighbor)

                    # Animar o nó 'neighbor' como parte da nova fronteira
                    step_animations.append(
                        g[neighbor].animate.set_color(COLOR_FRONTIER)
                    )

                    # Encontrar a aresta entre current e neighbor
                    edge_key = (current, neighbor) if (
                        current, neighbor) in g.edges else (neighbor, current)
                    step_animations.append(
                        g.edges[edge_key].animate.set_color(COLOR_FRONTIER)
                    )

            # Executa todas as animações de uma vez
            if step_animations:
                self.play(*step_animations, run_time=0.1)

        # Reconstroi o caminho
        if found:
            path_animations = []
            curr = target_node

            # Faz o backtrack volta para o início
            while curr != start_node:
                # Colore o nó do caminho
                path_animations.append(g[curr].animate.set_color(COLOR_PATH))

                prev = parent[curr]

                # Colore a aresta do caminho
                edge_key = (curr, prev) if (
                    curr, prev) in g.edges else (prev, curr)
                path_animations.append(
                    g.edges[edge_key].animate.set_color(COLOR_PATH))

                curr = prev

            # Colore o vértice inicial
            path_animations.append(g[start_node].animate.set_color(COLOR_PATH))

            self.play(*path_animations, run_time=1.5)

        self.wait(3)
