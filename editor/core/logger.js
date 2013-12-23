
define("Cedtory/editor/core/logger", function(require){
    var debugMode = true;
    return {
        log: function(){
            if (debugMode) console.log(arguments);
        }
    };
});
