var polyTranslate = function(p, trX, trY)
{
    var points = [];

    for(var i = 0; i < p.points.length; i++)
        points[i] = { x : p.points[i].x + trX, y : p.points[i].y + trY };
    return points;
};


var cropImage = function(poly)
{
    var maskColor = 'rgba(255, 0, 255, 255)';
    var maskColorRGBA = [255, 0, 255, 255];

    var pixels = { data : null, imageWidth : null};

    var isMaskColor = function(pixelData)
    {
        return (pixelData[0] == maskColorRGBA[0] &&
            pixelData[1] == maskColorRGBA[1] &&
            pixelData[2] == maskColorRGBA[2] &&
            pixelData[3] == maskColorRGBA[3]);
    };

    var minX, minY, maxX, maxY;

    minX = maxX = poly.points[0].x;
    minY = maxY = poly.points[0].y;

    for(var i = 1; i < poly.points.length; i++)
    {
        var p = poly.points[i];
        if(p.x < minX)
            minX = p.x;
        if(p.x > maxX)
            maxX = p.x;
        if(p.y < minY)
            minY = p.y;
        if(p.y > maxY)
            maxY = p.y;
    }
    var tmpCanvas = document.createElement('canvas');
    var tmpContext = tmpCanvas.getContext('2d');
    tmpCanvas.width = maxX - minX;
    tmpCanvas.height = maxY - minY;
    tmpContext.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    tmpContext.fillStyle = 'white';
    tmpContext.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    var newPoly = owl.deepCopy(poly);
    newPoly.points = polyTranslate(newPoly, -minX, -minY);
    drawPolygon(newPoly, maskColor, maskColor, tmpContext);

    pixels.data = tmpContext.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height).data;
    pixels.imageWidth = tmpCanvas.width;
    var tmp = canvas.state;
    canvas.state = 'idle';
    updateCanvas(editorCurrentRoom, 'room');
    var cutImage = ctx.getImageData(minX, minY, tmpCanvas.width, tmpCanvas.height);
    canvas.state = tmp;



    var findPixelsIndex = function(i, j) { return (j * tmpCanvas.width + i) * 4; };
    for(var i = 0; i < tmpCanvas.width; i++)
        for(var j = 0; j < tmpCanvas.height; j++)
        {
            var idx = findPixelsIndex(i, j);
            var pixelColor = [pixels.data[idx], pixels.data[idx + 1], pixels.data[idx + 2], pixels.data[idx + 3]];
            if (isMaskColor(pixelColor) == false)
            {
                cutImage.data[idx] = 0;
                cutImage.data[idx + 1] = 0;
                cutImage.data[idx + 2] = 0;
                cutImage.data[idx + 3] = 0;
            }
        }
    tmpContext.putImageData(cutImage, 0, 0);

    return {src: tmpCanvas.toDataURL(), width: maxX - minX, height: maxY - minY, pos : { x : minX, y : minY }};
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
var isPointInPoly = function (poly, pt)
{
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
};

var qSort = function(a, orderingFunction) // Quicksort for walkbehinds ordering
{
    if (a.length == 0) return [];

    var left = [], right = [], pivot = a[0];

    for (var i = 1; i < a.length; i++)
    {
        orderingFunction(a[i], pivot) === true ? left.push(a[i]) : right.push(a[i]);
    }

    return qSort(left, orderingFunction).concat(pivot, qSort(right, orderingFunction));
};

var orderWalkBehinds = function(wb1, wb2)
{
    return wb1.centralPerspectiveWalkBehind < wb2.centralPerspectiveWalkBehind;
};

var orderPanels = function(panel1_id, panel2_id)
{
    return panel1_id < panel2_id;
};

var setCanvasResolution = function(canvas, w, h)
{
    $(canvas).css({ 'width' : w, 'height' : h});
    scaleFactor.x =  w / canvas.width;
    scaleFactor.y = h / canvas.height;
};

var getDistanceBetweenPoints = function(p1, p2)
{
    try
    {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }
    catch (exception)
    {
        return Infinity;
    }
};

/**
 ** See: http://jsfromhell.com/math/dot-line-length
 **
 ** Distance from a point to a line or segment.
 **
 ** @param {number} x point's x coord
 ** @param {number} y point's y coord
 ** @param {number} x0 x coord of the line's A point
 ** @param {number} y0 y coord of the line's A point
 ** @param {number} x1 x coord of the line's B point
 ** @param {number} y1 y coord of the line's B point
 ** @param {boolean} overLine specifies if the distance should respect the limits
 ** of the segment (overLine = true) or if it should consider the segment as an
 ** infinite line (overLine = false), if false returns the distance from the point to
 ** the line, otherwise the distance from the point to the segment.
 **/
var dotLineLength = function(x, y, x0, y0, x1, y1, o) {
    function lineLength(x, y, x0, y0){
          return Math.sqrt((x -= x0) * x + (y -= y0) * y);
            }
      if(o && !(o = function(x, y, x0, y0, x1, y1){
            if(!(x1 - x0)) return {x: x0, y: y};
                else if(!(y1 - y0)) return {x: x, y: y0};
                    var left, tg = -1 / ((y1 - y0) / (x1 - x0));
                        return {x: left = (x1 * (x * tg - y + y0) + x0 * (x * - tg + y - y1)) / (tg * (x1 - x0) + y0 - y1), y: tg * left - tg * x + y};
                          }(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))){
            var l1 = lineLength(x, y, x0, y0), l2 = lineLength(x, y, x1, y1);
                return l1 > l2 ? l2 : l1;
                  }
        else {
              var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1;
                  return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
                    }
};

function wrapText(context, text, x, y, maxWidth, lineHeight, fillColor)
{
    var cars = text.split("\n");
    context.fillStyle = fillColor;

    for (var ii = 0; ii < cars.length; ii++) {

        var line = "";
        var words = cars[ii].split(" ");
        var correction = 0;
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;

            if (testWidth > maxWidth) {
                metrics = context.measureText(line);
                context.lineWidth = 5;
                var tmp = x - metrics.width / 2;
                if(tmp < 0)
                {
                    correction = -tmp;
                    tmp = 0;
                }
                context.strokeText(line, tmp, y);
                context.lineWidth = 3;
                context.fillText(line, tmp, y);
                line = words[n] + " ";
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }

        var metrics = context.measureText(line);
        context.lineWidth = 5;
        var tmp = x - metrics.width / 2;
        if(tmp < 0)
        {
            correction = 0;
            tmp = 0;
        }
        context.strokeText(line, tmp + correction, y);
        context.lineWidth = 3;
        context.fillText(line, tmp + correction, y);
        y += lineHeight;
    }
};

var keys = function(obj)
{
    var ks = [];
    for(var i in obj)
        ks.push(i);
    return ks;
};

var DEBUG_drawWalkBoxes = function()
{
    for(var key in testCurrentRoom.walkBoxes)
    {
        var wb = testCurrentRoom.walkBoxes[key];
        if(wb.visible)
            drawPolygon(wb.polygon, '', 'green', gameCtx, false);
    }
};

var getVector = function(p1, p2)
{
    return new Point(p2.x - p1.x, p2.y - p1.y);
};

var normalizeVector = function(v)
{
    var norm = Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
    v.x /= norm;
    v.y /= norm;
    return v;
};

var drawStraightLine = function(p1, p2)
{
    var v = normalizeVector(getVector(p1, p2));
    var p = new Point(p1.x, p1.y);
    var speed = 3;
    v.x *= speed;
    v.y *= speed;

    ctx.fillRect(p1.x - 5, p1.y - 5, 10, 10);
    ctx.fillRect(p2.x - 5, p2.y - 5, 10, 10);
    while(p.x !== p2.x || p.y !== p2.y)
    {
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        if((p.x > p2.x && p.x + v.x < p2.x) || (p.x < p2.x && p.x + v.x > p2.x))
            p.x = p2.x;
        else
            p.x += v.x;
        if((p.y > p2.y && p.y + v.y < p2.y) || (p.y < p2.y && p.y + v.y > p2.y))
            p.y = p2.y;
        else
            p.y += v.y;
    }
};

var getDistanceFromPoints = function(p1, p2)
{
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
};

var checkLineIntersection = function(edge1, edge2)
{
    var denominator, a, b, numerator1, numerator2;
    var result = { x: null, y: null, inLines: false};

    var line1StartX = edge1[0].x;
    var line1EndX = edge1[1].x;
    var line1StartY = edge1[0].y;
    var line1EndY = edge1[1].y;
    var line2StartX = edge2[0].x;
    var line2EndX = edge2[1].x;
    var line2StartY = edge2[0].y;
    var  line2EndY = edge2[1].y;
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator == 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));

    if ((a > 0 && a < 1) && (b > 0 && b < 1))
        result.inLines = true;

   return result;
};

var getNextPointInLine = function(p1, p2, speed)
{
    var v = normalizeVector(getVector(p1, p2));
    var p = new Point(p1.x, p1.y);

    if(Math.abs(p1.x - p2.x) < 1 && Math.abs(p1.y - p2.y) < 1)
        return p2;
    v.x *= speed;
    v.y *= speed;

    if((p.x > p2.x && p.x + v.x < p2.x) || (p.x < p2.x && p.x + v.x > p2.x))
        p.x = p2.x;
    else
        p.x += v.x;
    if((p.y > p2.y && p.y + v.y < p2.y) || (p.y < p2.y && p.y + v.y > p2.y))
        p.y = p2.y;
    else
        p.y += v.y;

    return p;

};

var getLineSlope = function(p1, p2)
{
    return (p1.y - p2.y) / (p1.x - p2.x);
};

var downloadCroppedImage = function (filename, text)
{
    // atob to base64_decode the data-URI
    var image_data = atob(text.split(',')[1]);
    // Use typed arrays to convert the binary data to a Blob
    var arraybuffer = new ArrayBuffer(image_data.length);
    var view = new Uint8Array(arraybuffer);
    for (var i=0; i<image_data.length; i++)
    {
        view[i] = image_data.charCodeAt(i) & 0xff;
    }
    var blob = new Blob([arraybuffer], {type : 'image/png'});
    var pom = document.createElement('a');
    //pom.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('href', URL.createObjectURL(blob));
    pom.setAttribute('download', filename);
    pom.click();
};