(async () => {
    const {importAll, getScript} = await import(`https://rpgen3.github.io/mylib/export/import.mjs`);
    await Promise.all([
        'https://code.jquery.com/jquery-3.3.1.min.js',
        'https://colxi.info/midi-parser-js/src/main.js',
        'https://cdnjs.cloudflare.com/ajax/libs/encoding-japanese/1.0.29/encoding.min.js'
    ].map(getScript));
    const {$, MidiParser, Encoding} = window;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<header>').appendTo(html),
          main = $('<main>').appendTo(html),
          foot = $('<footer>').appendTo(html);
    $('<h1>').appendTo(head).text('NSX-39の使用');
    $('<h2>').appendTo(head).text('MIDIとUSTで演奏');
    const rpgen3 = await importAll([
        [
            'input',
            'css',
            'util'
        ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`)
    ].flat());
    const rpgen4 = await importAll([
        'https://rpgen3.github.io/nsx39/mjs/nsx39.mjs',
        'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs',
        [
            'MidiNote',
            'MidiNoteMessage',
            'getTempos',
            'sec2delta'
        ].flat().map(v => `https://rpgen3.github.io/piano/mjs/midi/${v}.mjs`)
    ].flat());
    Promise.all([
        [
            'container',
            'tab',
            'img',
            'btn'
        ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`)
    ].flat().map(rpgen3.addCSS));
    const hideTime = 500;
    const addHideArea = (label, parentNode = main) => {
        const html = $('<div>').addClass('container').appendTo(parentNode);
        const input = rpgen3.addInputBool(html, {
            label,
            save: true,
            value: true
        });
        const area = $('<dl>').appendTo(html);
        input.elm.on('change', () => input() ? area.show(hideTime) : area.hide(hideTime)).trigger('change');
        return Object.assign(input, {
            get html(){
                return area;
            }
        });
    };
    {
        const {html} = addHideArea('init');
        const viewStatus = (() => {
            const holder = $('<dd>').appendTo(html);
            const label = $('<span>').appendTo(holder).text('状態：');
            const content = $('<span>').appendTo(holder);
            return status => content.text(status);
        })();
        viewStatus('未接続');
        rpgen3.addBtn(html, 'NSX-39に接続', async () => {
            try {
                await rpgen4.nsx39.requestMIDIAccess();
                viewStatus('接続成功');
            } catch (err) {
                console.error(err);
                viewStatus('接続失敗');
            }
        }).addClass('btn');
        rpgen3.addBtn(html, '「ら」を設定', async () => {
            rpgen4.nsx39.setLyric('ら');
        }).addClass('btn');
        rpgen3.addBtn(html, '発声テスト', async () => {
            rpgen4.nsx39.noteOn({ch: 0, pitch: 0x48, velocity: 100});
            setTimeout(() => {
                rpgen4.nsx39.noteOn({ch: 0, pitch: 0x48, velocity: 0});
            }, 1000);
        }).addClass('btn');
    }
    let g_midi = null;
    {
        const {html} = addHideArea('input MIDI file');
        $('<dt>').appendTo(html).text('MIDIファイル');
        const inputFile = $('<input>').appendTo($('<dd>').appendTo(html)).prop({
            type: 'file',
            accept: '.mid'
        });
        MidiParser.parse(inputFile.get(0), v => {
            g_midi = v;
        });
    }
    let g_ust = null;
    {
        const {html} = addHideArea('input UST file');
        $('<dt>').appendTo(html).text('USTファイル');
        $('<input>').appendTo($('<dd>').appendTo(html)).prop({
            type: 'file',
            accept: '.ust'
        }).on('change', async ({target}) => {
            const {files} = target;
            if(!files.length) return;
            const file = files[0];
            const a = new Uint8Array(await file.arrayBuffer());
            g_ust = Encoding.convert(a, {
                to: 'unicode',
                from: Encoding.detect(a),
                type: 'string'
            });
        });
    }
    const ignored_ust = 0;
    const ignored_midi = 1;
    const ignored_channel_1 = 2;
    const swap_channel_1 = 3;
    {
        const {html} = addHideArea('playing');
        const avoidChannelConflict = rpgen3.addSelect(html, {
            label: 'チャンネル衝突の回避設定',
            save: true,
            list: {
                'USTを演奏しない': ignored_ust,
                'MIDIを演奏しない': ignored_midi,
                'MIDIチャンネル1を無視': ignored_channel_1,
                'MIDIチャンネル1を交換': swap_channel_1
            }
        });
        const swapChannelHolder = $('<dl>').appendTo(html);
        const swapChannel = rpgen3.addSelect(swapChannelHolder, {
            label: 'チャンネル1の交換先',
            save: true,
            list: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16]
        });
        avoidConflict.elm.on('change', () => {
            if (avoidConflict() === swap_channel_1) swapChannelHolder.show();
            else swapChannelHolder.hide();
        }).trigger('change');
        $('<dd>').appendTo(html);
        rpgen3.addBtn(html, '演奏データの作成', () => {
            makeTimeline({
                avoidChannelConflict: avoidChannelConflict(),
                swapChannel: swapChannel()
            });
        }).addClass('btn');
        rpgen3.addBtn(html, '演奏中止', () => {
            stopTimeline();
        }).addClass('btn');
        rpgen3.addBtn(html, '演奏開始', () => {
            playTimeline();
        }).addClass('btn');
    }
    const makeTimeline = ({
        avoidChannelConflict,
        swapChannel
    }) => {
        const tempos = rpgen4.getTempos(g_midi);
        const midiNoteArray = rpgen4.MidiNote.makeArray(g_midi).filter(v => v.ch !== ignoredChannel);
        const ustNoteArray = UstNote.makeArray(g_ust);
    };
    const stopTimeline = () => {
        rpgen4.nsx39.allSoundOff();
    };
    const playTimeline = () => {
    };
})();
