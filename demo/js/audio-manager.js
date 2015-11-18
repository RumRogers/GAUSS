var editorMapIdAudio = {};
var editorAudioCount = 0;

var createNewAudioContent = function(id)
{
    var newAudioContent = { id : id, audioData : null };
    editorMapIdAudio[id] = newAudioContent;
};

var deleteAudioContent = function(id)
{
    delete editorMapIdAudio[id];
};