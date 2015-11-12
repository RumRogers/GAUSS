var exportGame = function()
{
    var header =
        '<!DOCTYPE html>\n\
        <html>\n\
        <head>\n\
            <title>Game - made with the GAUSS engine by Andrea Serreli</title>\n\
            <script type="text/javascript" src="js/jquery-1.11.0.js"></script>\n\
            <script type="text/javascript" src="js/paper-full.js"></script>\n\
        </head>\n\
        <body>\n\
            <style>\n\
                @font-face { font-family: LEC; src: url(\'fonts/MI.TTF\'); }\n\
            </style>\n\
            <canvas id="game-canvas"></canvas>\n';
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
    var globalVars = '\n\
        var roomsList = ' + JSON.stringify(backupRooms) + '; \n\
        var charactersList =' + JSON.stringify(backupCharacters) + '; \n\
        var animsList = ' + JSON.stringify(backupAnims) + '; \n\
        var invItemsList = ' + JSON.stringify(editorInvItemList) + '; \n\
        var scripts = ' + JSON.stringify(compileScripts()) + '; \n\
        var gameVars = ' + JSON.stringify(editorGameVars) + '; \n\
        var gameActions = ' + JSON.stringify(editorActionsList) + ';\n\
        var mapIdDialog = ' + JSON.stringify(editorMapIdDialog) + ';\n\
        var mapIdAudio = ' + JSON.stringify(editorMapIdAudio) + ';\n\
        var resolution = ' + JSON.stringify(resolution) + ';\n\
        var mapIdAction = ' + JSON.stringify(editorMapIdAction) + ';\n\
        var defaultSentences = ' + JSON.stringify(defaultSentences) + ';\n\
        var mapIdInvItem = ' + JSON.stringify(editorMapIdInvItem) + ';\n\
        var gameScripts;\n\
        var mapIdRoom = {};\n\
        var mapIdItem = {};\n\
        var mapIdAnim = {};\n\
        var mapIdEvent = {};\n\
        var currentCharacter;\n\
        var currentRoom;\n\
        var actionSelected;\n\
        var targetObj1;\n\
        var targetObj2;\n\
        var currentAction;\n\
        var testCurrentSentence;\n\
        var inventory;\n\
        var guiObj;\n\
        var pathfinder;\n\
        var activeAnims;\n\
        var sentence;\n\
        var definedTriples;\n\
        var undefinedTriples;\n\
        var hovering = false;\n\
        var DEBUG_ON = false;\n\
        var scrollIntLR;\n\
        var scrollIntUD;\n\
        var walkCycleMillisecs = 20;\n\
        var scrollingMillisecs = 30;\n\
        var scrollingAmount = 10;\n\
        var mouseDownTimer = 300;\n\
        var mouseDown;\n\
        var guiStyle = \'CMI\';\n\
        var drawInterval;\n\
        var mousePos;\n\
        var MAX_SLOPE = 1.5;\n\
        var MIN_SLOPE = -MAX_SLOPE;\n\
        var DEFAULT_WALK_SPEED = 7;\n\
        var scaleFactor = { x :1, y : 1 };\n\
        var atomicEffects = {\n\
            setDirection: setDirection,\n\
            egoSetDirection : egoSetDirection,\n\
            setPosition: setPosition,\n\
            setRoom : setCurrentRoom,\n\
            inventoryAdd: inventoryAdd,\n\
            inventoryRemove: inventoryRemove,\n\
            show: show,\n\
            hide: hide,\n\
            setState : setState,\n\
            egoSetState : egoSetState,\n\
            enableInput : enableInput,\n\
            disableInput : disableInput,\n\
            openDialog : openDialog,\n\
            closeDialog : closeDialog,\n\
            playAudio : playAudio\n\
        };\n\
        \n\
        var interruptibleEffects = {\n\
            delay: delay,\n\
            sayLine: sayLine,\n\
            egoSayLine: egoSayLine,\n\
            walkToPos: walkToPos,\n\
            egoWalkToPos: egoWalkToPos,\n\
            walkToObj: walkToObj,\n\
            egoWalkToObj: egoWalkToObj\n\
        };\n\
        $(document).ready(function() \
        {\n\
         $(document.body).css({ margin : \'0\', padding : \'0\' });\n\
         initGame();\n\
        });';

    var nativeFunctions = new Array();
    nativeFunctions.push('var initGame = function()\n\
    {\n\
        viewport = { left : 0, right : 0, top : 0, bottom : 0 };\n\
        clearInterval(scrollIntLR);\n\
        clearInterval(scrollIntUD);\n\
        scrollIntLR = null;\n\
        scrollIntUD = null;\n\
        actionSelected = \'Walk_to\';\n\
        targetObj1 = null;\n\
        targetObj2 = null;\n\
        mouseDown = false;\n\
        testMapIdRoom = {};\n\
        testMapIdAnim = {};\n\
        testMapIdEvent = {};\n\
        testMapIdAudio = {};\n\
        testMapIdWalkbox = {};\n\
        for(var key in activeAnims)\n\
            clearInterval(activeAnims[key]);\n\
        activeAnims = {};\n\
        for (var i in testRoomsList)\n\
        {\n\
            testRoomsList[i].zOrderMap = {}\n\
            testRoomsList[i].walkBehindList = [];\n\
            var items = testRoomsList[i].items;\n\
            var bg = testRoomsList[i].items[0];\n\
            var src = bg.img;\n\
            var img = new Image();\n\
            img.src = src;\n\
            testRoomsList[i].items[0] = {img : img, boundingBox : new paper.Rectangle(bg.boundingBox[1], bg.boundingBox[2], bg.boundingBox[3], bg.boundingBox[4])};\n\
            for (var j = 1; j < items.length; j++) {\n\
                if (testRoomsList[i].zOrderMap[testRoomsList[i].items[j].layer] == undefined)\n\
                    testRoomsList[i].zOrderMap[testRoomsList[i].items[j].layer] = [];\n\
                testRoomsList[i].zOrderMap[testRoomsList[i].items[j].layer].push(testRoomsList[i].items[j].id);\n\
                items[i].getCurrentFrame = getItemCurrentFrame;\n\
                items[j].setLayer = setItemLayer;\n\
                testMapIdItem[items[j].id] = items[j]\n\
                delete items[j].hideFromCanvas;\n\
                items[j].img = new Image();\n\
                if (items[j].defaultAnims.default != null && items[j].centralPerspectiveWalkBehind != null)\n\
                    testRoomsList[i].walkBehindList.push({\'walkBehind\': items[j].centralPerspectiveWalkBehind, \'itemId\': items[j].id});\n\
                if (items[j].hotspot != null) {\n\
                    var hotspotCopy = new Polygon();\n\
                    var hotspot = items[j].hotspot;\n\
                    for (var k = 0; k < hotspot.points.length; k++)\n\
                        hotspotCopy.points[k] = new paper.Point(hotspot.points[k][1], hotspot.points[k][2]);\n\
                    if(hotspot.closed)\n\
                        hotspotCopy.close();\n\
                    items[j].hotspot = hotspotCopy;\n\
                        //items[j].onClick = testMapIdItem[items[j].id].onClick;\n\
                        //items[j].onHover = testMapIdItem[items[j].id].onHover;\n\
                        //items[j].onWalk = testMapIdItem[items[j].id].onWalk;\n\
                        ;\n\
                }\n\
                testMapIdRoom[testRoomsList[i].id] = testRoomsList[i];\n\
            }\n\
            for(var j in testRoomsList[i].walkBoxes)\n\
            {\n\
                var walkBox = testRoomsList[i].walkBoxes[j];\n\
                var poly = new Polygon();\n\
                var polygon = walkBox.polygon;\n\
                for (var k = 0; k < polygon.points.length; k++)\n\
                {\n\
                    poly.points[k] = new paper.Point(polygon.points[k][1], polygon.points[k][2]);\n\
                }\n\
                if(polygon.closed)\n\
                    poly.close();\n\
                testRoomsList[i].walkBoxes[j].polygon = poly;\n\
                testMapIdWalkbox[j] = testRoomsList[i].walkBoxes[j];\n\
            }\n\
        \n\
        }\n\
        computeWalkboxNeighbors(testMapIdRoom);\n\
    \n\
        for(var i = 0; i < testAnimsList.length; i++)\n\
        {    \n\
            testMapIdAnim[testAnimsList[i].id] = testAnimsList[i];\n\
            for(var j = 0; j < editorAnimsList[i].frames.length; j++)\n\
            {\n\
                var frame = testAnimsList[i].frames[j];\n\
                    if (frame)\n\
                \n\
                    {\n\
                        var img = new Image();\n\
                        img.src = frame.img;\n\
                        testAnimsList[i].frames[j] = {img: img};\n\
                    }\n\
                    testAnimsList[i].incrCurrIdx = incrCurrFrame;\n\
                    testAnimsList[i].play = startRollingFrames;\n\
                    testAnimsList[i].stop = stopRollingFrames;\n\
            }\n\
        }\n\
        \n\
        for (var i = 0; i < testCharactersList.length; i++)\n\
        {\n\
            testCharactersList[i].scaleFactor = 1;\n\
            testCharactersList[i].getCurrentFrame = getItemCurrentFrame;\n\
            testCharactersList[i].setLayer = setItemLayer;\n\
            testMapIdItem[testCharactersList[i].id] = testCharactersList[i];\n\
        }\n\
    \n\
        for(var key in gameScripts[\'Events\'])\n\
        {\n\
            $(document).off(key);\n\
            (function(key)\n\
            {\n\
                $(document).on(key, function()\n\
                {\n\
                    eval(gameScripts[\'Events\'][key]);\n\
                });\n\
            })(key);\n\
        }\n\
        for(var key in editorMapIdAudio)\n\
        {\n\
            var audio = new Audio();\n\
            audio.src = editorMapIdAudio[key].audioData;\n\
            testMapIdAudio[key] = audio;\n\
        }\n\
        setCurrentCharacter(testCharactersList[0].id);\n\
    \n\
        currentCharacter.inventory = [];\n\
        //setObjectLocation(currentCharacter.id, currentCharacter.locationId);\n\
        testCurrentAction = testGameActions[0].description;\n\
        testCurrentSentence = testCurrentAction;\n\
        testInventory = new Array();\n\
        \n\
        currentCharacter.path = [];\n\
        if(currentCharacter.walkInt)\n\
            clearInterval(currentCharacter.walkInt);\n\
        currentCharacter.walkInt = null;\n\
        \n\
        sceneSentences = {};\n\
        pathfinder = new PathFinder();\n\
        guiObj = initGUI(resolution, guiStyle);\n\
        \n\
        var $gameCanvas = $(\'#game-canvas\');\n\
        $gameCanvas.css({\'background\' : \'black\', \'cursor\' : \'none\', \'border\' : \'1px solid black\' });\n\
        gameCanvas = $gameCanvas[0];\n\
        gameCtx = gameCanvas.getContext(\'2d\');\n\
        \n\
        gameCanvas.width = resolution.width;\n\
        gameCanvas.height = resolution.height;\n\
        setCanvasResolution(gameCanvas, window.screen.width, window.screen.height);\n\
        \n\
        gameCtx.font = \'30px LEC\';\n\
        gameCtx.fillStyle = \'white\';\n\
        gameCtx.strokeStyle = \'black\';\n\
        \n\
        mousePos = { x: 0, y: 0};\n\
        \n\
        $(gameCanvas).mousedown(function(e)\n\
        {\n\
            e.preventDefault();\n\
            e.stopImmediatePropagation();\n\
            var BUTTON_RIGHT = 3;\n\
        \n\
            if(e.which == BUTTON_RIGHT && guiObj.listening)\n\
            {\n\
                if(!guiObj.inventoryOpen)\n\
                {\n\
                    hovering = null;\n\
                    guiObj.hovering = null;\n\
                    stopPath(currentCharacter);\n\
                    currentCharacter.path = [];\n\
                }\n\
                guiObj.inventoryOpen = !guiObj.inventoryOpen;\n\
                guiObj.setCursor(\'default\');\n\
                guiObj.onScreen = false;\n\
                guiObj.sentence = \'\';\n\
                return;\n\
            }\n\
    \n\
            var offset = $(this).offset();\n\
            var relX = Math.round((e.pageX - offset.left) / scaleFactor.x);\n\
            var relY = Math.round((e.pageY - offset.top) / scaleFactor.y);\n\
    \n\
            if(guiObj.actionSelected)\n\
            {\n\
                if(guiObj.actionSelected !== \'Combine\')\n\
                {\n\
                    var action = guiObj.actionSelected;\n\
                    var obj = guiObj.hovering;\n\
                    if(gameScripts[guiObj.actionSelected][guiObj.hovering])\n\
                    {\n\
                        if(obj in testMapIdInvItem)\n\
                            try\n\
                            {\n\
                                eval(gameScripts[action][obj].code);\n\
                            }\n\
                            catch (err)\n\
                            {\n\
                                alert(err);\n\
                            }\n\
                        else\n\
                            try\n\
                            {\n\
                                walkToObj(currentCharacter.id, guiObj.hovering, null, function ()\n\
                                {\n\
                                    setDirection(currentCharacter.id, testMapIdItem[obj].faceDir);\n\
                                    eval(gameScripts[action][obj].code);\n\
                                });\n\
    \n\
                            }\n\
                            catch (err)\n\
                            {\n\
                                alert(err);\n\
                            }\n\
                    }\n\
                }\n\
                else\n\
                {\n\
                    var img = testMapIdAnim[testMapIdInvItem[guiObj.hovering].anim].frames[0].img;\n\
                    guiObj.setCursor(guiObj.hovering, img, -img.width / 2, 0);\n\
                }\n\
                guiObj.sentence = \'\';\n\
                guiObj.hovering = null;\n\
                guiObj.onScreen = false;\n\
                guiObj.actionSelected = null;\n\
                $gameCanvas.trigger(\'mousemove\');\n\
                return;\n\
            }\n\
            if(!guiObj.inventoryOpen)\n\
            {\n\
                if(guiObj.dialogOpen)\n\
                {\n\
                    var dialog = testMapIdDialog[guiObj.dialogOpen];\n\
                    var dialogChoices = dialog.subdialogs[dialog.currentSubDialog];\n\
                    for(var i = 0; i < dialogChoices.length; i++)\n\
                        if(dialogChoices[i].hovering)\n\
                        {\n\
                            dialogChoices[i].hovering = false;\n\
                            for(var j = 0; j < dialogChoices.length; j++)\n\
                            {\n\
                                if(dialogChoices[j].showOnce === true)\n\
                                    dialogChoices[j].hidden = true;\n\
                            }\n\
                //alert(dialogChoices[i].sentence);\n\
                var choice = dialogChoices[i];\n\
                if (choice.script)\n\
                    try\n\
                    {\n\
                        if(choice.chooseOnce)\n\
                            choice.hidden = true;\n\
                        if(choice.open)\n\
                        {\n\
                            dialog.currentSubDialog = choice.open;\n\
                            hideDialog();\n\
                        }\n\
                        else closeDialog();\n\
                        disableInput();\n\
                        eval(gameScripts[dialogChoices[i].script].code.concat());\n\
                    }\n\
                    catch (err) { alert(err); }\n\
                else\n\
                {\n\
                    closeDialog();\n\
                    enableInput();\n\
                }\n\
                return;\n\
            }\n\
            return;\n\
        }\n\
        if(!hovering)\n\
        {\n\
            if (guiObj.onScreen)\n\
            {\n\
                guiObj.sentence = \'\';\n\
                guiObj.hovering = null;\n\
                guiObj.onScreen = false;\n\
                guiObj.item = null;\n\
                return;\n\
            }\n\
    \n\
            if(guiObj.cursor.state !== \'default\')\n\
            {\n\
                guiObj.setCursor(\'default\');\n\
                return;\n\
            }\n\
       \n\
            relX += viewport.left;\n\
            relY += viewport.top;\n\
            if (actionSelected == \'Walk_to\' && guiObj.listening)\n\
            {\n\
                walkToPos(currentCharacter.id, relX, relY, [], null);\n\
            }\n\
            return;\n\
        }\n\
    \n\
        if(guiObj.cursor.state == \'default\')\n\
        {\n\
            guiObj.setPivot(relX, relY);\n\
            if (guiObj.onScreen)\n\
            {\n\
                guiObj.onScreen = false;\n\
                var ev = new jQuery.Event(\'mousemove\');\n\
                ev.pageX = e.pageX;\n\
                ev.pageY = e.pageY;\n\
                $(gameCanvas).trigger(ev);\n\
            }\n\
            guiObj.onScreen = \"almost\";\n\
            guiObj.item = null;\n\
            guiObj.hovering = hovering;\n\
        }\n\
        else if(guiObj.cursor.state === \'exit\')\n\
        {\n\
            var obj = testMapIdItem[hovering];\n\
            if(!mouseDown)\n\
            {\n\
                e.stopImmediatePropagation();\n\
                mouseDown = true;\n\
                walkToObj(currentCharacter.id, obj.id, null, function ()\n\
                {\n\
                    setPosition(currentCharacter.id, obj.exitTo.room, obj.exitTo.xPos, obj.exitTo.yPos);\n\
                });\n\
                setTimeout(function() { mouseDown = false; }, mouseDownTimer);\n\
            }\n\
            else\n\
            {\n\
                stopPath(currentCharacter);\n\
                setPosition(currentCharacter.id, obj.exitTo.room, obj.exitTo.xPos, obj.exitTo.yPos);\n\
            }\n\
            return;\n\
        }\n\
        else\n\
        {\n\
            var obj1 = guiObj.cursor.state;\n\
            var obj2 = hovering;\n\
    \n\
            try\n\
            {\n\
                walkToObj(currentCharacter.id, obj2, null, function ()\n\
                {\n\
                    setDirection(currentCharacter.id, testMapIdItem[obj2].faceDir);\n\
                    eval(gameScripts[\'Combine\'][obj1][obj2].code);\n\
                });\n\
    \n\
            }\n\
            catch (err) { }\n\
            hovering = null;\n\
            guiObj.sentence = \'\';\n\
            guiObj.hovering = null;\n\
            guiObj.setCursor(\'default\');\n\
            return;\n\
        }\n\
        stopPath(currentCharacter);\n\
    }\n\
    else if(!guiObj.dialogOpen)\n\
    {\n\
        var hoveredInvItem = guiObj.getHoveredInvItem();\n\
        if(!hoveredInvItem)\n\
        {\n\
            var invMargin = guiObj.getInvMargin();\n\
            if(mousePos.x < invMargin || mousePos.x > resolution.width - invMargin\n\
                || mousePos.y < invMargin || mousePos.y > resolution.height - invMargin)\n\
            {\n\
                guiObj.inventoryOpen = false;\n\
            }\n\
            guiObj.onScreen = false;\n\
            guiObj.setCursor(\'default\');\n\
            return;\n\
        }\n\
        if(guiObj.cursor.state !== \'default\')\n\
        {\n\
            if(guiObj.cursor.state !== hoveredInvItem.id)\n\
            {\n\
                eval(gameScripts[\'Combine\'][guiObj.cursor.state][hoveredInvItem.id].code);\n\
                guiObj.setCursor(\'default\');\n\
            }\n\
            return;\n\
        }\n\
        guiObj.setPivot(relX, relY);\n\
        guiObj.onScreen = true;\n\
        guiObj.hovering = hovering;\n\
    }\n\
    });\n\
    $(gameCanvas).mousemove(function(e)\n\
    {\n\
        e.preventDefault();\n\
        e.stopImmediatePropagation();\n\
    \n\
        var offset = $(this).offset();\n\
        var relX = Math.round((e.pageX - offset.left) / scaleFactor.x);\n\
        var relY = Math.round((e.pageY - offset.top) / scaleFactor.y);\n\
    \n\
        if(!isNaN(relX) && !isNaN(relY))\n\
        {\n\
            mousePos.x = relX;\n\
            mousePos.y = relY;\n\
        }\n\
    \n\
        if(guiObj.onScreen === true)\n\
        {\n\
            var btnHovering = false;\n\
            hovering = null;\n\
            if(getDistanceBetweenPoints(mousePos, guiObj.magnifierButtonCenter) < guiObj.getButtonRadius())\n\
            {\n\
                guiObj.setActionSelected(\'look\');\n\
                btnHovering = true;\n\
            }\n\
            else if(getDistanceBetweenPoints(mousePos, guiObj.handButtonCenter) < guiObj.getButtonRadius())\n\
            {\n\
                guiObj.setActionSelected(\'use\');\n\
                btnHovering = true;\n\
    \n\
            }\n\
            else if(getDistanceBetweenPoints(mousePos, guiObj.mouthButtonCenter) < guiObj.getButtonRadius())\n\
            {\n\
                guiObj.setActionSelected(\'talk\');\n\
                btnHovering = true;\n\
            }\n\
            else if(getDistanceBetweenPoints(mousePos, guiObj.cogwheelButtonCenter) < guiObj.getButtonRadius())\n\
            {\n\
                guiObj.setActionSelected(\'combine\');\n\
                btnHovering = true;\n\
            }\n\
    \n\
            if(btnHovering)\n\
            {\n\
                var sentence = null;\n\
                \n\
                if (gameScripts[guiObj.actionSelected][guiObj.hovering])\n\
                    sentence = gameScripts[guiObj.actionSelected][guiObj.hovering].sentence;\n\
    \n\
                if (guiObj.hovering in testMapIdItem)\n\
                    guiObj.sentence = sentence ? sentence : editorMapIdAction[guiObj.actionSelected].description + \' \' + testMapIdItem[guiObj.hovering].description;\n\
                else if (guiObj.hovering in testMapIdInvItem)\n\
                    guiObj.sentence = sentence ? sentence : editorMapIdAction[guiObj.actionSelected].description + \' \' + testMapIdInvItem[guiObj.hovering].description;\n\
                else\n\
                    guiObj.sentence = \'Combine \' + testMapIdInvItem[guiObj.hovering].description;\n\
            \n\
                return;\n\
            }\n\
    \n\
            guiObj.setActionSelected(null);\n\
            return;\n\
        }\n\
    \n\
        relX += viewport.left;\n\
        relY += viewport.top;\n\
    \n\
        if(guiObj.dialogOpen)\n\
        {\n\
            var dialogTopLeft = guiObj.getDialogMargin();\n\
            var x = dialogTopLeft.left;\n\
            var y = dialogTopLeft.top - 20;\n\
    \n\
            var dialog = testMapIdDialog[guiObj.dialogOpen];\n\
            var dialogChoices = dialog.subdialogs[dialog.currentSubDialog];\n\
    \n\
            for(var i = 0; i < dialogChoices.length; i++)\n\
            {\n\
                if(dialogChoices[i].hidden === true)\n\
                    continue;\n\
                dialogChoices[i].hovering = false;\n\
                if(mousePos.x >= x && mousePos.y >= y && mousePos.y <= y + 20)\n\
                {\n\
                    dialogChoices[i].hovering = true;\n\
                }\n\
                y += 40;\n\
            }\n\
            return;\n\
        }\n\
        if(!guiObj.listening)\n\
            return;\n\
    \n\
        if(!guiObj.inventoryOpen)\n\
        {\n\
            var reverseLayers = [];\n\
            for (var i in testCurrentRoom.zOrderMap)\n\
                reverseLayers.unshift(i);\n\
            for(var i = 0; i < testCharactersList.length; i++)\n\
            {\n\
                if(testCharactersList[i].id === currentCharacter.id)\n\
                    continue;\n\
                var character = testCharactersList[i] ;\n\
                if (character.visible && character.hotspot && isPointInPoly(character.hotspot.points, { x: relX, y: relY }) == true)\n\
                {\n\
                    hovering = character.id;\n\
                    if (!guiObj.onScreen)\n\
                    {\n\
                        if(guiObj.cursor.state === \'default\')\n\
                            guiObj.sentence = character.description;\n\
                        else\n\
                        {\n\
                            var sentence = \'Combine \' + testMapIdInvItem[guiObj.cursor.state].description + \' with \' + testMapIdItem[hovering].description;\n\
                            try\n\
                            {\n\
                                sentence = (gameScripts[\'Combine\'][guiObj.cursor.state][hovering].sentence) ? gameScripts[\'Combine\'][guiObj.cursor.state][hovering].sentence : sentence;\n\
                            }\n\
                            catch(err) {}\n\
                            guiObj.sentence = sentence;\n\
                        }\n\
                    }\n\
                    return;\n\
                }\n\
            }\n\
    \n\
            for (var i = 0; i < reverseLayers.length; i++)\n\
            {\n\
                var items = testCurrentRoom.zOrderMap[reverseLayers[i]];\n\
                for (var j = 0; j < items.length; j++)\n\
                {\n\
                    var item = testMapIdItem[items[j]];\n\
                    if (item.visible && item.hotspot && isPointInPoly(item.hotspot.points, { x: relX, y: relY }) == true)\n\
                    {\n\
                        hovering = item.id;\n\
                        if (!guiObj.onScreen)\n\
                        {\n\
                            if(item.exitTo.room)\n\
                            {\n\
                                if(guiObj.cursor.state === \'default\')\n\
                                    guiObj.setCursor(\'exit\');\n\
                                else if(guiObj.cursor.state !== \'exit\')\n\
                                {\n\
                                    hovering = null;\n\
                                    return;\n\
                                }\n\
                            }\n\
                            else if(guiObj.cursor.state === \'default\')\n\
                                guiObj.sentence = item.description;\n\
                            else if(guiObj.cursor.state !== \'exit\')\n\
                            {\n\
                                var sentence = \'Combine \' + testMapIdInvItem[guiObj.cursor.state].description + \' with \' + testMapIdItem[hovering].description;\n\
                                try\n\
                                {\n\
                                    sentence = (gameScripts[\'Combine\'][guiObj.cursor.state][hovering].sentence) ? gameScripts[\'Combine\'][guiObj.cursor.state][hovering].sentence : sentence;\n\
                                }\n\
                                catch(err) {}\n\
                                guiObj.sentence = sentence;\n\
                            }\n\
                        }\n\
                        return;\n\
                    }\n\
                }\n\
            }\n\
            if (!guiObj.onScreen)\n\
                guiObj.sentence = \'\';\n\
            hovering = null;\n\
            if(guiObj.cursor.state === \'exit\')\n\
                guiObj.setCursor(\'default\');\n\
        }\n\
        else\n\
        {\n\
            if(!guiObj.actionSelected)\n\
                if(guiObj.cursor.state != \'default\')\n\
                {\n\
                    var invMargin = guiObj.getInvMargin();\n\
    \n\
                    if (mousePos.x < invMargin || mousePos.x > resolution.width - invMargin\n\
                        || mousePos.y < invMargin || mousePos.y > resolution.height - invMargin)\n\
                    {\n\
                        guiObj.inventoryOpen = false;\n\
                        return;\n\
                    }\n\
                }\n\
            var hoveredItem = guiObj.getHoveredInvItem();\n\
            if(!hoveredItem || hoveredItem.id == guiObj.cursor.state)\n\
                return;\n\
            hovering = hoveredItem.id;\n\
            if (!guiObj.onScreen)\n\
            {\n\
                if(guiObj.cursor.state === \'default\')\n\
                    guiObj.sentence = testMapIdInvItem[hoveredItem.id].description;\n\
                else\n\
                {\n\
                    var sentence = \'Combine \' + testMapIdInvItem[guiObj.cursor.state].description + \' with \' + testMapIdInvItem[hoveredItem.id].description;\n\
                    try\n\
                    {\n\
                        sentence = (gameScripts[\'Combine\'][guiObj.cursor.state][hoveredItem.id].sentence) ? gameScripts[\'Combine\'][guiObj.cursor.state][hoveredItem.id].sentence : sentence;\n\
                    }\n\
                    catch (err) {}\n\
                    guiObj.sentence = sentence;\n\
                }\n\
            }\n\
        }\n\
    });\n\
    $(gameCanvas).contextmenu(function(e)\n\
    {\n\
        e.preventDefault();\n\
    });\n\
    setCurrentRoom(testRoomsList[0].id);\n\
    drawInterval = setInterval(function() { drawScene(); }, 1000/30);\n\
    };\n');

    nativeFunctions.push('var setPosition = ' + setPosition.toString());
    nativeFunctions.push('var walkToPos = ' + walkToPos.toString());
    nativeFunctions.push('var walkToObj = ' + walkToObj.toString());
    nativeFunctions.push('var egoWalkToObj = ' + egoWalkToObj.toString());
    nativeFunctions.push('var egoWalkToPos = ' + egoWalkToPos.toString());
    nativeFunctions.push('var show = ' + show.toString());
    nativeFunctions.push('var hide = ' + hide.toString());
    nativeFunctions.push('var inventoryAdd = ' + inventoryAdd.toString());
    nativeFunctions.push('var inventoryRemove = ' + inventoryRemove.toString());
    nativeFunctions.push('var sayLine = ' + sayLine.toString());
    nativeFunctions.push('var egoSayLine = ' + egoSayLine.toString());
    nativeFunctions.push('var setDirection = ' + setDirection.toString());
    nativeFunctions.push('var setState = ' + setState.toString());
    nativeFunctions.push('var enableInput = ' + enableInput.toString());
    nativeFunctions.push('var disableInput = ' + disableInput.toString());
    nativeFunctions.push('var openDialog = ' + openDialog.toString());
    nativeFunctions.push('var hideDialog = ' + hideDialog.toString());
    nativeFunctions.push('var closeDialog = ' + closeDialog.toString());
    nativeFunctions.push('var Sequence = ' + Sequence.toString());
    nativeFunctions.push('var SortedSequence = ' + SortedSequence.toString());
    nativeFunctions.push('var delay = ' + delay.toString());
    nativeFunctions.push('var egoSetDirection = ' + egoSetDirection.toString());
    nativeFunctions.push('var setCurrentRoom = ' + setCurrentRoom.toString());
    nativeFunctions.push('var egoSetState = ' + egoSetState.toString());
    nativeFunctions.push('var playAudio = ' + playAudio.toString());
    nativeFunctions.push('var drawScene = ' + drawScene.toString());
    nativeFunctions.push('var drawGUI = ' + drawGUI.toString());
    nativeFunctions.push('var drawGUISentence = ' + drawGUISentence.toString());
    nativeFunctions.push('var drawSentences = ' + drawSentences.toString());
    nativeFunctions.push('var drawInventory = ' + drawInventory.toString());
    nativeFunctions.push('var drawCursor = ' + drawCursor.toString());
    nativeFunctions.push('var drawSprite = ' + drawSprite.toString());
    nativeFunctions.push('var getBottomMiddlePos = ' + getBottomMiddlePos.toString());
    nativeFunctions.push('var setCurrentCharacter = ' + setCurrentCharacter.toString());
    nativeFunctions.push('var setCurrentRoom = ' + setCurrentRoom.toString());
    nativeFunctions.push('var setObjectLocation = ' + setObjectLocation.toString());
    nativeFunctions.push('var getItemZIndex = ' + getItemZIndex.toString());
    nativeFunctions.push('var startPath = ' + startPath.toString());
    nativeFunctions.push('var updatePath = ' + updatePath.toString());
    nativeFunctions.push('var stopPath = ' + stopPath.toString());
    nativeFunctions.push('var interpolateScaleAndSpeed = ' + interpolateScaleAndSpeed.toString());
    nativeFunctions.push('var setCurrentRoom = ' + setCurrentRoom.toString());
    nativeFunctions.push('var setCurrentRoom = ' + setCurrentRoom.toString());
    nativeFunctions.push('var setCurrentRoom = ' + setCurrentRoom.toString());
    nativeFunctions.push('var setCurrentRoom = ' + setCurrentRoom.toString());
    nativeFunctions.push('var computeWalkboxNeighbors = ' + computeWalkboxNeighbors.toString());
    nativeFunctions.push('var getEdgeList = ' + getEdgeList.toString());
    nativeFunctions.push('var Neighbor = ' + Neighbor.toString());
    nativeFunctions.push('var Walkbox = ' + WalkBox.toString());
    nativeFunctions.push('var Polygon = ' + Polygon.toString());
    nativeFunctions.push('var PathFinder = ' + PathFinder.toString());
    nativeFunctions.push('var SearchGraphNode = ' + SearchGraphNode.toString());
    nativeFunctions.push('var initGUI = ' + initGUI.toString());
    nativeFunctions.push('var Anim = ' + Anim.toString());
    nativeFunctions.push('var EditorSprite = ' + EditorSprite.toString());
    nativeFunctions.push('var addAnimFrame = ' + addAnimFrame.toString());
    nativeFunctions.push('var removeAnimFrame = ' + removeAnimFrame.toString());
    nativeFunctions.push('var incrCurrFrame = ' + incrCurrFrame.toString());
    nativeFunctions.push('var startRollingFrames = ' + startRollingFrames.toString());
    nativeFunctions.push('var stopRollingFrames = ' + stopRollingFrames.toString());
    nativeFunctions.push('var cameraCenterItem = ' + cameraCenterItem.toString());
    nativeFunctions.push('var getItemPlaceHolder = ' + getItemPlaceHolder.toString());
    nativeFunctions.push('var setItemLayer = ' + setItemLayer.toString());
    nativeFunctions.push('var isPointInPoly = ' + isPointInPoly.toString());
    nativeFunctions.push('var getWalkboxFromPoint = ' + getWalkboxFromPoint.toString());
    nativeFunctions.push('var getNearestWalkBox = ' + getNearestWalkBox.toString());
    nativeFunctions.push('var getPolygonCentroid = ' + getPolygonCentroid.toString());
    nativeFunctions.push('var getPolygonTopAndBottom = ' + getPolygonTopAndBottom.toString());
    nativeFunctions.push('var getDistanceFromPoints = ' + getDistanceFromPoints.toString());
    nativeFunctions.push('var getDistanceBetweenPoints = ' + getDistanceBetweenPoints.toString());
    nativeFunctions.push('var EditorItem = ' + EditorItem.toString());
    nativeFunctions.push('var getItemCurrentFrame = ' + getItemCurrentFrame.toString());
    nativeFunctions.push('var Point = ' + Point.toString());
    nativeFunctions.push('var getCommonEdge = ' + getCommonEdge.toString());
    nativeFunctions.push('var getLineSlope = ' + getLineSlope.toString());
    nativeFunctions.push('var getNextPointInLine = ' + getNextPointInLine.toString());
    nativeFunctions.push('var normalizeVector = ' + normalizeVector.toString());
    nativeFunctions.push('var getVector = ' + getVector.toString());
    nativeFunctions.push('var wrapText = ' + wrapText.toString());
    nativeFunctions.push('var checkLineIntersection = ' + checkLineIntersection.toString());
    nativeFunctions.push('var setDescription = ' + setDescription.toString());
    nativeFunctions.push('var fireEvent = ' + fireEvent.toString());
    nativeFunctions.push('var throwError = ' + throwError.toString());
    nativeFunctions.push('var setCanvasResolution = ' + setCanvasResolution.toString());
    nativeFunctions.push('var qSort = ' + qSort.toString());

    nativeFunctions.push('var drawPolygon = ' + drawPolygon.toString());
    nativeFunctions.push('var DEBUG_drawWalkBoxes = ' + DEBUG_drawWalkBoxes.toString());

    var program = header + '\n<script>\n';
    for(var i = 0; i < nativeFunctions.length; i++)
        program += nativeFunctions[i] + '\n';
    program += globalVars + '\n</script>\n</body>';

    program = program.replace(/testGameActions/g, 'gameActions')
        .replace(/testMapIdEvent/g, 'mapIdEvent')
        .replace(/testMapIdItem/g, 'mapIdItem')
        .replace(/testCurrentRoom/g, 'currentRoom')
        .replace(/game-test-container/g, 'game-container')
        .replace(/editorActionsList/g, 'testGameActions')
        .replace(/editorAnimsList/g, 'animsList')
        .replace(/testMapIdInvItem/g, 'mapIdInvItem')
        .replace(/testMapIdRoom/g, 'mapIdRoom')
        .replace(/testMapIdItem/g, 'mapIdItem')
        .replace(/testCurrentCharacter/g, 'currentCharacter')
        .replace(/testRoomsList/g, 'roomsList')
        .replace(/testInvItemsList/g, 'invItemsList')
        .replace(/editorScriptList/g, 'scripts')
        .replace(/testGameActions/g, 'gameActions')
        .replace(/editorMapIdAnim/g, 'mapIdAnim')
        .replace(/editorMapIdRoom/g, 'mapIdRoom')
        .replace(/testMapIdAnim/g, 'mapIdAnim')
        .replace(/testMapIdDialog/g, 'mapIdDialog')
        .replace(/testCharactersList/g, 'charactersList')
        .replace(/testAnimsList/g, 'animsList')
        .replace(/editorMapIdDialog/g, 'mapIdDialog')
        .replace(/editorMapIdAudio/g, 'mapIdAudio')
        .replace(/EditorSprite/g, 'Sprite')
        .replace(/gameScripts/g, 'scripts')
        .replace(/EditorItem/g, 'Item')
        .replace(/editorMapIdAction/g, 'mapIdAction');



    var blob = new Blob([program], {type : 'text/html'});
    var pom = document.createElement('a');
    //pom.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('href', URL.createObjectURL(blob));
    pom.setAttribute('download', 'game.html');
    pom.click();
};

var compileScripts = function()
{
    var gameScripts = {};
    for(var i = 0; i < editorActionsList.length; i++)
        gameScripts[editorActionsList[i].id] = {};
    for(var key in editorScriptList)
        scriptInterpreter(editorScriptList[key], gameScripts);
    for(var key in gameScripts)
    {
        if(key === 'Events')
            continue;
        for (var item in editorMapIdItem)
            if(key !== 'Combine')
            {
                if (gameScripts[key][item] === undefined)
                    gameScripts[key][item] = { 'code': defaultReactions[key] };
            }
            else break;

        //gameScripts[key][item] = { 'code' : getDefaultReaction(key, item) };
        //createDefaultScript('item', [key, item]);
        for (var item in editorMapIdInvItem)
            if(key !== 'Combine')
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

    for(var key1 in editorMapIdDialog)
    {
        for(var key2 in editorMapIdDialog[key1].subdialogs)
        {
            var subD = editorMapIdDialog[key1].subdialogs[key2];
            for(var i = 0; i < subD.length; i++)
                if(subD[i].script)
                    gameScripts[subD[i].script] = scriptInterpreter(editorScriptList[subD[i].script], gameScripts);
        }
    }

    return gameScripts;
};