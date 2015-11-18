var editorMapIdDialog = {};
var editorDialogsCount = 0;

var Dialog = function(id)
{
    this.id = id;
    this.currentSubDialog = 'root';
    this.subdialogs = { 'root' : [] };
    this.hidden = false;
};

//TODO: fix dialog lines ordering
Dialog.prototype.addDialogChoice = function(subDialogId, choice, pos)
{
    if(subDialogId.length == 0)
        subDialogId = 'root';
    else if(this.subdialogs[subDialogId] == undefined)
        this.subdialogs[subDialogId] = [];
    if(!pos)
    {
        this.subdialogs[subDialogId].push(choice);
        return;
    }
    this.subdialogs[subDialogId].splice(pos, 0, choice);
};

Dialog.prototype.removeDialogChoice = function(subDialogId, pos)
{
    if(this.subdialogs[subDialogId] && this.subdialogs[subDialogId].length)
        this.subdialogs[subDialogId].splice(pos, 1);
};

Dialog.prototype.copy = function(d)
{
    this.id = d.id;
    this.currentSubDialog = d.currentSubDialog;
    this.subdialogs = d.subdialogs;
};

var DialogChoice = function(text, script, quit, open, hidden, showOnce, hideOnce)
{
    this.sentence = text;
    this.script = script;
    this.quit = quit;
    this.open = open;
    this.hidden = hidden;
    this.showOnce = showOnce;
    this.chooseOnce = hideOnce;
};

var deleteDialog = function(id)
{
    delete editorMapIdDialog[id];
};

