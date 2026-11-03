/*
 * Blusher (TJSH): action replay moved verbatim from jsx/main.jsx.
 * Registered through $.scctlmFotoSkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.scctlmFotoBuildSkinCommands) turns the registry into $.scctlmFotoCommands.
 */
function TJSH() {
var parts = $.scctlmFotoSkinFns;
parts.TJSH_part1();
parts.TJSH_part2();
parts.TJSH_part3();
}

$.scctlmFotoSkinFns = $.scctlmFotoSkinFns || {};
$.scctlmFotoSkinFns.TJSH = TJSH;
