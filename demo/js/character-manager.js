var editorCharactersList = [];
var editorMapIdCharacter = {};
var editorCurrentCharacter = null;
var editorPlayerCharacter = null;

var createNewEditorCharacter = function(id)
{
    var newCharacter = new EditorItem(id, 'character');
    editorCharactersList.push(newCharacter);
    editorMapIdCharacter[newCharacter.id] = newCharacter;
};

var deleteEditorCharacter = function(id)
{
    var character = editorMapIdCharacter[id];
    editorCharactersList.splice(editorCharactersList.indexOf(character), 1);
    delete editorMapIdCharacter[id];
};