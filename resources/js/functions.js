window.onload = function(){

	var boardTable  = document.getElementById("board");
	var inputLevel  = document.getElementById("level");
	var inputMines  = document.getElementById("mines");
	var btnStart    = document.getElementById("btnStart");	

    var messages = {"WIN":{"content":"Fuck yeah! You win this time.","class":"alert alert-success"},
    				"LOSE":{"content":"BOOM! You lose.","class":"alert alert-danger"}};

	var colorValues = {1:'#0066ff',2:'#009933',3:'#ff3300',4:'#002699',5:'#cc3300',6:'#ff6699',7:'#ffff00'};

	Level = function(value){
		switch(value) {
			case "1":
				this.name = "Beginner";
				this.rows= 7;
				this.cols= 7;		
				this.mines = 10;
				break
			case "2":
				this.name = "Intermediate";
				this.rows= 15;
				this.cols= 15;
				this.mines = 40;
				break
			case "3":
				this.name = "Expert";
				this.rows= 15;
				this.cols= 29;
				this.mines = 99;
				break					
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
		this.enable = true

		this.isAMine = function(){
			return this.value == -1;
		}

		this.isEmpty = function(){
			return this.value == 0;
		}
	}

	Board.prototype.build = function(){	
		for(var i = 0; i <= this.level.rows ; i++){
			this.boxes.push([]);
			for(var j = 0; j <= this.level.cols ; j++){
				this.boxes[i][j] = new Box(i,j);
			}
		}			
		this.setMines();
		this.setPerimetersAndValues();
	}
	
	Board.prototype.setMines = function(){
		var minesRemaining = this.level.mines;
		while(minesRemaining>0){
			var row = Math.floor((Math.random() * this.level.rows));
			var col = Math.floor((Math.random() * this.level.cols));			

			if(!this.get(row, col).isAMine()){
				this.get(row, col).value = -1;
				minesRemaining-=1;
			}
		}		
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

	Game = function(level){
		this.board = new Board(level);
		this.showHelp = true;	
		this.movesRemaining = this.getTotalSafBoxes();
		this.activeMines = this.board.level.mines;
		this.buildBoard();	
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
		/*if(this.showHelp){
			boardTable.removeAttribute('bgcolor');
		}*/
	}
	
	Game.prototype.getTotalSafBoxes = function(){
		var totalBoxes = (this.board.level.rows+1) * (this.board.level.cols+1);
		totalBoxes-= this.board.level.mines;
		totalBoxes-= this.board.getAllByValue(0).length;
		return totalBoxes;
	}

	Game.prototype.getSafeBoxes = function(box){
		box.enable = false;	
		var perimeter = box.perimeter;
		for(var i = 0; i< perimeter.length; i++){
			itrBox = perimeter[i];
			this.updateBoardBox(itrBox);
			if(!itrBox.isEmpty()){
				if(itrBox.enable)
					this.movesRemaining-=1;
				itrBox.enable = false;
			}
			if(itrBox.isEmpty() && itrBox.enable)
				this.getSafeBoxes(itrBox);	
		}
	}

	Game.prototype.updateBoardBox = function(box){
		cell = boardTable.rows[box.row].cells[box.col];
		cell.innerHTML = box.value > 0 ? box.value : "";
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
				box.enable = false;
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

	Game.prototype.showAllMines = function(){
		var mines = this.board.getAllByValue(-1);
		for (var i = 0; i < mines.length; i++) {
			var box = mines[i];
			boardTable.rows[box.row].cells[box.col].className = "mine"; 	
		}
	}

	Game.prototype.disableAllBoxes = function(){
		var boxes = this.board.getAll();		
		for(var i = 0; i < boxes.length; i++) {
			for(var j = 0; j < boxes[i].length; j++) {
				var box = this.board.get(i,j);
				var cell = boardTable.rows[i].cells[j];
				box.enable = false;
				cell.setAttribute("disabled",true);
			}
		}			
	}
	
	function selectBox(cell){
		var row = cell.parentElement.rowIndex;
		var col = cell.getAttribute("id");
		var boxTarget = game.board.get(row,col);

		if(cell.className == "flag"){
			return;
		}
		if(boxTarget.enable){
			switch(boxTarget.value){
				case -1: 
					game.showAllMines(); //.showAllBoxes();
					game.disableAllBoxes();
					cell.className = "boom";
					showMessage(messages.LOSE);
				break;
				case 0: 	
					game.getSafeBoxes(boxTarget);
				break;
				default:
					boxTarget.enable = false;
					cell.className = "safe";
					cell.style.color = colorValues[boxTarget.value];			
					cell.innerHTML = boxTarget.value;	
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
		var boxTarget = game.board.get(row,col);
		var minesRemaining = parseInt(inputMines.value);

		if(boxTarget.enable){
			if(cell.className != "flag"){
				if(boxTarget.isAMine()){
					game.activeMines-=1;
					if(game.activeMines == 0){
						game.showAllBoxes();
						showMessage(messages.WIN);
					}
				}
				if(minesRemaining > 0){
					cell.className = "flag";
					inputMines.value = minesRemaining-1
				}
			}else{
				if(boxTarget.isAMine()){
					game.activeMines+=1;
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
			var color =  targetBox.isAMine() ? "#ffcccc" : "#b1c9ef";
			cell.setAttribute("bgcolor",color);

			for(var i = 0; i< perimeter.length; i++){
				var box = perimeter[i];
				cell = boardTable.rows[box.row].cells[box.col];
				color = box.isAMine() ? "#ffcccc" : "#b1c9ef";
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

	btnStart.addEventListener("click", function(){
		boardTable.innerHTML = "";
		level = inputLevel.value;
	    game = new Game(level);
		inputMines.value = game.board.level.mines;
		$('#modalGame').modal('hide');
	});

	$("#btnPlay").click(function(){
		$('#modalGame').modal('hide');
	})

	function showMessage(message){
		document.getElementById('messageModal').innerHTML = message.content;
		document.getElementById('divMessage').className = message.class;
		$('#modalMessage').modal('show');
	};
	
}