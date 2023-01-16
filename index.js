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
        'util',
        'save',
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const rpgen4 = await importAll([
        'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs',
        [
            'MidiNote',
            'MidiNoteMessage',
            'MidiControlChangeMessage',
            'MidiProgramChangeMessage',
            'MidiTempoMessage',
            'TrackNameMap',
        ].map(v => `https://rpgen3.github.io/piano/mjs/midi/${v}.mjs`),
        [
            'UstEvent',
            'UstNote',
            'UstNoteMessage',
            'UstTempoMessage',
            'nsx39Scheduler',
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
                await rpgen4.nsx39Scheduler.init();
                viewStatus('接続成功');
            } catch (err) {
                console.error(err);
                viewStatus('接続失敗');
            }
        }).addClass('btn');
        rpgen3.addBtn(html, '歌詞「あ」を設定', () => {
            try {
                rpgen4.nsx39Scheduler.nsx39.setLyric({data: {lyric: 'あ'}});
            } catch (err) {
                console.error(err);
                alert(err);
            }
        }).addClass('btn');
        rpgen3.addBtn(html, '発声テスト(C5)', () => {
            try {
                rpgen4.nsx39Scheduler.nsx39.noteOn({
                    data: {channel: 0, pitch: 0x48, velocity: 100}
                });
                rpgen4.nsx39Scheduler.nsx39.noteOn({
                    data: {channel: 0, pitch: 0x48, velocity: 0},
                    timestamp: performance.now() + 500
                });
            } catch (err) {
                console.error(err);
                alert(err);
            }
        }).addClass('btn');
    }
    let g_ust = null;
    {
        const {html} = addHideArea('input UST file');
        const viewStatus = addLabeledText(html, {
            label: 'USTファイル：',
            value: '入力したファイル名'
        });
        $('<input>').appendTo($('<dd>').appendTo(html)).prop({
            type: 'file',
            accept: '.ust'
        }).on('change', async ({target}) => {
            const file = target.files.item(0);
            viewStatus(file?.name);
            if (file) {
                const a = new Uint8Array(await file.arrayBuffer());
                g_ust = Encoding.convert(a, {
                    to: 'unicode',
                    from: Encoding.detect(a),
                    type: 'string'
                });
            }
        });
    }
    let g_midi = null;
    let g_midi_file_name = null;
    {
        const {html} = addHideArea('input MIDI file');
        const viewStatus = addLabeledText(html, {
            label: 'MIDIファイル：',
            value: '入力したファイル名'
        });
        const inputFile = $('<input>').appendTo($('<dd>').appendTo(html)).prop({
            type: 'file',
            accept: '.mid'
        }).on('change', async ({target}) => {
            const file = target.files.item(0);
            viewStatus(file?.name);
            if (file?.name) {
                g_midi_file_name = file.name;
            }
        });
        MidiParser.parse(inputFile.get(0), v => {
            g_midi = v;
            updateSwapChannel();
        });
    }
    let isMutedExcept39 = null;
    {
        const {html} = addHideArea('settings');
        const inputSpeedRate = rpgen3.addSelect(html, {
            label: '演奏速度',
            save: true,
            list: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(v => [`x${v}`, v]),
            value: 'x1'
        });
        inputSpeedRate.elm.on('change', () => {
            rpgen4.nsx39Scheduler.speedRate = inputSpeedRate();
        }).trigger('change');
        const inputScheduledTime = rpgen3.addSelect(html, {
            label: 'スケジューリング[ミリ秒]',
            save: true,
            list: [
                ...[...Array(10).keys()].map(v => v * 100),
                ...[...Array(5).keys()].map(v => v * 1000)
            ],
            value: 100
        });
        inputScheduledTime.elm.on('change', () => {
            rpgen4.nsx39Scheduler.scheduledTime = inputScheduledTime();
        }).trigger('change');
        const inputShiftedNoteOffTime = rpgen3.addSelect(html, {
            label: 'ノートオフを先行させる[デルタ時間]',
            save: true,
            list: [...Array(10).keys()],
            value: 1
        });
        inputShiftedNoteOffTime.elm.on('change', () => {
            rpgen4.nsx39Scheduler.shiftedNoteOffTime = inputShiftedNoteOffTime();
        }).trigger('change');
        isMutedExcept39 = rpgen3.addInputBool(html, {
            label: 'ミク以外をミュートする',
            save: true
        });
        rpgen3.addBtn(html, '音色の初期化', async () => {
            rpgen4.nsx39Scheduler.nsx39.allChannels.controlChange({data: {control: 0x00, value: 0x00}});
            rpgen4.nsx39Scheduler.nsx39.allChannels.controlChange({data: {control: 0x20, value: 0x00}});
            rpgen4.nsx39Scheduler.nsx39.allChannels.programChange({data: {program: 0x00}});
        }).addClass('btn');
    }
    {
        const {html} = addHideArea('tuning NSX-39');
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
        const inputShiftedPitch = rpgen3.addSelect(html, {
            label: 'ピッチシフト',
            save: true,
            list: [...Array(13).keys()].map(v => v - 6).reverse(),
            value: 0
        });
        inputShiftedPitch.elm.on('change', () => {
            rpgen4.nsx39Scheduler.shiftedPitch = inputShiftedPitch();
        }).trigger('change');
        const inputShiftedOctave = rpgen3.addSelect(html, {
            label: 'オクターブシフト',
            save: true,
            list: [...Array(9).keys()].map(v => v - 4).reverse(),
            value: 0
        });
        inputShiftedOctave.elm.on('change', () => {
            rpgen4.nsx39Scheduler.shiftedOctave = inputShiftedOctave();
        }).trigger('change');
    }
    let updateSwapChannel = null;
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
        const swapChannel = rpgen3.addSelect(html, {
            label: 'MIDIのCh.1の交換',
        });
        swapChannel.elm.on('change', () => {
            rpgen3.save(g_midi_file_name, swapChannel());
        });
        updateSwapChannel = () => {
            const trackNameMap = new rpgen4.TrackNameMap(g_midi);
            const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16].map(v => [
                [
                    `Ch.${v}`,
                    trackNameMap.has(v - 1) ? trackNameMap.get(v - 1) : [],
                ].flat().join(' '),
                v - 1,
            ]);
            swapChannel.update(list);
            const loaded = rpgen3.load(g_midi_file_name);
            if (loaded !== null) {
                swapChannel(list.find(([_, v]) => v === Number(loaded))[0]);
            }
        };
        const scheduledToEnd = addLabeledText(html, {
            label: '終了予定：',
            value: '未定'
        });
        rpgen3.addBtn(html, '演奏データの作成', () => {
            try {
                rpgen4.nsx39Scheduler.load(makeMessageArrays({
                    howToPlay: howToPlay(),
                    swapChannel: swapChannel(),
                    isMutedExcept39: isMutedExcept39()
                }));
            } catch (err) {
                console.error(err);
                alert(err);
            }
        }).addClass('btn');
        rpgen3.addBtn(html, '演奏中止', async () => {
            await rpgen4.nsx39Scheduler.stop();
            scheduledToEnd('中止');
        }).addClass('btn');
        rpgen3.addBtn(html, '演奏開始', async () => {
            await rpgen4.nsx39Scheduler.play();
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
    const makeMidi = ({howToPlay, swapChannel, isMutedExcept39}) => {
        const swap = messages => {
            if (howToPlay === playing_midi) {
                if (swapChannel === 0) {
                    return messages;
                }
                for (const v of messages) {
                    if (v.channel === 0) {
                        v.channel = swapChannel;
                    } else if (v.channel === swapChannel) {
                        v.channel = 0;
                    }
                }
                return messages;
            } else {
                if (swapChannel === 0) {
                    return messages.filter(({channel}) => channel !== 0);
                }
                return messages.filter(({channel}) => channel !== swapChannel).map(v => {
                    if (v.channel === 0) {
                        v.channel = swapChannel;
                    }
                    return v;
                });
            }
        };
        const mute = messages => isMutedExcept39 ? messages.filter(({channel}) => channel === 0) : messages;
        const midiNoteArray = rpgen4.MidiNote.makeArray(g_midi);
        return {
            midiNotes: mute(swap(rpgen4.MidiNoteMessage.makeArray(midiNoteArray))),
            tempos: rpgen4.MidiTempoMessage.makeArray(g_midi),
            controlChanges: mute(swap(rpgen4.MidiControlChangeMessage.makeArray(g_midi))),
            programChanges: mute(swap(rpgen4.MidiProgramChangeMessage.makeArray(g_midi)))
        };
    };
    const makeMessageArrays = ({howToPlay, swapChannel, isMutedExcept39}) => {
        switch (howToPlay) {
            case playing_ust:
                if (g_ust === null) throw 'Must input UST file.';
                return makeUst();
            case playing_midi:
                if (g_midi === null) throw 'Must input MIDI file.';
                return makeMidi({howToPlay, swapChannel, isMutedExcept39});
            case playing_both:
                if (g_ust === null) throw 'Must input UST file.';
                if (g_midi === null) throw 'Must input MIDI file.';
                return {
                    ...makeUst(),
                    ...makeMidi({howToPlay, swapChannel, isMutedExcept39})
                };
        }
    };
})();
