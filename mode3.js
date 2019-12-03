
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