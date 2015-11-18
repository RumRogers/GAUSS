var EditorRoom = function(id)
{
   this.id = id;
   this.items = [];
   this.walkBoxes = {};
   this.zOrderMap = {};
   this.setId = setId;
   this.walkablePath = null;
   this.walkBehinds = [];
   this.onEnterScript = null;
   this.onExitScript = null;
};

var setId = function(newId)
{
    for(var i = 0; i < this.items.length; i++)
        this.items[i].parentRoomId = newId;

    for(var i = 0; i < editorCharactersList.length; i++)
        if(editorCharactersList[i].parentRoomId == this.id)
            editorCharactersList[i].parentRoomId = newId;

    this.id = newId;
};

var EditorItem = function(id, type, pRoomId)
{
    this.id = id;
    this.type = type;
    this.walkspot = { x : null, y : null};
    this.hotspot = null;
    this.visible = true;
    this.layer = 2;
    this.description = '';
    this.parentRoomId = pRoomId;
    this.setLayer = setItemLayer;
    this.position = { x : null, y : null };
    this.anim_state = null;
    this.dir = null;
    this.defaultAnims = {};
    this.customAnims = {};
    this.speechColor = '#ffffff';
    this.faceDir = 'Left';
    this.getCurrentFrame = getItemCurrentFrame;
    this.maxScaleFactor = 100;
    this.exitTo = { 'room' : null, xPos : null, yPos : null };

    switch(type)
    {
        case 'character':
            var initAnims = function() { return { 'FL' : null, 'FR' : null, 'FF' : null, 'FB' : null, 'FFL' : null, 'FFR' : null, 'FBL' : null, 'FBR' : null }; };
            this.defaultAnims.stand = initAnims();
            this.defaultAnims.walk = initAnims();
            this.defaultAnims.talk = initAnims();
            this.anim_state = 'stand';
            this.dir = 'FL';
        break;
        case 'object':
            this.defaultAnims.default = null;
            this.anim_state = 'default';
        break;
        default:
            throw 'Error: invalid object type';
        break;
    }
};

var getItemPlaceHolder = function(item)
{
    var anim;

    switch(item.type)
    {
        case 'object':
            anim = editorMapIdAnim[item.defaultAnims.default];
        break;
        case 'character':
            anim = editorMapIdAnim[item.defaultAnims.stand.FL];
        break;
    }
    if(anim)
        return anim.frames[anim.start_idx];
    return null;
};

var setItemLayer = function(l, which)
{
    l = parseInt(l);

    var parentRoom;

    if(!which)
        parentRoom = editorMapIdRoom[this.parentRoomId];
    else
        parentRoom = testMapIdRoom[this.parentRoomId];
    if(parentRoom.zOrderMap[this.layer])
    {
        var index = parentRoom.zOrderMap[this.layer].indexOf(this.id);
        if(index !== -1)
        {
            parentRoom.zOrderMap[this.layer].splice(index, 1);
            if (parentRoom.zOrderMap[this.layer].length == 0)
                delete parentRoom.zOrderMap[this.layer];
        }
    }
    if(parentRoom.zOrderMap[l] == undefined)
        parentRoom.zOrderMap[l] = [];
    parentRoom.zOrderMap[l].push(this.id);

    this.layer = l;
};

var getItemCurrentFrame = function()
{
    var anim;

    switch(this.type)
    {
        case 'object':
            anim = testMapIdAnim[this.defaultAnims[this.anim_state][this.dir]];
            break;
        case 'character':
            if(this.anim_state in this.defaultAnims)
                try {anim = testMapIdAnim[this.defaultAnims[this.anim_state][this.dir]];}
                catch(err) { alert(err); return; }
            else if(this.anim_state in this.customAnims)
                try {anim = testMapIdAnim[this.customAnims[this.anim_state]];}
                catch(err) { alert(err); return; }

            break;
    }
    if(anim)
        return anim.frames[anim.start_idx];
    return null;
};

var EditorSprite = function(image)
{
    this.img = image;
    this.centralPerspectiveWalkBehind = null;
    //this.boundingBox = new paper.Rectangle(0, 0, image.width, image.height);
    this.boundingBox = new paper.Rectangle();
    this.setPosition = function setPosition(left, top)
    {
        //this.boundingBox = new paper.Rectangle(left, top, this.boundingBox.width, this.boundingBox.height);
        this.boundingBox.setTopLeft(left, top);
    };
    this.setSize = function setSize(width, height)
    {
        this.boundingBox.setSize(width, height);
    };
    //this.setPosition(0, 0);
};

var editorRoomsList = [];
var editorRoomsCount = 0;
var editorItemsCount = 0;
var editorMapIdRoom = {};
var editorMapIdItem = {};
var editorCurrentRoom = null;
var editorCurrentItem = null;
var editorCurrentWalkBox = null;
var editorMapIdWb = {};
var editorWbCount = 0;

var createNewEditorRoom = function(id)
{
    var newEditorRoom = new EditorRoom(id);
    editorRoomsList.push(newEditorRoom);
    editorMapIdRoom[id] = newEditorRoom;
};

var setEditorRoomBackground = function(event)
{
    if(!event.target.files[0].type.match(/image.*/))
    {
        alert("Please choose an image file!");
        return;
    }
    $('.previous-file').hide();
    var newEditorItem;
    var fileReader = new FileReader();
    fileReader.onload = function(event){
        var img = new Image();
        img.onload = function(){
            var bg = new EditorSprite(img);
            bg.setPosition(0, 0);
            bg.setSize(img.width, img.height);
            editorCurrentRoom.items[0] = bg;
            //editorCurrentRoom.zOrderMap[0] = newEditorItem;
            updateCanvas(editorCurrentRoom, 'room');
            $('.item').show();
        };
        img.src = event.target.result;
        img.draggable="true";
    };
    fileReader.readAsDataURL(event.target.files[0]);
};

var setEditorItemSprite = function(event, dfd)
{
    if(!event.target.files[0].type.match(/image.*/))
    {
        alert("Please choose an image file!");
        return;
    }
    $('.previous-file').hide();
    var fileReader = new FileReader();
    fileReader.onload = function(event)
    {
        var img = new Image();
        img.onload = function()
        {
            editorMapIdItem[editorCurrentItem.id].sprite = new EditorSprite(img);
            editorMapIdItem[editorCurrentItem.id].sprite.setPosition(-img.width, -img.height);
            editorMapIdItem[editorCurrentItem.id].sprite.setSize(img.width, img.height);
            if(editorCurrentRoom.zOrderMap[editorCurrentItem.layer] == undefined)
                editorCurrentRoom.zOrderMap[editorCurrentItem.layer] = [];
            editorCurrentRoom.zOrderMap[editorCurrentItem.layer].push(editorCurrentItem.id);
            dfd.resolve();
        };
        img.src = event.target.result;
        img.draggable="true";
    };
    fileReader.readAsDataURL(event.target.files[0]);
};

var createNewEditorItem = function(id, parentRoomId)
{
    var newEditorItem = new EditorItem(id, 'object', parentRoomId);
    editorCurrentRoom.items.push(newEditorItem);
    editorMapIdItem[id] = newEditorItem;
    if(editorCurrentRoom.zOrderMap[newEditorItem.layer] == undefined)
        editorCurrentRoom.zOrderMap[newEditorItem.layer] = [];
    editorCurrentRoom.zOrderMap[newEditorItem.layer].push(newEditorItem.id);
};

var deleteEditorRoom = function(roomId)
{
    var room = editorMapIdRoom[roomId];
    for(var i = 1; i < room.items.length; i++)
    {
        delete editorMapIdItem[room.items[i].id];
    }
    editorRoomsList.splice(editorRoomsList.indexOf(room), 1);
    delete editorMapIdRoom[room.id];
};

var deleteEditorItem = function(itemId)
{
    var item = editorMapIdItem[itemId];
    var room = editorMapIdRoom[item.parentRoomId];

    delete editorMapIdItem[itemId];

    room.zOrderMap[item.layer].splice(room.zOrderMap[item.layer].indexOf(item.id));
    room.items.splice(room.items.indexOf(item), 1);
};

var checkIdUniqueness = function(id, type)
{
    switch(type)
    {
        case 'room': return !(id in editorMapIdRoom);
        case 'item':
            for(var i = 0; i < editorRoomsList.length; i++)
                for(var j = 1; j < editorRoomsList[i].items.length; j++)
                    if(editorRoomsList[i].items[j].id == id)
                        return false;
            return true;
        case 'action': return !(id in editorMapIdAction);
        case 'character': return !(id in editorMapIdCharacter);
        case 'anim': return !(id in editorMapIdAnim);
        case 'inventory-item': return !(id in editorMapIdInvItem);
        case 'dialog' : return !(id in editorMapIdDialog);
    }
};

var createNewEditorWalkBehind = function(id, parentRoomId)
{
    editorMapIdRoom[parentRoomId].walkBehinds.push({ id : id, image : null, poly: null, position : null, centralPerspectiveWalkBehind : null });
    editorMapIdWb[id] = editorMapIdRoom[parentRoomId].walkBehinds[editorMapIdRoom[parentRoomId].walkBehinds.length - 1];
};

