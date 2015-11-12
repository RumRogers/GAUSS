var InventoryItem = function(id)
{
    this.id = id;
    this.anim = null;
    this.description = '';
};

var editorInvItemList = [];
var editorMapIdInvItem = {};
var editorInvItemCount = 0;

var createNewInvItem = function(id)
{
    var newInvItem = new InventoryItem(id);
    editorInvItemList.push(newInvItem);
    editorMapIdInvItem[newInvItem.id] = newInvItem;
};

var deleteInvItem = function(id)
{
    var invItem = editorMapIdInvItem[id];
    editorInvItemList.splice(editorInvItemList.indexOf(invItem), 1);
    delete editorMapIdInvItem[id];
};