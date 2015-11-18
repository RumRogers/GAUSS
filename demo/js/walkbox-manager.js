var WalkBox = function(id)
{
    this.id = id;
    this.visible = true;
    this.polygon = new Polygon();
    this.maxScaleFactor = 100;
    this.minScaleFactor = 100;
    this.deltaScale = 1;
    this.walkingSound = null;
    this.neighbors = [];
};

var Neighbor = function(wbId, commonEdge)
{
    this.wbId = wbId;
    this.commonEdge = commonEdge;
};

var Polygon = function()
{
    this.points = [];
    this.edges = [];
    this.closed = false;
    this.centroid = null;
    this.top = null;
    this.bottom = null;
    this.close = function()
    {
        this.closed = true;
        var points = this.points;
        for(var i = 0; i < points.length; i++)
            this.edges[i] = [points[i], points[(i + 1) % points.length]];

        this.centroid = getPolygonCentroid(this);
        var topAndBottom = getPolygonTopAndBottom(this);
        this.top = topAndBottom.top;
        this.bottom = topAndBottom.bottom;
    };
    this.getNearestPointToEdge = function(p, vertex1, vertex2)
    {
        var sqr = function(x) { return x * x; };
        var l2 = sqr(vertex1.getDistance(vertex2));
        if (l2 == 0) return vertex1;
        var t = ((p.x - vertex1.x) * (vertex2.x - vertex1.x) + (p.y - vertex1.y) * (vertex2.y - vertex1.y)) / l2;
        if (t < 0) return vertex1;
        if (t > 1) return vertex2;
        return new paper.Point(vertex1.x + t * (vertex2.x - vertex1.x), vertex1.y + t * (vertex2.y - vertex1.y));
    };
    this.getNearestPoint = function(p)
    {
        var list = [];

        for(var i = 0; i < this.edges.length; i++)
            list.push(this.getNearestPointToEdge(p, this.edges[i][0], this.edges[i][1]));

        var minDist = Number.MAX_VALUE;
        var minIdx = -1;

        for(var i = 0; i < list.length; i++)
        {
            var dist = getDistanceFromPoints(p, list[i]);
            if(minDist > dist)
            {
                minDist = dist;
                minIdx = i;
            }
        }

        return list[minIdx];
    };
};

var Point = function(x, y)
{
    this.x = x;
    this.y = y;
};

var highlightCloseVertex = function(p, wb, precision)
{
    var points = wb.polygon.points;
    for(var i = 0; i < points.length; i++)
        if(p.x >= points[i].x - precision && p.x < points[i].x + precision)
            if(p.y >= points[i].y - precision && p.y < points[i].y + precision)
            {
                wb.polygon.points[i].highlight = true;
                return;
            }
};

var resetVertexHighlighting = function(wb)
{
    var points = wb.polygon.points;
    for(var i = 0; i < points.length; i++)
        wb.polygon.points[i].highlight = false;
};

var resetVertexLocking = function(wb)
{
    var points = wb.polygon.points;
    for(var i = 0; i < points.length; i++)
        wb.polygon.points[i].locked = false;
};

var getHighlightedWalkboxVertex = function(wboxes)
{
    for(var i in wboxes)
    {
        var points = wboxes[i].polygon.points;
        for(var j = 0; j < points.length; j++)
            if(points[j].highlight)
                return { wboxId : i, point : points[j] };
    }
    return null;
};

var getLockedWalkboxVertex = function(wboxes)
{
    for(var i in wboxes)
    {
        var points = wboxes[i].polygon.points;
        for(var j = 0; j < points.length; j++)
            if(points[j].locked)
                return { wboxId : i, point : points[j] };
    }
    return null;
};

var changeLockedWalkboxVertexPosition = function(wboxes, wboxId, x, y)
{
    var poly = wboxes[wboxId].polygon;
    var points = poly.points;
    for(var j = 0; j < points.length; j++)
        if(points[j].locked)
        {
            points[j].x = x;
            points[j].y = y;
        }
    if(poly.closed === true)
        poly.close();
};

var isPointOnLine = function(edge, p, precision)
{
    var edgePointA = edge[0];
    var edgePointB = edge[1];

    var dist = Math.abs((edgePointB.y - edgePointA.y) * p.x - (edgePointB.x - edgePointA.x) * p.y + edgePointB.x * edgePointA.y
        - edgePointB.y * edgePointA.x) / Math.sqrt(Math.pow(edgePointB.y - edgePointA.y, 2)
        + Math.pow(edgePointB.x - edgePointA.x, 2));

    var maxX = Math.max(edgePointA.x, edgePointB.x);
    var minX = Math.min(edgePointA.x, edgePointB.x);
    var maxY = Math.max(edgePointA.y, edgePointB.y);
    var minY = Math.min(edgePointA.y, edgePointB.y);

    if(dist <= precision && (p.x >= minX - 5 && p.x < maxX + 5 && p.y >= minY -5 && p.y < maxY + 5))
        return true;
};


var highlightCloseEdge = function(p, wb, precision)
{
    var edges = wb.polygon.edges;
    for(var i = 0; i < edges.length; i++)
        if(isPointOnLine(edges[i], p, precision))
            {
                wb.polygon.edges[i].highlight = true;
                return;
            }
};

var getHighlightedWalkboxEdge = function(wboxes)
{
    for(var i in wboxes)
    {
        var edges = wboxes[i].polygon.edges;
        for(var j = 0; j < edges.length; j++)
            if(edges[j].highlight)
                return { wboxId : i, edge : edges[j] };
    }
    return null;
};

var lockVertex = function(wb, p)
{
    var points = wb.polygon.points;
    for(var i = 0; i < points.length; i++)
        if(p.x == points[i].x && p.y == points[i].y)
            {
                wb.polygon.points[i].locked = true;
                return;
            }
};

var resetEdgeHighlighting = function(wb)
{
    var edges = wb.polygon.edges;
    for(var i = 0; i < edges.length; i++)
        wb.polygon.edges[i].highlight = false;
};

var splitEdge = function(wb, edge, newPoint)
{
    var edges = wb.polygon.edges;
    var points = wb.polygon.points;
    var x1 = edge[0].x, y1 = edge[0].y;
    for(var i = 0; i < edges.length; i++)
        if(edges[i][0].x == edge[0].x && edges[i][0].y == edge[0].y
            && edges[i][1].x == edge[1].x && edges[i][1].y == edge[1].y)
        {
            wb.polygon.edges.splice(i, 0, [edge[0], new paper.Point(newPoint.x, newPoint.y)]);
            wb.polygon.edges[i + 1][0] = new paper.Point(newPoint.x, newPoint.y);
            break;
        }
    for(var i = 0; i < points.length; i++)
        if(points[i].x == x1 && points[i].y == y1)
        {
            wb.polygon.points.splice(i + 1, 0, new paper.Point(newPoint.x, newPoint.y));
            break;
        }
};

var getPolygonCentroid = function(poly)
{
    var p = new paper.Point(0, 0);
    var points = poly.points;

    for(var i = 0; i < points.length; i++)
    {
        p.x += points[i].x;
        p.y += points[i].y;
    }

    p.x /= points.length;
    p.y /= points.length;

    return p;
};

var getPolygonTopAndBottom = function(poly)
{
    var points = poly.points;
    var minY = points[0].y;
    var maxY = points[0].y;

    for(var i = 1; i < points.length; i++)
    {
        if(minY > points[i].y)
            minY = points[i].y;
        if(maxY < points[i].y)
            maxY = points[i].y;
    }

    return { top : minY, bottom : maxY };
};

var getEdgeList = function(room)
{
    var edges = {};
    for (var key in room.walkBoxes)
    {
        var _edges = room.walkBoxes[key].polygon.edges;
        for (var i = 0; i < _edges.length; i++)
        {
            var edge_str1 = '(' + _edges[i][0].x + ', ' + _edges[i][0].y + ')';
            var edge_str2 = '(' + _edges[i][1].x + ', ' + _edges[i][1].y + ')';
            var tmp = edge_str1 + ', ' + edge_str2;
            if (tmp in edges)
                edges[tmp]['IDs'].push(key);
            else
            {
                tmp = edge_str2 + ', ' + edge_str1;
                if (tmp in edges)
                    edges[tmp]['IDs'].push(key);
                else
                    edges[tmp] = {IDs: [key], edge: _edges[i] };
            }
        }
    }
    return edges;
};

var computeWalkboxNeighbors = function(rooms)
{
    for(var i in rooms)
    {
        var edgeList = getEdgeList(rooms[i]);
        for(var key in edgeList)
            if(edgeList[key].IDs.length > 1)
            {
                var IDs = edgeList[key].IDs;
                var neighborsList = rooms[i].walkBoxes[IDs[0]].neighbors;
                var alreadyPresent = false;
                for(var j = 0; j < neighborsList.length; j++)
                    if(neighborsList[j].wbId === IDs[1]) // has the neighbor already been added?
                    {
                        alreadyPresent = true;
                        break;
                    }

                if(alreadyPresent === true)
                    continue;
                rooms[i].walkBoxes[IDs[0]].neighbors.push(new Neighbor(IDs[1], edgeList[key].edge));
                rooms[i].walkBoxes[IDs[1]].neighbors.push(new Neighbor(IDs[0], edgeList[key].edge));
            }
    }

};

var getWalkboxFromPoint = function(wboxes, p, skipInvisible)
{
    for(var i in wboxes)
    {
        if(skipInvisible === true && wboxes[i].visible === false)
            continue;
        if (isPointInPoly(wboxes[i].polygon.points, p))
            return wboxes[i];
    }
    return null;
};

var getCommonEdge = function(wb1, wb2)
{
    var edge1 = null, edge2 = null;

    for(var i = 0; i < wb1.neighbors.length; i++)
    {
        var n = wb1.neighbors[i];
        if(n.wbId === wb2.id)
        {
            edge1 = n.commonEdge;
            break;
        }
    }

    if(!edge1)
        return null;

    for(var i = 0; i < wb2.neighbors.length; i++)
    {
        var n = wb2.neighbors[i];
        if(n.wbId === wb1.id)
        {
            edge2 = n.commonEdge;
            break;
        }
    }

    if(!edge2)
        return null;

    if(edge1 !== edge2)
        return null;

    return edge1;
};

var getNearestWalkBox = function(wboxes, point)
{
    var wb;
    var minDist = Infinity;
    var p;

    for(var i in wboxes)
    {
        if(wboxes[i].visible === false)
            continue;
        p = wboxes[i].polygon.getNearestPoint(point);
        var dist = getDistanceBetweenPoints(p, point);
        if (dist < minDist)
        {
            minDist = dist;
            wb = wboxes[i];
        }
    }
    return wb;
};

var deleteWalkbox = function(roomId, wbId)
{
    delete editorMapIdRoom[roomId].walkBoxes[wbId];
};