/*
 * EYEDROPPER - lets the panel's eyedropper buttons sample a color from the image: start() switches Photoshop to
 * the Eyedropper tool, poll() reports the tool and Foreground so the panel can see the click land, and stop()
 * puts the previous tool back. Photoshop sends no event for a Foreground change, hence the polling.
 */
$._ext_EYEDROPPER = {
    TOOL: 'eyedropperTool',
    previousTool: '',

    hex: function () {
        return '#' + app.foregroundColor.rgb.hexValue.toLowerCase();
    },

    // Returns the Foreground before sampling
    start: function () {
        var self = $._ext_EYEDROPPER;
        if (app.currentTool !== self.TOOL) self.previousTool = app.currentTool;
        app.currentTool = self.TOOL;
        return self.hex();
    },

    // "tool|#rrggbb"
    poll: function () {
        return app.currentTool + '|' + $._ext_EYEDROPPER.hex();
    },

    stop: function () {
        var self = $._ext_EYEDROPPER;
        if (app.currentTool === self.TOOL && self.previousTool) app.currentTool = self.previousTool;
        self.previousTool = '';
        return 'ok';
    }
};
