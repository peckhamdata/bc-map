// Determine the intersection point of two line segments

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect

export function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false;
    }

    const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    if (denominator === 0) {
        return false;
    }

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false;
    }

    const x = Math.floor(x1 + ua * (x2 - x1));
    const y = Math.floor(y1 + ua * (y2 - y1));

    return { x, y };
}

// Draw line parallel to another from https://stackoverflow.com/a/63538916/1064619

export function parallel(line, offset = 0) {
    let [ox, oy] = [0, 0];
    if (offset) {
        const [dx, dy] = [line.start.x - line.end.x, line.start.y - line.end.y];
        const scale = offset / (dx * dx + dy * dy) ** 0.5;
        [ox, oy] = [-dy * scale, dx * scale];
    }
    return {
        geometry: {
            start: { x: Math.floor(ox + line.start.x), y: Math.floor(oy + line.start.y) },
            end: { x: Math.floor(ox + line.end.x), y: Math.floor(oy + line.end.y) }
        }
    };
}

// Sort them based on distance from the start of the line:
// https://stackoverflow.com/a/20916980/1064619

export function distance_between(x1, y1, x2, y2) {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.floor(Math.sqrt(a * a + b * b));
}

// Shorten a line segment by a given length
export function shorten_line(line, length) {
    const xlen = line.geometry.end.x - line.geometry.start.x;
    const ylen = line.geometry.end.y - line.geometry.start.y;
    const hlen = Math.sqrt(xlen ** 2 + ylen ** 2);
    const ratio = length / hlen;

    const smallerX = line.geometry.start.x + xlen * ratio;
    const smallerY = line.geometry.start.y + ylen * ratio;

    return {
        geometry: {
            start: { x: line.geometry.start.x, y: line.geometry.start.y },
            end: { x: Math.floor(smallerX), y: Math.floor(smallerY) }
        }
    };
}

// Generate lines at right angles to another line
export function right_angle_line(line, dist, position) {
    const offset = shorten_line(line, position);
    const angle = Math.atan2(line.geometry.end.y - line.geometry.start.y, line.geometry.end.x - line.geometry.start.x);

    const plus = {
        geometry: {
            start: { x: offset.geometry.end.x, y: offset.geometry.end.y },
            end: { x: Math.floor(-Math.sin(angle) * dist + offset.geometry.end.x), y: Math.floor(Math.cos(angle) * dist + offset.geometry.end.y) }
        }
    };

    const minus = {
        geometry: {
            start: { x: offset.geometry.end.x, y: offset.geometry.end.y },
            end: { x: Math.floor(Math.sin(angle) * dist + offset.geometry.end.x), y: Math.floor(-Math.cos(angle) * dist + offset.geometry.end.y) }
        }
    };

    return [plus, minus];
}

