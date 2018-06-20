window.onload = function(){
    let isFirstMove;
	
	let config = {showHelp: false}

    const MINE = -1;
	let boardTable  = document.getElementById("board");
	let inputLevel  = document.getElementById("level");
	let spnTotalFlags = document.getElementById("spnTotalFlags");
	let btnStart    = document.getElementById("btnStart");	

    let messages = {"WIN":{"content":"Fuck yeah! You win this time.","class":"alert alert-info"},
    				"LOSE":{"content":"BOOM! You lose.","class":"alert alert-danger"}};

	let colorValues = {1:'#0066ff',2:'#009933',3:'#ff3300',4:'#002699',5:'#cc3300',6:'#ff6699',7:'#ffff00'};
	let perimeterColorValues = {"mine":"#ffd6cc","noMine":"#e6ffe6"};

	let levels = [{"name":"Beginner","rows":7,"cols":7,"mines":10},
				  {"name":"Intermediate","rows":15,"cols":15,"mines":40}, 
				  {"name":"Expert","rows":15,"cols":29,"mines":99}];

	Level = function(value){
		for(let level of levels){
			if(level.name == value)
				return level;
		}
	}
	
	Board = function(level){
		this.level = new Level(level);	
		this.boxes = new Array();
		this.totalFlaggeds = 0;
		this.build();
	}
	
	Box = function(row, col) {
		this.row = row,
		this.col = col,
		this.value = 0,
		this.isEnabled = true
		this.isFlagged = false;

		this.isAMine = function(){
			return this.value == MINE;
		}

		this.isEmpty = function(){
			return this.value == 0;
		}

		this.setFlag = function(value){
			this.isFlagged = value;
		}

	}

	Board.prototype.build = function(){	
		for(let i = 0; i <= this.level.rows ; i++){
			this.boxes.push([]);
			for(let j = 0; j <= this.level.cols ; j++){
				this.boxes[i][j] = new Box(i,j);
			}
		}			
	}
    
    Board.prototype.getRandomBox = function(){
        let row = Math.floor((Math.random() * this.level.rows));
        let col = Math.floor((Math.random() * this.level.cols));
        return this.getBox(row, col);
    }

    Board.prototype.fill = function(){
        let minesRemaining = this.level.mines;
        let targetBox;
        let boxPerimeter;

        while(minesRemaining > 0){
            targetBox = this.getRandomBox();

			if(!targetBox.isAMine()){
                targetBox.value = MINE;
                boxPerimeter = this.getBoxPerimeter(targetBox);
                boxPerimeter.forEach((box) => {
                    if(!box.isAMine())
                         box.value+= 1; 
                });
				minesRemaining-= 1;
			}                        
        }
    }

    Board.prototype.getBoxPerimeter = function(box){
		let rowFrom, rowTo, colFrom, colTo;		
        let perimeter = [];

		if(box.row == 0){
			rowFrom = box.row;
			rowTo = box.row + 1;
		}else if(box.row == this.level.rows){ 
			rowFrom = box.row - 1;
			rowTo = box.row;
		}else{
			rowFrom = box.row - 1;
			rowTo = box.row + 1;			
		}
		
		if(box.col == 0){
		    colFrom = box.col;
			colTo = box.col + 1;				
		}else if(box.col == this.level.cols){
		    colFrom = box.col - 1;
			colTo = box.col;				
		}else{
		    colFrom = box.col - 1;
			colTo = box.col + 1;				
		}

		for(let i = rowFrom; i <= rowTo; i++){
			for(let j = colFrom; j <= colTo; j++){
				let itrBox = this.getBox(i, j);
				if(itrBox != box)
					perimeter.push(itrBox);
			}		
        }
        
        return perimeter;
    }

	Board.prototype.getAll = function(){
		return this.boxes;
	}

	Board.prototype.getAllByValue = function(value){
		result = new Array();
		for(let i = 0; i < this.boxes.length; i++){
			for(let j= 0; j < this.boxes[i].length; j++){			
				if(this.boxes[i][j].value == value){
					result.push(this.boxes[i][j]);
				}
			}
		}
		return result;
	}
	
	Board.prototype.getBox = function(row, col){
		return this.boxes[row][col];
	}

	Board.prototype.getAllFlagged = function(){
		flaggedBoxes = new Array();

		for(let i = 0; i < this.boxes.length; i++){
			for(let j= 0; j < this.boxes[i].length; j++){		
				if(this.boxes[i][j].isFlagged)
					flaggedBoxes.push(this.boxes[i][j]);
			}
		}
		return flaggedBoxes;
	}

	Game = function(level){
		this.board = new Board(level);
		this.movesRemaining = 0;
        this.buildBoard();	
        //this.board.fill();
	}
	
	Game.prototype.start = function(){
        this.board.fill();
        game.movesRemaining = game.getTotalSafBoxes();
	}

	Game.prototype.buildBoard = function(){
		let boxes = this.board.getAll();

		for(let i = 0; i < boxes.length ; i++){
			let row = boardTable.insertRow(i);
			row.setAttribute("id",i);

			for(let j = 0; j<boxes[i].length ; j++){
				let cell = row.insertCell(j);
				cell.setAttribute("id",j);

				cell.addEventListener("click", function(){
					selectBox(this);
				});		
				cell.addEventListener("contextmenu", function(e){
					e.preventDefault();
					setFlag(this);
				},false);

                if(config.showHelp){
                    cell.addEventListener("mousemove", function(){
                        scanPerimeter(this);
                    });
                    cell.addEventListener("mouseout", function(){
                        hidePerimeter(this);
                    });	
                }	
			}
		}
	}
	
	Game.prototype.getTotalSafBoxes = function(){
		let safesBoxes = (this.board.level.rows + 1) * (this.board.level.cols + 1);
		safesBoxes-= this.board.level.mines;
		safesBoxes-= this.board.getAllByValue(0).length;
		return safesBoxes;
	}

	Game.prototype.showSafeBoxesAround = function(box){
		box.isEnabled = false;	
		let perimeter = this.board.getBoxPerimeter(box);  //box.perimeter;
		this.updateBoardBox(box);
		for(let itrBox of perimeter){
			this.updateBoardBox(itrBox);
			if(!itrBox.isEmpty()){
				if(itrBox.isEnabled)
					this.movesRemaining-=1;
				itrBox.isEnabled = false;
			}
			if(itrBox.isEmpty() && itrBox.isEnabled)
				this.showSafeBoxesAround(itrBox);	
		}
	}

	Game.prototype.updateBoardBox = function(box){
		cell = boardTable.rows[box.row].cells[box.col];
		cell.innerHTML = box.isEmpty() ? "" : box.value;
		cell.style.color = colorValues[box.value];
		cell.className = "safe";
		cell.setAttribute("disabled", true);
	}

	Game.prototype.showAllBoxes = function(){
		let boxes = this.board.getAll();
		
		for(let i = 0; i < boxes.length; i++) {
			for(let j= 0; j < boxes[i].length; j++) {
				let box = this.board.getBox(i,j);
				let cell = boardTable.rows[i].cells[j];				
				box.isEnabled = false;
				if(!box.isAMine()){
					cell.className = "over"; 
					cell.innerHTML = box.value > 0 ? box.value : "";
					cell.style.color = colorValues[box.value];
				}else{
					if(cell.className!='flag')
						cell.className = game.movesRemaining == 0 ? "flag": "mine";
					
				}
			}
		}
	}

	Game.prototype.showAllMinesNotFlagged = function(){
		let mines = this.board.getAllByValue(MINE);

		for (let box of mines) {
			let cell = boardTable.rows[box.row].cells[box.col];
			if(cell.className != "flag")
				cell.className = "mine"; 	
		}
	}

	Game.prototype.showWronglyFlaggedBoxes = function(){
		let flaggedBoxes = this.board.getAllFlagged();

		for(let box of flaggedBoxes){			
			cell = boardTable.rows[box.row].cells[box.col]; 
			if(cell.className == "flag" && !box.isAMine())
				cell.className = "wronglyFlagged";
		}
	}

	Game.prototype.disableAllBoxes = function(){
		let boxes = this.board.getAll();		
		for(let i = 0; i < boxes.length; i++) {
			for(let j= 0; j < boxes[i].length; j++) {
				let box = this.board.getBox(i,j);
				let cell = boardTable.rows[i].cells[j];
				box.isEnabled = false;
				cell.setAttribute("disabled",true);
			}
		}			
	}
	
	function selectBox(cell){
		let row = cell.parentElement.rowIndex;
		let col = cell.getAttribute("id");
		let box = game.board.getBox(row,col);

		if(isFirstMove){
		   game.start(box);
		   isFirstMove = false;	
		}

		if(box.isFlagged)
			return;

		if(box.isEnabled){
			switch(box.value){
				case MINE: 
					game.showAllMinesNotFlagged();
					game.disableAllBoxes();
					game.showWronglyFlaggedBoxes();
					cell.className = "boom";
					showMessage(messages.LOSE);
				break;
				case 0: 	
					game.showSafeBoxesAround(box);
				break;
				default:
					box.isEnabled = false;
					cell.className = "safe";
					cell.style.color = colorValues[box.value];			
					cell.innerHTML = box.value;	
					game.movesRemaining-= 1;
				break;
			}
			if(game.movesRemaining == 0){
				showMessage(messages.WIN);
				game.showAllBoxes();
				game.board.totalFlaggeds = game.board.level.mines;
				updateTotalFlagsIndicator();
			}
		}
	}
	
	function setFlag(cell){
		let row = cell.parentElement.rowIndex;
		let col = cell.cellIndex; 
		let box = game.board.getBox(row, col);
		
		if(box.isEnabled){
			if(box.isFlagged){
				cell.className = "";
				game.board.totalFlaggeds-= 1;
			}else{
				cell.className = "flag";
				game.board.totalFlaggeds+= 1;
			}
			box.isFlagged = !box.isFlagged;
			updateTotalFlagsIndicator();
		}		
	}

	function updateTotalFlagsIndicator(){
		spnTotalFlags.innerHTML = `${game.board.totalFlaggeds}/${game.board.level.mines}`;		
	}	

	function scanPerimeter(cell){
        let row = cell.parentElement.rowIndex;
        let col = cell.cellIndex; 
        let targetBox = game.board.getBox(row, col);
        let perimeter = game.board.getBoxPerimeter(targetBox); //targetBox.perimeter;
        let color =  targetBox.isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
        cell.setAttribute("bgcolor",color);

        for(let box of perimeter){
            cell = boardTable.rows[box.row].cells[box.col];
            color = box.isAMine() ? perimeterColorValues.mine: perimeterColorValues.noMine;
                cell.setAttribute("bgColor", color);
        }	
	}
	
	function hidePerimeter(cell){
        let row = cell.parentElement.rowIndex;
        let col = cell.getAttribute("id");
        let targetBox = game.board.getBox(row,col);
        let perimeter = game.board.getBoxPerimeter(targetBox); //targetBox.perimeter;
        cell.setAttribute("bgColor", "");

        for(let box of perimeter){
            cell = boardTable.rows[box.row].cells[box.col];
            cell.setAttribute("bgColor", "");
        }	
	}	

	function loadLevels(){
		for(let level of levels){
			let optionLevel = document.createElement('option');
			optionLevel.value = level.name;
			optionLevel.innerHTML = level.name;
			inputLevel.appendChild(optionLevel);
		}
	}

	function showMessage(message){
		document.getElementById('messageModal').innerHTML = message.content;
		document.getElementById('divMessage').className = message.class;
		$('#modalMessage').modal('show');
	};

	loadLevels();
	
	btnStart.addEventListener("click", function(){
		isFirstMove = true;
		totalFlags = 0; 
		boardTable.innerHTML = "";
		level = inputLevel.value;
		game = new Game(level);

		if(!config.showHelp)
			$('table tr td').css('background-color', '#d9d9d9')
			//$('.test tr td').css('background-color', '#d9d9d9');

		updateTotalFlagsIndicator();
		$('#modalGame').modal('hide');
	});
	
}