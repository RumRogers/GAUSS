var Action = function(id)
{
    this.id = id;
    this.description = '';
};

Action.prototype.setDescription = function(desc)
{
    this.description = desc;
};

var editorActionsList = new Array();
var editorMapIdAction = {};
var editorActionsCount = 0;

var createNewEditorAction = function(id, desc)
 {
 var newAction = new Action(id);
     if(desc)
        newAction.setDescription(desc);
 editorActionsList.push(newAction);
 editorMapIdAction[newAction.id] = newAction;
 };

var WALK_TO_ID = 'Walk_to';
var EYES_ID = 'Eyes';
var HAND_ID = 'Hand';
var MOUTH_ID = 'Mouth';
var COMBINE_ID = 'Combine';

var DEFAULT_WALK_TO_SENTENCE = 'Walk to';
var DEFAULT_EYES_SENTENCE = 'Look at';
var DEFAULT_HAND_SENTENCE = 'Pick up';
var DEFAULT_MOUTH_SENTENCE = 'Talk to';
var DEFAULT_COMBINE_SENTENCE = 'Combine';

createNewEditorAction(WALK_TO_ID, DEFAULT_WALK_TO_SENTENCE);
createNewEditorAction(EYES_ID, DEFAULT_EYES_SENTENCE);
createNewEditorAction(HAND_ID, DEFAULT_HAND_SENTENCE);
createNewEditorAction(MOUTH_ID, DEFAULT_MOUTH_SENTENCE);
createNewEditorAction(COMBINE_ID, DEFAULT_COMBINE_SENTENCE);

var defaultSentences = {};
defaultSentences[HAND_ID] = [ 'I can\'t pick that up.', 'I don\'t need it.', 'That doesn\'t seem to work.', 'I can\'t use that.', 'Nah.'];
defaultSentences[EYES_ID] = [ 'I don\'t see anything special about it.', 'Cool.' ];
defaultSentences[MOUTH_ID] = [ 'Not a chatterbox.', 'I don\'t think it\'s going to answer.' ];
defaultSentences[COMBINE_ID] = [ 'That doesn\'t seem to work.' ];

var defaultReactions = {};
defaultReactions[HAND_ID] = 'var set = defaultSentences["' + HAND_ID + '"]; var idx = Math.floor(Math.random() * set.length); egoSayLine(set[idx])';
defaultReactions[EYES_ID] = 'var set = defaultSentences["' + EYES_ID + '"]; var idx = Math.floor(Math.random() * set.length); egoSayLine(set[idx])';
defaultReactions[MOUTH_ID] = 'var set = defaultSentences["' + MOUTH_ID + '"]; var idx = Math.floor(Math.random() * set.length); egoSayLine(set[idx])';
defaultReactions[COMBINE_ID] = 'var set = defaultSentences["' + COMBINE_ID +'"]; var idx = Math.floor(Math.random() * set.length); egoSayLine(set[idx])';
