/*
 * DB dialog - modal options window for Dodge & Burn. show() returns
 * { group, color, view, brush } (booleans) after "OK", or null after Cancel / Esc.
 */
$._ext_DB_DIALOG = {
    TITLE: 'SCCTLM_Foto: Dodge & Burn',
    PANEL_TITLE: 'Tu\u1EF3 ch\u1ECDn',
    CANCEL_LABEL: 'Hu\u1EF7',
    OK_LABEL: '\u0110\u1ED3ng \u00FD',
    INTRO: 'Dodge (l\u00E0m s\u00E1ng) v\u00E0 Burn (l\u00E0m t\u1ED1i) l\u00E0 k\u1EF9 thu\u1EADt retouch th\u01B0\u1EDDng d\u00F9ng cho da, trang \u0111i\u1EC3m, t\u1EA1o kh\u1ED1i, ch\u1EC9nh s\u00E1ng. R\u00EA chu\u1ED9t l\u00EAn t\u1EEBng tu\u1EF3 ch\u1ECDn \u0111\u1EC3 xem chi ti\u1EBFt.',
    // label, default, help text shown while the pointer is over it
    OPTIONS: [
        { label: 'T\u1EA1o nh\u00F3m l\u1EDBp Dodge_Burn', value: true,
          help: 'T\u1EA1o hai l\u1EDBp (Dodge v\u00E0 Burn). Ch\u1ECDn m\u1EB7t n\u1EA1 c\u1EE7a l\u1EDBp Dodge ho\u1EB7c Burn r\u1ED3i t\u00F4 c\u1ECD l\u00EAn \u1EA3nh \u0111\u1EC3 l\u00E0m s\u00E1ng hay l\u00E0m t\u1ED1i v\u00F9ng mong mu\u1ED1n. Mu\u1ED1n xo\u00E1 hi\u1EC7u \u1EE9ng th\u00EC \u0111\u1ED5i c\u1ECD sang m\u00E0u \u0111en (b\u1EA5m "X" ho\u1EB7c ch\u1ECDn bi\u1EC3u t\u01B0\u1EE3ng c\u1ECD tr\u00EAn panel).' },
        { label: 'Th\u00EAm nh\u00F3m l\u1EDBp ch\u1EC9nh m\u00E0u', value: false,
          help: 'Th\u00EAm l\u1EDBp Dodge_Burn c\u00F9ng l\u1EDBp Hue/Saturation. T\u00F4 c\u1ECD l\u00EAn m\u1EB7t n\u1EA1 l\u1EDBp \u0111\u1EC3 \u00E1p d\u1EE5ng Dodge/Burn. Sau \u0111\u00F3 c\u00F3 th\u1EC3 d\u00F9ng l\u1EDBp Hue/Saturation \u0111\u1EC3 ch\u1EC9nh l\u1EA1i sai l\u1EC7ch m\u00E0u ph\u00E1t sinh.' },
        { label: 'Th\u00EAm nh\u00F3m l\u1EDBp quan s\u00E1t', value: false,
          help: 'Th\u00EAm nh\u00F3m l\u1EDBp quan s\u00E1t t\u1EA1m. Khi Dodge/Burn, h\u00E3y b\u1EADt nh\u00F3m l\u1EDBp n\u00E0y \u0111\u1EC3 th\u1EA5y hi\u1EC7u \u1EE9ng r\u00F5 h\u01A1n.' },
        { label: '\u0110\u1EB7t th\u00F4ng s\u1ED1 c\u1ECD theo gi\u00E1 tr\u1ECB khuy\u1EBFn ngh\u1ECB', value: false,
          help: 'G\u1EE3i \u00FD: \u0111\u1EB7t c\u1ECD theo th\u00F4ng s\u1ED1 Dodge_Burn khuy\u1EBFn ngh\u1ECB, flow 1%, hardness 0%, spacing 25%.' }
    ],

    show: function () {
        var self = $._ext_DB_DIALOG, i, boxes = [];
        var win = new Window('dialog', self.TITLE, undefined, { closeButton: true });
        win.orientation = 'column';
        win.alignChildren = ['fill', 'top'];
        win.margins = 16;
        win.spacing = 10;
        win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, [0.16, 0.16, 0.16, 1]);
        var help = win.add('statictext', undefined, self.INTRO, { multiline: true });
        help.preferredSize = [314, 64];
        help.graphics.foregroundColor = help.graphics.newPen(help.graphics.PenType.SOLID_COLOR, [0.95, 0.9, 0.6, 1], 1);
        var box = win.add('panel', undefined, self.PANEL_TITLE);
        box.orientation = 'column';
        box.alignChildren = ['left', 'top'];
        box.margins = [12, 16, 12, 10];
        var hover = function (check, text) {
            check.addEventListener('mouseover', function () { help.text = text; });
            check.addEventListener('mouseout', function () { help.text = self.INTRO; });
        };
        for (i = 0; i < self.OPTIONS.length; i += 1) {
            var check = box.add('checkbox', undefined, self.OPTIONS[i].label);
            check.value = self.OPTIONS[i].value;
            check.graphics.foregroundColor = check.graphics.newPen(check.graphics.PenType.SOLID_COLOR, [0.9, 0.9, 0.9, 1], 1);
            hover(check, self.OPTIONS[i].help);
            boxes.push(check);
        }
        var syncColorBox = function () { boxes[1].enabled = boxes[0].value; };
        boxes[0].onClick = syncColorBox;
        syncColorBox();
        var row = win.add('group');
        row.orientation = 'row';
        row.alignment = 'fill';
        var cancel = row.add('button', undefined, self.CANCEL_LABEL, { name: 'cancel' });
        row.add('group').alignment = ['fill', 'center'];
        var ok = row.add('button', undefined, self.OK_LABEL, { name: 'ok' });
        win.defaultElement = ok;
        win.cancelElement = cancel;
        if (win.show() !== 1) return null;
        return { group: boxes[0].value, color: boxes[0].value && boxes[1].value, view: boxes[2].value, brush: boxes[3].value };
    }
};
