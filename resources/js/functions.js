window.onload = function(){
    let isFirstMove;
    
    const MINE = -1;
	let boardTable  = document.getElementById("board");
	let inputLevel  = document.getElementById("level");
	let inputMines  = document.getElementById("mines");
	let btnStart    = document.getElementById("btnStart");	

    let messages = {"WIN":{"content":"Fuck yeah! You win this time.","class":"alert alert-info"},
    				"LOSE":{"content":"BOOM! You lose.","class":"alert alert-danger"}};

	let colorValues = {1:'#0066ff',2:'#009933',3:'#ff3300',4:'#002699',5:'#cc3300',6:'#ff6699',7:'#ffff00'};
	let perimeterColorValues = {"mine":"#ffcccc","noMine":"#b1c9ef"};

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
		this.build();
	}
	
	Box = function(row, col) {
		this.row = row,
		this.col = col,
		this.value = 0,
		this.perimeter = [],
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
	
	Board.prototype.setMines = function(){
		let minesRemaining = this.level.mines;
		while(minesRemaining > 0){
			let row = Math.floor((Math.random() * this.level.rows));
			let col = Math.floor((Math.random() * this.level.cols));			

			if(!this.get(row, col).isAMine()){
				this.get(row, col).value = MINE;
				minesRemaining-= 1;
			}
		}		
	}
	
	Board.prototype.setMinesFromBox = function(box){
		let minesRemaining = this.level.mines;
		while(minesRemaining > 0){
			let row = Math.floor((Math.random() * this.level.rows));
			let col = Math.floor((Math.random() * this.level.cols));			
			if(box != this.get(row, col)){
				if(!this.get(row, col).isAMine()){
					this.get(row, col).value = MINE;
					minesRemaining-= 1;
				}
			}
		}
		this.setPerimetersAndValues();		
	}

	Board.prototype.setPerimetersAndValues = function(){	
		for(let i = 0; i <= this.level.rows ; i++){
			for(let j = 0; j <= this.level.cols; j++){
				let box = this.get(i,j);
				if(!box.isAMine()){
					this.setPerimeter(box);
					this.setValue(box);
				}
			}
		}
	}

	Board.prototype.setPerimeter = function(box){
		let rowFrom, rowTo, colFrom, colTo;		

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
			for(let k = colFrom; k <= colTo; k++){
				let itrBox = this.get(i, k);
				if(itrBox != box)
					box.perimeter.push(itrBox);
			}		
	    }
	}

	Board.prototype.setValue = function(box){
		let perimeter = box.perimeter;
		let perimeterMines = 0;
		for(let itrBox of perimeter){
			if(itrBox.isAMine())
				perimeterMines+= 1;
		}
		box.value = perimeterMines;
	}

	Board.prototype.getAll = function(){
		return this.boxes;
	}

	Board.prototype.getAll2 = function(){
		result = new Array();
		for(let i = 0; i < this.boxes.length; i++){
			for(let j = 0; j < this.boxes[i].length; j++){			
				result.push(this.boxes[i][j]);
			}
		}
		return result;
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
	
	Board.prototype.get = function(row, col){
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
		this.showHelp = true;	
		this.movesRemaining = 0;
		this.activeMines = this.board.level.mines;
		this.buildBoard();	
	}
	
	Game.prototype.start = function(targetBox){
		this.board.setMinesFromBox(targetBox);
		game.movesRemaining = game.getTotalSafBoxes();
	}

	Game.prototype.buildBoard = function(){
		let boxes = this.board.getAll();
		let showHelp = this.showHelp;

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

				cell.addEventListener("mousemove", function(){
					scanPerimeter(this);
				});
				cell.addEventListener("mouseout", function(){
					hidePerimeter(this);
				});		
			}
		}
	}
	
	Game.prototype.getTotalSafBoxes = function(){
		let safesBoxes = (this.board.level.rows + 1) * (this.board.level.cols + 1);
		safesBoxes-= this.board.level.mines;
		safesBoxes-= this.board.getAllByValue(0).length;
		return safesBoxes;
	}

	Game.prototype.getSafeBoxes = function(box){
		box.isEnabled = false;	
		let perimeter = box.perimeter;
		this.updateBoardBox(box);
		for(let itrBox of perimeter){
			this.updateBoardBox(itrBox);
			if(!itrBox.isEmpty()){
				if(itrBox.isEnabled)
					this.movesRemaining-=1;
				itrBox.isEnabled = false;
			}
			if(itrBox.isEmpty() && itrBox.isEnabled)
				this.getSafeBoxes(itrBox);	
		}
	}

	Game.prototype.updateBoardBox = function(box){
		cell = boardTable.rows[box.row].cells[box.col];
		cell.innerHTML = box.isEmpty() ? "" : box.value;
		cell.style.color = colorValues[box.value];
		cell.className = "safe";
		cell.setAttribute("disabled",true);
	}

	Game.prototype.showAllBoxes = function(){
		let boxes = this.board.getAll();
		
		for(let i = 0; i < boxes.length; i++) {
			for(let j= 0; j < boxes[i].length; j++) {
				let box = this.board.get(i,j);
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
				let box = this.board.get(i,j);
				let cell = boardTable.rows[i].cells[j];
				box.isEnabled = false;
				cell.setAttribute("disabled",true);
			}
		}			
	}
	
	function selectBox(cell){
		let row = cell.parentElement.rowIndex;
		let col = cell.getAttribute("id");
		let targetBox = game.board.get(row,col);

		if(isFirstMove){
		   game.start(targetBox);
		   isFirstMove = false;
		}

		if(targetBox.isFlagged)
			return;

		if(targetBox.isEnabled){
			switch(targetBox.value){
				case MINE: 
					game.showAllMinesNotFlagged();
					game.disableAllBoxes();
					game.showWronglyFlaggedBoxes();
					cell.className = "boom";
					showMessage(messages.LOSE);
				break;
				case 0: 	
					game.getSafeBoxes(targetBox);
				break;
				default:
					targetBox.isEnabled = false;
					cell.className = "safe";
					cell.style.color = colorValues[targetBox.value];			
					cell.innerHTML = targetBox.value;	
					game.movesRemaining-= 1;
				break;
			}
			if(game.movesRemaining == 0){
				showMessage(messages.WIN);
				game.showAllBoxes();
			}
		}
	}
	
	function setFlag(cell){
		let row = cell.parentElement.rowIndex;
		let col = cell.getAttribute("id");
		let targetBox = game.board.get(row, col);

		if(targetBox.isEnabled){
			if(targetBox.isFlagged){
				if(targetBox.isAMine())
					game.activeMines+= 1;

				cell.className = "";
				inputMines.value = game.activeMines;
			}else{
				if(targetBox.isAMine()){
					game.activeMines-= 1;
					if(game.activeMines == 0){
						cell.className = "flag";
						game.showAllBoxes();
						showMessage(messages.WIN);
					}
				}
				if(game.activeMines > 0){
					cell.className = "flag";
					inputMines.value = game.activeMines;
				}
			}
			targetBox.isFlagged = !targetBox.isFlagged;
		}		
	}

	function scanPerimeter(cell){
		if(game.showHelp){
			let row = cell.parentElement.rowIndex;
			let col = cell.getAttribute("id");
			let targetBox = game.board.get(row, col);
			let perimeter = targetBox.perimeter;
			let color =  targetBox.isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
			cell.setAttribute("bgcolor",color);

			for(let box of perimeter){
				cell = boardTable.rows[box.row].cells[box.col];
				color = box.isAMine() ? perimeterColorValues.mine: perimeterColorValues.noMine;
 				cell.setAttribute("bgColor", color);
			}	
		}	
	}
	
	function hidePerimeter(cell){
		if(game.showHelp){
			let row = cell.parentElement.rowIndex;
			let col = cell.getAttribute("id");
			let targetBox = game.board.get(row,col);
			let perimeter = targetBox.perimeter;
			cell.setAttribute("bgColor", "");
			for(let box of perimeter){
				cell = boardTable.rows[box.row].cells[box.col];
				cell.setAttribute("bgColor", "");
			}
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
		boardTable.innerHTML = "";
		level = inputLevel.value;
	    game = new Game(level);
		inputMines.value = game.board.level.mines;
		$('#modalGame').modal('hide');
	});
	
}