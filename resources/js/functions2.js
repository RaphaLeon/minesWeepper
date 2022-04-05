window.onload = function () {
	let isFirstMove;
	let config = { showHelp: false };
	const MINE = -1;
	let boardTable = document.getElementById("board");
	let inputLevel = document.getElementById("level");
	let spnTotalFlags = document.getElementById("spnTotalFlags");
	let btnStart = document.getElementById("btnStart");

	let messages = {
		WIN: { content: "Fuck yeah! You win this time.", class: "alert alert-info" },
		LOSE: { content: "BOOM! You lose.", class: "alert alert-danger" }
	};

	let colorValues = { "1": "#0066ff", "2": "#009933", "3": "#ff3300", "4": "#002699", "5": "#cc3300", "6": "#ff6699", "7": "#ffff00" };
	let perimeterColorValues = { mine: "#ffd6cc", noMine: "#e6ffe6" };

	let levels = [
		{ name: "Beginner", rows: 7, cols: 7, mines: 10 },
		{ name: "Intermediate", rows: 15, cols: 15, mines: 40 },
		{ name: "Expert", rows: 15, cols: 29, mines: 99 }
	];

	function createBox(row, col) {
		let __isEnabled = true;
		let __isFlagged = false;

		const box = {
			row,
			col,
			value: 0,
			isAMine: () => box.value === MINE,
			isEmpty: () => box.value === 0,
			isEnabled: () => __isEnabled,
			isFlagged: () => __isFlagged,
			toggleFlag: () => {
				__isFlagged = !__isFlagged;
			},
			setMine: () => {
				box.value = MINE;
			},
			open: () => {
				__isEnabled = false
			}
		}
		return box;
	}

	Board = function ({ rows, cols, mines }) {
		this.rows = rows;
		this.cols = cols;
		this.mines = mines;
		this.boxes = [];
		this.totalFlaggeds = 0;
		this.build();
	}

	Board.prototype.build = function () {
		for (let row = 0; row <= this.rows; row++) {
			this.boxes.push([]);
			for (let col = 0; col <= this.cols; col++) {
				this.boxes[row][col] = createBox(row, col);
			}
		}
	}

	Board.prototype.getBox = function (row, col) {
		return this.boxes[row][col];
	}

	Board.prototype.getRandomBox = function () {
		let row = Math.floor((Math.random() * this.rows));
		let col = Math.floor((Math.random() * this.cols));
		return this.getBox(row, col);
	}

	Board.prototype.fill = function () {
		let minesRemaining = this.mines;
		let targetBox;
		let boxPerimeter;

		while (minesRemaining > 0) {
			targetBox = this.getRandomBox();

			if (!targetBox.isAMine()) {
				targetBox.setMine();
				boxPerimeter = this.getBoxPerimeter(targetBox);
				boxPerimeter.forEach((box) => {
					if (!box.isAMine())
						box.value += 1;
				});
				minesRemaining -= 1;
			}
		}
	}

	Board.prototype.getBoxPerimeter = function (box) {
		let perimeter = [];

		const getLimits = (axe, MAX) => {
			if (axe === 0) {
				return { from: axe, to: axe + 1 };
			}
			if (axe === MAX) {
				return { from: axe - 1, to: axe };
			}
			return { from: axe - 1, to: axe + 1 };
		};

		const { from: rowFrom, to: rowTo } = getLimits(box.row, this.rows);
		const { from: colFrom, to: colTo } = getLimits(box.col, this.cols);

		for (let i = rowFrom; i <= rowTo; i++) {
			for (let j = colFrom; j <= colTo; j++) {
				let itrBox = this.getBox(i, j);
				if (itrBox !== box)
					perimeter.push(itrBox);
			}
		}
		return perimeter;
	}

	Board.prototype.getAll = function () {
		return this.boxes;
	}

	Board.prototype.getAllByCriteria = function (filetrFn) {
		let result = [];
		for (let boxes of this.boxes) {
			result = result.concat(boxes.filter(filetrFn));
		};
		return result;
	}

	Board.prototype.getAllByValue = function (value) {
		return this.getAllByCriteria(box => box.value === value);
	}

	Board.prototype.getAllFlagged = function () {
		return this.getAllByCriteria(box => box.isFlagged());
	}

	Game = function (level) {
		this.level = level;
		this.board = new Board(level);
		this.movesRemaining = 0;
		this.buildBoard();
		this.board.fill();
	}

	Game.prototype.start = function () {
		// this.board.fill();
		this.movesRemaining = this.getTotalSafBoxes();
	}

	Game.prototype.buildBoard = function () {
		this.board.getAll().forEach((row, rowIndex) => {
			let div = document.createElement("div");
			div.className = "board-row";
			div.id = rowIndex;
			row.forEach((box) => {
				let cell = document.createElement("div");
				cell.id = box.col;
				cell.className = "box";

				cell.addEventListener("click", function (e) {
					selectBox(box);
				});

				cell.addEventListener("contextmenu", function (e) {
					e.preventDefault();
					setFlag(box);
				}, false);

				if (config.showHelp) {
					cell.addEventListener("mouseover", function () {
						scanPerimeter(this);
					});
					cell.addEventListener("mouseout", function () {
						hidePerimeter(this);
					});
				}

				div.appendChild(cell);
			});
			boardTable.appendChild(div);
		})

	}

	Game.prototype.getTotalSafBoxes = function () {
		let safesBoxes = (this.level.rows + 1) * (this.level.cols + 1);
		safesBoxes -= this.level.mines;
		safesBoxes -= this.board.getAllByValue(0).length;
		return safesBoxes;
	}

	Game.prototype.showSafeBoxesAround = function (box) {
		box.open();
		let perimeter = this.board.getBoxPerimeter(box).filter(box => box.isEnabled());

		this.updateBoardBox(box);
		for (let itrBox of perimeter) {
			this.updateBoardBox(itrBox);
			if (!itrBox.isEmpty()) {
				this.movesRemaining -= 1;
				itrBox.open();
			}
			if (itrBox.isEmpty() && itrBox.isEnabled())
				this.showSafeBoxesAround(itrBox);
		}
	}

	Game.prototype.updateBoardBox = function (box) {
		cell = getBoxFromHTML(box);
		cell.innerHTML = box.isEmpty() ? "" : box.value;
		cell.style.color = colorValues[box.value];
		cell.classList.add("safe");
		cell.disabled = "true";
	}

	Game.prototype.showAllBoxes = function () {
		let boxes = this.board.getAll().flat();
		boxes.forEach((box) => {
			box.open();
			let cell = getBoxFromHTML(box);
			if (!box.isAMine()) {
				cell.classList.add("over");
				cell.innerHTML = box.value > 0 ? box.value : "";
				cell.style.color = colorValues[box.value];
			} else {
				if (!cell.classList.contains("flag"))
					cell.classList.add(game.movesRemaining === 0 ? "flag" : "mine");
			}
		});
	}

	Game.prototype.showAllMinesNotFlagged = function () {
		let mines = this.board.getAllByValue(MINE);

		for (let box of mines) {
			let cell = getBoxFromHTML(box);
			if (!cell.classList.contains("flag"))
				cell.classList.add("mine");
		}
	}

	Game.prototype.showWronglyFlaggedBoxes = function () {
		let flaggedBoxes = this.board.getAllFlagged();
		flaggedBoxes.forEach((box) => {
			cell = getBoxFromHTML(box);
			if (cell.classList.contains("flag") && !box.isAMine())
				cell.classList.add("wronglyFlagged");
		});
	}

	Game.prototype.disableAllBoxes = function () {
		let boxes = this.board.getAll().flat();
		boxes.forEach((box) => {
			box.open();
			let cell = getBoxFromHTML(box);
			cell.disabled = true;
		});
	}

	function getBoxFromHTML(box) {
		return boardTable.children[box.row].children[box.col];
	}

	function selectBox(box) {
		let cell = getBoxFromHTML(box);

		if (isFirstMove) {
			game.start(box);
			isFirstMove = false;
		}

		if (!box.isEnabled() || box.isFlagged()) return;

		if (box.isAMine()) {
			game.showAllMinesNotFlagged();
			game.disableAllBoxes();
			game.showWronglyFlaggedBoxes();
			cell.classList.add("boom");
			showMessage(messages.LOSE);
		} else if (box.isEmpty()) {
			game.showSafeBoxesAround(box);
		} else {
			box.open();
			cell.classList.add("safe");
			cell.style.color = colorValues[box.value];
			cell.innerHTML = box.value;
			game.movesRemaining -= 1;
		}

		if (game.movesRemaining === 0) {
			game.showAllBoxes();
			showMessage(messages.WIN);
			game.board.totalFlaggeds = game.level.mines;
			updateTotalFlagsIndicator();
		}
	}

	function setFlag(box) {
		let cell = getBoxFromHTML(box);

		if (box.isEnabled()) {
			if (box.isFlagged()) {
				cell.classList.remove("flag");
				game.board.totalFlaggeds -= 1;
			} else {
				cell.classList.add("flag");
				game.board.totalFlaggeds += 1;
			}
			box.toggleFlag();
			updateTotalFlagsIndicator();
		}
	}

	function updateTotalFlagsIndicator() {
		spnTotalFlags.innerHTML = `${game.board.totalFlaggeds}/${game.level.mines}`;
	}

	function scanPerimeter(cell) {
		let row = cell.parentElement.id;
		let col = cell.id;
		let targetBox = game.board.getBox(row, col);
		let perimeter = game.board.getBoxPerimeter(targetBox).filter(box => box.isEnabled());
		let color = targetBox.isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
		cell.style.backgroundColor = color;

		for (let box of perimeter) {
			cell = getBoxFromHTML(box);
			color = box.isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
			cell.style.backgroundColor = color;
		}
	}

	function hidePerimeter(cell) {
		let row = cell.parentElement.id;
		let col = cell.id;
		let targetBox = game.board.getBox(row, col);
		let perimeter = game.board.getBoxPerimeter(targetBox);
		cell.style.backgroundColor = "";

		for (let box of perimeter) {
			cell = getBoxFromHTML(box)
			cell.style.backgroundColor = "";
		}
	}

	function showMessage(message) {
		document.getElementById("messageModal").innerHTML = message.content;
		document.getElementById("divMessage").className = message.class;
		$("#modalMessage").modal("show");
	};

	(function loadLevels() {
		for (let level of levels) {
			let optionLevel = document.createElement("option");
			optionLevel.value = level.name;
			optionLevel.innerHTML = level.name;
			inputLevel.appendChild(optionLevel);
		}
	})();

	btnStart.addEventListener("click", function () {
		boardTable.innerHTML = "";
		isFirstMove = true;
		totalFlags = 0;

		level = levels.find(level => level.name === inputLevel.value);
		game = new Game(level);
		updateTotalFlagsIndicator();
		$("#modalGame").modal("hide");
	});
}