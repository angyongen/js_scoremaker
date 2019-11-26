	var keyOffset = 60;
	var middleNote = 60;


	var beatLength = 1;

	var leftwidth = 0;
	var rightwidth = 0;
	var time = 0;
	var notesToAdd = [];
	var notes = [];
	var bars = {};

	var containerHeights = [];

	function clear() {
		beatLength = 1;
		leftwidth = 0;
		rightwidth = 0;
		time = 0;
		notesToAdd = [];
		notes = [];
		bars = {};
	}

	function isBlackKey(note) {
		return [false,true,false,true,false,false,true,false,true,false,true,false][note % 12]
	}

	function addMidiNoteSimple(note, duration) {
		if (!duration) duration = 1;
		if (duration > 0) {
			if (note == null) {
				time += duration
			} else {
				var noteoffset = (note - middleNote);
				leftwidth = Math.max(leftwidth, -noteoffset);
				rightwidth = Math.max(rightwidth, noteoffset + 1);
				if (!notes[time]) notes[time] = {}
				notes[time][note] = duration
				time += duration;
			}
		}	
	}
	function addKeyWithOffset(number, duration) {
		if (number == null) {
			addMidiNoteSimple(null, duration);
		} else {
			addMidiNoteSimple(number+keyOffset, duration)
		}
	}

	function parseNumericScore(numericScore) {
		var barOffsets = {};
		var containerHeightsOffsets = {};
		var currentNote = "";
		var currentNoteDuration = 1;
		var savedNote = "";
		var savedNoteDuration = 0;
		var pushNext = false;
		var push = function(note, duration) {
			console.log("note:"+note,"duration:"+duration)
			notesToAdd.push({note:note, duration:duration});
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
		for (var i = 0; i < numericScore.length; i++) {
			var char = numericScore[i]
			switch (char) {
				//before note characters set pushNext false
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
				case '#':
				currentNote += 1;
				pushNext = true;
				break;
				case 'b':
				currentNote -= 1;
				pushNext = true;
				break;
				default:
				if ('01234567'.includes(char)) {
					pushIfAvailable();
					currentNote = [null,0,2,4,5,7,9,11][parseInt(char)]
					pushNext = true;
				}
				if (char == "|") {
					barOffsets[notesToAdd.length] = 0;
					if (savedNote !== "") {
						barOffsets[notesToAdd.length] += savedNoteDuration;
					}
					if (currentNote !== "") {
						barOffsets[notesToAdd.length] += currentNoteDuration;
					}
				}
				if (char == "/") {
						containerHeightsOffsets[notesToAdd.length] = 0;
					if (savedNote !== "") {
						containerHeightsOffsets[notesToAdd.length] += savedNoteDuration;
					}
					if (currentNote !== "") {
						containerHeightsOffsets[notesToAdd.length] += currentNoteDuration;
					}
				}
			}
		}
		pushIfAvailable();
		console.log("beatLength:" + beatLength)
		var length = 0;
		var lastContainerHeight = time;
		for (var i = 0; i < notesToAdd.length; i++) {
			notesToAdd[i].duration *= beatLength;
			if (barOffsets[i] != null) {
				bars[time + (barOffsets[i]*beatLength)] = true;
			}
			if (containerHeightsOffsets[i] != null) {
				containerHeights.push(time + (containerHeightsOffsets[i]*beatLength) - lastContainerHeight)
				lastContainerHeight = time;
			}
			length += notesToAdd[i].duration
			addKeyWithOffset(notesToAdd[i].note, notesToAdd[i].duration)
		}
		console.log("length:"+length)
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
					if (--heldNotes[representedNote] == 1) delete heldNotes[representedNote];
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
			needNewTable = false;
		}
		outputContainer.appendChild(tableContainer);
	}