var editorGameVars = {};

var addGameVar = function(varName, varValue)
{
    editorGameVars[varName] = varValue;
    window[varName] = varValue;
};

var deleteGameVar = function(varName)
{
    delete editorGameVars[varName];
    delete window[varName];
};