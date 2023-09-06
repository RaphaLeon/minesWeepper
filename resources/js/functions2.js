window.onload = function () {
	const gameBoard = document.getElementById('board');
	const inputLevel = document.getElementById('level');
	const spnTotalFlags = document.getElementById('spnTotalFlags');
	const endGameModal = document.getElementById('messageModal');
	const endGameMessage = document.getElementById('divMessage');
	const retryModalBtn = document.getElementById('retry');
	
	const config = { showHelp: true };
	const MINE = -1;
	const colorValues = { '1': '#0066ff', '2': '#009933', '3': '#ff3300', '4': '#002699', '5': '#cc3300', '6': '#ff6699', '7': '#ffff00' };
	const highlighColorValues = { mine: '#ffd6cc', safe: '#e6ffe6' };
	const messages = {
		WIN: { content: 'Fuck yeah! You win this time.', class: 'alert alert-info' },
		LOSE: { content: 'BOOM! You lose.', class: 'alert alert-danger' }
	};
	const levels = [
		{ name: 'Beginner', rows: 7, cols: 7, mines: 10 },
		{ name: 'Intermediate', rows: 15, cols: 15, mines: 40 },
		{ name: 'Expert', rows: 15, cols: 29, mines: 99 }
	];

	class Cell {
		#value;
		#isEnable = true;
		#isFlagged = false;
		#perimeter = [];

		constructor(row, col, value, perimeter) {
			this.row = row;
			this.col = col;
			this.#value = value;
			this.#perimeter = perimeter
		}
		
		isAMine() { return this.#value === MINE }
		
		isEmpty() { return this.#value === 0; }
		
		isSafe() { return this.#value > 0; }
		
		isFlagged() { return this.#isFlagged }
		
		isEnable() { return this.#isEnable }
		
		getPerimeter() { return this.#perimeter }
		
		disable() { this.#isEnable = false }

		setUI(htmlCell) { this.htmlCell = htmlCell }
		
		toggleFlag() {
			this.#isFlagged = !this.#isFlagged;
			this.#isFlagged
				? this.htmlCell.classList.add('flag') 
				: this.htmlCell.classList.remove('flag');
		}
		
		open() {
			if (!this.isEnable() || this.isFlagged()) return;

			this.disable();
			this.htmlCell.classList.add('safe');
			this.htmlCell.style.color = colorValues[this.#value] || '';
			this.htmlCell.innerHTML = this.#value > 0 ? this.#value : '';
		}
		
		show(gameStatus) {
			if (!this.isEnable()) return;

			this.disable();
			if (this.isFlagged()) {
				this.htmlCell.classList.add('wronglyFlagged');
				return;
			}

			if (gameStatus === 'win') {
				this.htmlCell.style.color = colorValues[this.#value];
				this.htmlCell.innerHTML = this.#value > 0 ? this.#value : '';
			}
		}
	
		highlightOn() {
			this.htmlCell.style.backgroundColor = this.isAMine() ? highlighColorValues.mine : highlighColorValues.safe;
		}

		highlightOff() {
			this.htmlCell.style.backgroundColor = '';
		}
	}

	class Mine extends Cell {
		constructor(row, col, value, perimeter) {
			super(row, col, value, perimeter)
		}

		open() {
			if (!this.isEnable() || this.isFlagged()) return;
			this.disable();
			this.htmlCell.classList.add('boom');
		}
		
		show(gameStatus) {
			if (!this.isEnable()) return;
			this.disable();

			if (!this.isFlagged()) {
				this.htmlCell.classList.add(gameStatus === 'win' ? 'flag' : 'mine');
			}
		}
	}

	class Board {
		#cells = [];

		constructor({ rows, cols, mines }) {
			this.rows = rows;
			this.cols = cols;
			this.mines = mines;
			this.#build();
		}
		
		#build() {
			const minesCoords = this.#getMinesCoords();
			const isMine = ({ row, col }) => minesCoords.some(mine =>  mine.row === row && mine.col === col);
			
			for (let row = 0; row <= this.rows; row++) {
				this.#cells.push([]);
				for (let col = 0; col <= this.cols; col++) {
					const perimeter = this.#getCellPerimeterCoords({ row, col });
					if (isMine({ row, col })) {
						this.#cells[row][col] = new Mine(row, col, MINE, perimeter);
						continue;	
					}
					const value = perimeter.filter(isMine).length
					this.#cells[row][col] = new Cell(row, col, value, perimeter);
				}
			}
		}

		#getMinesCoords() {
			let minesRemaining = this.mines;
			const minesCoords = {};
			while (minesRemaining > 0) {
				const { row, col } = this.#getRandomCellCoords();
				if (!minesCoords[row + '_' + col]) {
					minesCoords[row + '_' + col] = { row, col };
					minesRemaining -= 1;
				}
			}
			return Object.values(minesCoords);
		}
		
		#getRandomCellCoords() {
			let row = Math.floor((Math.random() * this.rows));
			let col = Math.floor((Math.random() * this.cols));
			return { row, col };
		}

		#getCellPerimeterCoords(cell) {
			let perimeter = [];

			const getLimits = (axe, MAX) => {
				const from = axe - 1 >= 0 ? axe - 1 : axe; 
				const to = axe + 1 <= MAX ? axe + 1: axe;
				return { from, to };
			};

			const { from: rowFrom, to: rowTo } = getLimits(cell.row, this.rows);
			const { from: colFrom, to: colTo } = getLimits(cell.col, this.cols);

			for (let i = rowFrom; i <= rowTo; i++) {
				for (let j = colFrom; j <= colTo; j++) {
					let itrBox = { row: i, col: j };
					if (itrBox.row + '_' + itrBox.col !== cell.row + '_' + cell.col)
						perimeter.push(itrBox);
				}
			}
			return perimeter;
		}

		#getAllByCriteria(filetrFn) {
			let result = [];
			for (let cells of this.#cells) {
				result = result.concat(cells.filter(filetrFn));
			};
			return result;
		}

		getCellPerimeter(cell) {
			return cell.getPerimeter().map(({ row, col }) => this.#cells[row][col]);
		}

		getAll() {
			return this.#cells;
		}

		getSafes() {
			return this.#getAllByCriteria(cell => cell.isSafe());
		}

		getEnables() {
			return this.#getAllByCriteria(cell => cell.isEnable());
		}
	}

	class Game {
		constructor(level) {
			this.level = level;
			this.board = new Board(level);
			this.start();
		}
		
		start() {
			this.totalFlaggeds = 0;
			this.movesRemaining = this.board.getSafes().length;
			this.renderBoard();
			this.updateTotalFlagsIndicator();
		}

		renderBoard() {
			gameBoard.innerHTML = ''
			this.board.getAll().forEach((row) => {
				const rowDiv = document.createElement('div');
				rowDiv.className = 'board-row';
				row.forEach((cell) => {
					const cellDiv = document.createElement('div');
					cellDiv.className = 'cell';
					cell.setUI(cellDiv);
					
					cellDiv.addEventListener('click', (e) => {
						this.openCell(cell);
					});
					
					cellDiv.addEventListener('contextmenu', (e) => {
						e.preventDefault();
						this.setFlag(cell);
					}, false);
					
					if (config.showHelp) {
						cellDiv.addEventListener('mouseover', () => {
							this.showPerimeter(cell);
						});
						cellDiv.addEventListener('mouseout', () => {
							this.hidePerimeter(cell);
						});
					}
					
					rowDiv.appendChild(cellDiv);
				});
				gameBoard.appendChild(rowDiv);
			})
		}

		openCell(cell) {
			if (!cell.isEnable() || cell.isFlagged()) return;

			if (cell.isEmpty())	{
				this.openPerimeterCells(cell)
				return;
			}

			cell.open();
			if (cell.isAMine()) {
				this.showAllCells('lose');
				this.showMessage(messages.LOSE);
				return;
			}


			this.movesRemaining -= 1;
			if (this.movesRemaining === 0) {
				this.showAllCells('win');
				this.totalFlaggeds = this.level.mines;
				this.updateTotalFlagsIndicator();
				this.showMessage(messages.WIN);
			}
		}

		openPerimeterCells(cell) {
			cell.open();
			let perimeter = this.board.getCellPerimeter(cell);
			for (let itrCell of perimeter) {
				if (!itrCell.isEnable()) continue;

				if (itrCell.isEmpty()) {
					this.openPerimeterCells(itrCell);
				} else {
					itrCell.open();
					this.movesRemaining -= 1;
				}
			}
		}

		showAllCells(gameStatus) {
			this.board.getEnables().forEach((cell) => cell.show(gameStatus));
		}

		setFlag(cell) {
			if (!cell.isEnable()) return;
			
			if (cell.isFlagged()) {
				this.totalFlaggeds -= 1;
			} else {
				this.totalFlaggeds += 1;
			}  
			cell.toggleFlag();
			this.updateTotalFlagsIndicator();
		}

		updateTotalFlagsIndicator() {
			spnTotalFlags.innerHTML = `${this.totalFlaggeds}/${this.level.mines}`;
		}

		showMessage(message) {
			endGameModal.innerHTML = message.content;
			endGameMessage.className = message.class;
			$('#modalMessage').modal('show');
		}

		showPerimeter(cell) {
			cell.highlightOn()
			this.board.getCellPerimeter(cell)
				.filter(cell => cell.isEnable())
				.forEach(perimeterCell => perimeterCell.highlightOn());
		}

		hidePerimeter(cell) {
			cell.highlightOff();
			this.board.getCellPerimeter(cell).forEach(perimeterCell => perimeterCell.highlightOff())
		}
	}

	function startGame() {
		level = levels.find(level => level.name === inputLevel.value);
		game = new Game(level);
	}

	inputLevel.addEventListener('change', startGame);
	retryModalBtn.addEventListener('click', startGame);
	  
	startGame();
}