// SCCTLM_Foto: open a camera RAW without the Camera Raw dialog. Photoshop shows that dialog as a modal and the
// panel buttons cannot run until it closes; a plain document lets the colour presets run as on any other photo.
$._ext_OPENRAW = {
    FILTER: 'Camera RAW:*.arw;*.cr2;*.cr3;*.nef;*.nrw;*.raf;*.orf;*.rw2;*.dng;*.pef;*.srw;*.3fr;*.erf;*.kdc;*.mrw;*.x3f;*.iiq;*.rwl,All Files:*.*',

    run: function (fileOrPath) {
        var file = fileOrPath instanceof File ? fileOrPath :
            (typeof fileOrPath === 'string' && fileOrPath.length > 0 ? new File(fileOrPath) : File.openDialog('Chon anh RAW', $._ext_OPENRAW.FILTER));
        if (!file) {
            // Error number 8007 is how the panel bridge recognises a user cancel.
            var cancelled = new Error('User cancelled');
            cancelled.number = 8007;
            throw cancelled;
        }
        if (!file.exists) throw new Error('File not found: ' + file.fsName);

        var options = new CameraRAWOpenOptions();
        // SELECTEDIMAGE keeps edits already stored beside the file; 16-bit sRGB matches what the colour presets expect.
        options.settings = CameraRAWSettingsType.SELECTEDIMAGE;
        options.bitsPerChannel = BitsPerChannelType.SIXTEEN;
        options.colorSpace = ColorSpaceType.SRGB;

        var dialogs = app.displayDialogs;
        app.displayDialogs = DialogModes.NO;
        try {
            app.open(file, options);
        } finally {
            app.displayDialogs = dialogs;
        }
        return 'SCCTLM_OK';
    }
};
