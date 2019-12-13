	var keyOffset = 60;
	var middleNote = 60;


	var beatLength = 1;

	var leftwidth = 0;
	var rightwidth = 0;
	var time = 0;

	var notes = []; //this is an array of time instance objects(key-value pairs). the key is the note and value is time held.
	var bars = {};
	var containerHeights = [];
	var texts = {};
	var chords = {};

	var notesToAdd = [];
	var barsToAdd = [];
	var containerHeightsToAdd = [];
	var textsToAdd = [];
	var chordsToAdd = [];


	function clearNotes() {
		beatLength = 1;
		leftwidth = 0;
		rightwidth = 0;
		time = 0;

		notes = [];
		bars = {};
		containerHeights = [];
		texts = {}

		notesToAdd = [];
		barsToAdd = [];
		containerHeightsToAdd = [];
		textsToAdd = [];
		chordsToAdd = [];
		drawNotes();
	}

	function getJSON() {
		return JSON.stringify({keyOffset,middleNote,beatLength,leftwidth,rightwidth,time,notes,bars,containerHeights,texts})
	}

	function isBlackKey(note) {
		return [false,true,false,true,false,false,true,false,true,false,true,false][note % 12]
	}

	function addMidiNoteSimple(note, duration, advanceDuration) { 
		if (!duration) duration = 1;
		if (duration > 0) {
			if (note == null) {
				if (advanceDuration) time += duration
			} else {
				var noteoffset = (note - middleNote);
				leftwidth = Math.max(leftwidth, -noteoffset);
				rightwidth = Math.max(rightwidth, noteoffset + 1);
				if (!notes[time]) notes[time] = {}
				notes[time][note] = duration
				if (advanceDuration) time += duration
			}
		}	
	}
	function addRelativeKey(number, duration, advanceDuration) {
		if (number === null) {
			addMidiNoteSimple(null, duration, advanceDuration);
		} else {
			addMidiNoteSimple(number+keyOffset, duration, advanceDuration)
		}
	}

	function adjust_add_notes(notesToAdd, barsToAdd, containerHeightsToAdd, textsToAdd) {
		//console.log("beatLength:" + beatLength)
		notes = [];
		bars = [];
		texts = [];
		containerHeights = [];
		time = 0;
		var actualtotalLength = 0;
		var adjustedtotalLength = 0;
		var totalContainerHeight = 0;
		var barsToAdd_i = 0;
		var containerHeightsToAdd_i = 0;
		var textsToAdd_i = 0;
		var chordsToAdd_i = 0;
		var bTA;
		var cHTA;
		var tTA;
		var cTA;
		for (var i = 0; i < notesToAdd.length; i++) {
			while ((bTA = barsToAdd[barsToAdd_i]) && (bTA.location == i)) {
				bars[time + (bTA.offset*beatLength)] = true;
				++barsToAdd_i;
			}
			while ((cHTA = containerHeightsToAdd[containerHeightsToAdd_i]) && (cHTA.location == i)) {
				var lastContainerHeight = totalContainerHeight
				totalContainerHeight = cHTA.offset*beatLength + time
				containerHeights.push(totalContainerHeight - lastContainerHeight)
				++containerHeightsToAdd_i;
			}
			while ((tTA = textsToAdd[textsToAdd_i]) && (tTA.location == i)) {
				texts[time + (tTA.offset*beatLength)] = tTA.text;
				++textsToAdd_i;
			}
			while ((cTA = chordsToAdd[chordsToAdd_i]) && (cTA.location == i)) {
				chords[time + (cTA.offset*beatLength)] = cTA.chord;
				++chordsToAdd_i;
			}
			var adjustedNoteLength = notesToAdd[i].duration * beatLength
			if (notesToAdd[i].simultaneous) {
				addRelativeKey(notesToAdd[i].note, adjustedNoteLength, false)
			} else {
				actualtotalLength += notesToAdd[i].duration
				adjustedtotalLength += adjustedNoteLength
				addRelativeKey(notesToAdd[i].note, adjustedNoteLength, true)
			}
		}
		console.log("length:"+actualtotalLength)
		console.log("adjustedLength:"+adjustedtotalLength)
	}

	function parseNumericScore(numericScore) {
		//notesToAdd = [];
		//barsToAdd = [];
		//containerHeightsToAdd = [];
		//textsToAdd = [];

		var currentNote = "";
		var currentNoteDuration = 1;
		var savedNote = "";
		var savedNoteDuration = 0;
		var pushNext = false;
		var simultaneous = false;
		var push = function(note, duration) {
			//console.log("note:"+note,"duration:"+duration)
			notesToAdd.push({note:note, duration:duration, simultaneous:simultaneous});
			var fraction = toFraction(duration)
			beatLength = LCM(beatLength, fraction[1]); //everything is multiplied by beatLength to get all whole numbers
			pushNext = false;
		}
		var pushIfAvailable = function() {
			if (pushNext) {
				if (savedNote !== "") {
					if (savedNote == currentNote) {
						//tie
						currentNoteDuration += savedNoteDuration;
					} else {
						//slur
						push(savedNote, savedNoteDuration);
					}
					savedNote = "";
					savedNoteDuration = 0;
				}
				push(currentNote, currentNoteDuration)
				currentNote = "";
				currentNoteDuration = 1;
			}
		}
		var getOffset = function() {
			var offset = 0
			if (savedNote !== "") {
				offset += savedNoteDuration;
			}
			if (currentNote !== "") {
				offset += currentNoteDuration;
			}
			return offset;
		}
		for (var i = 0; i < numericScore.length; i++) {
			var char = numericScore[i]
			switch (char) {
				//before note characters set pushNext false after pushIfAvailable
				case '{':
				pushIfAvailable();
				simultaneous = true;
				case '_':
				pushIfAvailable();
				currentNoteDuration /= 2;
				break;
				case 't':
				pushIfAvailable();
				currentNoteDuration *= 2;
				currentNoteDuration /= 3;
				break;
				case '+':
				if (savedNote) {
					if (savedNote == currentNote) {
						//tie
						savedNoteDuration += currentNoteDuration;
					} else {
						//slur
						push(savedNote, savedNoteDuration);
						savedNote = currentNote;
						savedNoteDuration = currentNoteDuration;
					}
				} else {
					savedNote = currentNote;
					savedNoteDuration = currentNoteDuration;
				}
				currentNote = "";
				currentNoteDuration = 1;
				pushNext = false;
				break;
				//after note characters set pushNext true
				case '}':
				simultaneous = false;
				pushNext = true;
				break;
				case '-':
				currentNoteDuration += 1;
				pushNext = true;
				break;
				case '.':
				currentNoteDuration += currentNoteDuration / 2;
				pushNext = true;
				break;
				case '^':
				currentNote += 12;
				pushNext = true;
				break;
				case 'v':
				currentNote -= 12;
				pushNext = true;
				break;
				case '#':
				currentNote += 1;
				pushNext = true;
				break;
				case 'b':
				currentNote -= 1;
				pushNext = true;
				break;
				//misc symbols
				case '|':
				barsToAdd.push({location:notesToAdd.length, offset:getOffset()});
				break;
				case '/':
				containerHeightsToAdd.push({location:notesToAdd.length, offset:getOffset()});
				break;
				case '\"':
				var text = ""
				while (((char = numericScore[++i]) != '\"') && i < numericScore.length) {
					text += char;
				}
				textsToAdd.push({location:notesToAdd.length, offset:getOffset(), text:text})
				break;
				case '[':
				var chord = ""
				while (((char = numericScore[++i]) != ']') && i < numericScore.length) {
					chord += char;
				}
				chordsToAdd.push({location:notesToAdd.length, offset:getOffset(), chord:chord})
				break;
				default:
				if ('01234567'.includes(char)) {
					pushIfAvailable();
					currentNote = [null,0,2,4,5,7,9,11][parseInt(char)]
					pushNext = true;
				}
			}
		}
		pushIfAvailable();
		adjust_add_notes(notesToAdd, barsToAdd, containerHeightsToAdd, textsToAdd);
	}


	function drawNotes() {
		outputContainer.innerHTML = ""
		var tableContainer = document.createElement("div");
		tableContainer.id = "tableContainer";

		changeRowHeight(1/beatLength)

		var noteTable;
		var tableWidth = rightwidth + leftwidth
		var currentTableHeight = 0;
		var containerHeight;
		var containerIndex = 0;
		if (Array.isArray(containerHeights)) {
			containerHeight = containerHeights[0]
		} else {
			containerHeight = containerHeights
		}
		var needNewTable = true;
		var heldNotes = {};
		var lastBar_t = 0;
		for (var t = 0; (t < notes.length || Object.keys(heldNotes).length > 0); t++) {
			if (currentTableHeight == containerHeight) {
				if (Array.isArray(containerHeights)) {
					if (containerIndex < containerHeights.length) {
						containerHeight = containerHeights[++containerIndex]
					} else {
						containerHeight = undefined;
					}
				}
				currentTableHeight = 0;
				needNewTable = true;
			}
			if (needNewTable) {
				//create new table
				noteTable = document.createElement("table");
				tableContainer.appendChild(noteTable)
				//var head = noteTable.createTHead()
				//var hrow = head.insertRow(0);
				var hrow = noteTable.insertRow(0);
				
				for (var i = 0; i < tableWidth; i++) {
					var representedNote = i - leftwidth + middleNote
					var c = hrow.insertCell()
					if (representedNote==middleNote-1) {
						var m = hrow.insertCell()
						m.className = "m"
					}
					if (isBlackKey(representedNote)) c.className += " b"
				}
			
			}
			++currentTableHeight;
			var row = noteTable.insertRow();
			for (var i = 0; i < tableWidth; i++) {
				var representedNote = i - leftwidth + middleNote
				var instant = notes[t]
				var duration = 0;
				if (instant) duration = instant[representedNote]
				if (heldNotes[representedNote]) {
					if (--heldNotes[representedNote] <= 1) delete heldNotes[representedNote];
					if (needNewTable) {
						var c = row.insertCell()
						c.className = "n"
						c.className += " b"
						if (heldNotes[representedNote] > 1) {
							c.rowSpan = heldNotes[representedNote];
						}
						if (bars[t]) {
							c.className += " t"
							lastBar_t = t;
						}
						switch ((t-lastBar_t)/beatLength) {
							case 1:
							c.className += " t1"
							break;
							case 2:
							c.className += " t2"
							break;
							case 3:
							c.className += " t3"
							break;
							case 4:
							c.className += " t4"
							break;
						}
					}
				} else {
					var c = row.insertCell()
					if (duration) {
					if (duration % 1 != 0) throw new Error("Duration " + duration + " not allowed. Duration must be an integer")
						c.className = "n"
						if (duration > 1) {
							c.rowSpan = duration;
							heldNotes[representedNote] = duration;
						}
					}
					if (isBlackKey(representedNote)) c.className += " b"
					if (bars[t]) {
						c.className += " t"
						lastBar_t = t;
					}
					switch ((t-lastBar_t)/beatLength) {
						case 1:
						c.className += " t1"
						break;
						case 2:
						c.className += " t2"
						break;
						case 3:
						c.className += " t3"
						break;
						case 4:
						c.className += " t4"
						break;
					}
				}
				if (representedNote==middleNote-1) {
					var m = row.insertCell()
					m.className = "m"
				}
			}
			var text = ""
			if (texts[t]) {
				text += texts[t]
			}
			if (chords[t]) {
				text += " " + chords[t]
			}
			if (text) {
				var c = row.insertCell()
				var txt = document.createElement("pre")
				txt.className = "txt"
				txt.textContent = text
				c.appendChild(txt)
			}
			needNewTable = false;
		}
		outputContainer.appendChild(tableContainer);
	}