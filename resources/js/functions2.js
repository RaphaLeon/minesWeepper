window.onload = function() {
    let isFirstMove;
    let config = { showHelp: true };
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

    Box = function(row, col) {
        this.row = row;
        this.col = col;
        this.value = 0;
        this.isEnabled = true;
        this.isFlagged = false;

        this.isAMine = function() {
            return this.value === MINE;
        }

        this.isEmpty = function() {
            return this.value === 0;
        }

        this.setFlag = function(value) {
            this.isFlagged = value;
        }

    }

    Board = function(level) {
        this.level = level;
        this.boxes = [];
        this.totalFlaggeds = 0;
        this.build();
    }

    Board.prototype.build = function() {
        for (let i = 0; i <= this.level.rows; i++) {
            this.boxes.push([]);
            for (let j = 0; j <= this.level.cols; j++) {
                this.boxes[i][j] = new Box(i, j);
            }
        }
    }

    Board.prototype.getRandomBox = function() {
        let row = Math.floor((Math.random() * this.level.rows));
        let col = Math.floor((Math.random() * this.level.cols));
        return this.getBox(row, col);
    }

    Board.prototype.fill = function() {
        let minesRemaining = this.level.mines;
        let targetBox;
        let boxPerimeter;

        while (minesRemaining > 0) {
            targetBox = this.getRandomBox();

            if (!targetBox.isAMine()) {
                targetBox.value = MINE;
                boxPerimeter = this.getBoxPerimeter(targetBox);
                boxPerimeter.forEach((box) => {
                    if (!box.isAMine())
                        box.value += 1;
                });
                minesRemaining -= 1;
            }
        }
    }

    Board.prototype.getBoxPerimeter = function(box) {
        let rowFrom, rowTo, colFrom, colTo;
        let perimeter = [];

        if (box.row === 0) {
            rowFrom = box.row;
            rowTo = box.row + 1;
        } else if (box.row === this.level.rows) {
            rowFrom = box.row - 1;
            rowTo = box.row;
        } else {
            rowFrom = box.row - 1;
            rowTo = box.row + 1;
        }

        if (box.col === 0) {
            colFrom = box.col;
            colTo = box.col + 1;
        } else if (box.col === this.level.cols) {
            colFrom = box.col - 1;
            colTo = box.col;
        } else {
            colFrom = box.col - 1;
            colTo = box.col + 1;
        }

        for (let i = rowFrom; i <= rowTo; i++) {
            for (let j = colFrom; j <= colTo; j++) {
                let itrBox = this.getBox(i, j);
                if (itrBox != box)
                    perimeter.push(itrBox);
            }
        }
        return perimeter;
    }

    Board.prototype.getAll = function() {
        return this.boxes;
    }

    Board.prototype.getAllByValue = function(value) {
        let boxes = [];
        for (let i = 0; i < this.boxes.length; i++) {
            boxes = boxes.concat(this.boxes[i].filter(row => row.value === value));
        }
        return boxes;
    }

    Board.prototype.getBox = function(row, col) {
        return this.boxes[row][col];
    }

    Board.prototype.getAllFlagged = function() {
        let flaggedBoxes = [];

        for (let i = 0; i < this.boxes.length; i++) {
            for (let j = 0; j < this.boxes[i].length; j++) {
                if (this.boxes[i][j].isFlagged)
                    flaggedBoxes.push(this.boxes[i][j]);
            }
        }
        return flaggedBoxes;
    }

    Game = function(level) {
        this.board = new Board(level);
        this.movesRemaining = 0;
        this.buildBoard();
        //this.board.fill();
    }

    Game.prototype.start = function() {
        this.board.fill();
        game.movesRemaining = game.getTotalSafBoxes();
    }

    Game.prototype.buildBoard = function() {
        let boxes = this.board.getAll();

        for (let i = 0; i < boxes.length; i++) {
            let div = document.createElement("div");
            div.className = "board-row";
            div.id = i;
            for (let j = 0; j < boxes[i].length; j++) {
                let cell = document.createElement("div");
                cell.id = j;
                cell.className = "box";

                cell.addEventListener("click", function(e) {
                    selectBox(this);
                });

                cell.addEventListener("contextmenu", function(e) {
                    e.preventDefault();
                    setFlag(this);
                }, false);

                if (config.showHelp) {
                    cell.addEventListener("mouseover", function() {
                        scanPerimeter(this);
                    });
                    cell.addEventListener("mouseout", function() {
                        hidePerimeter(this);
                    });
                }

                div.appendChild(cell);
            }
            boardTable.appendChild(div);
        }
    }

    Game.prototype.getTotalSafBoxes = function() {
        let safesBoxes = (this.board.level.rows + 1) * (this.board.level.cols + 1);
        safesBoxes -= this.board.level.mines;
        safesBoxes -= this.board.getAllByValue(0).length;
        return safesBoxes;
    }

    Game.prototype.showSafeBoxesAround = function(box) {
        box.isEnabled = false;
        let perimeter = this.board.getBoxPerimeter(box);
        this.updateBoardBox(box);
        for (let itrBox of perimeter) {
            this.updateBoardBox(itrBox);
            if (!itrBox.isEmpty()) {
                if (itrBox.isEnabled)
                    this.movesRemaining -= 1;
                itrBox.isEnabled = false;
            }
            if (itrBox.isEmpty() && itrBox.isEnabled)
                this.showSafeBoxesAround(itrBox);
        }
    }

    Game.prototype.updateBoardBox = function(box) {
        cell = getBoxFromHTML(box.row, box.col);
        cell.innerHTML = box.isEmpty() ? "" : box.value;
        cell.style.color = colorValues[box.value];
        cell.classList.add("safe");
        cell.disabled = "true";
    }

    Game.prototype.showAllBoxes = function() {
        let boxes = this.board.getAll();

        for (let i = 0; i < boxes.length; i++) {
            for (let j = 0; j < boxes[i].length; j++) {
                let box = this.board.getBox(i, j);
                let cell = getBoxFromHTML(i, j);
                box.isEnabled = false;
                if (!box.isAMine()) {
                    cell.classList.add("over");
                    cell.innerHTML = box.value > 0 ? box.value : "";
                    cell.style.color = colorValues[box.value];
                } else {
                    if (!cell.classList.contains("flag"))
                        cell.classList.add(game.movesRemaining === 0 ? "flag" : "mine");

                }
            }
        }
    }

    Game.prototype.showAllMinesNotFlagged = function() {
        let mines = this.board.getAllByValue(MINE);
        
        for (let i = 0, len = mines.length; i < len; i++) {
            let cell = getBoxFromHTML(mines[i].row, mines[i].col);
            if (!cell.classList.contains("flag"))
                cell.classList.add("mine");
        }
    }

    Game.prototype.showWronglyFlaggedBoxes = function() {
        let flaggedBoxes = this.board.getAllFlagged();

        for (let i = 0, len = flaggedBoxes.length; i < len; i++) {
            cell = getBoxFromHTML(flaggedBoxes[i].row, flaggedBoxes[i].col);
            if (cell.classList.contains("flag") && !flaggedBoxes[i].isAMine())
                cell.classList.add("wronglyFlagged");
        }
    }

    Game.prototype.disableAllBoxes = function() {
        let boxes = this.board.getAll();
        for (let i = 0; i < boxes.length; i++) {
            for (let j = 0; j < boxes[i].length; j++) {
                let box = this.board.getBox(i, j);
                let cell = getBoxFromHTML(i, j);
                box.isEnabled = false;
                cell.disabled = true;
            }
        }
    }

    function getBoxFromHTML(row, col) {
        return boardTable.children[row].children[col];
    }

    function selectBox(cell) {
        let row = cell.parentElement.id;
        let col = cell.id;
        let box = game.board.getBox(row, col);

        if (isFirstMove) {
            game.start(box);
            isFirstMove = false;
        }

        if (box.isFlagged)
            return;

        if (box.isEnabled) {
            switch (box.value) {
                case MINE:
                    game.showAllMinesNotFlagged();
                    game.disableAllBoxes();
                    game.showWronglyFlaggedBoxes();
                    cell.classList.add("boom");
                    showMessage(messages.LOSE);
                    break;
                case 0:
                    game.showSafeBoxesAround(box);
                    break;
                default:
                    box.isEnabled = false;
                    cell.classList.add("safe");
                    cell.style.color = colorValues[box.value];
                    cell.innerHTML = box.value;
                    game.movesRemaining -= 1;
                    break;
            }
            if (game.movesRemaining === 0) {
                game.showAllBoxes();
                showMessage(messages.WIN);
                game.board.totalFlaggeds = game.board.level.mines;
                updateTotalFlagsIndicator();
            }
        }
    }

    function setFlag(cell) {
        let row = cell.parentElement.id;
        let col = cell.id;
        let box = game.board.getBox(row, col);

        if (box.isEnabled) {
            if (box.isFlagged) {
                cell.classList.remove("flag");
                game.board.totalFlaggeds -= 1;
            } else {
                cell.classList.add("flag");
                game.board.totalFlaggeds += 1;
            }
            box.isFlagged = !box.isFlagged;
            updateTotalFlagsIndicator();
        }
    }

    function updateTotalFlagsIndicator(flags) {
        spnTotalFlags.innerHTML = `${game.board.totalFlaggeds}/${game.board.level.mines}`;
    }

    function scanPerimeter(cell) {
        let row = cell.parentElement.id;
        let col = cell.id;
        let targetBox = game.board.getBox(row, col);
        let perimeter = game.board.getBoxPerimeter(targetBox);
        let color = targetBox.isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
        cell.style.backgroundColor = color;

        for (let i = 0, len = perimeter.length; i < len; i++) {
            cell = getBoxFromHTML(perimeter[i].row, perimeter[i].col);
            color = perimeter[i].isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
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
            cell = getBoxFromHTML(box.row, box.col)
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

    btnStart.addEventListener("click", function() {
        boardTable.innerHTML = "";
        isFirstMove = true;
        totalFlags = 0;

        level = levels.find(level => level.name === inputLevel.value);
        game = new Game(level);
        updateTotalFlagsIndicator();
        $("#modalGame").modal("hide");
    });
}