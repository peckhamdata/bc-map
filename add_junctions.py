import json
import itertools
import numpy as np

def bezier(t, P0, P1, P2):
    """Quadratic Bézier curve equation."""
    return (1 - t)**2 * np.array(P0) + 2 * (1 - t) * t * np.array(P1) + t**2 * np.array(P2)

def sample_curve(P0, P1, P2, num_samples=50):
    """Generate sampled points along a Bézier curve."""
    return [bezier(t, P0, P1, P2) for t in np.linspace(0, 1, num_samples)]

def find_nearby_intersections(curve1, curve2, threshold=5):
    """Check for intersections by comparing sampled points with a distance threshold."""
    samples1 = sample_curve(*curve1)
    samples2 = sample_curve(*curve2)
    
    for p1 in samples1:
        for p2 in samples2:
            if np.linalg.norm(p1 - p2) < threshold:
                return tuple(p1)  # Return first detected intersection
    return None

def detect_junctions(data):
    """Detect junctions by checking sampled Bézier curves for close intersections."""
    for curve1, curve2 in itertools.combinations(data, 2):
        c1_geom = curve1["geometry"]
        c2_geom = curve2["geometry"]
        
        P0_1 = (c1_geom["start"]["x"], c1_geom["start"]["y"])
        P1_1 = (c1_geom["control"]["x"], c1_geom["control"]["y"])
        P2_1 = (c1_geom["end"]["x"], c1_geom["end"]["y"])
        
        P0_2 = (c2_geom["start"]["x"], c2_geom["start"]["y"])
        P1_2 = (c2_geom["control"]["x"], c2_geom["control"]["y"])
        P2_2 = (c2_geom["end"]["x"], c2_geom["end"]["y"])
        
        intersection = find_nearby_intersections((P0_1, P1_1, P2_1), (P0_2, P1_2, P2_2))
        
        if intersection is not None:
            junction = {"x": intersection[0], "y": intersection[1]}
            curve1["junctions"].append(junction)
            curve2["junctions"].append(junction)
    
    return data

def main():
    with open("city_1.json", "r") as f:
        data = json.load(f)
    
    updated_data = detect_junctions(data)
    
    with open("city_1_with_junctions.json", "w") as f:
        json.dump(updated_data, f, indent=4)
    
if __name__ == "__main__":
    main()