#target photoshop
// Lists the commands registered by the loaded core, to match against the buttons in index.html
// (grep -o "onClickButton('[A-Z0-9_]*')" index.html). Needs the panel open so the core is loaded.
// Returns one name per line.
(function () {
    var names = [];
    if (typeof $.scctlmFotoCommands != 'object') return 'Core not loaded: open the panel first';
    for (var name in $.scctlmFotoCommands) if ($.scctlmFotoCommands.hasOwnProperty(name)) names.push(name);
    names.sort();
    return names.join('\n');
}());
