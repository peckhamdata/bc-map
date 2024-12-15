import { intersect, distance_between, shorten_line, right_angle_line} from './geometry-utils.js';

// Check if a line is inside a lot
export function inside_lot(line, lot, edge_index) {
    let hits = [];
    lot.forEach((edge, i) => {
        if (i !== edge_index) {
            const hit = intersect(
                line.geometry.start.x,
                line.geometry.start.y,
                line.geometry.end.x,
                line.geometry.end.y,
                edge.geometry.start.x,
                edge.geometry.start.y,
                edge.geometry.end.x,
                edge.geometry.end.y
            );

            if (hit) {
                if (line.line_id !== edge.id) {
                    hits.push(hit);
                }
            }
        }
    });

    return hits.length >= 1 ? hits : false;
}

// Add a single building based on lot edges
export function add_building(lot_edges, edge_index, start, end) {
    const far_away = 1000;

    function building_right_angle(edge, edge_index, far_away, start) {
        const right_angle_lines = right_angle_line(edge, far_away, start);

        const left_hits = inside_lot(right_angle_lines[0], lot_edges, edge_index);
        if (left_hits.length > 0) {
            const inside_line = {
                geometry: {
                    start: right_angle_lines[0].geometry.start,
                    end: left_hits[0]
                }
            };

            const length = distance_between(
                inside_line.geometry.start.x,
                inside_line.geometry.start.y,
                inside_line.geometry.end.x,
                inside_line.geometry.end.y
            ) / 4;

            return shorten_line(inside_line, length);
        } else {
            const right_hits = inside_lot(right_angle_lines[1], lot_edges, edge_index);
            if (right_hits.length > 0) {
                const inside_line = {
                    geometry: {
                        start: right_angle_lines[1].geometry.start,
                        end: right_hits[0]
                    }
                };

                const length = distance_between(
                    inside_line.geometry.start.x,
                    inside_line.geometry.start.y,
                    inside_line.geometry.end.x,
                    inside_line.geometry.end.y
                ) / 4;

                return shorten_line(inside_line, length);
            }
        }
    }

    let building = [];
    const left_line = building_right_angle(lot_edges[edge_index], edge_index, far_away, start);
    if (left_line !== undefined) {
        building.push(left_line);
    }

    const right_line = building_right_angle(lot_edges[edge_index], edge_index, far_away, end);
    if (right_line !== undefined) {
        building.push(right_line);
    }

    if (left_line !== undefined && right_line !== undefined) {
        building.push({
            geometry: {
                start: left_line.geometry.end,
                end: right_line.geometry.end
            }
        });
    }

    return building;
}

// Add multiple buildings along the lot edges
export function add_buildings(lot_edges, size) {
    let buildings = [];

    lot_edges.forEach((edge, i) => {
        const length = distance_between(
            edge.geometry.start.x,
            edge.geometry.start.y,
            edge.geometry.end.x,
            edge.geometry.end.y
        );

        let start = 10;
        let end = size;

        do {
            const building = add_building(lot_edges, i, start, end);
            buildings.push(building);
            start = end + 1;
            end += size;
        } while (end <= length);
    });

    let buildings_added = [];
    buildings.forEach((building, idx) => {
        let hit = undefined;
        building.forEach(line => {
            buildings.forEach((existing_building, existing_idx) => {
                if (idx !== existing_idx) {
                    existing_building.forEach(existing_line => {
                        hit = intersect(
                            line.geometry.start.x,
                            line.geometry.start.y,
                            line.geometry.end.x,
                            line.geometry.end.y,
                            existing_line.geometry.start.x,
                            existing_line.geometry.start.y,
                            existing_line.geometry.end.x,
                            existing_line.geometry.end.y
                        );
                    });
                }
            });
        });
        if (hit === undefined || hit === false) {
            buildings_added.push(building);
        } else {
            console.log('HIT!');
        }
    });

    return buildings_added;
}

// Check if shapes intersect with existing edges
export function intersects(shape, existing) {
    for (const new_line of shape) {
        for (const line of existing) {
            const hit = intersect(
                new_line.geometry.start.x,
                new_line.geometry.start.y,
                new_line.geometry.end.x,
                new_line.geometry.end.y,
                line.geometry.start.x,
                line.geometry.start.y,
                line.geometry.end.x,
                line.geometry.end.y
            );
            if (hit) {
                return true;
            }
        }
    }
    return false;
}

// Check if a lot is open (not fully enclosed)
export function is_lot_open(lot_edges) {
    let all_points = [];
    lot_edges.forEach(edge => {
        all_points.push(edge.geometry.start);
        all_points.push(edge.geometry.end);
    });

    let unique_points = [];
    let dupes = [];
    all_points.forEach(point => {
        const exists = unique_points.find(
            existing_point => existing_point.x === point.x && existing_point.y === point.y
        );
        if (!exists) {
            unique_points.push(point);
        } else {
            dupes.push(point);
        }
    });

    let new_line = [];
    all_points.forEach(point => {
        const is_a_dupe = dupes.find(dupe => dupe.x === point.x && dupe.y === point.y);
        if (!is_a_dupe) {
            new_line.push(point);
        }
    });

    if (new_line.length < 2) {
        return undefined;
    } else {
        return {
            geometry: {
                start: { x: new_line[0].x, y: new_line[0].y },
                end: { x: new_line[1].x, y: new_line[1].y }
            }
        };
    }
}

// Add buildings along lot edges
export function add_buildings_to_lot_edges(lot_edges) {
    const size = 20;
    let edge_buildings = [];

    lot_edges.forEach((edge, i) => {
        let buildings = [];
        const length = distance_between(
            edge.geometry.start.x,
            edge.geometry.start.y,
            edge.geometry.end.x,
            edge.geometry.end.y
        );

        let start = 10;
        let end = size;

        do {
            const building = add_building(lot_edges, i, start, end);
            buildings.push({ geometry: building });
            start = end + 1;
            end += size;
        } while (end <= length);

        edge_buildings.push(buildings);
    });

    edge_buildings.forEach((edge, i) => {
        edge.forEach(building => {
            building.geometry.forEach(line => {
                // Check for intersections with buildings on other edges
                edge_buildings.forEach((other_edge, j) => {
                    if (j !== i) {
                        other_edge.forEach(other_edge_building => {
                            other_edge_building.geometry.forEach(other_line => {
                                const hit = intersect(
                                    line.geometry.start.x,
                                    line.geometry.start.y,
                                    line.geometry.end.x,
                                    line.geometry.end.y,
                                    other_line.geometry.start.x,
                                    other_line.geometry.start.y,
                                    other_line.geometry.end.x,
                                    other_line.geometry.end.y
                                );
                                if (hit) {
                                    if (hit.x || hit.y) {
                                        building.overlaps = true;
                                    }
                                }
                            });
                        });
                    }
                });
            });
        });
    });

    return edge_buildings;
}

// Remove overlapping buildings
export function remove_overlapping_buildings(buildings) {
    buildings.forEach(building => {
        buildings = buildings.filter(function (building) {
            return building.overlaps !== true;
        });
    });

    return buildings;
}

import { intersect, distance_between, shorten_line, right_angle_line, inside_lot } from './geometry-utils.js';

export function add_building(lot_edges, edge_index, start, end) {
    const far_away = 1000;

    function building_right_angle(edge, edge_index, far_away, start) {
        const right_angle_lines = right_angle_line(edge, far_away, start);

        const left_hits = inside_lot(right_angle_lines[0], lot_edges, edge_index);
        if (left_hits.length > 0) {
            const inside_line = {
                geometry: {
                    start: right_angle_lines[0].geometry.start,
                    end: left_hits[0]
                }
            };

            const length = distance_between(
                inside_line.geometry.start.x,
                inside_line.geometry.start.y,
                inside_line.geometry.end.x,
                inside_line.geometry.end.y
            ) / 4;

            return shorten_line(inside_line, length);
        } else {
            const right_hits = inside_lot(right_angle_lines[1], lot_edges, edge_index);
            if (right_hits.length > 0) {
                const inside_line = {
                    geometry: {
                        start: right_angle_lines[1].geometry.start,
                        end: right_hits[0]
                    }
                };

                const length = distance_between(
                    inside_line.geometry.start.x,
                    inside_line.geometry.start.y,
                    inside_line.geometry.end.x,
                    inside_line.geometry.end.y
                ) / 4;

                return shorten_line(inside_line, length);
            }
        }
    }

    let building = [];
    const left_line = building_right_angle(lot_edges[edge_index], edge_index, far_away, start);
    if (left_line !== undefined) {
        building.push(left_line);
    }

    const right_line = building_right_angle(lot_edges[edge_index], edge_index, far_away, end);
    if (right_line !== undefined) {
        building.push(right_line);
    }

    if (left_line !== undefined && right_line !== undefined) {
        building.push({
            geometry: {
                start: left_line.geometry.end,
                end: right_line.geometry.end
            }
        });
    }

    return building;
}

export function add_buildings(lot_edges, size) {
    let buildings = [];

    lot_edges.forEach((edge, i) => {
        const length = distance_between(
            edge.geometry.start.x,
            edge.geometry.start.y,
            edge.geometry.end.x,
            edge.geometry.end.y
        );

        let start = 10;
        let end = size;

        do {
            const building = add_building(lot_edges, i, start, end);
            buildings.push(building);
            start = end + 1;
            end += size;
        } while (end <= length);
    });

    let buildings_added = [];
    buildings.forEach((building, idx) => {
        let hit = undefined;
        building.forEach(line => {
            buildings.forEach((existing_building, existing_idx) => {
                if (idx !== existing_idx) {
                    existing_building.forEach(existing_line => {
                        hit = intersect(
                            line.geometry.start.x,
                            line.geometry.start.y,
                            line.geometry.end.x,
                            line.geometry.end.y,
                            existing_line.geometry.start.x,
                            existing_line.geometry.start.y,
                            existing_line.geometry.end.x,
                            existing_line.geometry.end.y
                        );
                    });
                }
            });
        });
        if (hit === undefined || hit === false) {
            buildings_added.push(building);
        } else {
            console.log('HIT!');
        }
    });

    return buildings_added;
}

export function intersects(shape, existing) {
    for (const new_line of shape) {
        for (const line of existing) {
            const hit = intersect(
                new_line.geometry.start.x,
                new_line.geometry.start.y,
                new_line.geometry.end.x,
                new_line.geometry.end.y,
                line.geometry.start.x,
                line.geometry.start.y,
                line.geometry.end.x,
                line.geometry.end.y
            );
            if (hit) {
                return true;
            }
        }
    }
    return false;
}

export function is_lot_open(lot_edges) {
    let all_points = [];
    lot_edges.forEach(edge => {
        all_points.push(edge.geometry.start);
        all_points.push(edge.geometry.end);
    });

    let unique_points = [];
    let dupes = [];
    all_points.forEach(point => {
        const exists = unique_points.find(
            existing_point => existing_point.x === point.x && existing_point.y === point.y
        );
        if (!exists) {
            unique_points.push(point);
        } else {
            dupes.push(point);
        }
    });

    let new_line = [];
    all_points.forEach(point => {
        const is_a_dupe = dupes.find(dupe => dupe.x === point.x && dupe.y === point.y);
        if (!is_a_dupe) {
            new_line.push(point);
        }
    });

    if (new_line.length < 2) {
        return undefined;
    } else {
        return {
            geometry: {
                start: { x: new_line[0].x, y: new_line[0].y },
                end: { x: new_line[1].x, y: new_line[1].y }
            }
        };
    }
}
