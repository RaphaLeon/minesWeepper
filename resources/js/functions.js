window.onload = function(){
    var isFirstMove;
    
    const MINE = -1;
	var boardTable  = document.getElementById("board");
	var inputLevel  = document.getElementById("level");
	var inputMines  = document.getElementById("mines");
	var btnStart    = document.getElementById("btnStart");	

    var messages = {"WIN":{"content":"Fuck yeah! You win this time.","class":"alert alert-info"},
    				"LOSE":{"content":"BOOM! You lose.","class":"alert alert-danger"}};

	var colorValues = {1:'#0066ff',2:'#009933',3:'#ff3300',4:'#002699',5:'#cc3300',6:'#ff6699',7:'#ffff00'};
	var perimeterColorValues = {"mine":"#ffcccc","noMine":"#b1c9ef"};

	var levels = [{"name":"Beginner","rows":7,"cols":7,"mines":10},
				  {"name":"Intermediate","rows":15,"cols":15,"mines":40}, 
				  {"name":"Expert","rows":15,"cols":29,"mines":99}];

	Level = function(value){
		for(var i = 0; levels.length; i++){
			if(levels[i].name == value)
				return levels[i];
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
		for(var i = 0; i <= this.level.rows ; i++){
			this.boxes.push([]);
			for(var j = 0; j <= this.level.cols ; j++){
				this.boxes[i][j] = new Box(i,j);
			}
		}			
	}
	
	Board.prototype.setMines = function(){
		var minesRemaining = this.level.mines;
		while(minesRemaining > 0){
			var row = Math.floor((Math.random() * this.level.rows));
			var col = Math.floor((Math.random() * this.level.cols));			

			if(!this.get(row, col).isAMine()){
				this.get(row, col).value = MINE;
				minesRemaining-= 1;
			}
		}		
	}
	
	Board.prototype.setMinesFromBox = function(box){
		var minesRemaining = this.level.mines;
		while(minesRemaining > 0){
			var row = Math.floor((Math.random() * this.level.rows));
			var col = Math.floor((Math.random() * this.level.cols));			
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
		for(var i = 0; i <= this.level.rows ; i++){
			for(var j = 0; j <= this.level.cols; j++){
				var box = this.get(i,j);
				if(!box.isAMine()){
					//this.setPerimeter(box);
					this.setValue(box);
				}
			}
		}
	}

	Board.prototype.setPerimeter = function(box){
		var rowFrom;
		var rowTo;
		var colFrom;
		var colTo;		
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

		for(var h = rowFrom; h <= rowTo; h++){
			for(var k = colFrom; k <= colTo; k++){
				var itrBox = this.get(h, k);
				if(itrBox != box){
					box.perimeter.push(itrBox);
				}
			}		
	    }
	}

	Board.prototype.setValue = function(box){
		this.setPerimeter(box);
		for(var i = 0; i < box.perimeter.length; i++){
			if(box.perimeter[i].isAMine())
				box.value+= 1;
		}
	}

	Board.prototype.getAll = function(){
		return this.boxes;
	}

	Board.prototype.getAllByValue = function(value){
		result = new Array();

		for(var i = 0; i < this.boxes.length; i++){
			for(var j = 0; j < this.boxes[i].length; j++){			
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

		for(var i = 0; i < this.boxes.length; i++){
			for(var j = 0; j < this.boxes[i].length; j++){		
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
		var boxes = this.board.getAll();
		var showHelp = this.showHelp;

		for(var i = 0; i < boxes.length ; i++){
			var row = boardTable.insertRow(i);
			row.setAttribute("id",i);

			for(var j =0; j<boxes[i].length ; j++){
				var box = boxes[i][j];
				var cell = row.insertCell(j);
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
		var safesBoxes = (this.board.level.rows + 1) * (this.board.level.cols + 1);
		safesBoxes-= this.board.level.mines;
		safesBoxes-= this.board.getAllByValue(0).length;
		return safesBoxes;
	}

	Game.prototype.getSafeBoxes = function(box){
		box.isEnabled = false;	
		var perimeter = box.perimeter;
		this.updateBoardBox(box);
		for(var i = 0; i< perimeter.length; i++){
			itrBox = perimeter[i];
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
		var boxes = this.board.getAll();
		
		for(var i = 0; i < boxes.length; i++) {
			for(var j = 0; j < boxes[i].length; j++) {
				var box = this.board.get(i,j);
				var cell = boardTable.rows[i].cells[j];				
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
		var mines = this.board.getAllByValue(MINE);
		for (var i = 0; i < mines.length; i++) {
			var box = mines[i];
			var cell = boardTable.rows[box.row].cells[box.col];
			if(cell.className != "flag")
				cell.className = "mine"; 	
		}
	}

	Game.prototype.showWronglyFlaggedBoxes = function(){
		flaggedBoxes = this.board.getAllFlagged();
		for(var i = 0; i < flaggedBoxes.length; i++){			
			box = flaggedBoxes[i];
			cell = boardTable.rows[box.row].cells[box.col]; 
			if(cell.className == "flag" && !box.isAMine())
				cell.className = "wronglyFlagged";
		}
	}

	Game.prototype.disableAllBoxes = function(){
		var boxes = this.board.getAll();		
		for(var i = 0; i < boxes.length; i++) {
			for(var j = 0; j < boxes[i].length; j++) {
				var box = this.board.get(i,j);
				var cell = boardTable.rows[i].cells[j];
				box.isEnabled = false;
				cell.setAttribute("disabled",true);
			}
		}			
	}
	
	function selectBox(cell){
		var row = cell.parentElement.rowIndex;
		var col = cell.getAttribute("id");
		var targetBox = game.board.get(row,col);

		if(isFirstMove){
		   game.start(targetBox);
		   //game.movesRemaining = game.getTotalSafBoxes();
		   isFirstMove = false;
		}

		if(cell.className == "flag"){
			return;
		}
		if(targetBox.isEnabled){
			switch(targetBox.value){
				case MINE: 
					game.showAllMinesNotFlagged(); //.showAllBoxes();
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
					game.movesRemaining-=1;
				break;
			}
			if(game.movesRemaining == 0){
				showMessage(messages.WIN);
				game.showAllBoxes();
			}
		}
	}
	
	function setFlag(cell){
		var row = cell.parentElement.rowIndex;
		var col = cell.getAttribute("id");
		var targetBox = game.board.get(row,col);
		var minesRemaining = parseInt(inputMines.value);

		if(targetBox.isEnabled){

			targetBox.isFlagged = !targetBox.isFlagged;
			if(cell.className != "flag"){
				if(targetBox.isAMine()){
					game.activeMines-= 1;
					if(game.activeMines == 0){
						cell.className = "flag";
						game.showAllBoxes();
						showMessage(messages.WIN);
					}
				}
				if(minesRemaining > 0){
					cell.className = "flag";
					inputMines.value = minesRemaining - 1;
				}
			}else{
				if(targetBox.isAMine()){
					game.activeMines+= 1;
				}
				cell.className = "";
				inputMines.value = minesRemaining +=1;
			}
		}		
	}

	function scanPerimeter(cell){
		if(game.showHelp){
			var row = cell.parentElement.rowIndex;
			var col = cell.getAttribute("id");
			var targetBox = game.board.get(row,col);
			var perimeter = targetBox.perimeter;
			var color =  targetBox.isAMine() ? perimeterColorValues.mine : perimeterColorValues.noMine;
			cell.setAttribute("bgcolor",color);

			for(var i = 0; i< perimeter.length; i++){
				var box = perimeter[i];
				cell = boardTable.rows[box.row].cells[box.col];
				color = box.isAMine() ? perimeterColorValues.mine: perimeterColorValues.noMine;
 				cell.setAttribute("bgColor", color);
			}	
		}	
	}
	
	function hidePerimeter(cell){
		if(game.showHelp){
			var row = cell.parentElement.rowIndex;
			var col = cell.getAttribute("id");
			var targetBox = game.board.get(row,col);
			var perimeter = targetBox.perimeter;
			cell.setAttribute("bgColor", "");
				for(var i = 0; i < perimeter.length; i++){
					var box = perimeter[i];
					cell = boardTable.rows[box.row].cells[box.col];
					cell.setAttribute("bgColor", "");
				}
		}		
	}	

	function loadLevels(){
		for(var i = 0; i < levels.length ; i++){
			var optionLevel = document.createElement('option');
			optionLevel.value = levels[i].name;
			optionLevel.innerHTML = levels[i].name;
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