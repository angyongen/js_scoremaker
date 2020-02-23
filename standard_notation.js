function createBelowStem(extraHeight) {
	var stem = document.createElement("div")
	stem.className = "stem"
	stem.style.top = 0
	stem.style.height = (extraHeight + 4) + "em"
	return stem
}

function createAboveStem(extraHeight) {
	var stem = document.createElement("div")
	stem.className = "stem"
	stem.style.bottom = 0
	stem.style.height = (extraHeight + 4) + "em"
	return stem
}

function createBelowTail() {
	var tail = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	tail.setAttributeNS(null, "viewBox", "0 0 30 96");
	tail.setAttributeNS(null, "preserveAspectRatio", "xMidYMax meet");
	var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttributeNS(null, "d", "M0,70q6,-4,18,-20t5,-40t2,3t-5,48t-20,34Z");
	path.style = "stroke:black;fill:black;"
	tail.appendChild(path);
	return tail;
}
function createAboveTail() {
	var tail = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	tail.setAttributeNS(null, "viewBox", "0 0 30 96");
	tail.setAttributeNS(null, "preserveAspectRatio", "xMidYMin meet");
	var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttributeNS(null, "d", "M0,25q6,4,18,20t5,40t2,-3t-5,-48t-20,-34Z");
	path.style = "stroke:black;fill:black;"
	tail.appendChild(path);
	return tail;
}
function createTrebleClef() {
	var clef = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	clef.className.baseVal = "treble_clef"
	clef.setAttributeNS(null, "viewBox", "0 0 15 36");
	clef.setAttributeNS(null, "preserveAspectRatio", "xMidYMid meet");
	var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttributeNS(null, "d", "M6,22q-2,-1,0,-3t5,1t0,5t-7,0t-2,-8t5,-10t0,-6t-3,2t3,16t1,14t-4,0t1,-3");
	path.style = "stroke:black;fill:none;stroke-width:1px;"
	clef.appendChild(path);
	return clef;
}

function createUpTails(noteFraction) {
	var container = document.createElement("div")
	var i = noteFraction-3
	if (noteFraction > 0) {
		container.appendChild(createAboveStem(i))
	}
	for (; i >= 0; i--) {
		var tail = createAboveTail()
		tail.className.baseVal = "flag"
		tail.style.bottom = i + "em"
		container.appendChild(tail)
	}
	container.className = "stemflag"
	return container
}

function createDownTails(noteFraction) {
	var container = document.createElement("div")
	var i = noteFraction-3
	if (noteFraction > 0) {
		container.appendChild(createBelowStem(i))
	}
	for (; i >= 0; i--) {
		var tail = createBelowTail()
		tail.className.baseVal = "flag"
		tail.style.top = i + "em"
		container.appendChild(tail)
	}
	container.className = "stemflag"
	return container
}

function clearTails(note) {
	for (var k = note.children.length - 1; k >= 0; k--) {
		var item = note.children[k]
		if(item.className.includes("stemflag")) lnote.removeChild(item)
	}
}

function noteHeadResolveInterference(table, column, affectedRows) {
	for (var i = affectedRows.length - 1; i >= 0; i--) {
		var cell = table.rows[affectedRows[i]].cells[column]
		for (var j = cell.children.length - 1; j >= 0; j--) {
			var lnote = cell.children[j]
			if(lnote.className.includes("sub")) {
				lnote.className = "l sub"
			} else {
				lnote.className = "r"
			}
			
		}
	}
}
function resolveStem(table, column, affectedRows, averageLinespaceNumber) {
	for (var i = affectedRows.length - 1; i >= 0; i--) {
		var cell = table.rows[affectedRows[i]].cells[column]
		for (var j = cell.children.length - 1; j >= 0; j--) {
			var lnote = cell.children[j]

			if (averageLinespaceNumber > 1) {
				lnote.appendChild(createUpTails(noteFraction))
			} else {
				lnote.prepend(createDownTails(noteFraction))
			}
			
		}
	}
}

	function updateColumn(table, column) {
		var staffRows = []
		var linespaces = []

		var notes = 0
		var totalRowNumber = 0
		var offset = 0

	//var noteFractionGroups = {}
				//var noteFraction = identifyNote(lnote)
				//if (!noteFractionGroups[noteFraction]) noteFractionGroups[noteFraction] = []
				//noteFractionGroups[noteFraction].push(lnote)
			//1 group notes
			//for each note group determine average 
		var rows = table.rows.length;
		for (var i = 0; i < rows; i++) {
			staffRows.push(i)
			var row = table.rows[i]
			if (!offset) if (row.className.includes("linespace")) linespaces.push(i)
			if (row.className.includes("division")) {
				resolveStem(table, column, staffRows, totalRowNumber/notes - offset)
				noteHeadResolveInterference(table, column, staffRows)
				staffRows = []
				notes = 0
				totalRowNumber = 0
				offset = 0
			}
			var cell = row.cells[column]
			for (var j = cell.children.length - 1; j >= 0; j--) {
				var lnote = cell.children[j]
				++notes
				if (lnote.className.includes("sub")) {
					totalRowNumber += i + 0.5
				} else {
					totalRowNumber += i
				}
			}
		}
		resolveStem(table, column, staffRows, totalRowNumber/notes - offset)
		noteHeadResolveInterference(table, column, staffRows)
	}
	function putNote(table, column, cell, noteFraction, sub) {
		for (var i = cell.children.length - 1; i >= 0; i--) {
			if (cell.children[i].className.includes("sub")?sub:!sub) {
				//already has sub/ already has nosub
				return false
			}
		}
		var note = document.createElement("div");

		var head = document.createElement("div")
		head.className = noteFractionToClassName(noteFraction)
		note.appendChild(head)

		note.className = "note " + noteFraction

		if(sub) note.className += " sub"
		cell.appendChild(note)
		//updateColumn(table, column)
		return note
	}
	function identifyNote(container) {
		return parseInt(container.className.replace("sub", "").replace("note", ""))
	}


	function noteFractionToClassName(noteFraction) {
		switch(noteFraction) {
			case 0: return "notehead semibreve"
			case 1: return "notehead minim"
			case 2: return "notehead crotchet"
			default: if (noteFraction >= 3) return "notehead quaver"
			//maybe rests are negative numbers?
		}
	}
	function noteFractionToStemNumber(noteFraction) {
		switch(noteFraction) {
			case 0: return 0
			case 1: return 1
			case 2: return 1
			default: if (noteFraction >= 3) return noteFraction-2
		}
	}
