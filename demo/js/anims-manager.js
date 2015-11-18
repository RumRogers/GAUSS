var Anim = function(id)
{
    this.id = id;
    this.frames = new Array();
    this.loop = true;
    this.start_idx = 0;
    this.animInt = null;
    this.current_frame = this.start_idx;
    this.frame_rate = 150;
    this.addFrame = addAnimFrame;
    this.removeFrame = removeAnimFrame;
    this.incrCurrIdx = incrCurrFrame;
    this.play = startRollingFrames;
    this.stop = stopRollingFrames;
};

var addAnimFrame = function(idx, image)
{
    this.frames[idx] = image;
};

var removeAnimFrame = function(idx)
{
    this.frames.splice(idx, 1);
};

var incrCurrFrame = function()
{
    this.current_frame = (this.current_frame + 1) % this.frames.length;
};

var createNewAnim = function(id)
{
    var newAnim = new Anim(id);
    editorAnimsList.push(newAnim);
    editorMapIdAnim[id] = newAnim;
};

var startRollingFrames = function()
{
    if(this.animInt)
        return;
    var that = this;
    this.animInt = setInterval(function()
    {
        if(that.loop === false && that.current_frame === that.frames.length - 1)
        {
            clearInterval(that.animInt);
            that.animInt = null;
            return;
        }
        that.incrCurrIdx();
    }, that.frame_rate);
};

var stopRollingFrames = function()
{
    clearInterval(this.animInt);
    this.animInt = null;
    this.current_frame = this.start_idx;
};

var editorAnimsList = [];
var editorMapIdAnim = {};
var editorAnimsCount = 0;

var deleteEditorAnim = function(id)
{
    var anim = editorMapIdAnim[id];
    editorAnimsList.splice(editorCharactersList.indexOf(anim), 1);
    delete editorMapIdAnim[id];
};


