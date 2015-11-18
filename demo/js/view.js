var preventHighlitingCSS =
{
    '-webkit-touch-callout' : 'none',
    '-webkit-user-select' : 'none',
    '-khtml-user-select' : 'none',
    '-moz-user-select' : 'none',
    '-ms-user-select' : 'none',
    'user-select' : 'none',
    'padding-left' : '0px',
    'border' : 'none'
};
var editorScriptState = 'ok';
var editorScriptTree;
var editorScriptLastBtnPressed = null;
var codeMirror;
var cropPoly;

$(document).ready(function()
{
    $(".app").hide();
    $('#start-test').click(function(){ initTest(); });

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://ranma42.github.io/GAUSS/demo/DemoProject.json', true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
	if (this.status == 200) {
	    loadProject({ target: { files: [ this.response ]} });
	    // TODO: use a div to notify the user
	    alert('I loaded a demo project for you!\nYou can test it or start editing it right now :)');
	}
    };
    xhr.send();
});

/*============================================================ NAVBAR LOGIC ===================================================================*/
$(document).ready(function()
{
    $('#project-uploader').inputfile({
        uploadText: '<span class="glyphicon glyphicon-upload"></span> Select a project',
        removeText: '<span class="glyphicon glyphicon-trash"></span>',
        restoreText: '<span class="glyphicon glyphicon-remove"></span>',

        uploadButtonClass: 'btn btn-default btn-xs',
        removeButtonClass: 'btn btn-default',
        dontRemove: true
    });

    var showConfirmMessage = function()
    {
        return confirm('Are you sure? You will lose unsaved changes!');
    };
    $('#new-project').click(function()
    {
        if(showConfirmMessage() === false)
            return;
        newProject();
    });
    $('#project-uploader').change(function(ev)
    {
        if(editorRoomsCount + editorItemsCount + editorAnimsCount + editorAudioCount + editorInvItemCount
             + editorDialogsCount + editorCharactersList.length > 0)
            if(showConfirmMessage() === false)
                return;
        loadProject(ev);
    });
    $('#project-downloader').click(function ()
    {
        saveProject();
    });
    $('#export-game').click(function ()
    {
        exportGame();
    });

    /* Navbar buttons logic */
    $(".app-state").click(function ()
    {
        $(".app-state").removeClass("active");
        $(".project-action").removeClass("open");
        $(this).addClass("active");

        $('.app').hide();
        if ($(this).hasClass("room"))
            $("#room-manager").show();
        else if ($(this).hasClass("action"))
            $("#action-manager").show();
        else if ($(this).hasClass("script"))
            $("#script-manager").show();
        else if ($(this).hasClass("test"))
            $("#test-manager").show();
        else if ($(this).hasClass("character"))
            $("#character-manager").show();
        else if ($(this).hasClass("variables"))
            $("#global-vars-manager").show();
        else if ($(this).hasClass('anims'))
            $('#anims-manager').show();
        else if ($(this).hasClass('inventory'))
            $('#inventory-manager').show();
        else if ($(this).hasClass("dialog"))
            $("#dialog-manager").show();
        else if ($(this).hasClass("options"))
            $("#options-manager").show();
        else if ($(this).hasClass("sound"))
            $("#sound-manager").show();
    });
    $(".project-action").click(function ()
    {
        $(".app-state").removeClass("active");
    });
});
/*========================================================== END OF NAVBAR LOGIC ===================================================================*/

/*=========================================================== ACTION SECTION =================================================================*/
$(document).ready(function()
{
    for (var i in editorActionsList)
    {
        var actionId = editorActionsList[i].id;
        editorMapIdAction[actionId] = editorActionsList[i];
        editorActionsCount++;
        //view_CreateNewActionPanel(editorActionsList[i].id);
        if(actionId !== 'Walk_to')
            view_UpdateDataLists('add', 'actions', actionId);
    }
});
/*======================================================== END OF ACTION SECTION =================================================================*/

/*===========================================================  ROOMS SECTION  ===================================================================*/
$(document).ready(function()
{

    $('.add.room').click(function ()
    {
        var newRoomName = 'Room_' + editorRoomsCount++;

        createNewEditorRoom(newRoomName);
        view_CreateNewRoomPanel(newRoomName);
    });
    $('.delete.room').click(function ()
    {
        if (editorCurrentRoom == null)
            return;
        //editorItemsCount -= editorCurrentRoom.items.length > 1 ? editorCurrentRoom.items.length - 1 : 0;
        //editorRoomsCount--;
        deleteEditorRoom(editorCurrentRoom.id);
        view_DeleteActiveRoomPanel();

        editorCurrentRoom = null;
        editorCurrentItem = null;
    });
});
/*=========================================================== END OF ROOMS SECTION  ===================================================================*/

/*===========================================================  CHARACTERS SECTION  ===================================================================*/
$(document).ready(function()
{
    $('.add.character').click(function ()
    {
        var newCharacterId = 'Character_' + editorCharactersList.length;
        createNewEditorCharacter(newCharacterId);
        view_CreateNewCharacterPanel(newCharacterId);
    });
});
/*=====================================================  END OF CHARACTERS SECTION  ===================================================================*/

/*========================================================= CANVAS INPUT HANDLERS =================================================*/
$(document).ready(function()
{
    $canvas = $('canvas');
    canvas = $canvas[0];
    canvas_Char = $canvas[1];

    ctx = canvas.getContext('2d');
    ctx_Char = canvas_Char.getContext('2d');

    canvas.state = 'idle';
    canvas.mouseDown = { 'clicked' : 'false', 'offset' : null };
    canvas.selected = null;
    canvas_Char.state = 'idle';
    canvas_Char.mouseDown = { 'clicked' : 'false', 'offset' : null };
    canvas_Char.selected = null;
    $('.canvas').each(function() { $(this).css('background', 'lightgrey'); });
    $('.toolbar button').css({'font-size' : '13.5px'});
    $('.toolbar img').css({'width' : '13.5px', 'height' : '13.5px'});

    var editorCanvas = $("#editor-canvas");
    editorCanvas.click(function(e)
    {
        e.preventDefault();

        var offset = $(this).offset();
        var relX = parseInt(e.pageX - offset.left);
        var relY = parseInt(e.pageY - offset.top);

        var pushPolygonPoint = function(type)
        {
            //var initPolygon = function(poly) { poly = []; poly['closed'] = false};
            var polygon;
            switch(type)
            {
                case 'hotspot':
                    if(!(editorCurrentItem.id in editorMapIdItem))
                    {
                        alert('Please select an item!');
                        return;
                    }
                    if(editorCurrentItem.hotspot == null)
                        editorCurrentItem.hotspot = new Polygon();
                    polygon = editorCurrentItem.hotspot;
                    break;
                case 'path':
                    //if(editorCurrentRoom.walkablePath == null)
                    //    editorCurrentRoom.walkablePath = new Polygon();
                    //polygon = editorCurrentRoom.walkablePath;
                    polygon = editorCurrentRoom.walkBoxes[editorCurrentWalkBox].polygon;
                    break;
                case 'crop-image':
                    /*if(!(editorCurrentItem.id in editorMapIdWb))
                    {
                        alert('Please select a walk-behind!');
                        return;
                    }
                    if(editorCurrentItem.poly == null)
                        editorCurrentItem.poly = new Polygon();*/
                    if(cropPoly == null)
                        cropPoly = new Polygon();
                    polygon = cropPoly;
                    break;
            }

            if (!polygon.closed) {
                if (polygon.points.length && new paper.Rectangle(polygon.points[0].x - 5, polygon.points[0].y - 5, 10, 10).contains(new paper.Point(relX, relY)))
                    polygon.close();

                else {
                    var present = false;
                    for (var i = 0; i < polygon.points.length; i++)
                        if (relX == polygon.points[i].x && relY == polygon.points[i].y) {
                            present = true;
                            break;
                        }
                    if (!present) polygon.points.push(new paper.Point(relX, relY));
                }
            }

            updateCanvas(editorCurrentRoom, 'room');
        };

        switch(canvas.state)
        {
            case('hotspot'): pushPolygonPoint('hotspot');
                break;
            case('pathfinding'):
                //if(!e.shiftKey)
                relX = e.pageX - offset.left;
                relY = e.pageY - offset.top;
                var highlightedEdge = getHighlightedWalkboxEdge(editorCurrentRoom.walkBoxes);
                if(!highlightedEdge)
                {
                    var highlightedPoint = getHighlightedWalkboxVertex(editorCurrentRoom.walkBoxes);
                    if (highlightedPoint && highlightedPoint.wboxId !== editorCurrentWalkBox)
                    {
                        relX = highlightedPoint.point.x;
                        relY = highlightedPoint.point.y;
                    }
                    pushPolygonPoint('path');
                }
                else if(editorCurrentRoom.walkBoxes[editorCurrentWalkBox].polygon.closed === false)
                {
                    var wbox = editorCurrentRoom.walkBoxes[highlightedEdge.wboxId];
                    if(editorCurrentWalkBox === highlightedEdge.wboxId)
                        return;
                    var p = wbox.polygon.getNearestPoint(new paper.Point(relX, relY));
                    //p.x = parseInt(p.x);
                    //p.y = parseInt(p.y);
                    relX = p.x;
                    relY = p.y;
                    splitEdge(wbox, highlightedEdge.edge, p);
                    pushPolygonPoint('path');
                }
                break;
            case 'crop-image':
                pushPolygonPoint('crop-image');
                break;
            case 'start-pos':
                editorCurrentRoom.egoStartPos = { x : relX, y : relY};
                updateCanvas(editorCurrentRoom, 'room');
                break;
            case 'xy-pick':
                $('.clipboard').remove();
                var clipboard = 'Clipboard: (' + relX + ', ' + relY + ')';
                $('.well').append($(document.createElement('span')).attr('class', 'clipboard').append($(document.createElement('b')).text(clipboard)).css({ 'margin-left' : '20px'}));
                break;
            case 'walk-behind':
                if(editorCurrentItem.id in editorMapIdItem)
                {
                    var hasAnims = false;
                    for (var key in editorCurrentItem.defaultAnims)
                        if (editorCurrentItem.defaultAnims[key] != null)
                        {
                            hasAnims = true;
                            break;
                        }
                    if (hasAnims)
                        editorCurrentItem.centralPerspectiveWalkBehind = relY;
                    else
                    {
                        alert('Item \"' + editorCurrentItem.id + '\" has no sprite.');
                        return;
                    }
                }
                else if(editorCurrentItem.id in editorMapIdWb)
                {
                    if(editorCurrentItem.image != null)
                        editorCurrentItem.centralPerspectiveWalkBehind = relY;
                    else
                    {
                        alert('Walk-behind \"' + editorCurrentItem.id + '\" has no sprite.');
                        return;
                    }

                }
                updateCanvas(editorCurrentRoom, 'room');
                break;
            default :
                break;
        }
    });

    editorCanvas.on("contextmenu", function(evt)
    {
        evt.preventDefault();
        switch($(this)[0].state)
        {
            case 'hotspot':
                if(editorCurrentItem.hotspot != null)
                    editorCurrentItem.hotspot = null;
                break;
            case 'pathfinding':
                var wbox = editorCurrentRoom.walkBoxes[editorCurrentWalkBox];
                if(wbox.polygon.points.length > 0)
                {
                    wbox.polygon.points = [];
                    wbox.polygon.edges = [];
                    wbox.polygon.closed = false;
                }
                break;
            case 'crop-image':
                if(cropPoly != null)
                {
                    cropPoly = null;
                }
                break;
            case 'walk-behind':
                delete editorCurrentItem.centralPerspectiveWalkBehind;
                break;
        }
        updateCanvas(editorCurrentRoom, 'room');
    });

    editorCanvas.mousemove(function(e)
    {

        var offset = $(this).offset();
        var relX = parseInt(e.pageX - offset.left);
        var relY = parseInt(e.pageY - offset.top);

        view_UpdateMousePos(relX.toString(), relY.toString(), 'room');

        switch(canvas.state)
        {
            case 'sprite' :
                if (canvas.mouseDown.clicked == true && canvas.mouseDown.offset != null && canvas.selected != null)
                {
                    canvas.selected.position = { x : relX + canvas.mouseDown.offset.x, y : relY + canvas.mouseDown.offset.y};
                    //getItemPlaceHolder(canvas.selected).setPosition(canvas.selected.position.x, canvas.selected.position.y);
                    updateCanvas(editorCurrentRoom, 'room');
                    //drawItemBoundingBox(canvas.selected);
                }
                break;
            case 'walk-behind':
                updateCanvas(editorCurrentRoom, 'room');
                ctx.beginPath();
                ctx.setLineDash([10]);
                ctx.moveTo(0, relY);
                ctx.lineTo(canvas.width, relY);
                ctx.stroke();
                break;
            case 'pathfinding':
                updateCanvas(editorCurrentRoom, 'room');

                var wboxes = editorCurrentRoom.walkBoxes;

                for(i in wboxes)
                {
                    resetVertexHighlighting(wboxes[i]);
                    resetEdgeHighlighting(wboxes[i]);

                    highlightCloseVertex(new Point(relX, relY), wboxes[i], 10);

                    var vtx = getHighlightedWalkboxVertex(wboxes);
                    if(!vtx)
                    {
                        highlightCloseEdge(new Point(relX, relY), wboxes[i], 5);
                        var highlightedEdge = getHighlightedWalkboxEdge(wboxes);
                        if(highlightedEdge && highlightedEdge.wboxId === i)
                        {
                            var p = wboxes[i].polygon.getNearestPoint(new paper.Point(relX, relY));
                            ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
                        }
                    }

                    var lockedVertex = getLockedWalkboxVertex(editorCurrentRoom.walkBoxes);
                    if(lockedVertex !== null)
                    {
                        changeLockedWalkboxVertexPosition(wboxes, lockedVertex.wboxId, relX, relY);
                    }
                }

                if(editorCurrentWalkBox == null)
                    return;
                var path = editorCurrentRoom.walkBoxes[editorCurrentWalkBox].polygon;
                if(path != null && path.points.length && !path.closed)
                {
                    ctx.beginPath();
                    var lastPoint = path.points[path.points.length - 1];
                    ctx.beginPath();
                    ctx.moveTo(lastPoint.x, lastPoint.y);
                    ctx.lineTo(relX, relY);
                    ctx.stroke();
                }
                break;
            case 'hotspot':
                updateCanvas(editorCurrentRoom, 'room');
                var hotspot = editorCurrentItem.hotspot;
                if(hotspot != null && hotspot.points.length && !hotspot.closed)
                {
                    ctx.beginPath();
                    var lastPoint = hotspot.points[hotspot.points.length - 1];
                    ctx.beginPath();
                    ctx.moveTo(lastPoint.x, lastPoint.y);
                    ctx.lineTo(relX, relY);
                    ctx.stroke();
                }
                break;
            case 'crop-image':
                updateCanvas(editorCurrentRoom, 'room');
                var poly = cropPoly;
                if(poly != null && poly.points.length && !poly.closed)
                {
                    ctx.beginPath();
                    var lastPoint = poly.points[poly.points.length - 1];
                    ctx.beginPath();
                    ctx.moveTo(lastPoint.x, lastPoint.y);
                    ctx.lineTo(relX, relY);
                    ctx.stroke();
                }
                break;
            default:
                break;

        }
    });

    $(document).on('keydown',
        function(e)
        {
            var keycodes = { W : 87, A: 65, S : 83, D : 68};

            if(canvas.selected)
            {
                var fineTune = 1;
                switch (e.which)
                {
                    case keycodes.W : canvas.selected.position.y -= fineTune ;
                        break;
                    case keycodes.A : canvas.selected.position.x -= fineTune;
                        break;
                    case keycodes.D : canvas.selected.position.x += fineTune;
                        break;
                    case keycodes.S : canvas.selected.position.y += fineTune;
                        break;
                }
                updateCanvas(editorCurrentRoom, 'room');
            }
        }
    );

    editorCanvas.on('dragover', function(e)
    {
        e.preventDefault();
        view_UpdateMousePos(parseInt(e.originalEvent.pageX - $(this).offset().left), parseInt(e.originalEvent.pageY - $(this).offset().top), 'room');
    });

    editorCanvas.on('drop', function(e)
    {
        e.preventDefault();
        var xPos = parseInt($('.room .xPos').text());
        var yPos = parseInt($('.room .yPos').text());
        var sprite = getItemPlaceHolder(editorCurrentItem);
        editorCurrentItem.position.x = xPos;
        editorCurrentItem.position.y = yPos + sprite.img.height;
        //var frame = getItemPlaceHolder(editorCurrentItem);
        //frame.setPosition(xPos, yPos);
        updateCanvas(editorCurrentRoom, 'room');
    });

    editorCanvas.on('mousedown', function(e)
    {
        e.preventDefault();

        canvas.mouseDown.clicked = true;
        var offset = $(this).offset();
        var relX = Math.round(e.pageX - offset.left);
        var relY = Math.round(e.pageY - offset.top);

        switch(canvas.state)
        {
            case 'sprite':
                var clickedItem = getItemWithSpriteContaining(new paper.Point(relX, relY));
                canvas.selected = clickedItem;
                if(clickedItem != null)
                    canvas.mouseDown.offset = new paper.Point(clickedItem.position.x - relX, clickedItem.position.y - relY);
            break;
            case 'pathfinding':
                var highlightedVertex = getHighlightedWalkboxVertex(editorCurrentRoom.walkBoxes);
                if(highlightedVertex !== null)
                {
                    var wbox = editorCurrentRoom.walkBoxes[highlightedVertex.wboxId];
                    lockVertex(wbox, highlightedVertex.point);
                }
                break;

        }
        updateCanvas(editorCurrentRoom, 'room');
    });

    editorCanvas.on('mouseup', function(e)
    {
        canvas.mouseDown.clicked = false;
        canvas.mouseDown.offset = null;

        var lockedVertex = getLockedWalkboxVertex(editorCurrentRoom.walkBoxes);
        if(lockedVertex !== null)
            resetVertexLocking(editorCurrentRoom.walkBoxes[lockedVertex.wboxId]);
    });

    editorCanvas.on('mouseout', function(e)
    {
        canvas.mouseDown.clicked = false;
        canvas.mouseDown.offset = null;
        view_UpdateMousePos('-', '-');
    });

    /*============================================ TOOLBAR 1 MANAGEMENT =====================================*/
    $('#cropped-image-modal-OK').click(function()
    {
        $('#cropped-image-modal').modal('hide');
        downloadCroppedImage('chunk.png', $('#cropped-image img')[0].src)
    } );


    $('#place-sprite').click(function()
    {
        canvas.state = 'sprite';
        //context.attach('canvas', canvas_cMenu['spritePositioning']);
        $('.toolbar.room button').removeClass('active');
        $(this).addClass('active');
        updateCanvas(editorCurrentRoom, 'room');
    });

    $('#set-hotspot').click(function()
    {
        canvas.selected = null;
        if(editorCurrentItem == null || !(editorCurrentItem.id in editorMapIdItem))
        { this.blur(); alert('Please select an item.'); return; }
        canvas.state = 'hotspot';
        $('.toolbar.room button').removeClass('active');
        $(this).addClass('active');
        updateCanvas(editorCurrentRoom, 'room');
    });

    $('#set-walkzone').click(function()
    {
        canvas.selected = null;
        canvas.state = 'pathfinding';
        $('.toolbar.room button').removeClass('active');
        $(this).addClass('active');
        updateCanvas(editorCurrentRoom, 'room');
    });

    $('#set-start-pos').click(function()
    {
        canvas.selected = null;
        canvas.state = 'start-pos';
        $('.toolbar.room button').removeClass('active');
        $(this).addClass('active');
        updateCanvas(editorCurrentRoom, 'room');
    });

    $('#xy-picker').click(function()
    {
        canvas.selected = null;
        canvas.state = 'xy-pick';
        $('.toolbar.room button').removeClass('active');
        $(this).addClass('active');
    });

    $('#walk-behind').click(function()
    {
        canvas.selected = null;
        if(editorCurrentItem == null)
        { this.blur(); canvas.focus(); alert('Please select an item.'); return; }
        canvas.state = 'walk-behind';
        $('.toolbar button').removeClass('active');
        $(this).addClass('active');
        updateCanvas(editorCurrentRoom, 'room');
    });

    $('#crop-image').click(function()
    {
        canvas.selected = null;
        //if(editorCurrentItem == null || !(editorCurrentItem.id in editorMapIdWb))
        //{ this.blur(); canvas.focus(); alert('Please select a walk-behind.'); return; }
        canvas.state = 'crop-image';
        $('.toolbar.room button').removeClass('active');
        $(this).addClass('active');
        updateCanvas(editorCurrentRoom, 'room');
    });

    /*=======================================================================================================*/

    /*============================================ TOOLBAR 2 MANAGEMENT =====================================*/

    $('#place-spriteChar').click(function()
    {
        canvas_Char.state = 'sprite';
        //context.attach('canvas', canvas_cMenu['spritePositioning']);
        $('.toolbar.character button').removeClass('active');
        $(this).addClass('active');
        updateCanvas(editorMapIdRoom[editorCurrentCharacter.parentRoomId], 'character');
    });

    $('#set-hotspotChar').click(function()
    {
        canvas_Char.selected = null;
        if(editorCurrentCharacter == null)
        { this.blur(); alert('Please select a character.'); return; }
        canvas_Char.state = 'hotspot';
        $('.toolbar.character button').removeClass('active');
        $(this).addClass('active');
        updateCanvas(editorMapIdRoom[editorCurrentCharacter.parentRoomId], 'character');
    });

    $('#xy-pickerChar').click(function()
    {
        canvas_Char.selected = null;
        canvas_Char.state = 'xy-pick';
        $('.toolbar.character button').removeClass('active');
        $(this).addClass('active');
    });

    editorCanvas = $('#character-canvas');
    editorCanvas.click(function(e)
    {
        e.preventDefault();

        var offset = $(this).offset();
        var relX = Math.round(e.pageX - offset.left);
        var relY = Math.round(e.pageY - offset.top);

        var pushPolygonPoint = function(type)
        {
            //var initPolygon = function(poly) { poly = []; poly['closed'] = false};
            var polygon;
            switch(type)
            {
                case 'hotspot':
                    /*if(!(editorCurrentCharacter.id in editorMapIdItem))
                     {
                     alert('Please select an item!');
                     return;
                     }*/
                    if(editorCurrentCharacter.hotspot == null)
                        editorCurrentCharacter.hotspot = new Polygon();
                    polygon = editorCurrentCharacter.hotspot;
                    break;
            }

            if (!polygon.closed) {
                if (polygon.points.length && new paper.Rectangle(polygon.points[0].x - 5, polygon.points[0].y - 5, 10, 10).contains(new paper.Point(relX, relY)))
                {
                    polygon.close();
                    polygon.centroid = getPolygonCentroid(polygon);
                }

                else {
                    var present = false;
                    for (var i = 0; i < polygon.points.length; i++)
                        if (relX == polygon.points[i].x && relY == polygon.points[i].y) {
                            present = true;
                            break;
                        }
                    if (!present) polygon.points.push(new paper.Point(relX, relY));
                }
            }

            updateCanvas(editorMapIdRoom[editorCurrentCharacter.parentRoomId], 'character');
        };

        switch(canvas_Char.state)
        {
            case('hotspot'): pushPolygonPoint('hotspot');
                break;
            case 'xy-pick':
                $('.clipboard').remove();
                var clipboard = 'Clipboard: (' + relX + ', ' + relY + ')';
                $('.well').append($(document.createElement('span')).attr('class', 'clipboard').append($(document.createElement('b')).text(clipboard)).css({ 'margin-left' : '20px'}));
                break;
            default :
                break;
        }
    });

    editorCanvas.on('mousedown', function(e)
    {
        e.preventDefault();

        canvas_Char.mouseDown.clicked = true;
        var offset = $(this).offset();
        var relX = Math.round(e.pageX - offset.left);
        var relY = Math.round(e.pageY - offset.top);

        if(canvas_Char.state == 'sprite')
        {
            var clickedItem = getCharacterWithSpriteContaining(new paper.Point(relX, relY));
            canvas_Char.selected = clickedItem;

            if(clickedItem != null)
            {
                var frame = getItemPlaceHolder(clickedItem);
                canvas_Char.mouseDown.offset = new paper.Point(clickedItem.position.x - relX, clickedItem.position.y - relY);
            }
        }

        updateCanvas(editorMapIdRoom[editorCurrentCharacter.parentRoomId], 'character');
    });

    editorCanvas.mousemove(function(e)
    {

        var offset = $(this).offset();
        var relX = parseInt(e.pageX - offset.left);
        var relY = parseInt(e.pageY - offset.top);

        view_UpdateMousePos(relX.toString(), relY.toString(), 'character');

        var room = editorMapIdRoom[editorCurrentCharacter.parentRoomId];
        switch(canvas_Char.state)
        {
            case 'sprite' :
                if (canvas_Char.mouseDown.clicked == true && canvas_Char.mouseDown.offset != null && canvas_Char.selected != null)
                {
                    canvas_Char.selected.position = { x : relX + canvas_Char.mouseDown.offset.x, y : relY + canvas_Char.mouseDown.offset.y};
                    //getItemPlaceHolder(canvas.selected).setPosition(canvas.selected.position.x, canvas.selected.position.y);
                    updateCanvas(room, 'character');
                    //drawItemBoundingBox(canvas.selected);
                }
                break;
            case 'hotspot':
                updateCanvas(room, 'character');
                var hotspot = editorCurrentCharacter.hotspot;
                if(hotspot != null && hotspot.points.length && !hotspot.closed)
                {
                    ctx_Char.beginPath();
                    var lastPoint = hotspot.points[hotspot.points.length - 1];
                    ctx_Char.beginPath();
                    ctx_Char.moveTo(lastPoint.x, lastPoint.y);
                    ctx_Char.lineTo(relX, relY);
                    ctx_Char.stroke();
                }
                break;

            default:
                break;

        }
    });

    editorCanvas.on('mouseup', function(e)
    {
        canvas_Char.mouseDown.clicked = false;
        canvas_Char.mouseDown.offset = null;
    });

    editorCanvas.on('mouseout', function(e)
    {
        canvas_Char.mouseDown.clicked = false;
        canvas_Char.mouseDown.offset = null;
        view_UpdateMousePos('-', '-', 'character');
    });

    editorCanvas.on("contextmenu", function(evt)
    {
        evt.preventDefault();
        switch($(this)[0].state)
        {
            case 'hotspot':
                if(editorCurrentCharacter.hotspot != null)
                    editorCurrentCharacter.hotspot = null;
                break;
            default:
                break;
        }
        updateCanvas(editorMapIdRoom[editorCurrentCharacter.parentRoomId], 'character');
    });
});
/*===================================================== END OF CANVAS INPUT HANDLERS =====================================================*/

/*=========================================================== SCRIPTS SECTION ===================================================================*/
$(document).ready(function()
{
    $('#textarea').css({'width': '100%', 'height': '500px'});
    codeMirror = CodeMirror.fromTextArea($('#textarea')[0],
        {
            lineNumbers: true,
            mode: "javascript"
        });

    $('#script-name, #script-to-load').css({ 'width' : '100%' }).select2();

    $('#script-name').change(function()
    {
        $('#saveScriptInputText')[0].value = this.value;
    });

    $('#new-script').click(function ()
    {
        editorScriptLastBtnPressed = 'new';
        if (editorScriptState == 'ok')
        {
            //view_DeleteAllTreeNodes();
            view_DeleteAllTuples();
            codeMirror.doc.setValue('');
            $('#currentScript').text('unnamed script');
            //view_AcceptTreeDND();
        }
        else $('#unsaved-script-modal').modal('show');
    });

    $('#unsaved-script-modal-OK').click(function ()
    {
        editorScriptState = 'ok';
        if (editorScriptLastBtnPressed == 'new')
            $('#new-script').trigger('click');

        else $('#load-script-modal').modal('show');
    });

    $('#load-script').click(function ()
    {
        editorScriptLastBtnPressed = 'load';
        if (editorScriptState != 'ok')
        {
            $('#unsaved-script-modal').modal('show');
            return;
        }
        $('#load-script-modal').modal('show');
    });
    $('#load-script-modal-OK').click(function ()
    {
        var scriptToLoad = $('#script-to-load')[0].value;
        if (!scriptToLoad.length)
            return;
        var script = editorScriptList[scriptToLoad];
        $('#new-script').trigger('click');
        $('#currentScript').text(scriptToLoad);
        codeMirror.doc.setValue(script.code);
        for (var i = 0; i < script.scriptTriggerers.length; i++)
            view_CreateNewScriptRunnerTuple(script.scriptTriggerers[i].type, script.scriptTriggerers[i].params);
        return;
        $('#load-script-modal').modal('hide');
        editorScriptState = 'ok';
    });

    var validateScriptId = function (id)
    {
        if (id.trim().length == 0)
            return false;

        if (id in editorScriptList)
            return 'overwrite';

        return true;
    };

    var saveScript = function (scriptId)
    {
        editorScriptState = 'ok';
        var triggerers = [];
        $('.tuple.triggerer').each(function ()
        {
            var params = [];
            var type = ($(this).attr('class').split(' ')[3]);
            switch(type)
            {
                case 'user-trigger':
                    params[0] = $(this).find('select.triggerer-ev-1')[0].value;
                    params[1] = $(this).find('select.target-obj-1')[0].value;
                    params[2] = $(this).find('input[type="checkbox"]')[0].checked;
                    params[3] = $(this).find('select.target-obj-2')[0].value;
                    params[4] = $(this).find('.script-sentence')[0].value;
                    break;
                case 'event-trigger':
                    params[0] = $(this).find('input')[0].value;
                    break;
                case 'enter-room-trigger':
                    params[0] = $(this).find('select')[0].value;
                    editorMapIdRoom[params[0]].onEnterScript = scriptId;
                    break;
                default :
                    break;
            }

            triggerers.push(new ScriptTriggerer(type, params));
        });
        //var scriptTree = jsTree2ScriptTree(editorScriptTree.get_node('j1_1'), null);
        if (!(scriptId in editorScriptList))
        {
            $('#datalist-game-scripts').append($(document.createElement('option')).text(scriptId));
            view_UpdateDataLists('add', 'scripts', scriptId);
        }
        //editorScriptList[scriptId] = new Script(scriptTree, triggerers);

        editorScriptList[scriptId] = new Script(codeMirror.getValue(), triggerers);
    };

    $('#save-script').click(function ()
    {
        var currentScript = $('#currentScript')[0].textContent;
        if(currentScript === 'unnamed script')
        {
            $('#save-script-as').click();
            return;
        }
        editorScriptLastBtnPressed = 'save';
        $('#saveScriptInputText')[0].value = currentScript;
        $('#overwrite-script-modal').modal('show');
    });

    $('#save-script-as').click(function ()
    {
        editorScriptLastBtnPressed = 'save';
        $('#save-script-modal').modal('show');
    });
    $('#save-script-modal-OK').click(function ()
    {
        var scriptName = $('#saveScriptInputText');
        var scriptId = scriptName[0].value;
        var saveScriptModal = $('#save-script-modal');
        var isValid = validateScriptId(scriptId);
        if (!isValid)
            return;

        saveScriptModal.modal('hide');
        $('#currentScript').text(scriptId);
        if (isValid != 'overwrite')
        {
            saveScript(scriptId);
            scriptName[0].value = '';
            return;
        }
        $('#overwrite-script-modal').modal('show');
    });
    $('#save-script-modal-Cancel').click(function ()
    {
        $('#script-name')[0].value = '';
    });
    $('#overwrite-script-modal-OK').click(function ()
    {
        var scriptName = $('#saveScriptInputText');
        saveScript(scriptName[0].value);
        scriptName[0].value = '';
        $('#overwrite-script-modal').modal('hide');
    });
    $('#overwrite-script-modal-Cancel').click(function ()
    {
        $('#script-name')[0].value = '';
    });

    var addExecutionTriggerer = $('#add-execution-triggerer');
    addExecutionTriggerer.hover(function ()
        {
            $(this).css('cursor', 'pointer')
        },
        function ()
        {
            $(this).css('cursor', 'default')
        });
    addExecutionTriggerer.click(function ()
    {
        view_CreateNewScriptRunnerTuple($('#script-runner')[0].value)
    });

    $('.game-side-effects li, .game-controllers li').attr({'draggable': 'true'}).on('dragstart', function (event)
    {
        //event.preventDefault();
        event.originalEvent.dataTransfer.setData('data', JSON.stringify({'type': $(this).parent()[0].className, 'text': $(this).find('span').attr('value')}));
    });

    $('input[value=interaction]').attr('checked', 'checked');
    $('#script-event').prop('disabled', true);

    var radios = $('input[name=reaction]');
    radios.change(function ()
    {
        var selected = $(this).filter(':checked');

        var scriptRoom = $('#script-room');
        var scriptItem = $('#script-item');
        var scriptAction = $('#script-action');
        var scriptEvent = $('#script-event');

        if (selected[0].value == 'interaction')
        {
            scriptRoom.prop('disabled', false);
            scriptItem.prop('disabled', false);
            scriptAction.prop('disabled', false);
            scriptEvent.prop('disabled', true)
            return;
        }
        scriptRoom.prop('disabled', true);
        scriptItem.prop('disabled', true);
        scriptAction.prop('disabled', true);
        scriptEvent.prop('disabled', false);
    });

    //view_AssociateSelectors($('#script-room')[0], $('#script-item')[0]);

    $('#game-test-container').css(
        preventHighlitingCSS).attr('tabindex', '0');
    /*$().focus(function(){
     $(this).css('border', 'none');
     console.log('ett');});*/
    //$('#game-test-container').bind('keydown', keyboardManager);
    $('.cond-logic').css({'font-size': '15px'});
});
/*======================================================== END OF SCRIPTS SECTION ===========================================================*/

/*=========================================================== GAME VARS SECTION =================================================================*/
$(document).ready(function()
{
    $('#new-var').click(view_AddGameVariable).css(preventHighlitingCSS);
    $('#clear-all-vars').click(view_ClearGameVariables).css(preventHighlitingCSS);
    $('#new-var, #clear-all-vars').hover(function() { $(this).css('cursor', 'pointer')}, function() { $(this).css('cursor', 'default')});
});
/*======================================================= END OF GAME VARS SECTION =========================================================================*/

/*============================================================ ANIMS SECTION =====================================================================*/

$(document).ready(function()
{
    $($('.add.anim')).click(function ()
    {
        var animId = 'Anim_' + editorAnimsCount++;
        view_CreateNewAnimPanel(animId);
        createNewAnim(animId);
    });
});
/*======================================================== END OF ANIMS SECTION ============================================================================*/

/*========================================================= INVENTORY SECTION =====================================================================*/
$(document).ready(function()
{
    $('.add.inventory').click(function() { createNewInvItem('InvObj_' + editorInvItemCount); view_CreateNewInvItemPanel('InvObj_' + editorInvItemCount++); });
});
/*====================================================== END OF INVENTORY SECTION =============================================================================*/


/*============================================================ DIALOG SECTION ==============================================*/
$(document).ready(function()
{
    $('.add.dialog').click(function()
    {
        var dialogId = 'Dialog_' + editorDialogsCount++;
        view_CreateNewDialogPanel(dialogId);
    });
});
/*======================================================= END OF DIALOG SECTION =================================================================*/

/*============================================================ SOUNDS SECTION =====================================================================*/
$(document).ready(function()
{
    var soundUploader = $('#sound-uploader');
    soundUploader.hide();
    soundUploader.change(function (event)
        {
            var files = event.target.files;

            var loadAudioContent = function (i)
            {
                var id = files[i].name;
                createNewAudioContent(id);

                var fileReader = new FileReader();
                fileReader.onload = function (event)
                {
                    view_AddNewSound(event.target.result, id);
                    if (i < files.length - 1)
                        loadAudioContent(i + 1)

                };
                fileReader.readAsDataURL(files[i]);
            };

            loadAudioContent(0);
        }
    );
    $($('.add.sound')).click(function ()
    {
        $('#sound-uploader').click();
    });
});
/*======================================================= END OF SOUNDS SECTION ========================================================================================*/
/*============================================================ OPTIONS SECTION =====================================================================*/
$(document).ready(function()
{

    $('#game-resolution').change(
        function()
        {
            switch(this.value)
            {
                case '320x200': resolution.width = 320; resolution.height = 200;
                break;
                case '640x480': resolution.width = 640; resolution.height = 480;
                break;
                case '800x600': resolution.width = 800; resolution.height = 600;
                break;
                case '1024x768': resolution.width = 1024; resolution.height = 768;
                break;
            }
            updateCanvas(editorCurrentRoom, 'room');
        }
    );
});
/*======================================================= END OF OPTIONS SECTION ===============================================================================*/

var view_AppendAdditionalTreeDOMNodes = function(node)
{
    node = $('#script-tree').jstree().get_node(node);
    var data = node.data;
    if(!data || !data.DOM)
        return;
    node = $('#' + node.id);
    // Order inversion is needed since we're using $.after
    for(var i = data.DOM.length - 1; i >= 0; i--) $(node.find('a')[0]).after(data.DOM[i]);
};

var view_DeleteAllTuples = function()
{
    $('.tuple.triggerer').remove();
};

var initSelectNode = function(node, datalist)
{
    $(datalist).each(function()
    {
        $(this.options).each(function()
        {
            node.append($(document.createElement('option')).attr({'value' : this.text}).text(this.text));
        });
    });
};

/**
 * Creates a row that allows to specify parameters for different types of script triggerers
 */
var view_CreateNewScriptRunnerTuple = function(type, data)
{
    var row = $(document.createElement('div')).addClass('row tuple triggerer ' + type).css('margin-top', '10px');
    var eraser = $(document.createElement('span')).attr('class', 'glyphicon glyphicon-remove').css('color', 'firebrick');
    eraser.hover(function() { $(this).css('cursor', 'pointer');}, function() {$(this).css('cursor', 'default');});
    eraser.click(function() { row.remove();});
    row.append(eraser);

    switch(type)
    {
        case 'user-trigger':
            var actString = '';
            var obj1String = '';
            var obj2String = '';

            var checkbox = $(document.createElement('input')).attr({'type' : 'checkbox', 'class' : 'col activate-obj-2'}).css('margin-left', '15px');
            var sentence = $(document.createElement('input')).attr({'class' : 'col script-sentence'}).css('width', '150px');

            var updateSentence = function()
            {
                if(actString.length == 0)
                    return;
                var action = editorMapIdAction[actString];
                if(!action)
                {
                    sentence[0].value = '';
                    return;
                }
                var s = actString + ' ' + obj1String;
                if(obj2String && checkbox[0].checked)
                    s += ' ' + (action.id == 'Use' ? 'with' : (action.id == 'Give' ? 'to' : '-')) + ' ' + obj2String;

                sentence[0].value = s;
            };

            row.append($(document.createElement('span')).text('Action performed ').css('margin-left', '5px'));
            var action = $(document.createElement('select')).attr({'class' : 'col triggerer-ev-1 datalist-triggerer-events'}).css({ width: '150px' });
            initSelectNode(action, $('#datalist-triggerer-events'));
            row.append(action);
            action.select2();

            row.append($(document.createElement('span')).text('Target object ').css('margin-left', '15px'));
            //var obj1 = $(document.createElement('input')).attr({'list' : 'datalist-game-items', 'class' : 'target-obj-1'});
            var obj1 = $(document.createElement('select')).attr({'class' : 'col target-obj-1 datalist-game-items'}).css({ width: '150px' });
            initSelectNode(obj1, $('#datalist-game-items'));
            row.append(obj1);
            obj1.select2();

            row.append(checkbox);
            row.append($(document.createElement('span')).text('Second target object ').css('margin-left', '5px'));
            var targetObject2 = $(document.createElement('select')).attr({'class' : 'col target-obj-2 datalist-game-items', 'disabled' : 'disabled'}).css({ width: '150px' });;
            initSelectNode(targetObject2, $('#datalist-game-items'));
            row.append(targetObject2);
            targetObject2.select2();

            row.append(($(document.createElement('span')).text('Sentence ').css('margin-left', '15px'))).append(sentence);
            /*targetObject2.change(
                function()
                {
                    obj2String = editorMapIdItem[this.value].description || editorMapIdInvItem[this.description];
                    updateSentence();
                }
            );*/
            checkbox.on('change', function() {
                if(this.checked)
                {
                    targetObject2.prop('disabled', false);
                }
                else
                {
                    targetObject2.prop('disabled', true);
                    targetObject2[0].value = '';
                }
                updateSentence();
            });
        break;
        case 'event-trigger':
            row.append($(document.createElement('span')).text('Event name').css('margin-left', '5px'));
            row.append($(document.createElement('input')).attr({'type' : 'text', 'class' : 'col triggerer-ev'}).css('margin-left', '5px'));

        break;
        case 'timer-trigger':
            row.append($(document.createElement('span')).text('Time in milliseconds ').css('margin-left', '5px'));
            row.append($(document.createElement('input')).attr({'type' : 'number', 'class' : 'col triggerer-timer', 'min' : 150, 'value' : 150}).css('margin-left', '5px'));
            row.append($(document.createElement('input')).attr({'type' : 'checkbox', 'class' : 'col time-interval'}).css('margin-left', '15px'));
            row.append($(document.createElement('span')).text('Always restart timer ').css('margin-left', '5px'));
        break;
        case 'enter-room-trigger':
            row.append($(document.createElement('span')).text('Room ID ').css('margin-left', '5px'));
            var selectRoom = $(document.createElement('select')).attr({ 'class' : 'col datalist-game-rooms' }).css({ width: '200px' });
            initSelectNode(selectRoom, $('#datalist-game-rooms'));
            row.append(selectRoom);
            selectRoom.select2();
            break;
    }
    $('#script-container').append(row);
    if(data)
        view_PopulateTuple(type, row, data);
};

var view_CreateNewRoomPanel = function(roomId)
{
    var roomPanel = $(document.createElement('div'));
    var roomPanelHeading = $(document.createElement('div'));
    var roomPanelTitle = $(document.createElement('h4'));
    var roomPanelToggler = $(document.createElement('a'));
    var roomPanelCollapse = $(document.createElement('div'));
    var roomPanelBody = $(document.createElement('div'));
    var bgSelector = $(document.createElement('input'));

    roomPanelBody.append($(document.createElement('span')).append($(document.createTextNode('Background image '))));
    roomPanelBody.append(bgSelector);
    bgSelector.attr(
        {
            'type' : 'file',
            'accept' : 'image/*',
            'id' : roomId + '-bg-selector'
        });

    $(bgSelector).inputfile({
        uploadText: '<span class="glyphicon glyphicon-upload"></span> Select image file',
        removeText: '<span class="glyphicon glyphicon-trash"></span>',
        restoreText: '<span class="glyphicon glyphicon-remove"></span>',

        uploadButtonClass: 'btn btn-default',
        removeButtonClass: 'btn btn-default',

        dontRemove: true
    });



    roomPanelToggler.attr(
        {
            'data-toggle' : 'collapse',
            'data-parent' : '#room-accordion',
            'href' : '#' + roomId + '-panel',
            'class' : 'glyphicon glyphicon-collapse-down pull-right',
            'style' : 'color: inherit; text-decoration: none'
        }
    );

    roomPanelTitle.addClass('panel-title');
    roomPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(roomId))));
    roomPanelTitle.append(roomPanelToggler);
    roomPanelHeading.addClass('panel-heading room');
    roomPanelHeading.append(roomPanelTitle);
    roomPanelBody.addClass('panel-body');
    roomPanelCollapse.attr(
        {
            'id' : roomId + '-panel',
            'class' : 'panel-collapse collapse'
        }
    );

    roomPanelCollapse.append(roomPanelBody);
    roomPanel.append(roomPanelHeading);
    roomPanel.append(roomPanelCollapse);
    roomPanel.attr(
        {
            'class' : 'panel panel-default room'
        }
    );
    $('#room-accordion').append(roomPanel);
    $('#' + roomId + '-bg-selector')[0].addEventListener('change', setEditorRoomBackground, false);

    // Handle click on a room panel's heading
    $(roomPanelHeading).click(function ()
    {
        /* Look for another room panel that was previosuly collapsed down.
           If present, trigger click on his 'collapse' link to collapse it up.
         */
        if($(this).siblings()[0].className.indexOf('in') == -1)
            $('.room .in').siblings().find('a').trigger('click');

        var roomId = $(this).find('span').text().replace(/[\s\'\"]/g, '_');

        editorCurrentRoom = editorMapIdRoom[roomId];

        var pHeadingRoomActive = $('.panel-heading.room.active, .panel-heading.item.active, .panel-heading.walk-behind.active');
        pHeadingRoomActive.css({ 'background' : '#f5f5f5', 'color' : 'inherit'});
        pHeadingRoomActive.removeClass('active');

        $(this).addClass('active');
        $(this).css( {'background-color' : '#428bca', 'color' : 'white'});

        editorCurrentItem = null;
        $('.toolbar.room button.active').blur();
        $('.toolbar.room button').removeClass('active');
        canvas.state = 'idle';
        updateCanvas(editorCurrentRoom, 'room');


    });

    // Defines the attributes of the popup div generated by bootstrap-editable
    $(roomPanelHeading).find('span').editable({
        type: 'text',
        title: 'Enter room name',
        placement: 'right',
        unsavedclass: null
    });

    $(roomPanelHeading).find('span').editable('option', 'validate', function(inputString)
    {
        if(inputString == '')
            return 'This field can\'t be null!';

        inputString = inputString.replace(/[\s\'\"]/g, '_');

        if(checkIdUniqueness(inputString, 'room') == false)
            return 'Ids must be unique!';

        var oldId = $(this).text().replace(/[\s\'\"]/g, '_');

        //view_EditOptionOccurrences(inputString, $(this).text(), 'room');
        //changeParamNameOccurrences(inputString, oldId);
        view_UpdateDataLists('delete', 'rooms', oldId);
        view_UpdateDataLists('add', 'rooms', inputString);
        $('input[list="datalist-game-rooms"]').each(function() { if(this.value == oldId) this.value = inputString});

        // Deletes from the map the old id/room match and adds the new one
        var editorRoomToBeModified = editorMapIdRoom[oldId];
        delete editorMapIdRoom[editorRoomToBeModified.id];
        editorRoomToBeModified.setId(inputString);
        editorMapIdRoom[editorRoomToBeModified.id] = editorRoomToBeModified;
        $('#' + $(this).text() + '-panel').attr('id', inputString + '-panel');
        $('#' + $(this).text() + '-items-accordion').attr('id', inputString + '-items-accordion');
        $(this).text(inputString);
        roomPanelToggler.attr({ 'href' : '#' + inputString + '-panel'});
    });

    view_CreateEditorItemPanelGroup(roomPanelBody);
    view_CreateEditorWalkBoxesGroup(roomPanelBody);
    view_UpdateDataLists('add', 'rooms', roomId);
};

var view_CreateEditorItemPanelGroup = function(roomPanel)
{
    var buttonGroup = $(document.createElement('div'));
    var addButton = $(document.createElement('button'));
    var deleteButton = $(document.createElement('button'));
    //var clearButton = $(document.createElement('button'));

    buttonGroup.addClass('btn-group btn-group-xs item');
    buttonGroup.css({ 'font-family' : 'inherited' });
    addButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs add item'});
    deleteButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs delete item'});
    //clearButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs clear item'});

    addButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-plus-sign')).append($(document.createTextNode(' Add')));
    deleteButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-minus-sign')).append($(document.createTextNode(' Delete')));
    //clearButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-remove-sign')).append($(document.createTextNode(' Clear')));

    buttonGroup.append(addButton);
    buttonGroup.append(deleteButton);
    //buttonGroup.append(clearButton);
    buttonGroup.append($(document.createElement('div')).addClass('row spacer').css({ 'margin-top' : '40px'}));
    roomPanel.append($(document.createElement('hr')).addClass('item')).append($(document.createElement('h4')).addClass('item').append($(document.createElement('i')).append(document.createTextNode('Objects'))));
    roomPanel.append(buttonGroup);
    //roomPanel.append($(document.createElement('br')));

    var parentRoomName;
    var node =  roomPanel[0];

    do
    {
        node = node.parentNode;
    }
    while(node.className.indexOf('collapse') == -1);

    parentRoomName = node.id.slice(0, node.id.length - '-panel'.length);

    roomPanel.append($(document.createElement('div')).attr({ 'class' : 'panel-group', 'id' : parentRoomName + '-items-accordion' }));

    addButton.click(function() {
        var parentRoomName = node.id.slice(0, node.id.length - '-panel'.length);
        if(editorMapIdRoom[parentRoomName].items.length == 0) {
            if($(this).closest('.panel-body').find('.alert').length == 0)
                alertMessage($(this).closest('.panel-body'), 'Please choose a background for this room, first!', 'danger');
            return;
        }
        var newItemId = 'Item_' + editorItemsCount++;
        createNewEditorItem(newItemId, $(this).closest('.collapse')[0].id.slice(0, node.id.length - '-panel'.length));
        view_CreateEditorItemPanel(newItemId, parentRoomName);
    });
    deleteButton.click(function()
    {
        if(editorCurrentItem == null)
            return;
        var itemId = editorCurrentItem.id;
        view_DeleteEntity('items', itemId);
    });
};

var view_CreateEditorWBPanelGroup = function(roomPanel)
{
    var buttonGroup = $(document.createElement('div'));
    var addButton = $(document.createElement('button'));
    var deleteButton = $(document.createElement('button'));
    //var clearButton = $(document.createElement('button'));

    buttonGroup.addClass('btn-group btn-group-xs walk-behind');
    buttonGroup.css({ 'font-family' : 'inherited' });
    addButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs add walk-behind'});
    deleteButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs delete walk-behind'});
    //clearButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs clear walk-behind'});

    addButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-plus-sign')).append($(document.createTextNode(' Add')));
    deleteButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-minus-sign')).append($(document.createTextNode(' Delete')));
    //clearButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-remove-sign')).append($(document.createTextNode(' Clear')));

    buttonGroup.append(addButton);
    buttonGroup.append(deleteButton);
    //buttonGroup.append(clearButton);
    buttonGroup.append($(document.createElement('div')).addClass('row spacer').css({ 'margin-top' : '40px'}));
    roomPanel.append($(document.createElement('hr')).addClass('walk-behind')).append($(document.createElement('h4')).addClass('walk-behind').append($(document.createElement('i')).append(document.createTextNode('Walk-behinds'))));
    roomPanel.append(buttonGroup);
    //roomPanel.append($(document.createElement('br')));

    var parentRoomName;
    var node =  roomPanel[0];

    do
    {
        node = node.parentNode;
    }
    while(node.className.indexOf('collapse') == -1);

    parentRoomName = node.id.slice(0, node.id.length - '-panel'.length);

    roomPanel.append($(document.createElement('div')).attr({ 'class' : 'panel-group', 'id' : parentRoomName + '-wb-accordion' }));

    addButton.click(function() {
        var parentRoomName = node.id.slice(0, node.id.length - '-panel'.length);
        if(editorMapIdRoom[parentRoomName].items.length == 0) {
            if($(this).closest('.panel-body').find('.alert').length == 0)
                alertMessage($(this).closest('.panel-body'), 'Please choose a background for this room, first!', 'danger');
            return;
        }
        var newWbId = 'Walk-Behind_' + editorWbCount++;
        //createNewEditorItem(newWbId, $(this).closest('.collapse')[0].id.slice(0, node.id.length - '-panel'.length));
        view_CreateEditorWBPanel(newWbId, parentRoomName);
    });
};

var view_CreateEditorWalkBoxesGroup = function(roomPanel)
{
    var buttonGroup = $(document.createElement('div'));
    var addButton = $(document.createElement('button'));
    var deleteButton = $(document.createElement('button'));
    var clearButton = $(document.createElement('button'));

    buttonGroup.addClass('btn-group btn-group-xs walk-behind');
    buttonGroup.css({ 'font-family' : 'inherited' });
    addButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs add walk-boxes'});
    deleteButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs delete walk-boxes'});
    clearButton.attr({ 'type' : 'button' , 'class' : 'btn btn-default btn-xs clear walk-boxes'});

    addButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-plus-sign')).append($(document.createTextNode(' Add')));
    deleteButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-minus-sign')).append($(document.createTextNode(' Delete')));
    clearButton.append($(document.createElement('span')).addClass('glyphicon glyphicon-remove-sign')).append($(document.createTextNode(' Clear')));

    buttonGroup.append(addButton);
    buttonGroup.append(deleteButton);
    buttonGroup.append(clearButton);
    buttonGroup.append($(document.createElement('div')).addClass('row spacer').css({ 'margin-top' : '40px'}));
    roomPanel.append($(document.createElement('hr')).addClass('walk-behind')).append($(document.createElement('h4')).addClass('walk-boxes').append($(document.createElement('i')).append(document.createTextNode('WalkBoxes'))));
    roomPanel.append(buttonGroup);
    //roomPanel.append($(document.createElement('br')));

    var parentRoomName;
    var node =  roomPanel[0];

    do
    {
        node = node.parentNode;
    }
    while(node.className.indexOf('collapse') == -1);

    parentRoomName = node.id.slice(0, node.id.length - '-panel'.length);

    roomPanel.append($(document.createElement('div')).attr({ 'class' : 'panel-group', 'id' : parentRoomName + '-wboxes-accordion' }));

    addButton.click(function() {
        var parentRoomName = node.id.slice(0, node.id.length - '-panel'.length);
        /*if(editorMapIdRoom[parentRoomName].items.length == 0) {
            if($(this).closest('.panel-body').find('.alert').length == 0)
                alertMessage($(this).closest('.panel-body'), 'Please choose a background for this room, first!', 'danger');
            return;
        }*/
        var newWBoxId = 'WalkBox_' + keys(editorMapIdRoom[parentRoomName].walkBoxes).length + '_' + parentRoomName;
        editorMapIdRoom[parentRoomName].walkBoxes[newWBoxId] = new WalkBox(newWBoxId);
        //createNewEditorItem(newWbId, $(this).closest('.collapse')[0].id.slice(0, node.id.length - '-panel'.length));
        view_CreateEditorWalkBoxPanel(newWBoxId, parentRoomName);
    });

    deleteButton.click(function()
    {
        if(editorCurrentWalkBox == null)
            return;
        view_DeleteEntity('walkboxes', editorCurrentWalkBox);
        editorCurrentWalkBox = null;
    });
};

var view_CreateEditorWBPanel = function(wbId, parentRoomName)
{
    var wbPanel = $(document.createElement('div'));
    var wbPanelHeading = $(document.createElement('div'));
    var wbPanelTitle = $(document.createElement('h4'));
    var wbPanelToggler = $(document.createElement('a'));
    var wbPanelCollapse = $(document.createElement('div'));
    var wbPanelBody = $(document.createElement('div'));
    //var spriteSelector = $(document.createElement('input'));

    $('#' + parentRoomName + '-wb-accordion').append(wbPanel);

    wbPanelTitle.addClass('panel-title');
    wbPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(wbId))));
    wbPanelTitle.append(wbPanelToggler);
    wbPanelHeading.addClass('panel-heading walk-behind');
    wbPanelHeading.append(wbPanelTitle);
    wbPanelBody.addClass('panel-body');
    wbPanelCollapse.attr(
        {
            'id': wbId + '-panel',
            'class': 'panel-collapse collapse'
        }
    );
    wbPanelCollapse.append(wbPanelBody);
    wbPanel.append(wbPanelHeading);
    wbPanel.append(wbPanelCollapse);
    wbPanel.attr(
        {
            'class': 'panel panel-default'
        }
    );
    wbPanelToggler.attr(
        {
            'data-toggle' : 'collapse',
            'data-parent' : '#' + parentRoomName + '-wb-accordion',
            'href' : '#' + wbId + '-panel',
            'class' : 'glyphicon glyphicon-collapse-down pull-right',
            'style' : 'color: inherit; text-decoration: none'
        }
    );

    var thumbnailDiv = $(document.createElement('div'));
    var thumbnailA = $(document.createElement('a')).addClass('thumbnail');
    var thumbnail;
    if(editorMapIdWb[wbId] != undefined)
    {
        thumbnail = new Image();
        thumbnail.src = editorMapIdWb[wbId].image;
    }
    else
    {
        thumbnail = new Image(100, 100);
        thumbnail.src = './images/no-img.png';
        createNewEditorWalkBehind(wbId, parentRoomName);
    }
    thumbnailA.append(thumbnail);
    thumbnailDiv.append(thumbnailA);
    wbPanelBody.append(thumbnailDiv);

    // Handle click on a walk-behind panel's header
    $(wbPanelHeading).click(function ()
    {
        var relativeItemName = $(this).find('span').text().replace(/[\s\'\"]/g, '_');
        var relativePanelGroup = $(this).closest('.panel-group');

        // Collapse the previously opened item panel within the same room panel
        if($(relativePanelGroup).find('.collapse.in').length)
            if($(relativePanelGroup).find('.collapse.in').attr('id') != relativeItemName + '-panel')
                $(relativePanelGroup).find('.collapse.in').siblings().find('a').trigger('click');


        editorCurrentItem = editorMapIdWb[relativeItemName];

        var select = $('.panel-heading.walk-behind.active, .panel-heading.item.active');
        select.css({ 'background' : '#f5f5f5', 'color' : 'inherit'});
        select.removeClass('active');

        $(this).addClass('active');
        $(this).css( {'background-color' : '#428bca', 'color' : 'white'});

        updateCanvas(editorCurrentRoom, 'room');
    });
};

var view_DeleteWbThumbnail = function(wbId)
{
    var thumbnail = new Image(100, 100);
    thumbnail.src = './images/no-img.png';
    $('#' + wbId + '-panel .thumbnail').empty();
    $('#' + wbId.id + '-panel .thumbnail').append(thumbnail);
};

var view_CreateEditorWalkBoxPanel = function(wboxId, parentRoomName)
{
    var wboxPanel = $(document.createElement('div'));
    var wboxPanelHeading = $(document.createElement('div'));
    var wboxPanelTitle = $(document.createElement('h4'));
    var wboxPanelToggler = $(document.createElement('a'));
    var wboxPanelCollapse = $(document.createElement('div'));
    var wboxPanelBody = $(document.createElement('div'));
    //var spriteSelector = $(document.createElement('input'));

    $('#' + parentRoomName + '-wboxes-accordion').append(wboxPanel);

    wboxPanelTitle.addClass('panel-title');
    wboxPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(wboxId))));
    wboxPanelTitle.append(wboxPanelToggler);
    wboxPanelHeading.addClass('panel-heading walkbox');
    wboxPanelHeading.append(wboxPanelTitle);
    wboxPanelBody.addClass('panel-body');
    wboxPanelCollapse.attr(
        {
            'id': wboxId + '-panel',
            'class': 'panel-collapse collapse'
        }
    );
    wboxPanelCollapse.append(wboxPanelBody);
    wboxPanel.append(wboxPanelHeading);
    wboxPanel.append(wboxPanelCollapse);
    wboxPanel.attr(
        {
            'class': 'panel panel-default'
        }
    );
    wboxPanelToggler.attr(
        {
            'data-toggle' : 'collapse',
            'data-parent' : '#' + parentRoomName + '-wboxes-accordion',
            'href' : '#' + wboxId + '-panel',
            'class' : 'glyphicon glyphicon-collapse-down pull-right',
            'style' : 'color: inherit; text-decoration: none'
        }
    );

    var wboxData;
    var wbox = editorMapIdRoom[parentRoomName].walkBoxes[wboxId];

    wboxData = $(document.createElement('input')).attr('type', 'checkbox');
    if(wbox.visible === true)
        wboxData.prop('checked', 'checked');
    wboxPanelBody.append($(document.createElement('div')).append($(document.createTextNode('Visible: '))).append(wboxData));
    wboxData.change(function() {
        wboxPanelHeading.trigger('click');
        wbox.visible = !wbox.visible; });
    wboxData.checked = true;

    wboxData = view_CreateInputList(wboxId, 'audio');
    wboxPanelBody.append($(document.createElement('div')).append($(document.createTextNode('Walking sound: '))).append(wboxData));
    $(wboxData).change(function() { wboxPanelHeading.trigger('click'); wbox.walkingSound = this.value;});
    if(wbox.walkingSound)
        wboxData.value = wbox.walkingSound;

    wboxData = $(view_CreateInputNumber(wboxId, 'Max scale factor')).attr({ 'min' : '0'});
    wboxPanelBody.append($(document.createElement('div')).append($(document.createTextNode('Max scale factor: '))).append(wboxData));
    wboxData.change(function()
    {
        wboxPanelHeading.trigger('click');
        wbox.maxScaleFactor = parseInt(this.value);
    });
    wboxData[0].value = wbox.maxScaleFactor;

    wboxData = $(view_CreateInputNumber(wboxId, 'Min scale factor')).attr({ 'min' : '0'});
    wboxPanelBody.append($(document.createElement('div')).append($(document.createTextNode('Min scale factor: '))).append(wboxData));
    wboxData.change(function()
    {
        wboxPanelHeading.trigger('click');
        wbox.minScaleFactor = parseInt(this.value);
    });
    wboxData[0].value = wbox.minScaleFactor;

    // Handle click on a walkBox panel's header
    $(wboxPanelHeading).click(function ()
    {
        var relativeItemName = $(this).find('span').text().replace(/[\s\'\"]/g, '_');
        var relativePanelGroup = $(this).closest('.panel-group');

        // Collapse the previously opened item panel within the same room panel
        if($(relativePanelGroup).find('.collapse.in').length)
            if($(relativePanelGroup).find('.collapse.in').attr('id') != relativeItemName + '-panel')
                $(relativePanelGroup).find('.collapse.in').siblings().find('a').trigger('click');

        editorCurrentWalkBox = relativeItemName;

        //editorCurrentItem = editorMapIdWb[relativeItemName];

        var select = $('.panel-heading.walkbox.active, .panel-heading.item.active');
        select.css({ 'background' : '#f5f5f5', 'color' : 'inherit'});
        select.removeClass('active');

        $(this).addClass('active');
        $(this).css( {'background-color' : '#428bca', 'color' : 'white'});

        updateCanvas(editorCurrentRoom, 'room');
    });
};

function view_UpdateDataLists(op, type, text)
{
    var dataList;
    var selectNodes;

    switch(type)
    {
        case 'actions': dataList = $('#datalist-triggerer-events');
                        selectNodes = $('select.datalist-triggerer-events');
        break;
        case 'items': dataList = $('#datalist-game-items');
            selectNodes = $('select.datalist-game-items');
        break;
        case 'rooms': dataList = $('#datalist-game-rooms');
            selectNodes = $('select.datalist-game-rooms');
        break;
        case 'inventory-items': dataList =  $('#datalist-game-inventory-items');
            selectNodes = $('select.datalist-game-inventory-items');
        break;
        case 'dialogs': dataList =  $('#datalist-game-dialogs');
            selectNodes = $('select.datalist-game-dialogs');
        break;
        case 'anims': dataList =  $('#datalist-game-anims');
            selectNodes = $('select.datalist-game-anims');
        break;
        case 'audio': dataList =  $('#datalist-game-audio');
            selectNodes = $('select.datalist-game-audio');
            break;
        case 'scripts': dataList =  $('#datalist-game-scripts');
            selectNodes = $('select.datalist-game-scripts');
            break;
        case 'walkboxes':
            return;
        default:
            throwError('Error: unrecognized datalist type \"' + type + '\"')();
    }

    if(op == 'add')
    {
        dataList.append($(document.createElement('option')).attr('value', text).append($(document.createTextNode(text))));
        selectNodes.each(function()
        {
            $(this).append($(document.createElement('option')).attr('value', text).append($(document.createTextNode(text))));
        });
    }
    else if(op == 'delete')
    {
        var options = dataList[0].options;
        for(var i = 0; i < options.length; i++)
        {
            if(options[i].value === text)
            {
                dataList[0].remove(i);
                break;
            }
        };

        selectNodes.each(function()
        {
            $(this).find('option[value="' + text + '"]').remove();
        });
    }

    //editorScriptTree.trigger('redraw');
};
var view_CreateEditorItemPanel = function(_itemId_, parentRoomName)
{
    var itemId = _itemId_;
    var itemPanel = $(document.createElement('div'));
    var itemPanelHeading = $(document.createElement('div'));
    var itemPanelTitle = $(document.createElement('h4'));
    var itemPanelToggler = $(document.createElement('a'));
    var itemPanelCollapse = $(document.createElement('div'));
    var itemPanelBody = $(document.createElement('div'));
    //var spriteSelector = $(document.createElement('input'));

    $('#' + parentRoomName + '-items-accordion').append(itemPanel);

    itemPanelTitle.addClass('panel-title');
    itemPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(itemId))));
    itemPanelTitle.append(itemPanelToggler);
    itemPanelHeading.addClass('panel-heading item');
    itemPanelHeading.append(itemPanelTitle);
    itemPanelBody.addClass('panel-body');
    itemPanelCollapse.attr(
        {
            'id' : itemId + '-panel',
            'class' : 'panel-collapse collapse'
        }
    );
    itemPanelCollapse.append(itemPanelBody);
    itemPanel.append(itemPanelHeading);
    itemPanel.append(itemPanelCollapse);
    itemPanel.attr(
        {
            'class' : 'panel panel-default'
        }
    );

    var hideFromCanvas = $(document.createElement('input')).attr('type', 'checkbox').css('margin-left', '10px');
    hideFromCanvas.change(function()
    {
        editorMapIdItem[itemId].hideFromCanvas = this.checked;
        updateCanvas(editorCurrentRoom, 'room');
    });
    hideFromCanvas[0].checked = editorMapIdItem[itemId].hideFromCanvas;
    itemPanelBody.append($(document.createElement('span')).text('Hide from canvas')).append(hideFromCanvas);
    itemPanelBody.append($(document.createElement('h4')).append($(document.createElement('i')).append('Properties')));
    var itemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    var itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Description')));
    var itemInput = $(document.createElement('input')).attr(
        {
            'type' : 'text',
            'class' : 'form-control item'
        }
    );
    var saveItemChanges = function()
    {
        var itemParentRoomId = $(this.panelTitle).text();

        switch($(this).attr('type'))
        {
            case 'text':
                editorMapIdItem[itemParentRoomId].description = this.value;
                break;
            case 'number':
                if($(this).hasClass('layer'))
                {
                    editorMapIdItem[itemParentRoomId].setLayer(2 * this.value);
                    updateCanvas(editorCurrentRoom, 'room');
                }
                else if($(this).hasClass('walkX'))
                    //editorMapIdItem[itemParentRoomId].walkingX = parseInt(this.value);
                    editorMapIdItem[itemParentRoomId].walkspot.x = parseInt(this.value);
                else
                    //editorMapIdItem[itemParentRoomId].walkingY = parseInt(this.value);
                    editorMapIdItem[itemParentRoomId].walkspot.y = parseInt(this.value);
                break;
        }

    };
    itemInput[0].panelTitle = itemPanelTitle.find('span')[0];
    $(itemInput).on('change', saveItemChanges);
    itemPanelBody.append((itemInputGroup.append(itemInputLabel).append(itemInput)));

    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Layer')));
    var itemInputLayer = $(document.createElement('input')).attr(
        {
            'type' : 'number',
            'class' : 'form-control item layer',
            'min' : '1',
            'value' : '1'
        }
    );
    itemInputLayer[0].panelTitle = itemPanelTitle.find('span')[0];
    $(itemInputLayer).on('change', saveItemChanges);

    itemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    itemPanelBody.append((itemInputGroup.append(itemInputLabel).append(itemInputLayer)));

    itemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Walking X')));
    var itemWalkX = $(document.createElement('input')).attr({ 'type' : 'number', 'class' : 'form-control item walkX' });
    itemWalkX[0].panelTitle = itemPanelTitle.find('span')[0];
    itemWalkX.on('change', saveItemChanges);
    itemPanelBody.append((itemInputGroup.append(itemInputLabel).append(itemWalkX)));

    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Walking Y')));
    var itemWalkY = $(document.createElement('input')).attr({ 'type' : 'number', 'class' : 'form-control item walkY' });
    itemWalkY[0].panelTitle = itemPanelTitle.find('span')[0];
    itemWalkY.on('change', saveItemChanges);
    itemPanelBody.append((itemInputGroup.append(itemInputLabel).append(itemWalkY)));

    itemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Face direction')));
    var dirs = $(view_CreateInputList(itemId + '-direction', 'directions')).attr('type', 'datalist').addClass('form-control item direction');
    dirs[0].value = editorMapIdItem[itemId].faceDir;
    dirs.change(function() { editorMapIdItem[itemId].faceDir = this.value; });
    itemInputGroup.append(itemInputLabel).append(dirs);
    itemPanelBody.append(itemInputGroup);

    var itemVisibleCheckBox = $(document.createElement('input')).attr({ 'type' : 'checkbox', 'class' : 'item visible' });
    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append(itemVisibleCheckBox);
    var itemVisibleText = $(document.createElement('input')).attr('type', 'text').addClass('form-control item layer');
    itemVisibleCheckBox[0].checked = editorMapIdItem[_itemId_].visible;
    itemVisibleText[0].value = editorMapIdItem[_itemId_].visible ? 'Visible' : 'Hidden';
    itemVisibleCheckBox.on('change', function()
    {
        if(this.checked)
            itemVisibleText[0].value = 'Visible';
        else
            itemVisibleText[0].value = 'Hidden';
        editorMapIdItem[_itemId_].visible = this.checked;

    });
    itemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    itemPanelBody.append((itemInputGroup.append(itemInputLabel)).append(itemVisibleText));

    //////////////////////////////////////////////////////////////////////////////////////////////////
    itemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Leads to room')));
    var room = $(view_CreateInputList(itemId + '-exit-to', 'rooms')).addClass('form-control item exit');
    room[0].value = editorMapIdItem[itemId].exitTo.room;
    room.change(function() { editorMapIdItem[itemId].exitTo.room = this.value; });
    itemInputGroup.append(itemInputLabel).append(room);
    //itemPanelBody.append(itemInputGroup);

    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Pos X')));
    var exitPosX = $(document.createElement('input')).attr({ 'type' : 'number', 'class' : 'form-control item exit' });
    exitPosX[0].value = editorMapIdItem[itemId].exitTo.xPos;
    exitPosX.change(function() { editorMapIdItem[itemId].exitTo.xPos = this.value.length === 0 ? null : parseInt(this.value); });
    itemPanelBody.append((itemInputGroup.append(itemInputLabel).append(exitPosX)));

    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Pos Y')));
    var exitPosY = $(document.createElement('input')).attr({ 'type' : 'number', 'class' : 'form-control item exit' });
    exitPosY[0].value = editorMapIdItem[itemId].exitTo.yPos;
    exitPosY.change(function() { editorMapIdItem[itemId].exitTo.yPos = this.value.length === 0 ? null : parseInt(this.value); });
    itemPanelBody.append((itemInputGroup.append(itemInputLabel).append(exitPosY)));
    //////////////////////////////////////////////////////////////////////////////////////////////////

    itemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    itemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Default Anim')));
    itemInput = $(document.createElement('select')).attr('class', 'datalist-game-anims').addClass('form-control item anim-default').css({ width : '100%' });
    itemInput.append($(document.createElement('option')).attr({ 'value' : ''}).text('No anim'));
    initSelectNode(itemInput, $('#datalist-game-anims'));
    itemInput[0].panelTitle = itemPanelTitle.find('span')[0];
    itemInput.on('change', function() {
        var animId = itemInput[0].value;
        if(!animId.length)
        {
            editorMapIdItem[itemId].defaultAnims.default = null;
            thumbnailDiv.hide();
            return;
        }
        editorMapIdItem[itemId].defaultAnims.default = animId;
        var anim = editorMapIdAnim[animId];
        if(!anim)
            return;
        view_addThumbnail(anim.frames[anim.start_idx]);
        updateCanvas(editorCurrentRoom, 'room');
    });
    itemPanelBody.append((itemInputGroup.append(itemInputLabel).append(itemInput)));

    var view_addThumbnail = function(sprite)
    {
        thumbnail.src = sprite.img.src;
        thumbnailDiv.show();
        $(thumbnail).on('dragstart', function(event)
        {
            event.originalEvent.dataTransfer.setDragImage(thumbnail, sprite.img.width / 2, 0);
        });
    };

    var thumbnailDiv = $(document.createElement('div'));
    var thumbnailA = $(document.createElement('a')).addClass('thumbnail');
    var thumbnail = new Image();
    thumbnailA.append(thumbnail);
    thumbnailDiv.append(thumbnailA);
    itemPanelBody.append(thumbnailDiv);
    thumbnailDiv.hide();
    if(editorMapIdItem[itemId].defaultAnims.default)
    {
        var frame = getItemPlaceHolder(editorMapIdItem[itemId]);
        if(frame)
        {
            view_addThumbnail(frame);
        }
    }
    var itemStateAdder = $(document.createElement('span')).addClass('glyphicon glyphicon-plus').css({'color' : 'green', 'margin-top' : '15px'});
    itemStateAdder.hover(function() { $(this).css('cursor', 'pointer');}, function() { $(this).css('cursor', 'default'); });
    itemPanelBody.append(itemStateAdder);
    var itemStateContainer = $(document.createElement('div'));
    itemPanelBody.append(itemStateContainer);

    itemStateAdder.after(($(document.createElement('span')).css({'margin-left' : '10px', 'font-style' : 'italic'}).append(document.createTextNode('New <state, anim> couple'))));
    itemStateAdder.click(function() { itemStateContainer.append(view_CreateStateAnimCouple(editorMapIdItem[itemId]));});

    itemPanelToggler.attr(
        {
            'data-toggle' : 'collapse',
            'data-parent' : '#' + parentRoomName + '-items-accordion',
            'href' : '#' + itemId + '-panel',
            'class' : 'glyphicon glyphicon-collapse-down pull-right',
            'style' : 'color: inherit; text-decoration: none'
        }
    );

    $(itemPanelHeading).find('span').editable({
        type: 'text',
        title: 'Enter item id',
        placement: 'right',
        unsavedclass: null
    });

    $(itemPanelHeading).find('span').editable('option', 'validate', function(inputString)
    {
        if (inputString == '')
            return 'This field can\'t be null!';

        //else if(inputString.indexOf(' ')!=-1) return 'Invalid name';

        inputString = inputString.replace(/[\s\'\"]/g, '_');

        if(checkIdUniqueness(inputString, 'item') == false)
            return 'Ids must be unique!';

        itemId = inputString;
        _itemId_ = inputString;
        var oldId = $(this).text().replace(/[\s\'\"]/g, '_');

        view_UpdateDataLists('delete', 'items', oldId);
        view_UpdateDataLists('add', 'items', inputString);

        for(var key in editorScriptList)
            replaceScriptOccurrencies(editorScriptList[key], 'item', oldId, itemId);

        $('input[list="datalist-game-items"]').each(function() { if(this.value == oldId) this.value = inputString});

        for(var key in editorScriptList)
            if(key.indexOf(oldId) != -1)
            {
                var action = key.split(' + ')[0];
                editorScriptList[action + ' + ' + inputString] = editorScriptList[key];
                delete  editorScriptList[key];
            }

        // Deletes from the map the old id/item match and adds the new one
        var editorItemToBeModified = editorMapIdItem[oldId];
        delete editorMapIdItem[editorItemToBeModified.id];
        //if(editorItemToBeModified.defaultAnims.default != null)
        //{
            var index = editorCurrentRoom.zOrderMap[editorItemToBeModified.layer].indexOf(editorItemToBeModified.id);
            editorCurrentRoom.zOrderMap[editorItemToBeModified.layer].splice(index, 1);
            editorCurrentRoom.zOrderMap[editorItemToBeModified.layer].push(inputString);
        //}
        editorItemToBeModified.id = inputString;
        editorMapIdItem[editorItemToBeModified.id] = editorItemToBeModified;
        $('#' + $(this).text() + '-panel').attr('id', inputString + '-panel');
        itemPanelToggler.attr({ 'href' : '#' + inputString + '-panel'});
    });

    // Handle click on an item panel's header
    $(itemPanelHeading).click(function ()
    {
        var relativeItemName = $(this).find('span').text().replace(/[\s\'\"]/g, '_');
        var relativePanelGroup = $(this).closest('.panel-group');

        // Collapse the previously opened item panel within the same room panel
        if($(relativePanelGroup).find('.collapse.in').length)
            if($(relativePanelGroup).find('.collapse.in').attr('id') != relativeItemName + '-panel')
                $(relativePanelGroup).find('.collapse.in').siblings().find('a').trigger('click');


        editorCurrentItem = editorMapIdItem[relativeItemName];

        var pHeadingItemActive = $('.panel-heading.item.active');
        pHeadingItemActive.css({ 'background' : '#f5f5f5', 'color' : 'inherit'});
        pHeadingItemActive.removeClass('active');
        var pHeadingWbActive = $('.panel-heading.walk-behind.active');
        pHeadingWbActive.css({ 'background' : '#f5f5f5', 'color' : 'inherit'});
        pHeadingWbActive.removeClass('active');

        $(this).addClass('active');
        $(this).css( {'background-color' : '#428bca', 'color' : 'white'});


        if(editorCurrentItem.description != '')
            $(this).parent().find(':input[type="text"]').filter('.item')[0].value = editorCurrentItem.description;
        $(this).parent().find(':input[type="number"]')[0].value = editorCurrentItem.layer / 2;
        $(this).parent().find(':input[type="number"]')[1].value = editorCurrentItem.walkspot.x;
        $(this).parent().find(':input[type="number"]')[2].value = editorCurrentItem.walkspot.y;
        $(this).parent().find('select')[0].value = editorCurrentItem.defaultAnims.default;

        updateCanvas(editorCurrentRoom, 'room');
    });

    (function()
    {
        var item = editorMapIdItem[itemId];
        for(var key in item.customAnims)
            if(key != 'default')
                itemStateContainer.append(view_CreateStateAnimCouple(item, { key : key, val : item.customAnims[key] }));
    })();

    view_UpdateDataLists('add', 'items', itemId);
};

var view_ClearRoomPanels = function()
{
  $('.panel.panel-default.room, .panel.panel-default.character').remove();
};

var view_DeleteActiveRoomPanel = function()
{
    $('.panel-heading.room.active').parent().remove();
};


var view_UpdateMousePos = function(x, y, which)
{
    if(x < 0 || y < 0)
        x = y = '-';
    $('.' + which + ' .xPos').text(x);
    $('.' + which + ' .yPos').text(y);
};

function view_CreateNewActionPanel(actionId) {
    var actionPanel = $(document.createElement('div'));
    var actionPanelHeading = $(document.createElement('div'));
    var actionPanelTitle = $(document.createElement('h4'));
    var actionPanelToggler = $(document.createElement('a'));
    var actionPanelCollapse = $(document.createElement('div'));
    var actionPanelBody = $(document.createElement('div'));

    actionPanelTitle.addClass('panel-title');
    actionPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(actionId))));
    actionPanelTitle.append(actionPanelToggler);
    actionPanelHeading.addClass('panel-heading action');
    actionPanelHeading.append(actionPanelTitle);
    actionPanelBody.addClass('panel-body');
    actionPanelCollapse.attr(
        {
            'id': actionId + '-panel',
            'class': 'panel-collapse collapse'
        }
    );

    actionPanelCollapse.append(actionPanelBody);
    actionPanel.append(actionPanelHeading);
    actionPanel.append(actionPanelCollapse);
    actionPanel.attr(
        {
            'class': 'panel panel-default action'
        }
    );
    actionPanelToggler.attr(
        {
            'data-toggle': 'collapse',
            'data-parent': '#action-accordion',
            'href': '#' + actionId + '-panel',
            'class': 'glyphicon glyphicon-collapse-down pull-right',
            'style': 'color: inherit; text-decoration: none'
        }
    );
    $('#action-accordion').append(actionPanel);

    var actionInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    var actionInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Description')));
    var actionInput = $(document.createElement('input')).attr(
        {
            'type': 'text',
            'class': 'form-control action'
        }
    );
    actionPanelBody.append((actionInputGroup.append(actionInputLabel).append(actionInput)));
    /*actionPanelBody.append($(document.createElement('div')).addClass('divider').css({ 'margin-top': '40px' })).append($(document.createElement('button')).click(function () {
        var actionId = $(this).parent().parent().attr('id');
        actionId = actionId.slice(0, actionId.length - '-panel'.length);
        editorMapIdAction[actionId].description = $(this).parent().find(':input[type="text"]')[0].value;
    }).addClass('btn btn-success btn-sm').append($(document.createTextNode('Save changes'))));*/
    actionInput.change(function()
    {
       editorMapIdAction[actionId].description = this.value;
    });

    // Defines the attributes of the popup div generated by bootstrap-editable
    /*$(actionPanelHeading).find('span').editable({
        type: 'text',
        title: 'Enter action id',
        placement: 'right',
        unsavedclass: null
    });

    $(actionPanelHeading).find('span').editable('option', 'validate', function (inputString) {
        if (inputString == '')
            return 'This field can\'t be null!';

        inputString = inputString.replace(/[\s\'\"]/g, '_');

        if(checkIdUniqueness(inputString, 'action') == false)
            return 'Ids must be unique!';

        actionId = inputString;
        var oldId = $(this).text().replace(/[\s\'\"]/g, '_');

        //view_EditOptionOccurrences(inputString, $(this).text(), 'action');
        //changeParamNameOccurrences(inputString, oldId);
        view_UpdateDataLists('delete', 'actions', oldId);
        view_UpdateDataLists('add', 'actions', inputString);
        $('input[list="datalist-triggerer-events"]').each(function() { if(this.value == oldId) this.value = inputString});

        for(var key in editorScriptList)
            if(key.indexOf(oldId) != -1)
            {
                var item = key.split(' + ')[1];
                editorScriptList[inputString + ' + ' + item] = editorScriptList[key];
                delete  editorScriptList[key];
            }
        // Deletes from the map the old id/action match and adds the new one
        var editorActionToBeModified = editorMapIdAction[oldId];
        delete editorMapIdAction[editorActionToBeModified.id];

        editorActionToBeModified.id = inputString;
        editorMapIdAction[editorActionToBeModified.id] = editorActionToBeModified;
        $('#' + $(this).text() + '-panel').attr('id', inputString + '-panel');
        actionPanelToggler.attr({ 'href': '#' + inputString + '-panel'});
    });*/

    // Handle click on an action panel's header
    $(actionPanelHeading).click(function () {
        if($(this).siblings()[0].className.indexOf('in') == -1)
            $('.in').siblings().find('a').trigger('click');

        var relativeActionId = $(this).find('span').text().replace(/[\s\'\"]/g, '_');

        var pHeadingActionActive = $('.panel-heading.action.active');
        pHeadingActionActive.css({ 'background': '#f5f5f5', 'color': 'inherit'});
        pHeadingActionActive.removeClass('active');

        $(this).addClass('active');
        $(this).css({'background-color': '#428bca', 'color': 'white'});

        $(this).parent().find(':input[type="text"]').filter('.action')[0].value = editorMapIdAction[relativeActionId].description;
    });

    view_UpdateDataLists('add', 'actions', actionId);
};

var view_CreateNewCharacterPanel = function(characterId)
{
    var characterPanel = $(document.createElement('div'));
    var characterPanelHeading = $(document.createElement('div'));
    var characterPanelTitle = $(document.createElement('h4'));
    var characterPanelToggler = $(document.createElement('a'));
    var characterPanelCollapse = $(document.createElement('div'));
    var characterPanelBody = $(document.createElement('div'));
    var col1 = $(document.createElement('div')).addClass('col-md-12');

    characterPanelTitle.addClass('panel-title');
    characterPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(characterId))));
    characterPanelTitle.append(characterPanelToggler);
    characterPanelHeading.addClass('panel-heading character');
    characterPanelHeading.append(characterPanelTitle);
    characterPanelBody.addClass('panel-body');
    characterPanelCollapse.attr(
        {
            'id': characterId + '-panel',
            'class': 'panel-collapse collapse'
        }
    );

    characterPanelCollapse.append(characterPanelBody);
    characterPanel.append(characterPanelHeading);
    characterPanel.append(characterPanelCollapse);
    characterPanel.attr(
        {
            'class': 'panel panel-default character'
        }
    );
    characterPanelToggler.attr(
        {
            'data-toggle': 'collapse',
            'data-parent': '#character-accordion',
            'href': '#' + characterId + '-panel',
            'class': 'glyphicon glyphicon-collapse-down pull-right',
            'style': 'color: inherit; text-decoration: none'
        }
    );
    $('#character-accordion').append(characterPanel);

/*======================================================= Set player character input ===========================================================*/
    var characterInputGroup = $(document.createElement('div')).addClass('');
    var characterInputLabel = $(document.createElement('span')).append($(document.createTextNode('Set as player character')));
    var characterInput = $(document.createElement('input')).attr({'type': 'checkbox', 'class': 'character hero' }).css('margin-left', '10px');
    characterInput.change(function()
    {
        editorPlayerCharacter = null;
        var that = this;
        for(var i in editorMapIdCharacter)
            editorMapIdCharacter[i].isPlayer = false;
        $('.character.hero').each(function()
        {
            if(that !== this)
            {
                this.checked = false;
            }
        });
        editorMapIdCharacter[characterId].isPlayer = this.checked;
        editorPlayerCharacter = this.checked === true ? characterId : null;
    });
    if(editorMapIdCharacter[characterId].isPlayer === true)
    {
        characterInput[0].checked = true;
        editorPlayerCharacter = characterId;
    }
    col1.append((characterInputGroup.append(characterInputLabel)).append(characterInput));

/*======================================================= Character description input ===========================================================*/
    characterInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    characterInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Description')));
    characterInput = $(document.createElement('input')).attr({'type': 'text', 'class': 'form-control character' });
    characterInput.change(function() { editorMapIdCharacter[characterId].description = this.value; });

    //characterPanelBody.append($(document.createElement('h4')).append($(document.createElement('i')).append(document.createTextNode('General properties'))));
    characterPanelBody.append($(document.createElement('div')).addClass('row').append(col1.append($(document.createElement('h4')).append($(document.createElement('i')).append(document.createTextNode('General properties'))))));
    col1.append((characterInputGroup.append(characterInputLabel).append(characterInput)));

/*======================================================= Character initial room input ===========================================================*/
    characterInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    characterInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Parent room')));
    characterInput = $(document.createElement('input')).attr({'list' : 'datalist-game-rooms', 'class' : 'room-selector form-control'});
    characterInput.change(function() { editorMapIdCharacter[characterId].parentRoomId = this.value; });
    if(editorMapIdCharacter[characterId].parentRoomId != undefined)
        characterInput[0].value = editorMapIdCharacter[characterId].parentRoomId;
    col1.append((characterInputGroup.append(characterInputLabel)).append(characterInput));
/*====================================================== Character speech color input ===========================================================*/

    characterInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    characterInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Speech color')));
    var characterSpeechColor = $(document.createElement('input')).attr('type', 'color').addClass('speech-col form-control');
    characterInputGroup.append(characterInputLabel);
    characterInputGroup.append(characterSpeechColor);
    col1.append(characterInputGroup);
    characterSpeechColor[0].value = editorMapIdCharacter[characterId].speechColor;
    characterSpeechColor.change(function() { editorMapIdCharacter[characterId].speechColor = this.value; });
/*======================================================= Character initial position input ======================================================*/
    characterInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    characterInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Initial posX')));
    var characterInputPosX = $(document.createElement('input')).attr({
        'type': 'number',
        'class': 'point-x form-control',
        'value': '0'});
    characterInputPosX[0].value = editorMapIdCharacter[characterId].position.x;
    characterInputPosX.change(function() { editorMapIdCharacter[characterId].position.x = parseInt(this.value); });
    characterInputGroup.append(characterInputLabel);
    characterInputGroup.append(characterInputPosX);
    col1.append(characterInputGroup);
    var characterInputPosY = $(document.createElement('input')).attr({
            'type': 'number',
            'class': 'point-y form-control',
            'value': '0'});
    characterInputPosY[0].value = editorMapIdCharacter[characterId].position.y;
    characterInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    characterInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Initial posY')));
    characterInputPosY.change(function() { editorMapIdCharacter[characterId].position.y = parseInt(this.value); });
    characterInputGroup.append(characterInputLabel);
    characterInputGroup.append(characterInputPosY);
    col1.append(characterInputGroup);

    col1.append($(document.createElement('h4')).text('Character Anims').css({'font-style' : 'italic', 'margin-top' : '25px'}));
    var createAnimInputGroup = function(state, dir, label)
    {
        var characterInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
        var characterInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('<' + state + ', ' + label + '>')));
        var characterInput = $(document.createElement('select')).addClass('form-control character datalist-game-anims');
        initSelectNode(characterInput, $('#datalist-game-anims'));
        characterInput.change(function() { editorMapIdCharacter[characterId].defaultAnims[state][dir] = characterInput[0].value.length ? characterInput[0].value : null });
        try {
            characterInput[0].value = editorMapIdCharacter[characterId].defaultAnims[state][dir]; }
        catch(err) {
            console.log(err.message);
                   }
        return characterInputGroup.append(characterInputLabel).append(characterInput);
    };

    //var states = ['stand', 'walk', 'talk_start', 'talk_stop'];
    var states = ['stand', 'walk', 'talk'];
    //var dirKeys = ['FL', 'FR', 'FF', 'FB', 'FFL', 'FFR', 'FBL', 'FBR'];
    var dirKeys = ['FL', 'FR', 'FF', 'FB'];
    //var dirText = ['face left', 'face right', 'face front', 'face back', 'face front left', 'face front right', 'face back left', 'face back right'];
    var dirText = ['face left', 'face right', 'face front', 'face back'];
    for(var i = 0; i < states.length; i++)
        for(var j = 0; j < dirKeys.length; j++)
            col1.append(createAnimInputGroup(states[i], dirKeys[j], dirText[j]));

    $('select.character.datalist-game-anims').select2({ 'allowClear' : true});
    var characterStateAdder = $(document.createElement('span')).addClass('glyphicon glyphicon-plus').css({'color' : 'green', 'margin-top' : '15px'});
    characterStateAdder.hover(function() { $(this).css('cursor', 'pointer');}, function() { $(this).css('cursor', 'default'); });
    characterPanelBody.append(characterStateAdder);
    var characterStateContainer = $(document.createElement('div'));
    characterPanelBody.append(characterStateContainer);

    characterStateAdder.after(($(document.createElement('span')).css({'margin-left' : '10px', 'font-style' : 'italic'}).append(document.createTextNode('New <state, anim> couple'))));
    characterStateAdder.click(function() { characterStateContainer.append(view_CreateStateAnimCouple(editorMapIdCharacter[characterId], null));});
/*===============================================================================================================================================*/

    // Defines the attributes of the popup div generated by bootstrap-editable
    $(characterPanelHeading).find('span').editable({
        type: 'text',
        title: 'Enter character id',
        placement: 'right',
        unsavedclass: null
    });

    $(characterPanelHeading).find('span').editable('option', 'validate', function (inputString) {
        if (inputString == '')
            return 'This field can\'t be null!';

        inputString = inputString.replace(/[\s\'\"]/g, '_');

        if(checkIdUniqueness(inputString, 'character') == false)
            return 'Ids must be unique!';

        var oldId = $(this).text().replace(/[\s\'\"]/g, '_');

        //view_EditOptionOccurrences(inputString, $(this).text(), 'character');
        //changeParamNameOccurrences(inputString, oldId);
        view_UpdateDataLists('delete', 'items', oldId);
        view_UpdateDataLists('add', 'items', inputString);
        $('input[list="datalist-game-items"]').each(function() { if(this.value == oldId) this.value = inputString});

        for(var key in editorScriptList)
            if(key.indexOf(oldId) != -1)
            {
                var action = key.split(' + ')[0];
                editorScriptList[action + ' + ' + inputString] = editorScriptList[key];
                delete  editorScriptList[key];
            }
        // Deletes from the map the old id/character match and adds the new one
        var editorCharacterToBeModified = editorMapIdCharacter[oldId];
        delete editorMapIdCharacter[editorCharacterToBeModified.id];

        editorCharacterToBeModified.id = inputString;
        editorMapIdCharacter[editorCharacterToBeModified.id] = editorCharacterToBeModified;
        $('#' + $(this).text() + '-panel').attr('id', inputString + '-panel');
        characterPanelToggler.attr({ 'href': '#' + inputString + '-panel'});
    });


    // Handle click on a character panel's header
    $(characterPanelHeading).click(function () {
        if($(this).siblings()[0].className.indexOf('in') == -1)
            $('.in').siblings().find('a').trigger('click');

        var relativeCharacterId = $(this).find('span').text().replace(/[\s\'\"]/g, '_');
        editorCurrentCharacter = editorMapIdCharacter[relativeCharacterId];

        $('.panel-heading.character.active').css({ 'background': '#f5f5f5', 'color': 'inherit'});
        $('.panel-heading.character.active').removeClass('active');

        $(this).addClass('active');
        $(this).css({'background-color': '#428bca', 'color': 'white'});

        $(this).parent().find(':input[type="text"]').filter('.character')[0].value = editorMapIdCharacter[relativeCharacterId].description;
        if(editorMapIdRoom[editorMapIdCharacter[relativeCharacterId].locationId] != undefined)
            $(this).parent().find('.room-selector')[0].value = editorMapIdCharacter[relativeCharacterId].locationId;

        updateCanvas(editorMapIdRoom[editorCurrentCharacter.parentRoomId], 'character');
    });

    // If loading project, add previously defined custom <state, anim> couples, if any.
    (function()
    {
        var character = editorMapIdCharacter[characterId];
        for(var key in character.customAnims)
            if(states.lastIndexOf(key) == -1)
                characterStateContainer.append(view_CreateStateAnimCouple(character, { key : key, val : character.customAnims[key] }));
    })();

    view_UpdateDataLists('add', 'items', characterId);
};

var view_CreateNewAnimPanel = function(animId)
{
    var animPanel = $(document.createElement('div'));
    var animPanelHeading = $(document.createElement('div'));
    var animPanelTitle = $(document.createElement('h4'));
    var animPanelToggler = $(document.createElement('a'));
    var animPanelCollapse = $(document.createElement('div'));
    var animPanelBody = $(document.createElement('div'));

    animPanelTitle.addClass('panel-title');
    animPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(animId))));
    animPanelTitle.append(animPanelToggler);
    animPanelHeading.addClass('panel-heading anim');
    animPanelHeading.append(animPanelTitle);
    animPanelBody.addClass('panel-body');
    animPanelCollapse.attr(
        {
            'id': animId + '-panel',
            'class': 'panel-collapse collapse'
        }
    );

    animPanelCollapse.append(animPanelBody);
    animPanel.append(animPanelHeading);
    animPanel.append(animPanelCollapse);
    animPanel.attr(
        {
            'class': 'panel panel-default anim'
        }
    );
    animPanelToggler.attr(
        {
            'data-toggle': 'collapse',
            'data-parent': '#anim-accordion',
            'href': '#' + animId + '-panel',
            'class': 'glyphicon glyphicon-collapse-down pull-right',
            'style': 'color: inherit; text-decoration: none'
        }
    );

    var framesContainer = $(document.createElement('table'));
    framesContainer[0].r = new Array();
    framesContainer[0].r.push({'tr' : $(document.createElement('tr')).addClass('r0')[0], 'td' : []});
    framesContainer.append(framesContainer[0].r[0].tr);
    var frameAdder = $(document.createElement('span')).attr('class', 'glyphicon glyphicon-plus').css('color', 'green');
    frameAdder.hover(function() { $(this).css('cursor', 'pointer');}, function() { $(this).css('cursor', 'default')});
    animPanelBody.append(frameAdder).append(framesContainer);
    frameAdder.after(($(document.createElement('span')).css({'margin-left' : '10px', 'font-style' : 'italic'}).append(document.createTextNode('Add frame(s)'))));
    var frameSelector = $(document.createElement('input'));
    frameSelector.attr({ 'type' : 'file', 'accept' : 'image/*'}).prop({'multiple' : true});
    animPanelBody.append(frameSelector);
    frameAdder.click(function() { frameSelector.click(); });
    frameSelector.hide();
    frameSelector[0].addEventListener('change', function(event)
    {
        var anim = editorMapIdAnim[animId];
        var animFramesLength = anim.frames.length;
        var files = event.target.files;
        $.each(files, function(i)
        {
            var fileReader = new FileReader();
            fileReader.onload = function(event)
            {
                var img = new Image();
                img.onload = function()
                {
                    var newFrame = new EditorSprite(img);
                    newFrame.setPosition(-img.width, -img.height);
                    newFrame.setSize(img.width, img.height);
                    anim.addFrame(i + animFramesLength, newFrame);
                };
                img.src = event.target.result;

                view_AddNewFrame(img);
            };
            fileReader.readAsDataURL(this);
        });
    });

    var view_AddNewFrame = function(imgData)
    {
        var td = $(document.createElement('td'));
        var thumbnailDiv = $(document.createElement('div'));
        var thumbnailA = $(document.createElement('a')).attr('class', 'thumbnail');
        var img = new Image();
        img.src = imgData.src;
        img.height = 100;
        img.width = img.height * imgData.width / imgData.height;
        td.append(thumbnailDiv.append(thumbnailA.append(img)));

        var numRow = framesContainer[0].r.length;
        var row = framesContainer[0].r[numRow - 1];
        if (row.td.length == MAX_COLS)
        {
            row = {'tr': $(document.createElement('tr')).addClass('r' + numRow)[0], 'td': []};
            framesContainer[0].r.push(row);
            framesContainer.append(row.tr);
        }
        row.td.push(td.addClass('c' + row.td.length)[0]);
        $(row.tr).append(td);
        thumbnailDiv.on('contextmenu', function (e)
        {
            e.preventDefault();
            var rowIdx = parseInt($(this).parent().parent().attr('class').split('r')[1]);
            var colIdx = parseInt(td[0].className.split('c')[1]);
            var frameIdx = getArrayIdx(rowIdx, colIdx);
            //console.log(row.tr.className.split('r')[1] + ', ' + td[0].className.split('c')[1] + ' -> ' + frameIdx);
            var rows = framesContainer[0].r;

            var updateColumns = function (i)
            {
                if (i < rowIdx)
                    return;
                if (i == rowIdx)
                {
                    var toDelete = rows[rowIdx].td.splice(colIdx, 1);
                    $(toDelete).remove();
                }
                else if (rows[i] && rows[i].td.length)
                {
                    var elem = rows[i].td.splice(0, 1);
                    $(elem).attr('class', 'c' + MAX_COLS - 1);
                    rows[i - 1].td.push(elem[0]);
                    $(rows[i - 1].tr).append(elem);
                }
                for (var j = 0; j < rows[i].td.length; j++)
                    $(rows[i].td[j]).attr('class', 'c' + j);
                if (rows[i].td.length == 0 && rows.length > 1)
                {
                    var r = rows.splice(i, 1)[0];
                    numRow = rows.length;
                    row = framesContainer[0].r[numRow - 1];
                    $(r.tr).remove();
                }
            };
            for (var i = rowIdx; i < rows.length; i++)
                updateColumns(i);
            editorMapIdAnim[animId].removeFrame(getArrayIdx(rowIdx, colIdx));
        });
    };
    var MAX_COLS = 13;
    var getArrayIdx = function(rowIdx, colIdx) { return rowIdx * MAX_COLS + colIdx; };

    // Defines the attributes of the popup div generated by bootstrap-editable
    $(animPanelHeading).find('span').editable({
        type: 'text',
        title: 'Enter anim id',
        placement: 'right',
        unsavedclass: null
    });

    $(animPanelHeading).find('span').editable('option', 'validate', function (inputString) {
        if (inputString == '')
            return 'This field can\'t be null!';

        inputString = inputString.replace(/[\s\'\"]/g, '_');

        if(checkIdUniqueness(inputString, 'anim') == false)
            return 'Ids must be unique!';

        animId = inputString;
        var oldId = $(this).text().replace(/[\s\'\"]/g, '_');

        view_UpdateDataLists('delete', 'anims', oldId);
        view_UpdateDataLists('add', 'anims', inputString);

        $('input[list="datalist-game-anims"]').each(function()
        {
            if(this.value == oldId)
            {
                this.value = inputString;
                $(this).change();
            }
        });

        for(var itemId in editorMapIdItem)
            for(var animState in editorMapIdItem[itemId].anims)
                if(editorMapIdItem[itemId].anims[animState] == oldId)
                    editorMapIdItem[itemId].anims[animState] = inputString;



        // Deletes from the map the old id/invItem match and adds the new one
        var editorAnimToBeModified = editorMapIdAnim[oldId];
        delete editorMapIdAnim[editorAnimToBeModified.id];

        editorAnimToBeModified.id = inputString;
        editorMapIdAnim[editorAnimToBeModified.id] = editorAnimToBeModified;
        $('#' + $(this).text() + '-panel').attr('id', inputString + '-panel');
        animPanelToggler.attr({ 'href': '#' + inputString + '-panel'});
    });

    // Handle click on an anim's panel header
    $(animPanelHeading).click(function ()
    {
        if ($(this).siblings()[0].className.indexOf('in') == -1)
            $('.in').siblings().find('a').trigger('click');

        var relativeAnimId = $(this).find('span').text().replace(/[\s\'\"]/g, '_');

        var pHeadingAnimActive = $('.panel-heading.anim.active');
        pHeadingAnimActive.css({ 'background': '#f5f5f5', 'color': 'inherit'});
        pHeadingAnimActive.removeClass('active');

        $(this).addClass('active');
        $(this).css({'background-color': '#428bca', 'color': 'white'});
    });

    if(editorMapIdAnim[animId])
        for(var i = 0; i < editorMapIdAnim[animId].frames.length; i++)
        {
            var frame = editorMapIdAnim[animId].frames[i];
            view_AddNewFrame(editorMapIdAnim[animId].frames[i].img);
        }

    view_UpdateDataLists('add', 'anims', animId);
    $('#anims-accordion').append(animPanel);


};

var view_CreateNewDialogPanel = function(dialogId)
{
    var dialogPanel = $(document.createElement('div'));
    var dialogPanelHeading = $(document.createElement('div'));
    var dialogPanelTitle = $(document.createElement('h4'));
    var dialogPanelToggler = $(document.createElement('a'));
    var dialogPanelCollapse = $(document.createElement('div'));
    var dialogPanelBody = $(document.createElement('div'));

    dialogPanelTitle.addClass('panel-title');
    dialogPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(dialogId))));
    dialogPanelTitle.append(dialogPanelToggler);
    dialogPanelHeading.addClass('panel-heading dialog');
    dialogPanelHeading.append(dialogPanelTitle);
    dialogPanelBody.addClass('panel-body');
    dialogPanelCollapse.attr(
        {
            'id': dialogId + '-panel',
            'class': 'panel-collapse collapse'
        }
    );

    dialogPanelCollapse.append(dialogPanelBody);
    dialogPanel.append(dialogPanelHeading);
    dialogPanel.append(dialogPanelCollapse);
    dialogPanel.attr(
        {
            'class': 'panel panel-default dialog'
        }
    );
    dialogPanelToggler.attr(
        {
            'data-toggle': 'collapse',
            'data-parent': '#dialog-accordion',
            'href': '#' + dialogId + '-panel',
            'class': 'glyphicon glyphicon-collapse-down pull-right',
            'style': 'color: inherit; text-decoration: none'
        }
    );
    $('#dialog-accordion').append(dialogPanel);

    var createDialogRow = function(data)
    {
        var row = $(document.createElement('div')).addClass('row dialog-choice').css({'margin-top': '10px', 'margin-left': '0px', 'font-size' : '9.9px'});
        var eraser = $(document.createElement('span')).attr('class', 'glyphicon glyphicon-remove').css('color', 'firebrick');
        eraser.hover(function ()
        {
            $(this).css('cursor', 'pointer');
        }, function ()
        {
            $(this).css('cursor', 'default');
        });
        eraser.click(function ()
        {
            row.remove();
        });
        row.append(eraser);
        row.append($(document.createElement('span')).text('#').css('margin-left', '5px'));
        var inputDialogNumber = $(document.createElement('input')).attr({
            'type': 'number',
            'min' : '1',
            'value' : '1',
            'class': 'dialog-order'}).css({/*'margin-left' : '10px',*/ 'width' : '50px'});
        row.append(inputDialogNumber);
        row.append($(document.createElement('span')).text('Sentence text').css('margin-left', '5px'));
        var inputDialogText = $(document.createElement('input')).attr({'type': 'text', 'class': 'dialog-text'}).css({'margin-left' : '5px', 'width' : '150px'});
        row.append(inputDialogText);
        row.append($(document.createElement('span')).text('Subdialog name').css('margin-left', '5px'));
        var inputDialogNameSub = $(document.createElement('input')).attr({
            'type': 'text',
            'placeholder' : 'root',
            'class': 'dialog-name'}).css({'margin-left' : '5px'});
        row.append(inputDialogNameSub);
        row.append($(document.createElement('span')).text('Hidden').css('margin-left', '5px'));
        var inputDialogHidden = $(document.createElement('input')).attr({
            'type': 'checkbox',
            'class': 'dialog-hidden'}).css({'margin-left' : '5px'});
        row.append(inputDialogHidden);
        row.append($(document.createElement('span')).text('Ends dialog').css('margin-left', '5px'));
        var inputDialogQuit = $(document.createElement('input')).attr({
            'type': 'checkbox',
            'class': 'dialog-end'}).css({'margin-left' : '5px'});
        row.append(inputDialogQuit);

        inputDialogQuit.change(function()
        {
            if(this.checked)
            {

                inputDialogRunSub.prop('disabled', 'disabled').css('background', 'lightgray');
                inputDialogRunSub.prop('disabled', 'disabled').css('background', 'lightgray');
            }
            else
            {
                inputDialogRunSub.prop('disabled', false).css('background', 'white');
                inputDialogRunSub.prop('disabled', false).css('background', 'white');
            }
        });
        row.append($(document.createElement('span')).text('Opens subdialog').css('margin-left', '10px'));
        var inputDialogRunSub = $(document.createElement('input')).attr({
            'type': 'text',
            'placeholder' : 'Enter subdialog name',
            'class': 'dialog-open'}).css({'margin-left' : '10px'});
        row.append(inputDialogRunSub);
        row.append($(document.createElement('span')).text('Triggers script').css('margin-left', '10px'));
        var inputDialogScript = $(document.createElement('input')).attr({
            'list' : 'datalist-game-scripts',
            'placeholder' : 'None',
            'class': 'dialog-script'}).css({'margin-left' : '10px'});
        row.append(inputDialogScript);
        row.append($(document.createElement('span')).text('Show once').css('margin-left', '10px'));
        var inputDialogShowOnce = $(document.createElement('input')).attr({
            'type': 'checkbox',
            'class': 'dialog-showOnce'}).css({'margin-left' : '5px'});
        row.append(inputDialogShowOnce);
        row.append($(document.createElement('span')).text('Choose once').css('margin-left', '10px'));
        var inputDialogChooseOnce = $(document.createElement('input')).attr({
            'type': 'checkbox',
            'class': 'dialog-chooseOnce'}).css({'margin-left' : '5px'});
        row.append(inputDialogChooseOnce);
        inputDialogChooseOnce.change(function()
        {
            if(this.checked === true)
                inputDialogShowOnce[0].checked = false;
        });
        inputDialogShowOnce.change(function()
        {
            if(this.checked === true)
                inputDialogChooseOnce[0].checked = false;
        });
        dialogChoicesContainer.append(row);

        if(data)
        {
            inputDialogNumber[0].value = data.order;
            inputDialogText[0].value = data.sentence;
            inputDialogQuit[0].checked = data.quit;
            inputDialogRunSub[0].value = data.open;
            inputDialogScript[0].value = data.script;
            inputDialogHidden[0].checked = data.hidden;
            inputDialogShowOnce[0].checked = data.showOnce;
            inputDialogChooseOnce[0].checked = data.chooseOnce;
            if(data.branchName !== 'root')
                inputDialogNameSub[0].value = data.branchName;

            inputDialogQuit.change();
        }
    };
    var plus = $(document.createElement('span')).attr('class', 'glyphicon glyphicon-plus').css('color', 'green');
    plus.hover(function() { $(this).css('cursor', 'pointer');}, function() { $(this).css('cursor', 'default')});
    plus.click(function() { createDialogRow(null); });
    dialogPanelBody.append(plus);

    var dialogChoicesContainer = $(document.createElement('div'));
    dialogPanelBody.append(dialogChoicesContainer);

    var dialogSaveButton = $(document.createElement('button')).attr('type', 'button').addClass('btn btn-success').append($(document.createTextNode('Save')));
    dialogPanelBody.append($(document.createElement('div')).append(dialogSaveButton).css('margin-top', '25px'));
    dialogSaveButton.click(function()
    {
        var dialog = new Dialog(dialogId);

        var dialogChoices = dialogChoicesContainer.find('.dialog-choice');

        dialogChoices.each(function(i)
        {
            var data =
            {
                'order' : parseInt($(dialogChoices[i]).find('.dialog-order')[0].value),
                'text' : $(dialogChoices[i]).find('.dialog-text')[0].value,
                'name' : $(dialogChoices[i]).find('.dialog-name')[0].value,
                'quit' : $(dialogChoices[i]).find('.dialog-end')[0].checked,
                'open' : $(dialogChoices[i]).find('.dialog-open')[0].value,
                'script' : $(dialogChoices[i]).find('.dialog-script')[0].value,
                'showOnce' : $(dialogChoices[i]).find('.dialog-showOnce')[0].checked,
                'chooseOnce' : $(dialogChoices[i]).find('.dialog-chooseOnce')[0].checked,
                'hidden' : $(dialogChoices[i]).find('.dialog-hidden')[0].checked,
            };
            var dialogChoice = new DialogChoice(data.text, data.script.length ? data.script : null,
            data.quit, data.open && data.open.length ? data.open : null, data.hidden, data.showOnce, data.chooseOnce);
            dialog.addDialogChoice(data.name, dialogChoice, data.order);
        });

        editorMapIdDialog[dialogId] = dialog;
    });

    var fillDialogPanel = function()
    {
        var dialog = editorMapIdDialog[dialogId];

        for(var key in dialog.subdialogs)
        {
            var sub = dialog.subdialogs[key];
            for(var i = 0; i < sub.length; i++)
            {
                var data = { order : i + 1, branchName : key, hidden : sub[i].hidden, showOnce : sub[i].showOnce,
                    chooseOnce : sub[i].chooseOnce, chosen : sub[i].chosen, sentence : sub[i].sentence,
                    quit : sub[i].quit, open : sub[i].open, script : sub[i].script };
                createDialogRow(data);
            }
        }
    };

    if(editorMapIdDialog[dialogId] == undefined)
        editorMapIdDialog[dialogId] = new Dialog(dialogId);
    else
        fillDialogPanel();

    // Defines the attributes of the popup div generated by bootstrap-editable
    $(dialogPanelHeading).find('span').editable({
        type: 'text',
        title: 'Enter dialog id',
        placement: 'right',
        unsavedclass: null
    });

    $(dialogPanelHeading).find('span').editable('option', 'validate', function (inputString) {
        if (inputString == '')
            return 'This field can\'t be null!';

        inputString = inputString.replace(/[\s\'\"]/g, '_');

        if(checkIdUniqueness(inputString, 'dialog') == false)
            return 'Ids must be unique!';

        dialogId = inputString;
        var oldId = $(this).text().replace(/[\s\'\"]/g, '_');

        //view_EditOptionOccurrences(inputString, $(this).text(), 'character');
        //changeParamNameOccurrences(inputString, oldId);
        view_UpdateDataLists('delete', 'dialogs', oldId);
        view_UpdateDataLists('add', 'dialogs', inputString);

        for(var key in editorScriptList)
            replaceScriptOccurrencies(editorScriptList[key], 'dialog', oldId, dialogId);
        $('input[list="datalist-game-dialogs"]').each(function() { if(this.value == oldId) this.value = inputString});

        // Deletes from the map the old id/invItem match and adds the new one
        var editorDialogToBeModified = editorMapIdDialog[oldId];
        delete editorMapIdDialog[editorDialogToBeModified.id];

        editorDialogToBeModified.id = inputString;
        editorMapIdDialog[editorDialogToBeModified.id] = editorDialogToBeModified;
        $('#' + $(this).text() + '-panel').attr('id', inputString + '-panel');
        dialogPanelToggler.attr({ 'href': '#' + inputString + '-panel'});
    });


    // Handle click on a dialog panel's header
    $(dialogPanelHeading).click(function () {
        if($(this).siblings()[0].className.indexOf('in') == -1)
            $('.in').siblings().find('a').trigger('click');

        //var relativeInvItemId = $(this).find('span').text().replace(/[\s\'\"]/g, '_');
        //editorCurrentInvItem = editorMapIdCharacter[relativeCharacterId];

        var pHeadingDialogActive = $('.panel-heading.dialog.active');
        pHeadingDialogActive.css({ 'background': '#f5f5f5', 'color': 'inherit'});
        pHeadingDialogActive.removeClass('active');

        $(this).addClass('active');
        $(this).css({'background-color': '#428bca', 'color': 'white'});

        //$(this).parent().find(':input[type="text"]').filter('.character')[0].value = editorMapIdInvItem[relativeInvItemId].description;
        //if(editorMapIdInvItem[editorMapIdCharacter[relativeCharacterId].locationId] != undefined)
        //    $(this).parent().find('.room-selector')[0].value = editorMapIdCharacter[relativeCharacterId].locationId;
    });

    view_UpdateDataLists('add', 'dialogs', dialogId);
};

var view_CreateNewInvItemPanel = function(invItemId)
{
    var invItemPanel = $(document.createElement('div'));
    var invItemPanelHeading = $(document.createElement('div'));
    var invItemPanelTitle = $(document.createElement('h4'));
    var invItemPanelToggler = $(document.createElement('a'));
    var invItemPanelCollapse = $(document.createElement('div'));
    var invItemPanelBody = $(document.createElement('div'));
    var col1 = $(document.createElement('div')).addClass('col-md-5');

    invItemPanelTitle.addClass('panel-title');
    invItemPanelTitle.append($(document.createElement('span')).append($(document.createTextNode(invItemId))));
    invItemPanelTitle.append(invItemPanelToggler);
    invItemPanelHeading.addClass('panel-heading inventory');
    invItemPanelHeading.append(invItemPanelTitle);
    invItemPanelBody.addClass('panel-body');
    invItemPanelCollapse.attr(
        {
            'id': invItemId + '-panel',
            'class': 'panel-collapse collapse'
        }
    );

    invItemPanelCollapse.append(invItemPanelBody);
    invItemPanel.append(invItemPanelHeading);
    invItemPanel.append(invItemPanelCollapse);
    invItemPanel.attr(
        {
            'class': 'panel panel-default inventory'
        }
    );
    invItemPanelToggler.attr(
        {
            'data-toggle': 'collapse',
            'data-parent': '#inventory-accordion',
            'href': '#' + invItemId + '-panel',
            'class': 'glyphicon glyphicon-collapse-down pull-right',
            'style': 'color: inherit; text-decoration: none'
        }
    );
    $('#inventory-accordion').append(invItemPanel);

    /*======================================================= InvItem description input ===========================================================*/
    var invItemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    var invItemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Description')));
    var invItemInput = $(document.createElement('input')).attr({'type': 'text', 'class': 'form-control inventory' });
    invItemInput.change(function() { editorMapIdInvItem[invItemId].description = this.value; });
    invItemInput[0].value = editorMapIdInvItem[invItemId].description;
    invItemPanelBody.append($(document.createElement('div')).addClass('row').append(col1));
    col1.append((invItemInputGroup.append(invItemInputLabel).append(invItemInput)));

    /*======================================================= InvItem anim input ============================================================*/

    invItemInputGroup = $(document.createElement('div')).addClass('input-group input-group-sm');
    invItemInputLabel = $(document.createElement('span')).addClass('input-group-addon').append($(document.createTextNode('Anim')));
    invItemInput = $(document.createElement('input')).attr('list', 'datalist-game-anims').addClass('form-control inventory anim-default');
    col1.append((invItemInputGroup.append(invItemInputLabel).append(invItemInput)));
    invItemInput[0].panelTitle = invItemPanelTitle.find('span')[0];
    var thumbnailDiv = $(document.createElement('div'));
    var thumbnailA = $(document.createElement('a')).addClass('thumbnail');
    var thumbnail = new Image();
    thumbnailA.append(thumbnail);
    thumbnailDiv.append(thumbnailA);
    var col2 = $(document.createElement('div')).addClass('row').append($(document.createElement('div')).addClass('col-md-1').append(thumbnailDiv));
    invItemPanelBody.append(col2);
    thumbnailDiv.hide();

    var view_addThumbnail = function(sprite)
    {
        thumbnail.src = sprite.img.src;
        //thumbnail.height = thumbnail.height * 100 / thumbnail.width;
        //thumbnail.width = 100;
        thumbnailDiv.show();
        $(thumbnail).on('dragstart', function(event)
        {
            event.originalEvent.dataTransfer.setDragImage(thumbnail, 0, 0);
        });
        /*if(editorCurrentRoom.zOrderMap[editorCurrentItem.layer] == undefined)
         editorCurrentRoom.zOrderMap[editorCurrentItem.layer] = [];
         editorCurrentRoom.zOrderMap[editorCurrentItem.layer].push(editorCurrentItem.id);*/

    };

    invItemInput.on('change', function()
    {
        var animId = invItemInput[0].value;
        if (!animId.length) {
            editorMapIdInvItem[invItemId].anims = null;
            thumbnailDiv.hide();
            return;
        }
        editorMapIdInvItem[invItemId].anim = animId;
        var anim = editorMapIdAnim[animId];
         if(!anim)
         return;
        view_addThumbnail(anim.frames[anim.start_idx]);
    });

    invItemInput[0].value = editorMapIdInvItem[invItemId].anim;
    invItemInput.change();

    // Defines the attributes of the popup div generated by bootstrap-editable
    $(invItemPanelHeading).find('span').editable({
        type: 'text',
        title: 'Enter character id',
        placement: 'right',
        unsavedclass: null
    });

    $(invItemPanelHeading).find('span').editable('option', 'validate', function (inputString) {
        if (inputString == '')
            return 'This field can\'t be null!';

        inputString = inputString.replace(/[\s\'\"]/g, '_');

        if(checkIdUniqueness(inputString, 'inventory-item') == false)
            return 'Ids must be unique!';

        invItemId = inputString;
        var oldId = $(this).text().replace(/[\s\'\"]/g, '_');

        //view_EditOptionOccurrences(inputString, $(this).text(), 'character');
        //changeParamNameOccurrences(inputString, oldId);
        view_UpdateDataLists('delete', 'items', oldId);
        view_UpdateDataLists('add', 'items', inputString);

        for(var key in editorScriptList)
            replaceScriptOccurrencies(editorScriptList[key], 'inventoryItem', oldId, invItemId);

        $('input[list="datalist-game-inventory-items"]').each(function() { if(this.value == oldId) this.value = inputString});

        // Deletes from the map the old id/invItem match and adds the new one
        var editorInvItemToBeModified = editorMapIdInvItem[oldId];
        delete editorMapIdInvItem[editorInvItemToBeModified.id];

        editorInvItemToBeModified.id = inputString;
        editorMapIdInvItem[editorInvItemToBeModified.id] = editorInvItemToBeModified;
        $('#' + $(this).text() + '-panel').attr('id', inputString + '-panel');
        invItemPanelToggler.attr({ 'href': '#' + inputString + '-panel'});
    });


    // Handle click on a character panel's header
    $(invItemPanelHeading).click(function () {
        if($(this).siblings()[0].className.indexOf('in') == -1)
            $('.in').siblings().find('a').trigger('click');

        //var relativeInvItemId = $(this).find('span').text().replace(/[\s\'\"]/g, '_');
        //editorCurrentInvItem = editorMapIdCharacter[relativeCharacterId];

        var pHeadingInvActive = $('.panel-heading.inventory.active');
        pHeadingInvActive.css({ 'background': '#f5f5f5', 'color': 'inherit'});
        pHeadingInvActive.removeClass('active');

        $(this).addClass('active');
        $(this).css({'background-color': '#428bca', 'color': 'white'});

        //$(this).parent().find(':input[type="text"]').filter('.character')[0].value = editorMapIdInvItem[relativeInvItemId].description;
        //if(editorMapIdInvItem[editorMapIdCharacter[relativeCharacterId].locationId] != undefined)
        //    $(this).parent().find('.room-selector')[0].value = editorMapIdCharacter[relativeCharacterId].locationId;
    });


    view_UpdateDataLists('add', 'items', invItemId);
};

var view_ScriptTreeAddNode = function(parent, data)
{
    var newNode = editorScriptTree.get_node(editorScriptTree.create_node(parent, JSON.parse(JSON.stringify({'text' : data.text})), 'last'));
    editorScriptTree.open_node(parent);
    newNode.type = data.type;
    newNode.data = { DOM : []};
    var icon;
    switch(newNode.type)
    {
        case 'game-controllers':
            icon = 'glyphicon glyphicon-exclamation-sign';
            newNode.original.max_children = Infinity;
            break;
        case 'game-side-effects':
            icon = 'glyphicon glyphicon-leaf';
            newNode.original.max_children = 0;
            break;
        default :
            break;
    }
    editorScriptTree.set_icon(newNode, icon);
    switch(newNode.text.toLowerCase())
    {
        case 'setdirection':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'items');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            newNode.data.DOM[1] = view_CreateInputList(newNode.id + '-param-2', 'directions');
            $(newNode.data.DOM[1]).attr('class', 'param-2');
        break;
        case 'walktopos':
        case 'setposition':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'items');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            newNode.data.DOM[1] = view_CreateInputNumber(newNode.id + '-param-2', 'xPos');
            $(newNode.data.DOM[1]).attr('class', 'param-2');
            newNode.data.DOM[2] = view_CreateInputNumber(newNode.id + '-param-3', 'yPos');
            $(newNode.data.DOM[2]).attr('class', 'param-3');
            break;
        case 'walktoobj':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'items');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            newNode.data.DOM[1] = view_CreateInputList(newNode.id + '-param-2', 'items');
            $(newNode.data.DOM[1]).attr('class', 'param-2');
        break;
        case 'setroom':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'rooms');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
        break;
        case 'show':
        case 'hide':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'items');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            break;
        case 'sayline':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'items');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            newNode.data.DOM[1] = view_CreateInputText(newNode.id + '-param-2', 'Sentence');
            $(newNode.data.DOM[1]).attr('class', 'param-2');
            break;
        case 'inventoryadd':
        case 'inventoryremove':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'items');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            break;
        case 'if':
            newNode.data.DOM[0] = view_CreateInputText(newNode.id + '-param-1', 'Condition');
            $(newNode.data.DOM[0]).addClass('param-1 condition');
            $(newNode.data.DOM[0]).on('input', function()
            {
                if(new Parser().parse(this.value).valid == false)
                    $(this).css('color', 'red');
                else $(this).css('color', 'black');
            }).css('width', '200px');
            break;
        case 'fireevent':
        case 'waitevent':
            newNode.data.DOM[0] = view_CreateInputText(newNode.id + '-param-1', 'Event name');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            break;
        /*case 'parallel':
            //newNode.data.DOM[0] = view_CreateSelector(newNode.id + 'aggregator', ['SortedSequence', 'Parallel']);
            //$(newNode.data.DOM[0]).attr('class', 'param-1');
            break;*/
        case 'varset':
            newNode.data.DOM[0] = view_CreateInputText(newNode.id + '-param-1', 'Variable');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            newNode.data.DOM[1] = view_CreateInputText(newNode.id + '-param-2', 'Value');
            $(newNode.data.DOM[1]).attr('class', 'param-2');
            break;
        case 'varincr':
            newNode.data.DOM[0] = view_CreateInputText(newNode.id + '-param-1', 'Variable');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            newNode.data.DOM[1] = view_CreateInputNumber(newNode.id + '-param-2', 'Amount');
            $(newNode.data.DOM[1]).attr('class', 'param-2');
            break;
        case 'setstate':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'items');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
            newNode.data.DOM[1] = view_CreateInputText(newNode.id + '-param-2', 'Value');
            $(newNode.data.DOM[1]).attr('class', 'param-2');
        break;
        case 'delay':
            newNode.data.DOM[0] = view_CreateInputNumber(newNode.id + '-param-1', 'millisecs');
            $(newNode.data.DOM[0]).attr({'class' : 'param-1', 'min' : '0', 'value' : '0'});
        break;
        case 'opendialog':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'dialogs');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
        break;
        case 'playaudio':
            newNode.data.DOM[0] = view_CreateInputList(newNode.id + '-param-1', 'audio');
            $(newNode.data.DOM[0]).attr('class', 'param-1');
        break;
        default:
        break;
    }
    view_AppendAdditionalTreeDOMNodes(editorScriptTree.get_node(newNode.id));
    if(data.params)
        view_PopulateTreeNodeDOM(newNode.data.DOM, data.params);
    return newNode.id;
};

var view_ParseConditionalInputs = function()
{
    $('.condition').on('input', (function()
        {
            if (new Parser().parse(this.value).valid == false)
                $(this).css('color', 'red');
            else $(this).css('color', 'black');
        }
    ));
};

var view_CreateSelector = function(id, options)
{
    var input =  $(document.createElement('select')).attr('id', id);
    for(var i = 0; i < options.length; i++)
        input.append($(document.createElement('option')).text(options[i]));
    //return input.css('border-radius', '10px')[0];
    return input[0];
};

var view_CreateInputList = function(id, type)
{
    var input = $(document.createElement('input')).attr('id', id);
    switch(type)
    {
        case 'items': input.attr('list', 'datalist-game-items');
        break;
        case 'rooms': input.attr('list', 'datalist-game-rooms');
        break;
        case 'inventory-items': input.attr('list', 'datalist-game-inventory-items');
        break;
        case 'directions': input.attr('list', 'datalist-game-directions');
        break;
        case 'dialogs': input.attr('list', 'datalist-game-dialogs');
        break;
        case 'audio': input.attr('list', 'datalist-game-audio');
        break;
    }

    //return input.css('border-radius', '10px')[0];
    return input[0];
};

var view_CreateInputNumber = function(id, placeholder)
{
    //return $(document.createElement('input')).attr({'id' : id, 'type' : 'number', 'placeholder' : placeholder}).css('border-radius', '10px')[0];
    return $(document.createElement('input')).attr({'id' : id, 'type' : 'number', 'placeholder' : placeholder})[0];
};

var view_CreateInputText = function(id, placeholder)
{
    //return $(document.createElement('input')).attr({ 'id' : id, 'type' : 'text', 'placeholder' : placeholder }).css('border-radius', '10px')[0];
    return $(document.createElement('input')).attr({ 'id' : id, 'type' : 'text', 'placeholder' : placeholder })[0];
};

var view_PopulateTreeNodeDOM = function(DOM, params)
{
    for(var i = 0; i < params.length; i++)
        DOM[i].value = params[i];
};

var view_PopulateTuple = function(type, tuple, params)
{
    var DOM = tuple.find('.col').not('div');
    /*for(var i = 0; i < DOM.length; i++)
        DOM[i] = DOM[i][0];
*/
    switch(type)
    {
        case 'user-trigger':
            DOM[0].value = params[0];
            $(DOM[0]).select2();
            DOM[1].value = params[1];
            $(DOM[1]).select2();
            DOM[2].checked = params[2];
            DOM[3].value = params[3];
            $(DOM[3]).attr('disabled', params[2] ? false : 'disabled');
            $(DOM[3]).select2();
            DOM[4].value = params[4];
            //;
            //$(DOM[4]).attr('disabled', params[2] ? false : 'disabled');
        break;
        case 'event-trigger':
            DOM[0].value = params[0];
        break;
        case 'enter-room-trigger':
        case 'exit-room-trigger':
            DOM[0].value = params[0];
            $(DOM[0]).select2();
        break;
        case 'timer-trigger':
            DOM[0].value = params[0];
            DOM[1].checked = params[1];
        break;
    }
};

var view_CreateStateAnimCouple = function(item, couple)
{
    var row = $(document.createElement('div')).addClass('row obj-state-anim').css({'margin-top' : '10px', 'margin-left' : '10px'});
    var eraser = $(document.createElement('span')).attr('class', 'glyphicon glyphicon-remove').css('color', 'firebrick');
    eraser.hover(function() { $(this).css('cursor', 'pointer');}, function() {$(this).css('cursor', 'default');});
    eraser.click(function()
    {
        row.remove();
        delete item.customAnims[stateInput[0].value];
    });
    row.append(eraser);
    var stateInput = $(document.createElement('input')).attr({'type' : 'text', 'placeholder' : 'Enter state name'}).addClass('obj-state').css('margin-left', '10px');
    row.append(stateInput);
    var animInput = $(document.createElement('input')).attr({'list' : 'datalist-game-anims', 'placeholder' : 'Select Anim'});
    row.append(animInput);

    /*/////////////////////////////// If loading a project, couple param is not null /////////////////////*/
    if(couple)
    {
        stateInput[0].value = couple.key;
        animInput[0].value = couple.val;
        stateInput[0].oldState = couple.key;
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Manage item state
    stateInput.on('input', function()
    {
        if(stateInput[0].value in item.customAnims && stateInput[0].oldState != stateInput[0].value)
            $(this).css('color', 'red'); else $(this).css('color', 'black');
    });
    stateInput.change(function()
    {
        var state = stateInput[0].value;
        if(!state.length || state in item.customAnims)
            return;
        var oldState = stateInput[0].oldState;
        if(oldState)
            delete item.customAnims[stateInput[0].oldState];
        item.customAnims[state] = animInput[0].value.length ? animInput[0].value : null;
        stateInput[0].oldState = state;
    });

    // Manage item anim
    animInput.change(function() {
        var state = stateInput[0].value;
        if(state.length)
            item.customAnims[state] = animInput[0].value;
    });

    return row;
};

var view_AddGameVariable = function(varData)
{
    var row = $(document.createElement('div')).addClass('row game-var').css({'margin-top' : '10px', 'margin-left' : '10px'});
    var eraser = $(document.createElement('span')).attr('class', 'glyphicon glyphicon-remove').css('color', 'firebrick');
    eraser.hover(function() { $(this).css('cursor', 'pointer');}, function() {$(this).css('cursor', 'default');});
    eraser.click(function() {
        row.remove();});
    row.append(eraser);
    row.append($(document.createElement('span')).text('Variable name').css('margin-left', '10px'));
    var inputVarName = $(document.createElement('input')).attr({'type' : 'text', 'class' : 'var-name'}).css('margin-left', '10px');
    row.append(inputVarName);
    row.append($(document.createElement('span')).text('Variable type').css('margin-left', '10px'));
    var select = $(view_CreateSelector(null, ['Boolean', 'Numeric', 'String'])).addClass('var-type').css('margin-left', '10px');
    row.append(select);
    var associatedSelector = $(view_CreateSelector(null, ['true', 'false'])).addClass('var-value').css('margin-left', '10px');
    row.append(associatedSelector);
    select.change(function(e)
    {
        associatedSelector.remove();
        switch(this.value)
        {
            case 'Boolean':
                associatedSelector = $(view_CreateSelector(null, ['true', 'false']));
            break;
            case 'Numeric':
                associatedSelector = $(document.createElement('input')).attr({'type' : 'number', 'value' : 0});
            break;
            case 'String':
                associatedSelector = $(document.createElement('input')).attr('type', 'text');
            break;
            default: return;
        }

        associatedSelector.addClass('var-value').css('margin-left', '10px');
        row.append(associatedSelector);
        e.stopPropagation();
    });
    $('#game-vars-container').append(row);
    if(varData)
    {
        if(varData.hasOwnProperty('originalEvent'))
            return;
        inputVarName[0].value = varData.name;
        select[0].value = varData.type;
        select.trigger('change');
        associatedSelector[0].value = varData.value;
    }
};

var view_ClearGameVariables = function()
{
    $('.game-var').remove();
};

var view_SaveGameVariables = function()
{
    $('.game-var').each(function() { view_SaveGameVariable($(this));});
};

var view_SaveGameVariable = function(varRow)
{
    var varName = varRow.find('input[class="var-name"]')[0].value;
    var varType = varRow.find('select[class="var-type"]')[0].value;
    var varValue;
    switch(varType)
    {
        case 'Boolean':
            varValue = varRow.find('select[class="var-value"]')[0].value;
            varValue = varValue == 'true';
        break;
        case 'Numeric':
            varValue = parseFloat(varRow.find('input[class="var-value"]')[0].value);
        break;
        case 'String':
            varValue = varRow.find('input[class="var-value"]')[0].value;
        break;
        default:
            throw 'Error: invalid variable type.';
            return;
    }

    addGameVar(varName, varValue);
};

var view_LoadGameVariables = function()
{
    for(var key in editorGameVars)
    {
        var type;
        switch(typeof editorGameVars[key])
        {
            case 'boolean': type = 'Boolean';
            break;
            case 'number': type = 'Numeric';
            break;
            case 'string': type = 'String';
            break;
            default:
                throw 'Error: variable ' + key + 'has invalid type.';
                return;
        }
        view_AddGameVariable({name : key, type : type, value : editorGameVars[key]});
    }
};

var alertMessage = function(element, string, type)
{
    var alert = $(document.createElement('div')).addClass('alert alert-' + type + ' alert-dismissable');
    var alertButton = $(document.createElement('button')).attr(
        {
            'type' : 'button',
            'class' : 'close',
            'data-dismiss' : 'alert',
            'aria-hidden' : 'true'
        });
    alertButton.append('&times;');
    alert.append(alertButton);
    alert.append($(document.createElement('strong')).append($(document.createTextNode(string))));
    element.append(alert);
};

var view_AddNewSound = function(audioData, id)
{
    editorMapIdAudio[id].audioData = audioData;
    //var rowContainer = $(document.createElement('div')).css('margin-left', '10px');
    var row = $(document.createElement('div')).addClass('row tuple ' + 'audio').css({'margin-top' : '10px', 'margin-left' : 'inherit'});
    var eraser = $(document.createElement('span')).attr('class', 'glyphicon glyphicon-remove').css({'color' : 'firebrick', 'float' : 'left'});
    eraser.hover(function() { $(this).css('cursor', 'pointer');}, function() {$(this).css('cursor', 'default');});
    eraser.click(function() { row.remove();});
    row.append(eraser);
    var idContainer = $(document.createElement('div')).css({'width' : '400px', 'float' : 'left'});
    var span = $(document.createElement('span')).text('Filename: ').css('margin-left', '10px');
    idContainer.append(span);
    span = $(document.createElement('span')).append($(document.createElement('i')).append($(document.createElement('b')).text(id)));
    idContainer.append(span);
    row.append(idContainer);
    var audioDiv = $(document.createElement('audio')).prop('controls', true).css({'float' : 'left', 'vertical-align' : 'middle', 'margin-left' : '10px'});
    var source = $(document.createElement('source')).attr({'src' : audioData, 'type' : 'audio/mpeg'});
    audioDiv.append(source);
    row.append(audioDiv);
    $('#audio-container').append(row);

    view_UpdateDataLists('add', 'audio', id);
};

var view_DeleteEntity = function(type, id)
{
    $('#' + id + '-panel').parent().remove();
    view_UpdateDataLists('delete', type, id);
    switch (type)
    {
        case 'room':
            deleteEditorRoom(id);
            break;
        case 'items':
            deleteEditorItem(id);
            break;
        case 'character':
            deleteEditorCharacter(id);
            break;
        case 'anim':
            deleteEditorAnim(id);
            break;
        case 'invItem':
            deleteInvItem(id);
            break;
        case 'audio':
            deleteAudioContent(id);
            break;
        case 'dialog':
            deleteDialog(id);
            break;
        case 'walkboxes':
            deleteWalkbox(editorCurrentRoom.id, id);
            break;
    }
};

// TODO: ADD ANIM PLAYER TO ANIM SECTION
