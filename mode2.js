	var keyOffset = 60;
	var middleNote = 60;


	var beatLength = 1;

	var leftwidth = 0;
	var rightwidth = 0;
	var time = 0;
	var notesToAdd = [];
	var notes = [];
	var bars = {};
	var texts = {}

	var containerHeights = [];

	function clearNotes() {
		beatLength = 1;
		leftwidth = 0;
		rightwidth = 0;
		time = 0;
		notesToAdd = [];
		notes = [];
		bars = {};
		texts = {}
		drawNotes();
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

	function parseNumericScore(numericScore) {
		var barsToAdd = [];
		var containerHeightsToAdd = [];
		var textsToAdd = [];
		var currentNote = "";
		var currentNoteDuration = 1;
		var savedNote = "";
		var savedNoteDuration = 0;
		var pushNext = false;
		var chord = false;
		var push = function(note, duration) {
			console.log("note:"+note,"duration:"+duration)
			notesToAdd.push({note:note, duration:duration, chord:chord});
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
				case '[':
				pushIfAvailable();
				chord = true;
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
				case ']':
				chord = false;
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
				default:
				if ('01234567'.includes(char)) {
					pushIfAvailable();
					currentNote = [null,0,2,4,5,7,9,11][parseInt(char)]
					pushNext = true;
				}
			}
		}
		pushIfAvailable();
		console.log("beatLength:" + beatLength)
		var length = 0;
		var totalContainerHeight = time;
		notes = [];
		time = 0;
		var barsToAdd_i = 0;
		var containerHeightsToAdd_i = 0;
		var textsToAdd_i = 0;
		for (var i = 0; i < notesToAdd.length; i++) {
			while (barsToAdd[barsToAdd_i] && (barsToAdd[barsToAdd_i].location == i)) {
				bars[time + (barsToAdd[barsToAdd_i].offset*beatLength)] = true;
				++barsToAdd_i;
			}
			while (containerHeightsToAdd[containerHeightsToAdd_i] && (containerHeightsToAdd[containerHeightsToAdd_i].location == i)) {
				var lastContainerHeight = totalContainerHeight
				totalContainerHeight = containerHeightsToAdd[containerHeightsToAdd_i]*beatLength + time
				containerHeights.push(totalContainerHeight - lastContainerHeight)
				++containerHeightsToAdd_i;
			}
			while (textsToAdd[textsToAdd_i] && (textsToAdd[textsToAdd_i].location == i)) {
				texts[time + (textsToAdd[textsToAdd_i].offset*beatLength)] = textsToAdd[textsToAdd_i].text;
				++textsToAdd_i;
			}
			if (notesToAdd[i].chord) {
				addRelativeKey(notesToAdd[i].note, notesToAdd[i].duration * beatLength, false)
			} else {
				length += notesToAdd[i].duration
				addRelativeKey(notesToAdd[i].note, notesToAdd[i].duration * beatLength, true)
			}
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
			if (texts[t]) {
				var c = row.insertCell()
				var txt = document.createElement("pre")
				txt.className = "txt"
				txt.textContent = texts[t]
				c.appendChild(txt)
			}
			needNewTable = false;
		}
		outputContainer.appendChild(tableContainer);
	}