var resolution = { width : 1024, height : 768 };

var newProject = function()
{
    $('#room-accordion').empty();
    for(var room in editorMapIdRoom)
    {
        deleteEditorRoom(room);
        view_UpdateDataLists('delete', 'rooms', room);
        editorRoomsCount = 0;
        editorItemsCount = 0;
    }
    $('#character-accordion').empty();
    for(var character in editorMapIdCharacter)
    {
        deleteEditorCharacter(character);
    }
    $('#anims-accordion').empty();
    for(var anim in editorMapIdAnim)
    {
        deleteEditorAnim(anim);
        view_UpdateDataLists('delete', 'anims', anim);
    }
    $('#inventory-accordion').empty();
    for(var invItem in editorMapIdInvItem)
    {
        deleteInvItem(invItem);
        view_UpdateDataLists('delete', 'inventory-items', invItem);
        editorInvItemCount = 0;
    }
    $('#dialog-accordion').empty();
    for(var dialog in editorMapIdDialog)
    {
        deleteDialog(dialog);
        view_UpdateDataLists('delete', 'dialogs', dialog);
        editorDialogsCount = 0;
    }
    $('#audio-container').empty();
    for(var audio in editorMapIdAudio)
    {
        deleteAudioContent(audio)
        view_UpdateDataLists('delete', 'audio', audio);
    }
    for(var script in editorScriptList)
    {
        view_UpdateDataLists('delete', 'scripts', script);
    }
    editorScriptList = {};
};

var saveProject = function()
{
    var backupRooms = owl.deepCopy(editorRoomsList);
    var backupCharacters = owl.deepCopy(editorCharactersList);
    var backupAnims = owl.deepCopy(editorAnimsList);

    for(var i in backupRooms)
    {
        eliminateCycles(backupRooms[i], 'room');
        delete backupRooms[i].zOrderMap;
    }
    for(var i = 0; i < backupAnims.length; i++)
        eliminateCycles(backupAnims[i], 'anim');

    view_SaveGameVariables();
    var project = { resolution : JSON.stringify(resolution), rooms : JSON.stringify(backupRooms), actions: JSON.stringify(editorActionsList), characters: JSON.stringify(backupCharacters), scripts: JSON.stringify(editorScriptList), vars : JSON.stringify(editorGameVars), anims: JSON.stringify(backupAnims), inv_items : JSON.stringify(editorInvItemList), dialogs : JSON.stringify(editorMapIdDialog), audio : JSON.stringify(editorMapIdAudio) };
    download('project.json', JSON.stringify(project));
};

var loadProject = function(event)
{
    newProject();
    var fileReader = new FileReader();
    fileReader.onload = function(event)
    {
        var s = event.target.result;
        var project = JSON.parse(s);
        if(project.resolution)
            resolution = JSON.parse(project.resolution);
        editorRoomsList = JSON.parse(project.rooms);
        editorMapIdRoom = {};
        editorMapIdItem = {};
        editorCurrentRoom = null;
        editorCurrentItem = null;
        editorRoomsCount = 0;
        editorItemsCount = 0;
        editorInvItemList = JSON.parse(project.inv_items);
        editorInvItemCount = 0;
        editorCharactersList = JSON.parse(project.characters);
        editorMapIdCharacter = {};
        editorAnimsList = JSON.parse(project.anims);
        editorMapIdAnim = {};
        editorAnimsCount = 0;
        editorScriptList = JSON.parse(project.scripts);
        if(project.dialogs)
            editorMapIdDialog = JSON.parse(project.dialogs);
        if(project.audio)
            editorMapIdAudio = JSON.parse(project.audio);

        if(project.vars) editorGameVars = JSON.parse(project.vars);
        view_ClearRoomPanels();

        for(var i = 0; i < editorAnimsList.length; i++)
        {
            editorAnimsList[i].addFrame = addAnimFrame;
            editorAnimsList[i].removeFrame = removeAnimFrame;
            editorAnimsList[i].incrCurrIdx = incrCurrFrame;
            editorAnimsList[i].play = startRollingFrames;
            editorAnimsList[i].stop = stopRollingFrames;

            for(var j = 0; j < editorAnimsList[i].frames.length; j++)
            {
                var frame = editorAnimsList[i].frames[j];
                if(frame)
                {
                    var img = new Image();
                    img.src = frame.img;
                    //var newFrame = new EditorSprite(img);
                    //newFrame.setPosition(frame.boundingBox[1], frame.boundingBox[2]);
                    //newFrame.setSize(frame.boundingBox[3], frame.boundingBox[4]);
                    //editorAnimsList[i].frames[j] = newFrame;
                    editorAnimsList[i].frames[j] = {img: img};
                }
            }
            editorMapIdAnim[editorAnimsList[i].id] = editorAnimsList[i];
            view_CreateNewAnimPanel(editorAnimsList[i].id);
            editorAnimsCount++;
        }

        for(var i = 0; i < editorCharactersList.length; i++)
        {
            var currentCharacter = editorCharactersList[i];
            currentCharacter.getCurrentFrame = getItemCurrentFrame;
            currentCharacter.setLayer = setItemLayer;
            for(var j in currentCharacter.sprites)
            for(var k in currentCharacter.sprites[j])
            {
                var src = currentCharacter.sprites[j][k].img;
                var img = new Image();
                img.src = src;
                //var sprite = new EditorSprite(img);
                //sprite.setPosition(currentCharacter.sprites[j][k].boundingBox[1], currentCharacter.sprites[j][k].boundingBox[2]);
                //sprite.setSize(currentCharacter.sprites[j][k].boundingBox[3], currentCharacter.sprites[j][k].boundingBox[4]);
                //currentCharacter.sprites[j][k] = sprite;
                currentCharacter.sprites[j][k] = {img: img};
            };

            var hotspot = currentCharacter.hotspot;

            if(hotspot != null)
            {
                var hotspotCopy = new Polygon();
                for (var k = 0; k < hotspot.points.length; k++)
                    hotspotCopy.points[k] = new paper.Point(hotspot.points[k][1], hotspot.points[k][2]);
                if(hotspot.closed)
                    hotspotCopy.close();
                editorCharactersList[i].hotspot = hotspotCopy;
            }
            editorMapIdCharacter[editorCharactersList[i].id] = editorCharactersList[i];
            view_CreateNewCharacterPanel(editorCharactersList[i].id);
        }

        for(var i in editorRoomsList)
        {
            editorRoomsList[i].setId = setId;
            editorRoomsList[i].zOrderMap = {};
            if(editorRoomsList[i].walkBehinds == undefined) // Project backward compatibility
                editorRoomsList[i].walkBehinds = [];
            editorMapIdRoom[editorRoomsList[i].id] = editorRoomsList[i];
            editorRoomsCount++;

            view_CreateNewRoomPanel(editorRoomsList[i].id);

            if(editorRoomsList[i].walkablePath != null)
            {
                var path = editorRoomsList[i].walkablePath;
                var pathCopy = new Polygon();

                for(var j = 0; j < path.points.length; j++)
                    pathCopy.points[j] =  new paper.Point(path.points[j][1], path.points[j][2]);
                if(path.closed)
                    pathCopy.close();

                if(path.holes.length)
                {
                    var holesCopy = [];

                    for(var j = 0; j < path.holes.length; j++)
                    {
                        var hole = path.holes[j];
                        var newHole = new Polygon();

                        for(var k = 0; k < hole.points.length; k++)
                        {
                            newHole.points[k] = new paper.Point(hole.points[k][1], hole.points[k][2]);
                        }
                        holesCopy[j] = newHole;
                        if(hole.closed)
                            newHole.close();
                    }

                    pathCopy.holes = holesCopy;
                }
                editorRoomsList[i].walkablePath = pathCopy;
            }
            var bg = editorRoomsList[i].items[0];
            if(bg)
            {
                var src = bg.img;
                var img = new Image();
                img.src = src;
                editorRoomsList[i].items[0] = {img : img, boundingBox : new paper.Rectangle(bg.boundingBox[1], bg.boundingBox[2], bg.boundingBox[3], bg.boundingBox[4])};
            }
            for(var j = 1; j < editorRoomsList[i].items.length; j++)
            {
                editorRoomsList[i].items[j].setLayer = setItemLayer;
                editorRoomsList[i].items[j].getCurrentFrame = getItemCurrentFrame;
                for(var key in editorRoomsList[i].items[j].defaultAnims)

                //if(animsDefined)
                //{
                    if (editorRoomsList[i].zOrderMap[editorRoomsList[i].items[j].layer] == undefined)
                        editorRoomsList[i].zOrderMap[editorRoomsList[i].items[j].layer] = [];
                    editorRoomsList[i].zOrderMap[editorRoomsList[i].items[j].layer].push(editorRoomsList[i].items[j].id);
                //}
                editorMapIdItem[editorRoomsList[i].items[j].id] = editorRoomsList[i].items[j];
                view_CreateEditorItemPanel(editorRoomsList[i].items[j].id, editorRoomsList[i].id);
                editorItemsCount++;

                var hotspot = editorRoomsList[i].items[j].hotspot;

                if(hotspot != null)
                {
                    var hotspotCopy = new Polygon();
                    for (var k = 0; k < hotspot.points.length; k++)
                        hotspotCopy.points[k] = new paper.Point(hotspot.points[k][1], hotspot.points[k][2]);
                    if(hotspot.closed)
                        hotspotCopy.close();
                    editorRoomsList[i].items[j].hotspot = hotspotCopy;
                }
            }
            for(var j = 0; j < editorRoomsList[i].walkBehinds.length; j++)
            {
                var wb = editorRoomsList[i].walkBehinds[j];
                editorMapIdWb[wb.id] = wb;
                for(var k = 0; k < wb.poly.points.length; k++)
                    wb.poly.points[k] = new paper.Point(wb.poly.points[k][1], wb.poly.points[k][2]);
                view_CreateEditorWBPanel(wb.id, editorRoomsList[i].id);
                editorWbCount++;
            }
            for(var j in editorRoomsList[i].walkBoxes)
            {
                var wbox = editorRoomsList[i].walkBoxes[j];
                var polyCopy = new Polygon();
                for(var k = 0; k < wbox.polygon.points.length; k++)
                    polyCopy.points[k] = new paper.Point(wbox.polygon.points[k][1], wbox.polygon.points[k][2]);
                if(wbox.polygon.closed)
                    polyCopy.close();
                /*for(var k = 0; k < wbox.polygon.edges.length; k++)
                {
                    polyCopy.edges[k] = [ new paper.Point(wbox.polygon.edges[k][0][1], wbox.polygon.edges[k][0][2]),
                                          new paper.Point(wbox.polygon.edges[k][1][1], wbox.polygon.edges[k][1][2])];
                }*/
                editorRoomsList[i].walkBoxes[j].polygon = polyCopy;
                view_CreateEditorWalkBoxPanel(wbox.id, editorRoomsList[i].id);
                //editorWbCount++;
            }
        }

        for(var i = 0; i < editorInvItemList.length; i++)
        {
            editorMapIdInvItem[editorInvItemList[i].id] = editorInvItemList[i];
            view_CreateNewInvItemPanel(editorInvItemList[i].id);
            editorInvItemCount++;
        }

        for(var key in editorScriptList)
        {
            //$('#datalist-game-scripts').append($(document.createElement('option')).append(key));
            view_UpdateDataLists('add', 'scripts', key);
        }

        for(var key in editorMapIdDialog)
        {
            var d = new Dialog();
            d.copy(editorMapIdDialog[key]);
            editorMapIdDialog[key] = d;
            editorDialogsCount++;
            view_CreateNewDialogPanel(d.id);
        }

        view_LoadGameVariables();

        $('#game-resolution')[0].value = resolution.width + 'x' + resolution.height;
        $('#game-resolution').change();

        for(var key in editorMapIdAudio)
        {
            view_AddNewSound(editorMapIdAudio[key].audioData, editorMapIdAudio[key].id);
        }
    };

    fileReader.readAsText(event.target.files[0]);
};

var eliminateCycles = function(data, dataType)
{
    switch(dataType)
    {
        case 'room':
            if(data.items[0] != null)
                data.items[0].img = data.items[0].img.src;
            break;
        case 'character':
            if(data.sprite != null)
                data.sprite.img = data.sprite.img.src;
            for(var i in data.sprites)
                for(var j in data.sprites[i])
                    if(data.sprites[i][j])
                        data.sprites[i][j].img = data.sprites[i][j].img.src;
                    else  delete  data.sprites[i][j];
            break;
        case 'anim':
            for(var i = 0; i < data.frames.length; i++)
                if(data.frames[i])
                    data.frames[i].img = data.frames[i].img.src;
        break;
    }
};

var download = function (filename, text)
{
    var blob = new Blob([text], {type : 'text/html'});
    var pom = document.createElement('a');
    //pom.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('href', URL.createObjectURL(blob));
    pom.setAttribute('download', filename);
    pom.click();
};