var setPosition = function(itemId, roomId, xPos, yPos)
{
    var oldX = null, oldY = null;
    var item = testMapIdItem[itemId];
    var sprite = item.getCurrentFrame();

    if(sprite != null)
    {
        oldX = item.position.x;
        oldY = item.position.y;

        item.position.x = xPos;
        item.position.y = yPos;

        var hotspot = item.hotspot;
        if(hotspot != null)
        {
            var offsetX = xPos - oldX;
            var offsetY = yPos - oldY;

            for (var i = 0; i < hotspot.length; i++)
                translate(hotspot[i], offsetX, offsetY);
        }

        // The destination room is the current room
        /*if(roomId == testMapIdRoom[currentCharacter.parentRoomId].id)
        {
            if(hotspot != null)
            {
                var oldPoly = $('#' + itemId + '-hotspot')[0];
                if(!oldPoly)
                    return;
                for(var i = 0; i < oldPoly.points.length; i++)
                    translate(oldPoly.points[i], offsetX, offsetY);

            }
        }*/

        if(itemId == currentCharacter.id)
        {
            testMapIdItem[currentCharacter.id].onScreen = false;
            if(currentCharacter.parentRoomId !== roomId) // We're changing room here
                setCurrentRoom(roomId);
            //setObjectLocation(itemId, roomId);

            //drawScene();
        }

        // The destination room is NOT the current room and the item to move there IS in the current room
        else if(testMapIdRoom[currentCharacter.parentRoomId].id == item.parentRoomId)
        {
            item.parentRoomId = roomId;
        }
    }

};

var walkToPos = function(itemId, xPos, yPos, abort, callback)
{
    var item = testMapIdItem[itemId];
    var sprite = getItemPlaceHolder(item);
    if(!sprite)
        return;
    var start = item.position;//getWalkboxFromPoint(testCurrentRoom.walkBoxes, getBottomMiddlePos(itemId))//testCurrentRoom.walkablePath.getNearestLeaf(getBottomMiddlePos(itemId));
    start = new Point(start.x, start.y);
    var goal = new Point(xPos, yPos);//getWalkboxFromPoint(testCurrentRoom.walkBoxes, destPoint);
    var nextPath = pathfinder.aStar(testCurrentRoom.walkBoxes, start, goal);
    //var currPath = testMapIdItem[itemId].path;
    if(nextPath.length == 0)
    {
        if(callback)
        {
            if(callback.resolve)
                callback.resolve();
            else callback();
        }
        return;
    }

    if(nextPath.length == 1)
    {
        var pos = item.position;
        if(nextPath[0].x === pos.x && nextPath[0].y === pos.y)
        {
            if(callback)
            {
                if(callback.resolve)
                    callback.resolve();
                else callback();
            }
            return;
        }
    }

    var slope = getLineSlope(item.position, nextPath[0]);
    if (slope <= MAX_SLOPE && slope >= MIN_SLOPE )
    {
        if (item.position.x < nextPath[0].x)
            setDirection(item.id, 'right');
        else
            setDirection(item.id, 'left');
    }
    else if(item.position.y < nextPath[0].y)
        setDirection(item.id, 'front');
    else
        setDirection(item.id, 'back');
    clearInterval(item.walkInt);
    item.path = nextPath;
    if(testMapIdItem[itemId].state == 'walk')
    {
        currentCharacter.walkInt = setInterval(function() {updatePath(item, callback)}, 25);
        return;
    }
    startPath(item, callback);
};

var walkToObj = function(walkingItemId, destItemId, abort, callback)
{
    var destItem = testMapIdItem[destItemId];
    if(destItem.walkspot.x == null || destItem.walkspot.y == null)
        throwError('Error: bad walking spot for item ' + destItemId)();
    else walkToPos(walkingItemId, destItem.walkspot.x, destItem.walkspot.y, abort, callback);
};

var egoWalkToObj = function(destItemId, abort, callback)
{
  walkToObj(currentCharacter.id, destItemId, abort, callback);
};

var egoWalkToPos = function (xPos, yPos, abort, callback)
{
    walkToPos(currentCharacter.id, xPos, yPos, abort, callback);
};

var show = function(itemId)
{
    var item = testMapIdItem[itemId];
    item.visible = true;
};

var hide = function(itemId)
{
    //console.log('hide' + openB + itemId + closedB);
    var item = testMapIdItem[itemId];
    item.visible = false;
};

var inventoryAdd = function(itemId)
{
    if(!(itemId in testMapIdInvItem))
        throwError('Error: inventory item \"' + itemId + '\" is not defined. -> inventoryAdd')();
    currentCharacter.inventory.push(itemId);

    switch(guiObj.type)
    {
        case 'MI2':
            drawInventory();
        break;
        case 'CMI':
            guiObj.inventoryPush(itemId);
        break;
    }

};

var inventoryRemove = function(itemId)
{
    if(!(itemId in testMapIdInvItem))
        throwError('Error: inventory item \"' + itemId + '\" is not defined. -> inventoryAdd')();
    currentCharacter.inventory.splice(currentCharacter.inventory.indexOf(itemId), 1);
};

var egoSayLine = function(sentence, abort, callback)
{
    sayLine(currentCharacter.id, sentence, abort, callback);
};

var sayLine = function(itemId, sentence, abort, callback, nextState)
{
    var marginTop = 50;
    var fontSize = 30;
    var maxWidth = 400;
    var item = testMapIdItem[itemId];
    var tOutID;

    if(item.type == 'character')
    {

        stopRollingFrames(item);
        if(!item.path || item.path.length == 0)
            item.anim_state = 'talk';
        //drawSprite(item);
    }
    //abort.push(function() { });
    var posX = null, posY = null;
    //var width = (sentence / fontSize) * 100;

    if(sceneSentences[itemId])
        clearInterval(sceneSentences[itemId].tOutID);


    if(item.position.x != null && item.position.y != null && item.type == 'character')
    {
        var anim = testMapIdAnim[item.defaultAnims[item.anim_state][item.dir]];
        var frameWidth = 0;
        var y = item.position.y;

        if(anim)
        {
            frameWidth = anim.frames[anim.current_frame].img.width * item.scaleFactor;
            y -= anim.frames[anim.current_frame].img.height * item.scaleFactor;
        }

        posX = (item.position.x + frameWidth / 2);
        posY = y - marginTop;
    }
    else if(item.hotspot != null)
    {
        var minX, minY, maxX, maxY;

        minX = maxX = item.hotspot.points[0].x;
        minY = maxY = item.hotspot.points[0].y;

        for(var i = 1; i < item.hotspot.points.length; i++)
        {
            var p = item.hotspot.points[i];
            if(p.x < minX)
                minX = p.x;
            if(p.x > maxX)
                maxX = p.x;
            if(p.y < minY)
                minY = p.y;
            if(p.y > maxY)
                maxY = p.y;
        }
        posX = (minX + (maxX - minX) / 2);
        posY = minY - marginTop;
    }
    posX -= viewport.left;
    posY -= viewport.top;

    if(posX < 0)
        posX = 0;
    if(posY < 0)
        posY = 0;
    //abort.push(function() { delete sceneSentences[itemId]; });
    sceneSentences[itemId] = { text : sentence, pos : { x : posX, y : posY }, tOutID : -1};

    (function(callback)
    {
        var clearSentence = function (callback) {
            $(document).off('keydown', skipSentenceBeforeTime);
            stopRollingFrames(item);
            if (item.type === 'character') {
                if (!item.path || item.path.length == 0)
                    item.anim_state = 'stand';
            }
            else item.anim_state = 'default';
            if (nextState)
                item.anim_state = nextState;
            delete sceneSentences[itemId];
            if (callback && callback.hasOwnProperty('resolve'))
                callback.resolve();
            else if (callback)
                callback();
        };

        var skipSentenceBeforeTime = function (e) {
            e.stopImmediatePropagation();
            var keycode = 190;
            if (e.which === keycode) {
                clearTimeout(sceneSentences[itemId].tOutID);
                clearSentence(callback);
            }
        };

        sceneSentences[itemId].tOutID = setTimeout(function() { clearSentence(callback); }, 2500);
        $(document).on('keydown', skipSentenceBeforeTime);
    })(callback);

    //})(sentenceDiv);
//abort.push(function() { clearTimeout(sceneSentences[itemId].tOutID);});
};

var fireEvent = function(eventName)
{
    $(document).trigger(eventName);
};

var varSet = function(varName, varValue)
{
    if(window[varName] == null)
        throwError('Error: variable ' + varName + ' is not defined.')();
    if(isNaN(varValue))
    {
        if(varValue.toLowerCase() == 'true' || varValue.toLowerCase() == 'false')
            window[varName] = varValue.toLowerCase() == 'true';
        else
            window[varName] = varValue;
    }
    else
        window[varName] =  parseInt(varValue);
};

var varIncr = function(varName, incrAmount)
{
    if(window[varName] == null)
        throwError('Error: variable ' + varName + ' is not defined.')();
    incrAmount = parseInt(incrAmount);
    if(incrAmount == NaN)
        throwError('Error: attempting to increment variable ' + varName + ' by a non-numeric value.')();
    window[varName] += incrAmount;
};

var setCurrentRoom = function(roomId)
{
    testCurrentRoom = testMapIdRoom[roomId];
    setObjectLocation(currentCharacter.id, roomId);
    cameraCenterItem(currentCharacter.id);
    var zIndex = getItemZIndex(currentCharacter.id);
    currentCharacter.setLayer(zIndex, true);
    guiObj.setCursor('default');
    hovering = false;
    guiObj.hovering = null;

    if(testCurrentRoom.onEnterScript)
        eval(gameScripts['EnterRoom'][roomId]);
};


var setDirection = function(itemId, dir)
{
    switch(dir.toLowerCase())
    {
        case 'left': dir = 'FL';
            break;
        case 'right': dir = 'FR';
            break;
        case 'front': dir = 'FF';
            break;
        case 'back': dir = 'FB';
            break;
        case 'front left': dir = 'FFL';
            break;
        case 'front right': dir = 'FFR';
            break;
        case 'back left': dir = 'FBL';
            break;
        case 'back right': dir = 'FBR';
        break;
    }
    var item = testMapIdItem[itemId];
    item.dir = dir;
    //drawSprite(item);
};

var egoSetDirection = function(dir)
{
    setDirection(currentCharacter.id, dir);
};

var setState = function(itemId, state)
{
    var item = testMapIdItem[itemId];
    if(!item)
        throwError('Error. No item with ID \"' + itemId + '\".')();
    if(!(state in item.defaultAnims) && !(state in item.customAnims))
        throwError('Error. Item \"' + itemId + '\" does not have such state as ' + '\"' + state + '\".')();
    item.anim_state = state;
    //drawSprite(item);
};

var egoSetState = function(state)
{
    setState(currentCharacter.id, state);
};

var delay = function(millisecs, abort, callback)
{
    setTimeout(function() {
        if(callback && callback.hasOwnProperty('resolve'))
            callback.resolve();
        else if(callback)
            callback();
    }, parseInt(millisecs));
};

var disableInput = function()
{
    guiObj.disableListening();
};

var enableInput = function()
{
    guiObj.enableListening();
};

var setDescription = function(id, description)
{
    if(id in testMapIdItem)
        testMapIdItem[id].description = description;
    else if(id in testMapIdInvItem)
        testMapIdInvItem[id].description = description;
    else
    {
        alert('Error! <setDescription> No game entity with ID ' + id + '.');
    }

};

var openDialog = function(dialogId)
{
    guiObj.disableListening();
    guiObj.dialogOpen = dialogId;
    testMapIdDialog[dialogId].hidden = false;
};

var closeDialog = function()
{
    if(!guiObj.dialogOpen)
        return;
    testMapIdDialog[guiObj.dialogOpen].currentSubDialog = 'root';
    guiObj.dialogOpen = null;
    enableInput();
    return;
};

var hideDialog = function()
{
    testMapIdDialog[guiObj.dialogOpen].hidden = true;
};

var playAudio = function(audioId)
{
    var audio = testMapIdAudio[audioId];
    audio.pause();
    audio.currentTime = 0;
    audio.play();
};

var cameraCenterItem = function(characterId)
{
    var character = testMapIdItem[characterId];

    viewport.left = character.position.x - resolution.width / 2;
    if(viewport.left < 0)
        viewport.left = 0;
    else if(viewport.left + resolution.width > testCurrentRoom.items[0].img.width)
        viewport.left = Math.max(testCurrentRoom.items[0].img.width - resolution.width, 0);

    viewport.top = character.position.y - (2 * resolution.height / 3);
    if(viewport.top < 0)
        viewport.top = 0;
    else if(viewport.top + resolution.height > testCurrentRoom.items[0].img.height)
        viewport.top = Math.max(testCurrentRoom.items[0].img.height - resolution.height, 0);
};

var enableWalkbox = function(walkboxId)
{
    testMapIdWalkbox[walkboxId].visible = true;
};

var disableWalkbox = function(walkboxId)
{
    testMapIdWalkbox[walkboxId].visible = false;
};

/*var playCustomAnimation = function(item, state)
{
    var anim = editorMapIdAnim[item.defaultAnims[state]];
    var img = $('#svg' + '-' + item.id + '-sprite image');
    var imgContainer = $('#' + item.id + '-sprite-container');
    if(anim.frames.length < 2)
    {
        img.attr({'href' : anim.frames[anim.current_frame].img.src, 'x' : 0, 'y' : 0});
        imgContainer.attr({'x' : item.position.x, 'y' : item.position.y });
        return;
    }
    activeAnims.push(setInterval(
        function()
        {
            anim.incrCurrIdx(); img.attr({'href' : anim.frames[anim.current_frame].img.src, 'x' : 0, 'y' : 0});
            imgContainer.attr({'x' : item.position.x, 'y' : item.position.y });
        }, anim.frame_rate));

};

var stopRollingFrames = function(item)
{
    var anim = item.type == 'character' ? editorMapIdAnim[item.defaultAnims[item.anim_state][item.dir]] : editorMapIdAnim[item.defaultAnims[item.anim_state]];
    if(!anim)
        return;
    anim.current_frame = anim.start_idx;
};
*/