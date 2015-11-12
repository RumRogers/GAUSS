var testRoomsList;
var testCharactersList;
var testAnimsList;
var testInvItemsList;
var testMapIdRoom;
var testMapIdItem;
var testMapIdInvItem;
var testMapIdAnim;
var testMapIdEvent;
var testMapIdDialog;
var testMapIdWb;
var currentCharacter;
var testCurrentRoom;
var testGameActions;
var testCurrentAction;
var testCurrentSentence;
var testInventory;
var testMapIdAudio;
var testMapIdWalkbox;
var gameCanvas;
var gameCtx;
var gameVars;
var guiObj;
var pathfinder;
var activeAnims;
var sentence;
var gameScripts = {};
var sceneSentences;
var hovering = false;
var DEBUG_ON = false;
var actionSelected;
var targetObj1;
var targetObj2;
var viewport;
var scrollIntLR;
var scrollIntUD;
var walkCycleMillisecs = 20;
var scrollingMillisecs = 30;
var scrollingAmount = 10;
var mouseDownTimer = 300;
var mouseDown;
var guiStyle = 'CMI';
var drawInterval;
var mousePos;
var MAX_SLOPE = 1.5;
var MIN_SLOPE = -MAX_SLOPE;
var DEFAULT_WALK_SPEED = 7;
var scaleFactor = { x : 1, y : 1};

var initTest = function()
{
    viewport = { left : 0, right : 0, top : 0, bottom : 0 };
    clearInterval(scrollIntLR);
    clearInterval(scrollIntUD);
    scrollIntLR = null;
    scrollIntUD = null;
    actionSelected = WALK_TO_ID;
    targetObj1 = null;
    targetObj2 = null;
    mouseDown = false;
    gameVars = owl.deepCopy(editorGameVars);
    testRoomsList = owl.deepCopy(editorRoomsList);
    testMapIdRoom = {};
    testMapIdAnim = {};
    testMapIdEvent = {};
    testMapIdAudio = {};
    testMapIdWalkbox = {};
    testMapIdDialog = owl.deepCopy(editorMapIdDialog);
    testMapIdInvItem = owl.deepCopy(editorMapIdInvItem);
    testMapIdItem = owl.deepCopy(editorMapIdItem);
    testGameActions = owl.deepCopy(editorActionsList);
    testCharactersList = owl.deepCopy(editorCharactersList);
    testAnimsList = owl.deepCopy(editorAnimsList);
    testInvItemsList = owl.deepCopy(editorInvItemList);
    testMapIdWb = owl.deepCopy(editorMapIdWb);
    for(var key in activeAnims)
        clearInterval(activeAnims[key]);
    activeAnims = {};
    //================================================= SCRIPT COMPILATION ===========================================//
    gameScripts = {};
    for(var i = 0; i < editorActionsList.length; i++)
        gameScripts[editorActionsList[i].id] = {};
    for(var key in editorScriptList)
        scriptInterpreter(editorScriptList[key], gameScripts);
    for(var key in gameScripts)
    {
        if(key === 'Events')
            continue;
        for (var item in testMapIdItem)
            if(key !== COMBINE_ID)
            {
                if (gameScripts[key][item] === undefined)
                    gameScripts[key][item] = { 'code': defaultReactions[key] };
            }
            else break;

                //gameScripts[key][item] = { 'code' : getDefaultReaction(key, item) };
                //createDefaultScript('item', [key, item]);
        for (var item in testMapIdInvItem)
            if(key !== COMBINE_ID)
            {
                if (gameScripts[key][item] === undefined)
                    gameScripts[key][item] = { 'code': defaultReactions[key] };
            }
            else
            {
                if (gameScripts[key][item] === undefined)
                    gameScripts[key][item] = {};
                for(var item2 in testMapIdItem)
                {
                    if (gameScripts[key][item][item2] === undefined)
                        gameScripts[key][item][item2] = { 'code': defaultReactions[key] };
                }
                for(var item2 in testMapIdInvItem)
                {
                    if(item === item2)
                        break;
                    if (gameScripts[key][item][item2] === undefined)
                        gameScripts[key][item][item2] = { 'code': defaultReactions[key] };
                }
            }
                //createDefaultScript('inv', [key, item]);
    }

    for(var key1 in testMapIdDialog)
    {
        for(var key2 in testMapIdDialog[key1].subdialogs)
        {
            var subD = testMapIdDialog[key1].subdialogs[key2];
            for(var i = 0; i < subD.length; i++)
                if(subD[i].script)
                    gameScripts[subD[i].script] = scriptInterpreter(editorScriptList[subD[i].script], gameScripts);
        }
    }

    for(var key in gameScripts['Events'])
    {
        $(document).off(key);
        (function(key)
        {
            $(document).on(key, function()
            {
                eval(gameScripts['Events'][key]);
            });
        })(key);
    }
    //============================================= END OF SCRIPT COMPILATION ======================================//

    for (var i in testRoomsList)
    {
        testMapIdRoom[testRoomsList[i].id] = testRoomsList[i];

        testRoomsList[i].walkBehindList = [];
        ////////////////////////////
        computeWalkboxNeighbors(testMapIdRoom);
        ////////////////////////////
        var items = testRoomsList[i].items;
        for (var j = 1; j < items.length; j++) {
            delete items[j].hideFromCanvas;
            items[j].img = new Image();
            if (items[j].defaultAnims.default != null && items[j].centralPerspectiveWalkBehind != null)
                testRoomsList[i].walkBehindList.push({'walkBehind': items[j].centralPerspectiveWalkBehind, 'itemId': items[j].id});
            if (items[j].hotspot != null) {
                items[j].onClick = testMapIdItem[items[j].id].onClick;
                items[j].onHover = testMapIdItem[items[j].id].onHover;
                items[j].onWalk = testMapIdItem[items[j].id].onWalk;
                testMapIdItem[items[j].id] = items[j];
            }
        }
        for(var j in testRoomsList[i].walkBoxes)
        {
            testMapIdWalkbox[j] = testRoomsList[i].walkBoxes[j];
        }
        testRoomsList[i].walkBehinds = qSort(testRoomsList[i].walkBehinds, orderWalkBehinds);

        for(var j = 0; j < testRoomsList[i].walkBehinds.length; j++)
        {
            var img = new Image();
            img.src = testRoomsList[i].walkBehinds[j].image;
            testRoomsList[i].walkBehinds[j].image = img;
        }
    }

    for(var i = 0; i < testAnimsList.length; i++)
        testMapIdAnim[testAnimsList[i].id] = testAnimsList[i];

    for (var i = 0; i < testCharactersList.length; i++)
    {
        testCharactersList[i].scaleFactor = 1;
        testMapIdItem[testCharactersList[i].id] = testCharactersList[i];
    }

    for(var key in editorMapIdAudio)
    {
        var audio = new Audio();
        audio.src = editorMapIdAudio[key].audioData;
        testMapIdAudio[key] = audio;
    }
    if(!editorPlayerCharacter)
    {
        alert('No player character found. Aborting.');
        return;
    }
    setCurrentCharacter(editorPlayerCharacter);

    currentCharacter.inventory = [];
    //setObjectLocation(currentCharacter.id, currentCharacter.locationId);
    testCurrentAction = testGameActions[0].description;
    testCurrentSentence = testCurrentAction;
    testInventory = new Array();

    currentCharacter.path = [];
    if(currentCharacter.walkInt)
        clearInterval(currentCharacter.walkInt);
    currentCharacter.walkInt = null;

    sceneSentences = {};
    pathfinder = new PathFinder();
    guiObj = initGUI(resolution, guiStyle);

    var $gameCanvas = $('#game-canvas');
    $gameCanvas.css({'background' : 'black', 'cursor' : 'none', 'border' : '1px solid black' });
    gameCanvas = $gameCanvas[0];
    gameCtx = gameCanvas.getContext('2d');

    gameCanvas.width = resolution.width;
    gameCanvas.height = resolution.height;

    setCanvasResolution(gameCanvas, 640, 480);

    gameCtx.font = '30px LEC';
    gameCtx.fillStyle = 'white';
    gameCtx.strokeStyle = 'black';

    mousePos = { x: 0, y: 0};

    $(gameCanvas).mousedown(function(e)
    {
        e.preventDefault();
        e.stopImmediatePropagation();
        var BUTTON_RIGHT = 3;

        if(e.which == BUTTON_RIGHT && guiObj.listening)
        {
            if(!guiObj.inventoryOpen)
            {
                hovering = null;
                guiObj.hovering = null;
                stopPath(currentCharacter);
                currentCharacter.path = [];
            }
            guiObj.inventoryOpen = !guiObj.inventoryOpen;
            guiObj.setCursor('default');
            guiObj.onScreen = false;
            guiObj.sentence = '';
            return;
        }

        var offset = $(this).offset();
        var rect = gameCanvas.getBoundingClientRect();
        var relX = Math.round((e.clientX - rect.left) / scaleFactor.x);
        var relY = Math.round((e.clientY - rect.top) / scaleFactor.y);

        if(guiObj.actionSelected) // Mousedown occurred over a GUI button
        {
            if(guiObj.actionSelected !== COMBINE_ID)
            {
                var action = guiObj.actionSelected;
                var obj = guiObj.hovering;
                if(gameScripts[guiObj.actionSelected][guiObj.hovering])
                {
                    if(obj in testMapIdInvItem)
                        try
                        {
                            eval(gameScripts[action][obj].code);
                        }
                        catch (err)
                        {
                            alert(err);
                        }
                    else
                        try
                        {
                            walkToObj(currentCharacter.id, guiObj.hovering, null, function ()
                            {
                                setDirection(currentCharacter.id, testMapIdItem[obj].faceDir);
                                eval(gameScripts[action][obj].code);
                            });

                        }
                        catch (err)
                        {
                            alert(err);
                        }
                }
            }
            else if(guiObj.inventoryOpen === true)
            {
                var img = testMapIdAnim[testMapIdInvItem[guiObj.hovering].anim].frames[0].img;
                guiObj.setCursor(guiObj.hovering, img, -img.width / 2, 0);
            }
            guiObj.sentence = '';
            guiObj.hovering = null;
            guiObj.onScreen = false;
            guiObj.actionSelected = null;
            $gameCanvas.trigger('mousemove');

            return;
        }
        if(!guiObj.inventoryOpen)
        {
            if(guiObj.dialogOpen)
            {
                var dialog = testMapIdDialog[guiObj.dialogOpen];
                if(dialog.hidden === true)
                    return;
                var dialogChoices = dialog.subdialogs[dialog.currentSubDialog];
                for(var i = 0; i < dialogChoices.length; i++)
                    if(dialogChoices[i].hovering)
                    {
                        dialogChoices[i].hovering = false;
                        for(var j = 0; j < dialogChoices.length; j++)
                        {
                            if(dialogChoices[j].showOnce === true)
                                dialogChoices[j].hidden = true;
                        }
                        //alert(dialogChoices[i].sentence);
                        var choice = dialogChoices[i];
                        if (choice.script)
                            try
                            {
                                if(choice.chooseOnce)
                                    choice.hidden = true;
                                if(choice.open)
                                {
                                    dialog.currentSubDialog = choice.open;
                                    hideDialog();
                                }
                                else closeDialog();
                                disableInput();
                                eval(gameScripts[dialogChoices[i].script].code.concat());
                            }
                            catch (err) { alert(err); }
                        else
                        {
                            closeDialog();
                            enableInput();
                        }
                        return;
                    }
                return;
            }
            if(!hovering) // Mousedown occurred outside of any hotspot and the inventory is closed
            {
                if (guiObj.onScreen) // Clear GUI if still present on screen
                {
                    guiObj.sentence = '';
                    guiObj.hovering = null;
                    guiObj.onScreen = false;
                    guiObj.item = null;
                    return;
                }

                // User is dragging an inventory object and clicked a non-interactive zone
                if(guiObj.cursor.state !== 'default')
                {
                    guiObj.setCursor('default');
                    return;
                }

                // No verb coin present, the cursor is default, so the user tried to walk
                relX += viewport.left;
                relY += viewport.top;
                if (actionSelected == WALK_TO_ID && guiObj.listening)
                {
                    if (DEBUG_ON)
                        console.log('click on ' + relX + ', ' + relY);
                    walkToPos(currentCharacter.id, relX, relY, [], null);
                }
                return;
            }

            // Mousedown occurred over a hotspot
            if(guiObj.cursor.state == 'default')
            {
                guiObj.setPivot(relX, relY);
                if (guiObj.onScreen)
                {
                    guiObj.onScreen = false;
                    var ev = new jQuery.Event('mousemove');
                    ev.pageX = e.pageX;
                    ev.pageY = e.pageY;
                    $(gameCanvas).trigger(ev);
                }
                guiObj.onScreen = true
                guiObj.item = null;
                guiObj.hovering = hovering;
            }
            else if(guiObj.cursor.state === 'exit')
            {
                var obj = testMapIdItem[hovering];
                if(!mouseDown)
                {
                    e.stopImmediatePropagation();
                    mouseDown = true;
                    walkToObj(currentCharacter.id, obj.id, null, function ()
                    {
                        //setDirection(currentCharacter.id, testMapIdItem[hovering].faceDir);
                        setPosition(currentCharacter.id, obj.exitTo.room, obj.exitTo.xPos, obj.exitTo.yPos);
                    });
                    setTimeout(function() { mouseDown = false; }, mouseDownTimer);
                }
                else
                {
                    stopPath(currentCharacter);
                    setPosition(currentCharacter.id, obj.exitTo.room, obj.exitTo.xPos, obj.exitTo.yPos);
                }
                return;
            }
            else
            {
                var obj1 = guiObj.cursor.state;
                var obj2 = hovering;

                try
                {
                    walkToObj(currentCharacter.id, obj2, null, function ()
                    {
                        setDirection(currentCharacter.id, testMapIdItem[obj2].faceDir);
                        eval(gameScripts[COMBINE_ID][obj1][obj2].code);
                    });

                }
                catch (err) { }
                hovering = null;
                guiObj.sentence = '';
                guiObj.hovering = null;
                guiObj.setCursor('default');
                return;

                //alert('combine ' + testMapIdInvItem[guiObj.cursor.state].description + ' with ' + testMapIdItem[hovering].description);
            }
            stopPath(currentCharacter);
        }
        else if(!guiObj.dialogOpen)
        {
            var hoveredInvItem = guiObj.getHoveredInvItem();
            if(!hoveredInvItem)
            {
                var invMargin = guiObj.getInvMargin();
                if(mousePos.x < invMargin || mousePos.x > resolution.width - invMargin
                    || mousePos.y < invMargin || mousePos.y > resolution.height - invMargin)
                {
                    guiObj.inventoryOpen = false;
                }
                guiObj.onScreen = false;
                guiObj.setCursor('default');
                return;
            }
            if(guiObj.cursor.state !== 'default')
            {
                if(guiObj.cursor.state !== hoveredInvItem.id)
                {
                    eval(gameScripts[COMBINE_ID][guiObj.cursor.state][hoveredInvItem.id].code);
                    guiObj.setCursor('default');
                }
                return;
            }
            guiObj.setPivot(relX, relY);
            guiObj.onScreen = true;
            guiObj.hovering = hovering;
        }
    });
    $(gameCanvas).mousemove(function(e)
    {
        e.preventDefault();
        e.stopImmediatePropagation();

        var offset = $(this).offset();
        var relX = Math.round((e.pageX - offset.left) / scaleFactor.x);
        var relY = Math.round((e.pageY - offset.top) / scaleFactor.y);


        if(!isNaN(relX) && !isNaN(relY))
        {
            mousePos.x = relX;
            mousePos.y = relY;
        }

        if(guiObj.onScreen === true)
        {
            var btnHovering = false;
            hovering = null;
            if(getDistanceBetweenPoints(mousePos, guiObj.magnifierButtonCenter) < guiObj.getButtonRadius())
            {
                guiObj.setActionSelected(EYES_ID);
                btnHovering = true;
            }
            else if(getDistanceBetweenPoints(mousePos, guiObj.handButtonCenter) < guiObj.getButtonRadius())
            {
                guiObj.setActionSelected(HAND_ID);
                btnHovering = true;

            }
            else if(getDistanceBetweenPoints(mousePos, guiObj.mouthButtonCenter) < guiObj.getButtonRadius())
            {
                guiObj.setActionSelected(MOUTH_ID);
                btnHovering = true;
            }
            else if(guiObj.inventoryOpen === true && getDistanceBetweenPoints(mousePos, guiObj.cogwheelButtonCenter) < guiObj.getButtonRadius())
            {
                guiObj.setActionSelected(COMBINE_ID);
                btnHovering = true;
            }

            if(btnHovering)
            {
                var sentence = null;
                //if(guiObj.actionSelected !== 'Combine')
                {
                    if (gameScripts[guiObj.actionSelected][guiObj.hovering])
                        sentence = gameScripts[guiObj.actionSelected][guiObj.hovering].sentence;

                    if (guiObj.hovering in testMapIdItem)
                        guiObj.sentence = sentence ? sentence : editorMapIdAction[guiObj.actionSelected].description + ' ' + testMapIdItem[guiObj.hovering].description;
                    else if (guiObj.hovering in testMapIdInvItem)
                        guiObj.sentence = sentence ? sentence : editorMapIdAction[guiObj.actionSelected].description + ' ' + testMapIdInvItem[guiObj.hovering].description;
                    else
                        guiObj.sentence = 'Combine ' + testMapIdInvItem[guiObj.hovering].description;
                }

                return;

            }

            guiObj.setActionSelected(null);
            return;
        }

        relX += viewport.left;
        relY += viewport.top;

        if(guiObj.dialogOpen)
        {
            var dialogTopLeft = guiObj.getDialogMargin();
            var x = dialogTopLeft.left;
            var y = dialogTopLeft.top - 20;

            var dialog = testMapIdDialog[guiObj.dialogOpen];
            var dialogChoices = dialog.subdialogs[dialog.currentSubDialog];

            for(var i = 0; i < dialogChoices.length; i++)
            {
                if(dialogChoices[i].hidden === true)
                    continue;
                dialogChoices[i].hovering = false;
                if(mousePos.x >= x && mousePos.y >= y && mousePos.y <= y + 20)
                {
                    dialogChoices[i].hovering = true;
                }
                y += 40;
            }
            return;
        }
        if(!guiObj.listening)
            return;

        if(!guiObj.inventoryOpen)
        {
            var reverseLayers = [];
            for (var i in testCurrentRoom.zOrderMap)
                reverseLayers.unshift(i);
            for(var i = 0; i < testCharactersList.length; i++)
            {
                if(testCharactersList[i].id === currentCharacter.id)
                    continue;
                var character = testCharactersList[i] ;
                if (character.visible && character.hotspot && isPointInPoly(character.hotspot.points, { x: relX, y: relY }) == true)
                {
                    hovering = character.id;
                    if (!guiObj.onScreen)
                    {
                        if(guiObj.cursor.state === 'default')
                            guiObj.sentence = character.description;
                        else
                        {
                            var sentence = 'Combine ' + testMapIdInvItem[guiObj.cursor.state].description + ' with ' + testMapIdItem[hovering].description;
                            try
                            {
                                sentence = (gameScripts[COMBINE_ID][guiObj.cursor.state][hovering].sentence) ? gameScripts[COMBINE_ID][guiObj.cursor.state][hovering].sentence : sentence;
                            }
                            catch(err) {}
                            guiObj.sentence = sentence;
                        }
                    }
                    return;
                }
            }

            for (var i = 0; i < reverseLayers.length; i++)
            {
                var items = testCurrentRoom.zOrderMap[reverseLayers[i]];
                for (var j = 0; j < items.length; j++)
                {
                    var item = testMapIdItem[items[j]];
                    if (item.visible && item.hotspot && isPointInPoly(item.hotspot.points, { x: relX, y: relY }) == true)
                    {
                        hovering = item.id;
                        if (!guiObj.onScreen)
                        {
                            if(item.exitTo.room)
                            {
                                if(guiObj.cursor.state === 'default')
                                    guiObj.setCursor('exit');
                                else if(guiObj.cursor.state !== 'exit')
                                {
                                    hovering = null;
                                    return;
                                }
                            }
                            else if(guiObj.cursor.state === 'default')
                                guiObj.sentence = item.description;
                            else if(guiObj.cursor.state !== 'exit')
                            {
                                var sentence = 'Combine ' + testMapIdInvItem[guiObj.cursor.state].description + ' with ' + testMapIdItem[hovering].description;
                                try
                                {
                                    sentence = (gameScripts[COMBINE_ID][guiObj.cursor.state][hovering].sentence) ? gameScripts[COMBINE_ID][guiObj.cursor.state][hovering].sentence : sentence;
                                }
                                catch(err) {}
                                guiObj.sentence = sentence;
                            }
                        }
                        return;
                    }
                }
            }
            if (!guiObj.onScreen)
                guiObj.sentence = '';
            hovering = null;
            if(guiObj.cursor.state === 'exit')
                guiObj.setCursor('default');
        }
        // Inventory management
        else
        {
            if(!guiObj.actionSelected)
            if(guiObj.cursor.state != 'default')
            {
                var invMargin = guiObj.getInvMargin();

                // If the cursor is moved outside the inventory GUI bounds, close inventory
                if (mousePos.x < invMargin || mousePos.x > resolution.width - invMargin
                    || mousePos.y < invMargin || mousePos.y > resolution.height - invMargin)
                {
                    guiObj.inventoryOpen = false;
                    return;
                }
            }
            var hoveredItem = guiObj.getHoveredInvItem();
            if(!hoveredItem || hoveredItem.id == guiObj.cursor.state)
                return;
            hovering = hoveredItem.id;
            if (!guiObj.onScreen)
            {
                if(guiObj.cursor.state === 'default')
                    guiObj.sentence = testMapIdInvItem[hoveredItem.id].description;
                else
                {
                    var sentence = 'Combine ' + testMapIdInvItem[guiObj.cursor.state].description + ' with ' + testMapIdInvItem[hoveredItem.id].description;
                    try
                    {
                        sentence = (gameScripts[COMBINE_ID][guiObj.cursor.state][hoveredItem.id].sentence) ? gameScripts[COMBINE_ID][guiObj.cursor.state][hoveredItem.id].sentence : sentence;
                    }
                    catch (err) {}
                    guiObj.sentence = sentence;
                }
            }
        }

    });
    $(gameCanvas).contextmenu(function(e)
    {
        e.preventDefault();
    });
    setCurrentRoom(testRoomsList[0].id);
    drawInterval = setInterval(function() { drawScene(); }, 1000/30);
};


var drawScene = function()
{

    var bg = testCurrentRoom.items[0].img;
    gameCtx.clearRect(0, 0, resolution.width, resolution.height);
    gameCtx.drawImage(bg, viewport.left, viewport.top, gameCanvas.width, gameCanvas.height, 0, 0, gameCanvas.width, gameCanvas.height);

    var charactersIndexes = [];
    for(var i = 0; i < testCharactersList.length; i++) {
        var character = testCharactersList[i];
        if (character.parentRoomId !== testCurrentRoom.id)
            continue;
        charactersIndexes[i] = getItemZIndex(character.id);
        character.setLayer(charactersIndexes[i], true);
    }

    for(var key in testCurrentRoom.zOrderMap)
    {
        var layer = testCurrentRoom.zOrderMap[key];

        if(parseInt(key) % 2 === 1)
        {
            layer = qSort(layer, function(c1, c2) { return testMapIdItem[c1].position.y < testMapIdItem[c2].position.y; });
        }

        for(var i = 0; i < layer.length; i++)
        {
            var item = testMapIdItem[layer[i]];
            if(item.visible)
                drawSprite(testMapIdItem[layer[i]]);
        }
    }

    if(DEBUG_ON)
    {
        DEBUG_drawWalkBoxes();
        if(currentCharacter.path.length > 0)
        {
            var tmp = gameCtx.strokeStyle;
            var sprite = getItemPlaceHolder(currentCharacter);
            var currPos = new Point(currentCharacter.position.x,
                    currentCharacter.position.y);

            var path = currentCharacter.path;
            gameCtx.strokeStyle = 'yellow';
            gameCtx.beginPath();
            for(var i = 0; i < path.length; i++)
            {
                var tmp = new Point(path[i].x, path[i].y);
                gameCtx.moveTo(currPos.x - viewport.left, currPos.y - viewport.top);
                gameCtx.lineTo(tmp.x - viewport.left , tmp.y - viewport.top);
                currPos = tmp;
            }
            gameCtx.closePath();
            gameCtx.stroke();
            gameCtx.strokeStyle = tmp;
            gameCtx.strokeStyle = 'black';
        }
    }
    //if(!currentCharacter.onScreen)
    //    drawSprite(currentCharacter);
    drawInventory();
    drawSentences();
    drawGUI();
    drawGUISentence();
    drawCursor();

};

var drawGUISentence = function()
{
    var textMargin = 10;
    var startX = guiObj.onScreen ? guiObj.pivot.x : mousePos.x;
    var startY = guiObj.onScreen ? guiObj.magnifierButtonCenter.y - guiObj.getButtonRadius() - textMargin : mousePos.y;
    gameCtx.lineWidth = 5;
    var textSize = gameCtx.measureText(guiObj.sentence);
    var destX = startX - textSize.width / 2 < 0 ? 0 : (startX + textSize.width / 2 > resolution.width ? resolution.width - textSize.width : startX - textSize.width / 2);
    gameCtx.strokeText(guiObj.sentence, destX, startY - 20);
    gameCtx.lineWidth = 3;
    gameCtx.fillStyle = 'white';
    gameCtx.fillText(guiObj.sentence, destX, startY - 20);
};

var drawSentences = function ()
{
    var maxWidth = 500;
    for(var key in sceneSentences)
    {
        gameCtx.lineWidth = 5;
        wrapText(gameCtx, sceneSentences[key].text, sceneSentences[key].pos.x, sceneSentences[key].pos.y, maxWidth, 40, testMapIdItem[key].speechColor);
    }

};

var drawInventory = function()
{
    if(guiObj.inventoryOpen)
    {
        var inv = currentCharacter.inventory;
        var invGUIMargin = guiObj.getInvMargin();
        var MAX_ROWS = guiObj.getInvRows();
        var MAX_COLUMNS = guiObj.getInvColumns();
        var cellMargin = guiObj.getInvCellMargin();
        var cellSize = guiObj.getInvCellSize();

        gameCtx.fillStyle = 'rgba(255, 127, 127, 0.5)';
        gameCtx.fillRect(invGUIMargin, invGUIMargin, resolution.width - 2 * invGUIMargin, resolution.height - 2 * invGUIMargin);

        for(var i = 0; i < MAX_ROWS; i++)
            for(var j = 0; j < MAX_COLUMNS; j++)
            {
                var idx = j + (MAX_COLUMNS * i);
                if(idx == inv.length)
                    return;
                var img = testMapIdAnim[testMapIdInvItem[inv[idx]].anim].frames[0].img;
                img.width = img.height = cellSize;
                gameCtx.drawImage(img, invGUIMargin + cellMargin + j * (cellMargin + cellSize), invGUIMargin + cellMargin + i * (cellMargin + cellSize));
                gameCtx.lineWidth = 1;
                gameCtx.strokeRect(invGUIMargin + cellMargin + j * (cellMargin + cellSize), invGUIMargin + cellMargin + i * (cellMargin + cellSize), cellSize, cellSize);
            }
    }
};

var drawGUI = function()
{
    if(guiObj.onScreen === true)
    {
        var radius = guiObj.getButtonRadius();
        var diameter = 2 * radius;
        //gameCtx.fillStyle = 'black';
        //gameCtx.fillRect(guiObj.position.x - guiObj.size.width / 2, guiObj.position.y, guiObj.size.width, guiObj.size.height);
        gameCtx.drawImage(guiObj.actions[0], guiObj.magnifierButtonCenter.x - radius, guiObj.magnifierButtonCenter.y - radius, diameter, diameter);
        gameCtx.drawImage(guiObj.actions[1], guiObj.handButtonCenter.x - radius, guiObj.handButtonCenter.y - radius, diameter, diameter);
        gameCtx.drawImage(guiObj.actions[2], guiObj.mouthButtonCenter.x - radius, guiObj.mouthButtonCenter.y - radius, diameter, diameter);
        if(guiObj.inventoryOpen === true)
            gameCtx.drawImage(guiObj.actions[3], guiObj.cogwheelButtonCenter.x - radius, guiObj.cogwheelButtonCenter.y - radius, diameter, diameter);

        return;
    }

    if(guiObj.dialogOpen)
    {
        var dialog = testMapIdDialog[guiObj.dialogOpen];
        if(dialog.hidden === true)
            return;
        var dialogChoices = dialog.subdialogs[dialog.currentSubDialog];
        var dialogMargin = guiObj.getDialogMargin();
        var y = dialogMargin.top;


        for (var i = 0; i < dialogChoices.length; i++)
        {
            if(dialogChoices[i].hidden)
                continue;
            if(dialogChoices[i].open)
            {
                var subdialog = dialog.subdialogs[dialogChoices[i].open];
                var allHidden = true;
                for(var j = 0; j < subdialog.length; j++)
                {
                    if(subdialog[j].hidden === false)
                    {
                        allHidden = false;
                        break;
                    }
                }
                if(allHidden === true)
                {
                    dialogChoices[i].hidden = true;
                    continue;
                }
            };
            if(dialogChoices[i].hovering)
                gameCtx.fillStyle = 'yellow';
            else
                gameCtx.fillStyle = 'lightgreen';
            gameCtx.lineWidth = 5;
            gameCtx.strokeText(dialogChoices[i].sentence, dialogMargin.left, y);
            gameCtx.lineWidth = 3;
            gameCtx.fillText(dialogChoices[i].sentence, dialogMargin.left, y);
            y += 40;
        }
    }
};

var drawCursor = function()
{
    gameCtx.drawImage(guiObj.cursor.img, mousePos.x + guiObj.cursor.offset.x, mousePos.y + guiObj.cursor.offset.y);
};

var initGUI = function(gameResolution, guiStyle)
{
    var guiObj;

    switch (guiStyle)
    {
        case 'MI2':
            break;
        case 'CMI':
            var imgWidth = 75;
            var margin = 5;
            var dialogMargin = { left: 25, top: resolution.height - 200 };

            var defaultCursorId = 'default';
            var defaultCursorPath = 'icons/cursor-small.png';
            var defaultCursor = new Image();
            defaultCursor.src = defaultCursorPath;

            var defaultCursorOffset = { x : -23, y : -1 };

            var MAX_ROWS = 5;
            var MAX_COLUMNS = 5;
            var invGUIMargin = 100;
            var invCellMargin = 50;
            var invCellSize = 100;

            var exitCursorId = 'exit';
            var exitCursorPath = 'icons/exit.png';
            var exitCursor = new Image();
            exitCursor.src = exitCursorPath;
            var exitCursorOffset = { x : -19, y : -1 };

            var magnifier_img = new Image();
            var hand_img = new Image();
            var mouth_img = new Image();
            var cogwheel_img = new Image();
            var magnifier_hover_img = new Image();
            var hand_hover_img = new Image();
            var mouth_hover_img = new Image();
            var cogwheel_hover_img = new Image();

            var magnifier_icon = 'icons/occhi.png';
            var magnifier_hover_icon = 'icons/occhi-hover.png';
            var hand_icon = 'icons/mano.png';
            var hand_hover_icon = 'icons/mano-hover.png';
            var mouth_icon = 'icons/bocca.png';
            var mouth_hover_icon = 'icons/bocca-hover.png';
            var cogwheel_icon = 'icons/cogwheel.png';
            var cogwheel_hover_icon = 'icons/cogwheel-hover.png';

            var magnifier_img_offset = { x : 0, y : -79};
            var hand_img_offset = {x :-50, y : 0};
            var mouth_img_offset = {x : 50, y : 0};
            var cogwheel_img_offset = {x : 0, y : 79};
            magnifier_img.src = magnifier_icon;
            hand_img.src = hand_icon;
            mouth_img.src = mouth_icon;
            cogwheel_img.src = cogwheel_icon;
            magnifier_hover_img.src = magnifier_hover_icon;
            hand_hover_img.src = hand_hover_icon;
            mouth_hover_img.src = mouth_hover_icon;
            cogwheel_hover_img.src = cogwheel_hover_icon;


            var guiObject = function()
            {
                this.type = 'CMI';
                this.listening = true;
                this.onScreen = false;
                this.inventoryOpen = false;
                this.dialogOpen = null;
                this.cursor = { state : defaultCursorId, img : defaultCursor, offset : defaultCursorOffset};
                this.listening = true;
                this.actionSelected = null;
                this.sentence = '';
                this.pivot = { x : null, y : null };
                this.size = {width : 250, height : 100 };
                this.magnifierButtonCenter = null;
                this.handButtonCenter = null;
                this.mouthButtonCenter = null;
                this.cogwheelButtonCenter = null;
                this.hovering = null;
                this.actions = [];
                this.actions[0] = magnifier_img;
                this.actions[1] = hand_img;
                this.actions[2] = mouth_img;
                this.actions[3] = cogwheel_img;

                this.getButtonDiameter = function()
                {
                    return imgWidth;
                };
                this.getButtonRadius = function()
                {
                    return imgWidth / 2;
                };
                this.getInvRows = function()
                {
                    return MAX_ROWS;
                };
                this.getInvColumns = function()
                {
                    return MAX_COLUMNS;
                };
                this.getInvMargin = function()
                {
                    return invGUIMargin;
                };
                this.getInvCellMargin = function()
                {
                    return invCellMargin;
                };
                this.getInvCellSize = function()
                {
                    return invCellSize;
                };
                this.getMargin = function()
                {
                    return margin;
                };
                this.getDialogMargin = function()
                {
                    return dialogMargin;
                };
                this.setPivot = function(x, y)
                {
                    var size = this.size;
                    x - size.width / 2 < 0 ? this.pivot.x = size.width / 2 : (x + size.width / 2 > resolution.width ? this.pivot.x = resolution.width - size.width : this.pivot.x = x);
                    y + size.height > resolution.height ? this.pivot.y = resolution.height - size.height : this.pivot.y = y;
                    //this.magnifierButtonCenter = { x : this.pivot.x, y : this.pivot.y + imgWidth / 2 + margin};
                    this.magnifierButtonCenter = { x : this.pivot.x + magnifier_img_offset.x, y : this.pivot.y + magnifier_img_offset.y };
                    //this.handButtonCenter = { x : this.pivot.x - imgWidth / 2 - margin, y : this.pivot.y + imgWidth + 2 * margin + imgWidth / 2};
                    this.handButtonCenter = { x : this.pivot.x + hand_img_offset.x, y : this.pivot.y + hand_img_offset.y};
                    //this.mouthButtonCenter = { x : this.pivot.x + imgWidth / 2 + margin, y : this.pivot.y + imgWidth + 2 * margin + imgWidth / 2 };
                    this.mouthButtonCenter = { x : this.pivot.x +  mouth_img_offset.x, y : this.pivot.y + mouth_img_offset.y };
                    //this.cogwheelButtonCenter = { x : this.pivot.x, y : this.pivot.y + 2 * imgWidth + 3 * margin + imgWidth / 2};
                    this.cogwheelButtonCenter = { x : this.pivot.x + cogwheel_img_offset.x, y : this.pivot.y + cogwheel_img_offset.y};
                };
                this.setActionSelected = function(action)
                {
                    this.actionSelected = action;
                    switch(action)
                    {
                        case EYES_ID:
                            this.actions[0] = magnifier_hover_img;
                        break;
                        case HAND_ID:
                            this.actions[1] = hand_hover_img;
                        break;
                        case MOUTH_ID:
                            this.actions[2] = mouth_hover_img;
                        break;
                        case COMBINE_ID:
                            this.actions[3] = cogwheel_hover_img;
                        break;
                        default:
                            this.actionSelected = null;
                            this.actions[0] = magnifier_img;
                            this.actions[1] = hand_img;
                            this.actions[2] = mouth_img;
                            this.actions[3] = cogwheel_img;
                        break;
                    }
                };
                this.disableListening = function()
                {
                    hovering = null;
                    this.sentence = '';
                    this.hovering = null;
                    this.listening = false;
                };
                this.enableListening = function()
                {
                    this.listening = true;
                };
                this.inventoryPush = function(invItemId)
                {

                };

                this.show = function(x, y)
                {

                    this.onScreen = true;
                };
                this.hide = function()
                {
                    this.onScreen = false;
                };
                this.drawSentence = function(x, y, sentence, zIndex)
                {
                };
                this.openInventory = function()
                {

                };
                this.closeInventory = function()
                {

                };
                this.setCursor = function(id, path, offsetX, offsetY)
                {
                    if(id === 'default')
                    {
                        this.cursor = { state : defaultCursorId, img : defaultCursor, offset : defaultCursorOffset };
                        return;
                    }
                    if(id === 'exit')
                    {
                        this.cursor = { state : exitCursorId, img : exitCursor, offset : exitCursorOffset };
                        return;
                    }
                    this.cursor.state = id;
                    this.cursor.img = path;
                    this.cursor.offset = { x: offsetX, y: offsetY };

                };
                this.getHoveredInvItem = function()
                {
                    var inv = currentCharacter.inventory;

                    for(var i = 0; i < MAX_ROWS; i++)
                        for(var j = 0; j < MAX_COLUMNS; j++)
                        {
                            var idx = j + (MAX_ROWS * i);
                            if(idx == inv.length)
                            {
                                hovering = null;
                                this.sentence = '';
                                return null;
                            }
                            var left = invGUIMargin + invCellMargin + j * (invCellSize + invCellMargin);
                            var top = invGUIMargin + invCellMargin + i * (invCellSize + invCellMargin);
                            var right = left + invCellSize;
                            var bottom = top + invCellSize;

                            if(mousePos.x >= left && mousePos.x < right && mousePos.y >= top && mousePos.y < bottom)
                                return { id: inv[idx], left : left, top : top, right : right, bottom : bottom };
                        }
                };
            };
            guiObj = new guiObject();
            break;
    }
    return guiObj;
};


var drawSprite = function(item, drawAbsolute)
{
    var anim = null;
    //if(item.type === 'character')
    //{
    if (item.anim_state in item.defaultAnims)
    {
        if(item.type === 'character')
            anim = testMapIdAnim[item.defaultAnims[item.anim_state][item.dir]];
        else anim = testMapIdAnim[item.defaultAnims[item.anim_state]];
    }
    else if (item.anim_state in item.customAnims)
        anim = testMapIdAnim[item.customAnims[item.anim_state]];
    //}
    //else
    //    anim = testMapIdAnim[item.defaultAnims[item.anim_state]];
    if(!anim)
        return;
    anim.play();

    var sprite = anim.frames[anim.current_frame].img;

    var pos = item.position;
    var currWBox = getWalkboxFromPoint(testCurrentRoom.walkBoxes, pos);
    if(!currWBox)
        currWBox = getNearestWalkBox(testCurrentRoom.walkBoxes, pos);
    var width = sprite.width;
    var height = sprite.height;
    var scrollLeft = drawAbsolute !== true ? viewport.left : 0;
    var scrollTop = drawAbsolute !== true ? viewport.top : 0;

    if(item.type === 'character')
    {
        interpolateScaleAndSpeed(item, currWBox.polygon.top, currWBox.minScaleFactor, currWBox.polygon.bottom, currWBox.maxScaleFactor);
        width *= item.scaleFactor;
        height *= item.scaleFactor;
    }

    gameCtx.drawImage(sprite, pos.x - width / 2 - scrollLeft, pos.y - height - scrollTop, width, height);
};

var getBottomMiddlePos = function(itemId)
{
    var item = testMapIdItem[itemId];
    var anim;
    if(item.type == 'character')
        anim = testMapIdAnim[item.defaultAnims[item.anim_state][item.dir]];
    else anim = testMapIdAnim[item.defaultAnims[item.anim_state]];
    if(!anim)
        return null;
    var sprite = anim.frames[anim.current_frame];
    return new paper.Point(item.position.x + sprite.img.width / 2, item.position.y + sprite.img.height);
};

var setCurrentCharacter = function(characterId)
{
    currentCharacter = testMapIdItem[characterId];
    currentCharacter.path = [];
};

var setObjectLocation = function(objectId, roomId)
{
    testMapIdItem[objectId].parentRoomId = roomId;
    //drawScene();
};
var getItemZIndex = function(itemId)
{
    var walkBehindList = testCurrentRoom.walkBehindList;
    var item = testMapIdItem[itemId];

    for (var i = 0; i < walkBehindList.length; i++)
        if (item.position.y < walkBehindList[i].walkBehind)
        {
            return testMapIdItem[walkBehindList[i].itemId].layer - 1;
        }

    return 2000;
};

var atomicEffects = {
    setDirection: setDirection,
    egoSetDirection : egoSetDirection,
    setPosition: setPosition,
    setRoom : setCurrentRoom,
    inventoryAdd: inventoryAdd,
    inventoryRemove: inventoryRemove,
    show: show,
    hide: hide,
    varSet : varSet,
    varIncr : varIncr,
    setState : setState,
    egoSetState : egoSetState,
    enableInput : enableInput,
    disableInput : disableInput,
    openDialog : openDialog,
    playAudio : playAudio
};

var interruptibleEffects = {
    delay: delay,
    sayLine: sayLine,
    egoSayLine: egoSayLine,
    walkToPos: walkToPos,
    egoWalkToPos: egoWalkToPos,
    walkToObj: walkToObj,
    egoWalkToObj: egoWalkToObj
};



var throwError = function(errMsg)
{
    return function() { alert(errMsg); throw errMsg; }
};

var startPath = function(item, dfd)
{
    currentCharacter.anim_state = 'walk';
    //drawSprite(currentCharacter);
    currentCharacter.walkInt = setInterval(function() {updatePath(item, dfd)}, walkCycleMillisecs);
};

var updatePath = function(item, dfd)
{
    var length = item.path.length;
    if(length == 0)
    {
        stopPath(item, dfd);
        return;
    }
    var sprite = item.getCurrentFrame();
    var viewCoords = { x : item.position.x - viewport.left, y : item.position.y - viewport.top };
    var scrollCamera = function (dir)
    {
        var stop = false;
        var scroll = item.walkSpeed + 3;
        switch(dir)
        {
            case 'left':
            case 'right':
                if(dir == 'right')
                    scroll *= -1;

                if (dir == 'left' && viewport.left + resolution.width + scroll > testCurrentRoom.items[0].boundingBox.width)
                {
                    scroll = - (viewport.left + resolution.width - testCurrentRoom.items[0].boundingBox.width);
                    stop = true;
                }
                else if(dir == 'right' && viewport.left + scroll < 0)
                {
                    scroll = -viewport.left;
                    stop = true;
                }
                viewport.left += scroll;

                var left = item.position.x - viewport.left;
                if (stop)
                {
                    clearInterval(scrollIntLR);
                    scrollIntLR = null;
                    return;
                }

                if (dir == 'left' && left + sprite.img.width / 2 < resolution.width / 2)
                {
                    clearInterval(scrollIntLR);
                    scrollIntLR = null;
                    return;
                }

                if (dir == 'right' && left + sprite.img.width / 2 > resolution.width / 2)
                {
                    clearInterval(scrollIntLR);
                    scrollIntLR = null;
                    return;
                }
                break;
            case 'up':
            case 'down':
                if(dir == 'up')
                    scroll *= -1;

                if (dir == 'down' && viewport.top + resolution.height + scroll > testCurrentRoom.items[0].boundingBox.height)
                {
                    scroll = - (viewport.top + resolution.height - testCurrentRoom.items[0].boundingBox.height);
                    stop = true;
                }
                else if(dir == 'up' && viewport.top + scroll < 0)
                {
                    scroll = -viewport.top;
                    stop = true;
                }
                viewport.top += scroll;

                var top = item.position.y - viewport.top;
                if (stop)
                {
                    clearInterval(scrollIntUD);
                    scrollIntUD = null;
                    return;
                }

                if (dir == 'down' && top + sprite.img.height / 2 < (resolution.height - (guiStyle == 'MI2' ? guiHeights[resolution.height] : 0))/ 2)
                {
                    clearInterval(scrollIntUD);
                    scrollIntUD = null;
                    return;
                }

                if (dir == 'up' && top + sprite.img.height / 2 > (resolution.height - (guiStyle == 'MI2' ? guiHeights[resolution.height] : 0)) / 2)
                {
                    clearInterval(scrollIntUD);
                    scrollIntUD = null;
                    return;
                }
            break;
        }

    };
    if(item.id === currentCharacter.id)
        cameraCenterItem(item.id);
    /*if((viewCoords.x) >= (resolution.width / 3) * 2 && scrollIntLR == null)
    {

        if(viewport.left + resolution.width < testCurrentRoom.items[0].boundingBox.width)
        {
            scrollIntLR = setInterval(function() { scrollCamera('left'); }, scrollingMillisecs);
        }
    }
    else if((viewCoords.x) < (resolution.width / 3) && scrollIntLR == null)
    {
        if(viewport.left > 0)
        {
            scrollIntLR = setInterval(function() { scrollCamera('right'); }, scrollingMillisecs);
        }
    }
    if((viewCoords.y) >= ((resolution.height - (guiStyle == 'MI2' ? guiHeights[resolution.height] : 0))/ 3) && scrollIntUD == null)
    {
        if(viewport.top + resolution.height < testCurrentRoom.items[0].boundingBox.height)
        {
            scrollIntUD = setInterval(function() { scrollCamera('down'); }, scrollingMillisecs);
        }
    }
    else if((viewCoords.y) < ((resolution.height - (guiStyle == 'MI2' ? guiHeights[resolution.height] : 0)) / 3) * 0.4 && scrollIntUD == null)
    {
        if(viewport.top > 0)
        {
            scrollIntUD = setInterval(function() { scrollCamera('up'); }, scrollingMillisecs);
        }
    }*/
    var path = item.path;
    var currPos = item.position;
    var nextPoint = getNextPointInLine(currPos, path[0], item.walkSpeed);


    if(Math.abs(nextPoint.x - path[0].x) < 1  && Math.abs(nextPoint.y - path[0].y) < 0.1)
    {
        path.splice(0, 1);
        if(path.length > 0)
        {
            var slope = getLineSlope(currPos, path[0]);
            var nextToNextPoint = getNextPointInLine(currPos, path[0], item.walkSpeed);
            //console.log('Slope is ' + slope);
            if (slope <= MAX_SLOPE && slope >= MIN_SLOPE )
            {
                if (nextToNextPoint.x > currPos.x)
                    setDirection(item.id, 'right');
                else
                    setDirection(item.id, 'left');
            }
            else if(nextToNextPoint.y > currPos.y)
                setDirection(item.id, 'front');
            else
                setDirection(item.id, 'back');
        }
    }
    var nextWBox = getWalkboxFromPoint(testCurrentRoom.walkBoxes, nextPoint, true);
    if(nextWBox && nextWBox.visible === false)
    {
        item.path = [];
        stopPath(item, dfd);
        return;
    }
    setPosition(item.id, item.parentRoomId, nextPoint.x, nextPoint.y);
    //setItemZIndex(currentCharacter.id);

    for(var i = 0; i < testCurrentRoom.items.length; i++)
    {
        var itm = testCurrentRoom.items[i];
        if(itm.hotspot)
        {
            if(itm.onWalk && isPointInPoly(itm[i].hotspot.points, getBottomMiddlePos(item.id)))
            {
                try { eval(itm.onWalk.code); }
                catch(err) { alert(err); }
            }
        }
    }
};

var stopPath = function(item, dfd)
{
    clearInterval(item.walkInt);
    item.anim_state = 'stand';
    //drawSprite(currentCharacter);
    item.callback = null;
    if(dfd && dfd.hasOwnProperty('resolve'))
        dfd.resolve();
    else if(dfd)
        dfd();
};

var interpolateScaleAndSpeed = function(item, minY, minScale, maxY, maxScale)
{
    item.scaleFactor = (maxScale + (minScale - maxScale) * ((item.position.y - maxY) / (minY - maxY))) / 100;
    item.walkSpeed = DEFAULT_WALK_SPEED * item.scaleFactor;
};