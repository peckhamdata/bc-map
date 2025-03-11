import numpy as np
import json
import logging
from scipy.spatial import KDTree

# Configure logging
logging.basicConfig(level=logging.INFO)

# LCG for controlled randomness
def lcg(seed, size):
    m, a, c = 2**32, 1664525, 1013904223
    values = []
    x = seed
    for _ in range(size):
        x = (a * x + c) % m
        values.append(x / m)
    return values

# Quadratic Bézier curve
def bezier_curve(P0, P1, P2, num_points=20):
    t = np.linspace(0, 1, num_points)
    curve = (1 - t)[:, None]**2 * P0 + 2 * (1 - t)[:, None] * t[:, None] * P1 + t[:, None]**2 * P2
    return curve[:, 0].tolist(), curve[:, 1].tolist()

# Cross street density setting (higher = more cross streets)
CROSS_STREET_DENSITY = 3  # 🔧 Adjust this to control cross street frequency

# Generate city layout
def generate_bezier_city():
    num_curves = 39
    rng = lcg(39, num_curves * 3)

    scale_factor = 5000
    radius = scale_factor * 0.6
    centerX, centerY = scale_factor * 1.4, scale_factor

    streets = []

    # Generate main Bézier streets
    for i in range(num_curves):
        angle = np.pi * (i / (num_curves - 1))
        x0, y0 = centerX + radius * np.cos(angle), centerY + radius * np.sin(angle)
        x1, y1 = centerX + (radius * 1.2) * np.cos(angle) + (rng[i+1] - 0.5) * radius, centerY + (radius * 1.2) * np.sin(angle) + (rng[i+2] * radius)
        x2, y2 = centerX + (radius * 1.8) * np.cos(angle), centerY + (radius * 1.8) * np.sin(angle)

        bx, by = bezier_curve([x0, y0], [x1, y1], [x2, y2], num_points=50)

        streets.append({"id": len(streets), "points": list(zip(bx, by)), "type": "main"})

    return {"streets": streets}

# Generate cross streets
def generate_cross_streets(city_data):
    cross_streets = []
    all_points = [pt for street in city_data["streets"] for pt in street["points"]]
    tree = KDTree(all_points)

    rng = lcg(42, 1000)

    for street in city_data["streets"]:
        step_size = max(2, 20 // CROSS_STREET_DENSITY)  # More density → more frequent cross streets
        for i in range(5, len(street["points"]) - 5, step_size):  # Walk along the curve
            bx, by = street["points"][i]

            # Generate perpendicular vector
            if i < len(street["points"]) - 1:
                dx, dy = street["points"][i + 1][0] - street["points"][i - 1][0], street["points"][i + 1][1] - street["points"][i - 1][1]
                norm = np.sqrt(dx**2 + dy**2)
                dx, dy = dx / norm, dy / norm

                px, py = -dy, dx  # Perpendicular vector
                offset = (rng[i] - 0.5) * 500  # More spread for variety
                x_ext, y_ext = bx + px * offset, by + py * offset

                # Find nearest street point
                dist, idx = tree.query([x_ext, y_ext])
                if dist < 300:  # Allow more connections
                    x_nearest, y_nearest = all_points[idx]

                    # Create cross street
                    cross_streets.append({
                        "id": len(city_data["streets"]) + len(cross_streets),
                        "points": [[bx, by], [x_nearest, y_nearest]],
                        "type": "cross"
                    })

    city_data["streets"].extend(cross_streets)
    return city_data

# Generate the city
bezier_city = generate_bezier_city()
bezier_city_with_cross = generate_cross_streets(bezier_city)

# Save to JSON
output_path = "bezier_city_with_cross.json"
with open(output_path, "w") as json_file:
    json.dump(bezier_city_with_cross, json_file, indent=4)

logging.info(f"City JSON saved to {output_path}")
