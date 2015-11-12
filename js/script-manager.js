var editorScriptList = { };

var ScriptTree = function(scriptElement)
{
    this.children = new Array();
    this.scriptElement = scriptElement;
    this.type = null;
};

var Script = function(code, scriptTriggerers)
{
    //this.scriptTree = scriptTree;
    this.code = code;
    this.scriptTriggerers = scriptTriggerers;
};

var ScriptElement = function(f, params)
{
    this.f = f;
    this.params = params;
    this.execute = function(abort, callback) {
        window[f].apply(this, params.concat([abort]).concat([callback]));
    };
};

var ScriptTriggerer = function(type, params)
{
    this.type = type;
    this.params = params;
};

var Aggregator = function(type, body, cond)
{
    this.body = body;
    this.type = type;
    this.processIdx = 0;
    this.execute = function(check, callback)
    {
        if(this.type == 'Parallel')
        {
            var interruptibleCount = 0;
            var completedInterruptible = 0;
            for(var i = 0; i < body.length; i++)
            {
                if(body[i].type == 'atomic')
                    body[i].f();
                if(body[i].type == 'interruptible')
                {
                    interruptibleCount++;
                    var dfd = $.Deferred();
                    dfd.done(function()
                    {
                        completedInterruptible++;
                        if(completedInterruptible == interruptibleCount)
                            callback.resolve();
                    });
                    body[i].f(dfd);
                }
            }
            if(interruptibleCount == 0)
                callback.resolve();
            return;
        }
        if(this.type == 'If' && check == true)
        {
            if(!eval(cond))
                return;
        }
        for (var i = this.processIdx; i < body.length; i++)
            if(body[i].type == 'atomic')
                body[i].f();
            else if(body[i].type == 'interruptible' || body[i].type == 'Parallel')
            {
                var dfd = $.Deferred();
                var that = this;
                dfd.done(function()
                {
                    that.processIdx = i + 1;
                    if(that.processIdx == that.body.length)
                    {
                        that.processIdx = 0;
                        if(callback)
                            callback.resolve();
                    }
                    else
                        that.execute(false, callback);
                });
                if(body[i].type == 'interruptible')
                    body[i].f(dfd);
                else
                    body[i].execute(false, dfd);
                return;
            }
            else if(body[i].type == 'If')
            {
                body[i].execute(true, callback);
            }
        this.processIdx = 0;
        if(callback)
            callback.resolve();
    }
};

var scriptTreeInterpreter = function(scriptTree)
{
    if(!scriptTree)
        return null;

    if (scriptTree.type == 'game-controllers') {
        if (scriptTree.scriptElement.f == 'Aggregator') {
            var body = [];

            for (var i = 0; i < scriptTree.children.length; i++)
                body.push(scriptTreeInterpreter(scriptTree.children[i]));

            return new Aggregator(scriptTree.scriptElement.params[0], body, true);
        }
        else if (scriptTree.scriptElement.f == 'If')
        {
            var expr = new Parser().parse(scriptTree.scriptElement.params[0]);
            if(expr.valid == false)
                throwError('Bad if-guard: \"' + scriptTree.scriptElement.params[0] + '\"')();
            var body = [];

            for (var i = 0; i < scriptTree.children.length; i++)
                body.push(scriptTreeInterpreter(scriptTree.children[i]));
            return new Aggregator('If', body, scriptTree.scriptElement.params[0]);

        }
        else
        {
            throwError('Error: bad scriptTree.')();
        }
    }
    else if (scriptTree.type == 'game-side-effects') {
        //if (scriptTree.scriptElement.f === 'waitEvent')
        //    return evreact.expr.simple({});//events[scriptTree.scriptElement.params[0]]);
        if (scriptTree.scriptElement.f in atomicEffects)
            return {type : 'atomic', f : function() {
                atomicEffects[scriptTree.scriptElement.f].apply(null, scriptTree.scriptElement.params) }};
        if (scriptTree.scriptElement.f in interruptibleEffects)
            return {type : 'interruptible', f : function(dfd) {
                interruptibleEffects[scriptTree.scriptElement.f].apply(null, scriptTree.scriptElement.params.concat([[], dfd])) }};
        (function() { var errMsg = "Unknown side effect: " + scriptTree.scriptElement.f; alert(errMsg); throw errMsg; })();

        return null;
    }


};

var scriptTriggererInterpreter = function(triggerer)
{
    var definedTriggerer = { type : triggerer.type };

    switch(triggerer.type)
    {
        case 'user-trigger':
            definedTriggerer.action = triggerer.params[0];
            definedTriggerer.obj1 = triggerer.params[1];
            definedTriggerer.sentence = triggerer.params[4];

            if(triggerer.params[2])
            {
                definedTriggerer.obj2 = triggerer.params[3];
            }
            break;
        case 'event-trigger':
            definedTriggerer.eventName = triggerer.params[0];
            break;
        case 'timer-trigger':
            break;
        case 'enter-room-trigger':
        case 'exit-room-trigger':
            definedTriggerer.roomId = triggerer.params[0];
            break;
    }
    return definedTriggerer;
};

var scriptInterpreter = function(script, scriptMap)
{
    if(!script)
        return null;
    //var scriptBody = scriptTreeInterpreter(script.scriptTree);
    var scriptHeader = scriptTriggerersInterpreter(script.scriptTriggerers);

    for(var i = 0; i < scriptHeader.length; i++)
    {
        switch(scriptHeader[i].type)
        {
            case 'user-trigger':
                if
                    (scriptHeader[i].obj2)
                {
                    if (!scriptMap[scriptHeader[i].action][scriptHeader[i].obj1])
                        scriptMap[scriptHeader[i].action][scriptHeader[i].obj1] = {};
                    scriptMap[scriptHeader[i].action][scriptHeader[i].obj1][scriptHeader[i].obj2] = { code: script.code, sentence: scriptHeader[i].sentence};
                }
                else
                    switch (scriptHeader[i].action)
                    {
                        case 'Mouse click':
                            testMapIdItem[scriptHeader[i].obj1].onClick = { code: script.code, sentence: null };
                            break;
                        case 'Mouse hover':
                            testMapIdItem[scriptHeader[i].obj1].onHover = { code: script.code, sentence: null };
                            break;
                        case 'Walk on':
                            testMapIdItem[scriptHeader[i].obj1].onWalk = { code: script.code, sentence: null };
                            break;
                        default:
                            scriptMap[scriptHeader[i].action][scriptHeader[i].obj1] = { code: script.code, sentence: scriptHeader[i].sentence};
                            break;
                    }
                break;
            case 'event-trigger':
                if(!('Events' in scriptMap))
                    scriptMap['Events'] = {};
                scriptMap['Events'][scriptHeader[i].eventName] = script.code;
                break;
            case 'enter-room-trigger':
                if(!('EnterRoom' in scriptMap))
                    scriptMap['EnterRoom'] = {};
                scriptMap['EnterRoom'][scriptHeader[i].roomId] = script.code;
                break;
            case 'exit-room-trigger':
                break;

        }
    }

    return { code : script.code };
};

var scriptTriggerersInterpreter = function(scriptTriggerers)
{
    var triggerers = [];
    for(var i = 0; i < scriptTriggerers.length; i++)
        triggerers.push(scriptTriggererInterpreter(scriptTriggerers[i]));
    return triggerers;
};

var replaceScriptOccurrencies = function(script, type, oldId, newId)
{
    return;
    replaceScriptBodyOccurrencies(script.scriptTree, type, oldId, newId);
    replaceScriptTriggerersOccurrencies(script.scriptTriggerers, type, oldId, newId)
};

var replaceScriptBodyOccurrencies = function(scriptTree, type, oldId, newId)
{
    return;
    var length = scriptTree.children.length;

    for(var i = 0; i < length; i++)
        replaceScriptBodyOccurrencies(scriptTree.children[i], type, oldId, newId);

    var scriptElement = scriptTree.scriptElement;

    if(scriptElement.f == 'Aggregator')
        return;

    switch(type)
    {
        case 'item':
            switch(scriptElement.f)
            {
                case 'setPosition':
                case 'walkToPos':
                case 'sayLine':
                case 'show':
                case 'hide':
                case 'setState':
                    if(scriptElement.params[0] == oldId)
                        scriptElement.params[0] = newId;
                    break;
                case 'walkToObj':
                    if(scriptElement.params[0] == oldId)
                        scriptElement.params[0] = newId;
                    if(scriptElement.params[1] == oldId)
                        scriptElement.params[1] = newId;
                    break;
            }
            break;
        case 'room':
            switch(scriptElement.f)
            {
                case 'setPosition':
                    if(scriptElement.params[1] == oldId)
                        scriptElement.params[1] = newId;
                    break;
                case 'setRoom':
                    if(scriptElement.params[0] == oldId)
                        scriptElement.params[0] = newId;
                    break;

            }
            break;
        case 'inventoryItem':
            switch(scriptElement.f)
            {
                case 'inventoryAdd':
                case 'inventoryRemove':
                    if(scriptElement.params[0] == oldId)
                        scriptElement.params[0] = newId;
                    break;
            }
            break;
        case 'dialog':
            switch(scriptElement.f)
            {
                case 'openDialog':
                    if(scriptElement.params[0] == oldId)
                        scriptElement.params[0] = newId;
                    break;
            }
        default:
            break;
    }
};

var replaceScriptTriggerersOccurrencies = function(scriptTriggerers, type, oldId, newId)
{
    switch(type)
    {
        case 'inventoryItem':
        case 'item':
            for(var i = 0; i < scriptTriggerers.length; i++)
            {
                if(scriptTriggerers[i].type != 'user-trigger')
                    continue;
                if(scriptTriggerers[i].params[1] == oldId)
                    scriptTriggerers[i].params[1] = newId;
                if(scriptTriggerers[i].params[3] == oldId)
                    scriptTriggerers[i].params[3] = newId;
            }
            break;
    }
};

var SortedSequence = function(body, callback)
{
    this.processIdx = 0;
    this.body = body;

    this.execute = function()
    {
        for (var i = this.processIdx; i < body.length; i++)
        {
            if (!body[i].hasOwnProperty('params'))
                body[i].f();
            else
            {
                if(body[i].f in atomicEffects)
                {
                    atomicEffects[body[i].f].apply(null, body[i].params);
                    continue;
                }
                var dfd = $.Deferred();
                var that = this;
                dfd.done(function () { that.execute(); });
                that.processIdx = i + 1;
                interruptibleEffects[body[i].f].apply(null, body[i].params.concat([
                    [],
                    dfd
                ]));

                return;
            }
        }
        if(callback)
            callback();
    }
};

var Sequence = function(body)
{
    new SortedSequence(body, function()
    {
        if(guiObj.listening === false)
            enableInput();
        if(guiObj.dialogOpen)
        {
            openDialog(guiObj.dialogOpen);
        }
    }).execute();
};
