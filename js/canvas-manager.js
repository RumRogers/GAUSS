var $canvas, canvas, canvas_Char, ctx, ctx_Char;

/*var canvas_cMenu =
    {
        'spritePositioning' :
         [{
            'text' : 'Place object here',
            'action' : function() { console.log('Elt')}
         }]
    }
;*/

paper.Point.getDistance = function(p)
{
    return Math.sqrt(Math.pow(this.x - p.x, 2) - Math.pow(this.y - p.y, 2));
};

var drawPolygon = function(polygon, fillColor, strokeColor, ctx, drawHandles)
{
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    if(polygon.points.length == 0)
        return;
    if (polygon.points.length == 1)
    {
        ctx.fillRect(polygon.points[0].x - 5, polygon.points[0].y - 5, 10, 10);
        return;
    }
    else
    {
        var shiftX = 0, shiftY = 0;
        if(ctx === gameCtx)
        {
            shiftX = viewport.left;
            shiftY = viewport.top;
        }
        ctx.beginPath();
        ctx.moveTo(polygon.points[0].x - shiftX, polygon.points[0].y - shiftY);
        for (var i = 0; i < polygon.points.length; i++) {
            if (polygon.points[i + 1] != undefined) {
                if (polygon.points[i + 1].x == polygon.points[i].x && polygon.points[i + 1].y == polygon.points[i].y)
                    continue;
                ctx.lineTo(polygon.points[i + 1].x + 0.5 - shiftX, polygon.points[i + 1].y - shiftY);
            }
            else if (polygon.closed) {
                ctx.closePath();
                if(fillColor)
                {
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                    break;
                }

            }
        }

        if(strokeColor)
        {
            ctx.lineWidth = 3;
            ctx.strokeStyle = strokeColor;
        }
        ctx.stroke();
        ctx.strokeStyle = 'black';

        ctx.fillStyle = 'black';

        /*for(var i = 0; i < polygon.edges.length; i++)
        {
            if(polygon.edges[i].highlight)
            {
                //alert('Close to edge!');
                ctx.fillRect(0, 0, 50, 50);
                ctx.strokeStyle = 'blue';
                ctx.lineTo(polygon.edges[i][0] + 0.5, polygon.edges[i][1]);
                break;
            }
        }
        */
        if (!polygon.closed || drawHandles === true)
            for(var i = 0; i < polygon.points.length; i++)
            {
                if(polygon.points[i].highlight)
                    ctx.fillStyle = 'red';
                ctx.fillRect(polygon.points[i].x - 5, polygon.points[i].y - 5, 10, 10);
                ctx.fillStyle = 'black';
            }


    }
};


/*=======================================================================================================*/
var getItemWithSpriteContaining = function(point)
{
    /* The point must be sought starting from the highest layers down to the lowest.
        This allows the user to select an item whose bounding box is completely contained inside another object's bounding box */

    var ks = new Array();
    for(var layer in editorCurrentRoom.zOrderMap)
        ks.push(layer);
    ks.sort(); // Since you can't order an object by keys in Javascript, order its keys

        for(var i = ks.length - 1; i >= 0; i--)
        {
            for(var j = 0; j < editorCurrentRoom.zOrderMap[ks[i]].length; j++)
            {
                var currentItem = editorMapIdItem[editorCurrentRoom.zOrderMap[ks[i]][j]];
                if (currentItem.defaultAnims.default == null)
                    continue;
                var anim = editorMapIdAnim[currentItem.defaultAnims.default];
                if(!anim)
                    continue;
                var frame = anim.frames[anim.start_idx];
                var bb = new paper.Rectangle(currentItem.position.x - frame.img.width / 2, currentItem.position.y - frame.img.height, frame.img.width, frame.img.height);
                if (bb.contains(point))
                    return currentItem;
            }
        }
    return null;
};

var getCharacterWithSpriteContaining = function(point)
{
    var room = editorMapIdCharacter[editorCurrentCharacter.id];
    var characters = [];

    for(var key in editorMapIdCharacter)
        if(editorMapIdCharacter[key].id == room.id)
            characters.push(editorMapIdCharacter[key]);

    for(var i = 0; i < characters.length; i++)
    {
            if (characters[i].defaultAnims.stand.FL == null)
                continue;
            var anim = editorMapIdAnim[characters[i].defaultAnims.stand.FL];
            if(!anim)
                continue;
            var frame = anim.frames[anim.start_idx];
            var bb = new paper.Rectangle(characters[i].position.x - frame.img.width / 2, characters[i].position.y - frame.img.height, frame.img.width, frame.img.height);
            if (bb.contains(point))
                return characters[i];
    }
    return null;
};

var drawItemBoundingBox = function(item, ctx)
{
    if(item == null)
        return;
    var frame = getItemPlaceHolder(item);
    ctx.beginPath();
    ctx.lineWidth = '2';
    ctx.setLineDash([2]);
    ctx.strokeStyle = '#2200ff';
    ctx.rect(item.position.x - frame.img.width / 2, item.position.y - frame.img.height, frame.img.width, frame.img.height);
    ctx.stroke();
};

var updateCanvas = function(room, which)
{
    if(!room)
    {
        $('.container.' + which).hide();
        return;
    }

    var _canvas;
    var _context;
    var _selectedData;
    var _drawRoomChunks;

    switch(which)
    {
        case 'room':
            _canvas = canvas;
            _context = ctx;
            _selectedData = editorCurrentItem;
            _drawRoomChunks = function()
                {
                    for(var key in room.zOrderMap)
                    {
                        var itemsKeyList = room.zOrderMap[key];
                        for (var i = 0; i < itemsKeyList.length; i++)
                        {
                            var item = editorMapIdItem[itemsKeyList[i]];
                            if(item.hideFromCanvas === true)
                                continue;
                            var frame = getItemPlaceHolder(item);
                            if (!frame)
                                continue;
                            if (item.position.x == null || item.position.y == null)
                                continue;
                            _context.drawImage(frame.img, item.position.x - frame.img.width / 2, item.position.y - frame.img.height);
                        }
                    }
                };
        break;
        case 'character':
            _canvas = canvas_Char;
            _context = ctx_Char;
            _selectedData = editorCurrentCharacter;
            _drawRoomChunks = function()
            {
                for (var key in editorMapIdCharacter)
                {
                    var character = editorMapIdCharacter[key];
                    if (character.parentRoomId != room.id)
                        continue;
                    var frame = getItemPlaceHolder(character);
                    if (!frame)
                        continue;
                    if (character.position.x == null || character.position.y == null)
                        continue;
                    _context.drawImage(frame.img, character.position.x - frame.img.width / 2, character.position.y - frame.img.height);
                }
            };
        break;
    }

    _context.clearRect(0, 0, _canvas.width, _canvas.height);

    if(room.items.length == 0)
    {
        $('.container.' + which).hide();
        //$('.canvas.room').hide();
        //$('.toolbar.room').hide();
        //$('.item').hide();
        return;
    }

    //$(_canvas).css({ 'width' : room.items[0].boundingBox.width, 'height' : room.items[0].boundingBox.height });
    _canvas.width = room.items[0].boundingBox.width;
    //_canvas.width = resolution.width;
    _canvas.height = room.items[0].boundingBox.height;
    //_canvas.height = resolution.height;

    var canvasDiv = $('.canvas.' + which);

    //canvasDiv.width(resolution.width);
    //canvasDiv.height(resolution.height - guiHeights[resolution.height]);
    //canvasDiv.height(resolution.height);
    if(_canvas.width > resolution.width)
    {
        canvasDiv.css({ 'overflow-x' : 'scroll' });
    }
    else
    {
        canvasDiv.css({ 'overflow-x' : 'visible' });
    }
    //if(_canvas.height > resolution.height - guiHeights[resolution.height])
    if(_canvas.height > resolution.height)
    {
        canvasDiv.css({ 'overflow-y' : 'scroll' });
    }
    else
    {
        canvasDiv.css({ 'overflow-y' : 'visible' });
    }

    _context.drawImage(room.items[0].img, room.items[0].boundingBox.left, room.items[0].boundingBox.top);

    _drawRoomChunks();
    switch(_canvas.state)
    {
        case 'sprite':
            drawItemBoundingBox(_canvas.selected, _context);
            break;
        case 'hotspot':
            if(_selectedData != null && _selectedData.hotspot != null)
                drawPolygon(_selectedData.hotspot, '', _selectedData.hotspot['closed'] ? 'red' : '', _context);
            break;
        case 'pathfinding':
            if(keys(editorCurrentRoom.walkBoxes).length > 0)
            {
                for(var i in editorCurrentRoom.walkBoxes)
                {
                    var fillColor = 'rgba(255, 255, 0, 0.5)';
                    var lineColor = 'orange';
                    if(editorCurrentWalkBox === editorCurrentRoom.walkBoxes[i].id)
                    {
                        fillColor = 'rgba(255, 0, 0, 0.5)';
                        lineColor = 'purple';
                    }
                    drawPolygon(editorCurrentRoom.walkBoxes[i].polygon, fillColor, lineColor, ctx, true);
                }
            }
            break;
        case 'crop-image':
            if(cropPoly != null)
            {
                drawPolygon(cropPoly, '', cropPoly['closed'] ? 'red' : '', ctx);
                if(cropPoly['closed'] === true)
                {
                    var data = cropImage(cropPoly);
                    var croppedImage = new Image();
                    croppedImage.src = data.src;
                    $(croppedImage).css('border', '1px solid black');
                    var croppedImageDiv = $('#cropped-image');
                    croppedImageDiv.empty();
                    croppedImageDiv.append(croppedImage);
                    $('#cropped-image-modal').modal('show');
                    cropPoly = null;
                }
            }
            break;
        case 'walk-behind':
            if(editorCurrentItem != null && editorCurrentItem.centralPerspectiveWalkBehind != null)
            {
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.moveTo(0, editorCurrentItem.centralPerspectiveWalkBehind);
                ctx.lineTo(canvas.width, editorCurrentItem.centralPerspectiveWalkBehind);
                ctx.closePath();
                ctx.stroke();
            }
            break;
        default:
            break;
    }
    $('.container.' + which).show(); // Show the right part of the page
    //$('.canvas.room').show();
    $('.toolbar.' + which).width($('.canvas.' + which).width());
    $('.item.' + which).show();
};