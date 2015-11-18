var SearchGraphNode = function()
{
    this.g = Number.MAX_VALUE;
    this.h = null;
    this.f = function() { return this.g + this.h; };
    this.walkbox = null;
    this.parentIdx = null;
};

var PathFinder = function()
{
    this.open = [];
    this.closed = [];
    this.getHighestPriorityNodeIndex = function()
    {
        var minF = Number.MAX_VALUE;
        var idx;

        for(var i = 0; i < this.open.length; i++)
        {
            var curr = this.open[i];
            if(curr.f() < minF)
            {
                minF = curr.f();
                idx = i;
            }
        }
        return idx;
    };
    this.getClosedNodeNearestToGoal = function()
    {
        var minH = Number.MAX_VALUE;
        var idx;

        for(var i = 0; i < this.closed.length; i++)
        {
            var curr = this.closed[i];
            if(curr.h < minH)
            {
                minH = curr.f();
                idx = i;
            }
        }
        return this.closed[idx];
    };

    this.walkboxIdxInsideList = function(wb, which)
    {
        var list = which == 'open' ? this.open : this.closed;
        for(var i = 0; i < list.length; i++)
            if(wb.id === list[i].walkbox.id)
                return i;
        return -1;
    };
    this.aStar = function(nodes, startPoint, destPoint)
    {
        var getNearestEndpoint = function(edge, p)
        {
            var dist1 = getDistanceFromPoints(edge[0], p);
            var dist2 = getDistanceFromPoints(edge[1], p);

            if(dist1 < dist2)
                return edge[0];
            return edge[1];
        };
        var getNearestPointInWalkBox = function(point, skipInvisible)
        {
            var tmp = new Point(point.x, point.y);
            var minDist = Infinity;
            var p;
            for(var i in nodes)
            {
                if(skipInvisible === true && nodes[i].visible === false)
                    continue;
                p = nodes[i].polygon.getNearestPoint(point);
                var dist = getDistanceBetweenPoints(p, point);
                if (dist < minDist)
                {
                    minDist = dist;
                    tmp = new Point(p.x, p.y);
                }
            }
            return tmp;
        };
        var start;
        var tmp = new Point(startPoint.x, startPoint.y);
        start = getWalkboxFromPoint(nodes, tmp);
        if(!start)
        {
            start = getNearestWalkBox(nodes, tmp);
            if (!start)
            {
                alert("SEVERE PATHFINDING ERROR");
                return [];
            }
        }

        tmp = new Point(destPoint.x, destPoint.y);
        var goal = getWalkboxFromPoint(nodes, tmp);
        if(!goal)
        {
            tmp = getNearestPointInWalkBox(tmp, true);
            goal = getNearestWalkBox(nodes, tmp, true);
            if(!goal)
            {
                alert("SEVERE PATHFINDING ERROR");
                return [];
            }

        }
        destPoint = new Point(tmp.x, tmp.y);

        if(startPoint.x === destPoint.x && startPoint.y === destPoint.y)
            return [];

        tmp = start.polygon.centroid;
        var startPos = new paper.Point(tmp.x, tmp.y);
        tmp = goal.polygon.centroid;
        var goalPos = new paper.Point(tmp.x, tmp.y);

        var s = new SearchGraphNode();
        s.walkbox = start;
        s.g = 0;
        s.h = startPos.getDistance(goalPos);
        s.parentIdx = -1;

        this.open.push(s);
        var goalFound = false;
        while(!goalFound)
        {
            var highestPriorityIndex = this.getHighestPriorityNodeIndex();
            var currNode = this.open[highestPriorityIndex];
            if(!currNode) // disconnected node
                break;

            if(currNode.walkbox.id === goal.id)
            {
                goalFound = true;
                break;
            }
            this.open.splice(highestPriorityIndex, 1);
            this.closed.push(currNode);

            var currNeighborsIds = currNode.walkbox.neighbors;
            var currNeighbors = [];
            for(var i = 0; i < currNeighborsIds.length; i++)
                currNeighbors.push(nodes[currNeighborsIds[i].wbId]);

            for(var i = 0; i < currNeighbors.length; i++)
            {
                var neighbor = new SearchGraphNode();
                neighbor.walkbox = currNeighbors[i];
                var currNodeCenter = currNode.walkbox.polygon.centroid;
                var neighborCenter = neighbor.walkbox.polygon.centroid;
                var distance = currNodeCenter.getDistance(neighborCenter);
                var cost = currNode.g + distance;
                var neighborIdxInOpenList = this.walkboxIdxInsideList(neighbor.walkbox, 'open');
                var neighborIdxInClosedList = this.walkboxIdxInsideList(neighbor.walkbox, 'closed');

                if(neighborIdxInOpenList != -1 && cost < this.open[neighborIdxInOpenList].g)
                {
                    this.open.splice(neighborIdxInOpenList, 1);
                    neighborIdxInOpenList = -1;
                }
                if(neighborIdxInOpenList == -1 && neighborIdxInClosedList == -1)
                {
                    neighbor.g = cost;
                    neighbor.h = neighborCenter.getDistance(goalPos);
                    neighbor.parentIdx = this.closed.indexOf(currNode);
                    this.open.push(neighbor);
                }
            }
        }
        var walkBoxesToTraverse = [];
        var node = this.open[this.getHighestPriorityNodeIndex()];
        if(!node) // disconnected node, start from the nearest visited node
            walkBoxesToTraverse.push(this.getClosedNodeNearestToGoal().walkbox.id);
        while(node && node.parentIdx != -1 && this.closed[node.parentIdx].walkbox != start)
        {
            node = this.closed[node.parentIdx];
            walkBoxesToTraverse.unshift(node.walkbox.id);
        }

        walkBoxesToTraverse.push(goal.id);

        this.open = [];
        this.closed = [];

        var shortestPath = [];
        var currWB = start.id;

        var startGoalEdge = [startPoint, destPoint];
        for(var i = 0; i < walkBoxesToTraverse.length; i++)
        {
            var nextWb = walkBoxesToTraverse[i];
            var commonEdge = getCommonEdge(nodes[currWB], nodes[nextWb]);
            if(!commonEdge)
            {
                if(currWB !== nextWb)
                    destPoint = nodes[currWB].polygon.getNearestPoint(destPoint);
                break;
            }
            var nextWayPoint = checkLineIntersection(startGoalEdge, commonEdge);
            if(!nextWayPoint.inLines)
                nextWayPoint = getNearestEndpoint(getCommonEdge(nodes[currWB], nodes[nextWb]), nextWayPoint);
            nextWayPoint = new Point(nextWayPoint.x, nextWayPoint.y);
            if(nodes[nextWb].visible === false)
            {
                destPoint = nextWayPoint;
                break;
            }
            shortestPath.push(nextWayPoint);
            currWB = nextWb;
        }

        shortestPath.push(destPoint);
        return shortestPath;
    };
};
//TODO: modify the Open and Closed list with a hashmap in order to access an element in O(1)