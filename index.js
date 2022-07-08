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
        'input',
        'css',
        'util'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const rpgen4 = await importAll([
        'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs',
        [
            'MidiNote',
            'MidiNoteMessage',
            'MidiProgramChangeMessage',
            'MidiTempoMessage'
        ].map(v => `https://rpgen3.github.io/piano/mjs/midi/${v}.mjs`),
        [
            'UstEvent',
            'UstNote',
            'UstNoteMessage',
            'UstTempoMessage',
            'nsx39Scheduler'
        ].map(v => `https://rpgen3.github.io/nsx39/mjs/${v}.mjs`)
    ].flat());
    Promise.all([
        'container',
        'tab',
        'img',
        'btn'
    ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`).map(rpgen3.addCSS));
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
    const addLabeledText = (html, {label, value}) => {
        const holder = $('<dd>').appendTo(html);
        $('<span>').appendTo(holder).text(label);
        const content = $('<span>').appendTo(holder).text(value);
        return value => content.text(value);
    };
    {
        const {html} = addHideArea('init');
        const viewStatus = addLabeledText(html, {
            label: '状態：',
            value: '未接続'
        });
        rpgen3.addBtn(html, 'NSX-39に接続', async () => {
            try {
                await rpgen4.nsx39Scheduler.nsx39.requestMIDIAccess();
                viewStatus('接続成功');
            } catch (err) {
                console.error(err);
                viewStatus('接続失敗');
            }
        }).addClass('btn');
        rpgen3.addBtn(html, '歌詞「ら」を設定', async () => {
            rpgen4.nsx39Scheduler.nsx39.setLyric({data: {lyric: 'ら'}});
        }).addClass('btn');
        rpgen3.addBtn(html, '発声テスト', async () => {
            rpgen4.nsx39Scheduler.nsx39.noteOn({
                data: {channel: 0, pitch: 0x45, velocity: 100}
            });
            rpgen4.nsx39Scheduler.nsx39.noteOn({
                data: {channel: 0, pitch: 0x45, velocity: 0},
                timestamp: performance.now() + 500
            });
        }).addClass('btn');
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
    {
        const {html} = addHideArea('tuning NSX-39');
        const inputScheduledTime = rpgen3.addSelect(html, {
            label: 'スケジューリング[ミリ秒]',
            save: true,
            list: [...Array(10).keys()].map(v => v * 100),
            value: 100
        });
        inputScheduledTime.elm.on('change', () => {
            rpgen4.nsx39Scheduler.scheduledTime = inputScheduledTime();
        }).trigger('change');
        const inputShiftedLyricTime = rpgen3.addSelect(html, {
            label: '事前歌詞入力[ミリ秒]',
            save: true,
            list: [...Array(10).keys()].map(v => v * 10),
            value: 10
        });
        inputShiftedLyricTime.elm.on('change', () => {
            rpgen4.nsx39Scheduler.shiftedLyricTime = inputShiftedLyricTime();
        }).trigger('change');
        const inputShiftedNoteTime = rpgen3.addSelect(html, {
            label: '先行して歌わせる[デルタ時間]',
            save: true,
            list: [...Array(20).keys()].map(v => v * 25),
            value: 150
        });
        inputShiftedNoteTime.elm.on('change', () => {
            rpgen4.nsx39Scheduler.shiftedNoteTime = inputShiftedNoteTime();
        }).trigger('change');
        const inputShiftedNoteOffTime = rpgen3.addSelect(html, {
            label: 'ノートオフを先行させる[デルタ時間]',
            save: true,
            list: [...Array(10).keys()].map(v => v * 10),
            value: 10
        });
        inputShiftedNoteOffTime.elm.on('change', () => {
            rpgen4.nsx39Scheduler.shiftedNoteOffTime = inputShiftedNoteOffTime();
        }).trigger('change');
    }
    const playing_ust = 0;
    const playing_midi = 1;
    const playing_both = 2;
    {
        const {html} = addHideArea('playing');
        const howToPlay = rpgen3.addSelect(html, {
            label: '演奏方法',
            save: true,
            list: {
                'USTだけ演奏': playing_ust,
                'MIDIだけ演奏': playing_midi,
                '同時演奏': playing_both
            }
        });
        $('<dd>').appendTo(html).text('同時演奏の場合');
        $('<dd>').appendTo(html).text('Ch.1はUSTが独占します');
        const swapChannel = rpgen3.addSelect(html, {
            label: 'MIDIのCh.1の交換',
            save: true,
            list: [
                ['交換しない', null],
                ...[2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16].map(v => [`Ch.${v}`, v - 1])
            ]
        });
        const scheduledToEnd = addLabeledText(html, {
            label: '終了予定：',
            value: '未定'
        });
        rpgen3.addBtn(html, '演奏データの作成', () => {
            try {
                rpgen4.nsx39Scheduler.load(makeMessageArrays({
                    howToPlay: howToPlay(),
                    swapChannel: swapChannel()
                }));
            } catch (err) {
                console.error(err);
                alert(err);
            }
        }).addClass('btn');
        rpgen3.addBtn(html, '演奏中止', () => {
            rpgen4.nsx39Scheduler.stop();
            scheduledToEnd('中止');
        }).addClass('btn');
        rpgen3.addBtn(html, '演奏開始', () => {
            rpgen4.nsx39Scheduler.play();
            scheduledToEnd(new Date(Date.now() + rpgen4.nsx39Scheduler.scheduledTime + rpgen4.nsx39Scheduler.duration).toTimeString());
        }).addClass('btn');
    }
    const makeUst = () => {
        const ustEventArray = rpgen4.UstEvent.makeArray(g_ust);
        const ustNoteArray = rpgen4.UstNote.makeArray(ustEventArray);
        return {
            ustNotes: rpgen4.UstNoteMessage.makeArray(ustNoteArray),
            tempos: rpgen4.UstTempoMessage.makeArray(ustEventArray)
        };
    };
    const makeMidi = ({howToPlay, swapChannel}) => {
        const swap = messages => {
            if (howToPlay === playing_midi) {
                if (swapChannel === null) return messages;
                for (const v of messages) {
                    if (v.channel === 0) v.channel = swapChannel;
                    else if (v.channel === swapChannel) v.channel = 0;
                }
                return messages;
            } else {
                if (swapChannel === null) return messages.filter(({channel}) => channel !== 0);
                return messages.filter(({channel}) => channel !== swapChannel).map(v => {
                    if (v.channel === 0) v.channel = swapChannel;
                    return v;
                });
            }
        };
        const midiNoteArray = rpgen4.MidiNote.makeArray(g_midi);
        return {
            midiNotes: swap(rpgen4.MidiNoteMessage.makeArray(midiNoteArray)),
            tempos: rpgen4.MidiTempoMessage.makeArray(g_midi),
            programChanges: swap(rpgen4.MidiProgramChangeMessage.makeArray(g_midi))
        };
    };
    const makeMessageArrays = ({howToPlay, swapChannel}) => {
        switch (howToPlay) {
            case playing_ust:
                if (g_ust === null) throw 'Must input UST file.';
                return makeUst();
            case playing_midi:
                if (g_midi === null) throw 'Must input MIDI file.';
                return makeMidi({howToPlay, swapChannel});
            case playing_both:
                if (g_ust === null) throw 'Must input UST file.';
                if (g_midi === null) throw 'Must input MIDI file.';
                return {
                    ...makeUst(),
                    ...makeMidi({howToPlay, swapChannel})
                };
        }
    };
})();
