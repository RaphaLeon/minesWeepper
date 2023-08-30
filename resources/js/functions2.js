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

	class Box {
		#isEnabled = true;
		#isFlagged = false;

		constructor(row, col) {
			this.row = row;
			this.col = col;
			this.value = 0;
		}

		isAMine() { return this.value === MINE }
		isEmpty() { return  this.value === 0; }
		isEnabled() { return  this.#isEnabled }
		isFlagged() { return  this.#isFlagged }
		toggleFlag() { this.#isFlagged = !this.#isFlagged; }
		setMine() { this.value = MINE; }
		open() { this.#isEnabled = false }
	}

	class Board {
		#boxes = [];

		constructor({ rows, cols, mines }) {
			this.rows = rows;
			this.cols = cols;
			this.mines = mines;
			this.totalFlaggeds = 0;
			this.build();
		}

		build() {
			for (let row = 0; row <= this.rows; row++) {
				this.#boxes.push([]);
				for (let col = 0; col <= this.cols; col++) {
					this.#boxes[row][col] = new Box(row, col);
				}
			}
		}

		getBox(row, col) {
			return this.#boxes[row][col];
		}

		getRandomBox() {
			let row = Math.floor((Math.random() * this.rows));
			let col = Math.floor((Math.random() * this.cols));
			return this.getBox(row, col);
		}

		fill() {
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

		getBoxPerimeter(box) {
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

		getAll() {
			return this.#boxes;
		}

		getAllByCriteria(filetrFn) {
			let result = [];
			for (let boxes of this.#boxes) {
				result = result.concat(boxes.filter(filetrFn));
			};
			return result;
		}

		getAllByValue(value) {
			return this.getAllByCriteria(box => box.value === value);
		}

		getAllFlagged() {
			return this.getAllByCriteria(box => box.isFlagged());
		}

	}

	class Game {
		constructor(level) {
			this.level = level;
			this.board = new Board(level);
			this.movesRemaining = 0;
			this.buildBoard();
			this.board.fill();
		}

		start() {
			// this.board.fill();
			this.movesRemaining = this.getTotalSafBoxes();
		}

		buildBoard() {
			this.board.getAll().forEach((row, rowIndex) => {
				let div = document.createElement("div");
				div.className = "board-row";
				div.id = rowIndex;
				row.forEach((box) => {
					let cell = document.createElement("div");
					cell.id = box.col;
					cell.className = "box";

					cell.addEventListener("click", (e) => {
						this.selectBox(box);
					});

					cell.addEventListener("contextmenu", (e) => {
						e.preventDefault();
						this.setFlag(box);
					}, false);

					if (config.showHelp) {
						cell.addEventListener("mouseover", () => {
							this.scanPerimeter(cell);
						});
						cell.addEventListener("mouseout", () => {
							this.hidePerimeter(cell);
						});
					}

					div.appendChild(cell);
				});
				boardTable.appendChild(div);
			})

		}

		getTotalSafBoxes() {
			return this.board.getAllByCriteria(box => box.value > 0).length;
		}

		showSafeBoxesAround(box) {
			box.open();
			this.updateBoardBox(box);
			let perimeter = this.board.getBoxPerimeter(box);
			for (let itrBox of perimeter) {
				if (!itrBox.isEnabled()) continue;
				
				this.updateBoardBox(itrBox);
				if (itrBox.isEmpty()) {
					this.showSafeBoxesAround(itrBox);
				} else {
					this.movesRemaining -= 1;
					itrBox.open();
				}
			}
		}

		updateBoardBox(box) {
			const cell = this.getBoxFromHTML(box);
			cell.innerHTML = box.isEmpty() ? "" : box.value;
			cell.style.color = colorValues[box.value];
			cell.classList.add("safe");
			cell.disabled = "true";
		}

		showAllBoxes() {
			let boxes = this.board.getAll().flat();
			boxes.forEach((box) => {
				box.open();
				let cell = this.getBoxFromHTML(box);
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

		showAllMinesNotFlagged() {
			let mines = this.board.getAllByValue(MINE);

			for (let box of mines) {
				let cell = this.getBoxFromHTML(box);
				if (!cell.classList.contains("flag"))
					cell.classList.add("mine");
			}
		}

		showWronglyFlaggedBoxes() {
			let flaggedBoxes = this.board.getAllFlagged();
			flaggedBoxes.forEach((box) => {
				cell = this.getBoxFromHTML(box);
				if (cell.classList.contains("flag") && !box.isAMine())
					cell.classList.add("wronglyFlagged");
			});
		}

		disableAllBoxes() {
			let boxes = this.board.getAll().flat();
			boxes.forEach((box) => {
				box.open();
				let cell = this.getBoxFromHTML(box);
				cell.disabled = true;
			});
		}

		selectBox(box) {
			let cell = this.getBoxFromHTML(box);

			if (isFirstMove) {
				this.start(box);
				isFirstMove = false;
			}

			if (!box.isEnabled() || box.isFlagged()) return;

			if (box.isAMine()) {
				this.showAllMinesNotFlagged();
				this.disableAllBoxes();
				this.showWronglyFlaggedBoxes();
				cell.classList.add("boom");
				showMessage(messages.LOSE);
			} else if (box.isEmpty()) {
				this.showSafeBoxesAround(box);
			} else {
				box.open();
				cell.classList.add("safe");
				cell.style.color = colorValues[box.value];
				cell.innerHTML = box.value;
				this.movesRemaining -= 1;
			}

			if (this.movesRemaining === 0) {
				this.showAllBoxes();
				showMessage(messages.WIN);
				this.board.totalFlaggeds = this.level.mines;
				updateTotalFlagsIndicator();
			}
		}

		setFlag(box) {
			let cell = this.getBoxFromHTML(box);

			if (box.isEnabled()) {
				if (box.isFlagged()) {
					cell.classList.remove("flag");
					this.board.totalFlaggeds -= 1;
				} else {
					cell.classList.add("flag");
					this.board.totalFlaggeds += 1;
				}
				box.toggleFlag();
				updateTotalFlagsIndicator();
			}
		}

		scanPerimeter(cell) {
			let row = cell.parentElement.id;
			let col = cell.id;
			let targetBox = this.board.getBox(row, col);
			let perimeter = this.board.getBoxPerimeter(targetBox).filter(box => box.isEnabled());
			let color = targetBox.isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
			cell.style.backgroundColor = color;

			for (let box of perimeter) {
				cell = this.getBoxFromHTML(box);
				color = box.isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
				cell.style.backgroundColor = color;
			}
		}

		hidePerimeter(cell) {
			let row = cell.parentElement.id;
			let col = cell.id;
			let targetBox = this.board.getBox(row, col);
			let perimeter = this.board.getBoxPerimeter(targetBox);
			cell.style.backgroundColor = "";

			for (let box of perimeter) {
				cell = this.getBoxFromHTML(box)
				cell.style.backgroundColor = "";
			}
		}

		getBoxFromHTML(box) {
			return boardTable.children[box.row].children[box.col];
		}
	}

	function updateTotalFlagsIndicator() {
		spnTotalFlags.innerHTML = `${game.board.totalFlaggeds}/${game.level.mines}`;
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