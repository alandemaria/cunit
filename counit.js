palavras = []; //variaveis globais
noloopif = [];
arrayCondicionais = [];

/*	(function() { // funcao auto executante que captura texto da caixa de entrada
		var texto = document.getElementById("texto").value;
		document.getElementById("res").innerHTML = texto;
	}()); */

	function quebraTexto() { // quebrar o texto em substrings
		//chamada para limpar tokens caso o botão tenha sido clicado mais de uma vez
		//if (lexemas.childElementCount != 0) {
		//	limpaToken();
		//}
		//geracao de de tokens usando funcao js "split" e regex. -> no momento não reconhece ponto final como terminador de escopo. necessário melhorar esse motor de quebra da string em tokens válidos para cobol.
		tokens = document.getElementById("texto").value.toUpperCase().split(/\s+|\.\b/);
		var id = 0;
		//loop para criacao dos objetos que carregam o token, o id (posicao na string) e a classe do token (essas classes mudam de acordo com a logica do parser)
		
		for (var a in tokens) {
			if (!tokens.hasOwnProperty(a)) {
			continue;
			}
			// insere as propriedades num objeto do array
			// funcao captura token pega a classificacao do token
			palavras.push(
				{literal: tokens[a],
				id: a,
				classe: capturaIdToken(tokens[a])}
			);
			// objeto abaixo contem a estrutura necessaria para gerar a arvore binária a partir das palavras de controle loop condicional
			if (palavras[a].literal == "IF" || palavras[a].literal == "ELSE") {
				noloopif.push(
					{literal: palavras[a].literal,
					pai: "",
					geracao: "",
					subgeracao: 0,
					idno: id,
					condition_block: "",
					idant: "",
					literalpai: "",
					geracaopai: "",
					subgeracaopai: ""
					}
				);
			} else {
			  if (palavras[a].literal == "END-IF") {
			    noloopif.push(
					{literal: palavras[a].literal.slice(0,3),  //gambiarra só pra passar END
					pai: "",
					geracao: "",
					subgeracao: 0,
					idno: id,
					condition_block: "FIM DO LAÇO",
					literalpai: "",
					geracaopai: "",
					subgeracaopai: ""
					}
				);
			  };
			}
          id = id + 1;
		}
		fonte();
		try {
			executaArvore();
			}
		catch(err) {
			executaArvore();
			}
	}

	var capturaIdToken = function capturaIdToken(tkn) { //funcao que retorna o tipo de token
		// definicoes das palavras reservadas e suas classificacoes
		var _verbo = [
			"DISPLAY", "ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MOVE", "PERFORM", "COMPUTE",
			"RETURN", "OPEN", "CLOSE", "READ", "WRITE", "EXIT", "CANCEL", "CALL", "CONTINUE",
		];
		var _to = ["TO"];
		var _if = ["IF"];
		var _else = ["ELSE"];
		var _endif = ["END-IF"];
		var _var = [];
		var _numvar = [];
		var _operador = [">", ">=", "<= ", "<", "=", "EQUAL", "GREATER", "LESS"];
		var _goback = ["GOBACK"];
		var _andor = ["AND", "OR"];
		var elemento = tkn;

		//ifs abaixo testam se o elemento está na lista. o comando indexOf retorna a posição caso o elemento exista, -1 caso contrário
		//necessário organizar
		if (_verbo.indexOf(elemento) > -1) {
			return "VERBO";
		}

		if (_to.indexOf(elemento) > -1) {
			return "TO";
		}

		if (_operador.indexOf(elemento) > -1) {
			return "OPERADOR";
		}

		if (_andor.indexOf(elemento) > -1) {
			return "CONECTIVO AND/OR";
		}

		if (_if.indexOf(elemento) > -1) {
			return "IF";
		}

		if (_else.indexOf(elemento) > -1) {
			return "ELSE";
		}

		if (_endif.indexOf(elemento) > -1) {
			return "END-IF";
		}

		if (_goback.indexOf(elemento) > -1) {
			return "GOBACK";
		}

		if (isNaN(parseInt(elemento, 10))) {
			return "VARIAVEL"
		} else {
			return "NUMERO"
		}

	}

	// logica parser ------------------------------------------------------------------------------

	var indicetoken = 0;
	var flagsaida = false;
	var condicionalnormal; //indice que guarda os condicionais para mostrar na árvore
	var condicionalinversa;

	function avancaToken() { //funcoes de controle do posicionamento do token
		indicetoken += 1;
		return indicetoken;
	}

	function retornaToken() { //funcoes de controle do posicionamento do token
		indicetoken -= 1;
		return indicetoken;
	}

	function fonte() { // funcao principal fonte. é o nó inicial na busca do parser
		if(!corpo()) {
			console.log("Ocorreu um erro no parseamento do trecho. Verifique e tente novamente");
		}

		avancaToken();

		//goback é o terminador do escopo do fonte por enquanto. na realidade deve ser o último ponto (terminador de escopo) do programa.
		if(!goback()) {
			console.log("Terminador de trecho GOBACK não encontrado. Faça a alteração e tente novamente");
		}

		console.log("Parseamento com sucesso");
	}

	function corpo() { //a funcao corpo está definida para analisar somente laços de if. seria o ponto de expansão caso novas estruturas gramaticais sejam adicionadas

		if(!_if()) {
			console.log("Um IF era esperado na primeira posição. Favor verificar");
		}

		avancaToken();

		do {
			condicional();
		}
		while (flagsaida == false);

		avancaToken();

		do {
			expressao();
		}
		while (flagsaida == false);

		avancaToken();
		
		if(_if()) {
			corpo(); //voltar para expressao se for o caso
		} else {
			if (verbo()) { 
				expressao();
			}
		}

		if (_else()) {

			avancaToken();
			
			do {
				if(_if()) {
					corpo(); //voltar para expressao se for o caso
				} else {
					if (verbo()) { 
						expressao();
					}
				}
			}
			while (flagsaida == false);

			avancaToken();

			_endif();

			return true;

		} else {
			if (!_endif()) {
				console.log("Erro, esperado terminador de escopo end-if");
			} else {
				return true;
			}
		}
	}

	function condicional() { 	//funcao condicional trata de testes logicos A > B, etc. expansão futura: adição de suporte a parênteses

		flagsaida = false;

		if ( !(num() || vari()) ) {
			console.log("Um número ou variável era esperado na posicao. Favor verificar");
		}
		
		condicionalnormal = palavras[indicetoken].literal;
		
		avancaToken();

		if (!operador()) {
			console.log("Um operador era esperado na posição. Favor verificar");
		}
		
		var operadoraux;
		
		operadoraux = renomeiaOperador(palavras[indicetoken].literal); // renomeia o operador
		condicionalnormal = condicionalnormal + " " + operadoraux; // concatena o operador com a variavel anterior
		
		avancaToken();

		if ( !(num() || vari()) ) {
			console.log("Um número ou variável era esperado na posicao. Favor verificar");
		}

		condicionalnormal = condicionalnormal + " " + palavras[indicetoken].literal;
		
		avancaToken();

		if (!andor()) {
			arrayCondicionais.push(condicionalnormal);
			retornaToken();
			flagsaida = true;
		} else {
			avancaToken();
		}
	}

	function expressao() { //funcao expressao cuida dos comandos executados dentro de um if (move, add, etc.). por enquanto suporte somente a gramatica VERBO VARIAVEL TO VARIAVEL (verbos move e add) e if aninhado.

	flagsaida = false;

		if (verbo()) {

			avancaToken();

			if ( !(num() || vari()) ) {
				console.log("Um número ou variável era esperado na posicao. Favor verificar");
			}

			avancaToken();

			if (!to()) {
				console.log("Um 'TO' era esperado na posicao. Favor verificar");
			}

			avancaToken();

			if (!vari()) {
				console.log("Uma variavel era esperado na posicao. Favor verificar");
			}

		} else {

			if(!corpo()) {
				console.log("Ocorreu um erro no parseamento do if aninhado. Verifique e tente novamente");
			}
		}

		avancaToken();

		//essa pergunta do if abaixo deverá ser feita para todas as possibilidades de tokens de início de expressão -> para expansão futura
		if(verbo() || _if()) {
			flagsaida = false;
		} else {
			retornaToken();
			flagsaida = true;
		}
	}

	//funcoes abaixo controlam expressões não-terminais em terminais

	function controlecond() {
		if (palavras[indicetoken].classe == "CONTROLE CONDICIONAL") {
			return true;
		} else {
			return false;
			}
	}
	
	
	function num() {
		if (palavras[indicetoken].classe == "NUMERO") {
			return true;
		} else {
			return false;
			}
	 }

	function vari() {
		if (palavras[indicetoken].classe == "VARIAVEL") {
			return true;
		} else {
			return false;
			}
	 }

	function operador() {
		if (palavras[indicetoken].classe == "OPERADOR") {
			return true;
		} else {
			return false;
			}
	}

	function to() {
		if (palavras[indicetoken].classe == "TO") {
			return true;
		} else {
			return false;
			}
	}

	function _if() {
		if (palavras[indicetoken].classe == "IF") {
			return true;
		} else {
			return false;
			}
	}

	function _else() {
		if (palavras[indicetoken].classe == "ELSE") {
			return true;
		} else {
			return false;
			}
	}

	function _endif() {
		if (palavras[indicetoken].classe == "END-IF") {
			return true;
		} else {
			return false;
			}
	}

	function verbo() {
		if (palavras[indicetoken].classe == "VERBO") {
			return true;
		} else {
			return false;
			}
	}

	function goback() {
		if (palavras[indicetoken].classe == "GOBACK") {
			return true;
		} else {
			return false;
			}
	}

	function andor() {
		if (palavras[indicetoken].classe == "CONECTIVO AND/OR") {
			return true;
		} else {
			return false;
			}
	}

	function inverteOperador(op) { //funcao que recebe e avalia o operador do condicional, retornando o operador inverso
		switch (op) {
		case ">":
			return "<=";
		case "GREATER":
			return "<=";
		case "<":
			return ">=";
		case "LESS":
			return ">=";
		case "=":
			return "!=";
		case "EQUAL":
			return "!=";
		}
	}

	function renomeiaOperador(op) {
		switch (op) {
		case "GREATER":
			return ">";
		case "LESS":
			return "<";
		case "EQUAL":
			return "=";
		default:
			return op;
		}
	}

	function insereCasosDeTeste(txt) {
		var lista = document.getElementById("listacasosdeteste"),
		novalinha = document.createElement("li"),
		conteudo = document.createTextNode(txt);

		novalinha.appendChild(conteudo);
		lista.appendChild(novalinha);
	}

	function atualizaCasosDeTeste(valor, indice) {
		document.getElementById("listacasosdeteste").childNodes[indice].innerHTML += valor;
	}

    // funcoes para geracao da arvore binaria e casos de testes
	//se o end-if é encontrado, então o controle tem que voltar para o pai do último if antes do if terminado pelo end-if.

function inserePai() {
  for (var a in noloopif) {
    if (!noloopif.hasOwnProperty(a)) {
      continue;
	}
	if (noloopif[a].idno === 0) {
	  noloopif[a].pai = "vazio";
	} else {
	  noloopif[a].pai = noloopif[a-1].literal;
	  noloopif[a].idant = noloopif[a-1].idno;
	}
   }
  console.log("sucesso");
}

var indexador = -1;

function proximoNo() {
  indexador = indexador + 1;
}

//var saida2 = true;
function executaBloco() {
	while (indexador <= noloopif.length) {
		bloco();
	}
}

function bloco() {
  proximoNo();
  if (typeof(noloopif[indexador]) !== "undefined") {
    switch (noloopif[indexador].literal) {
      case "IF":
  	    avaliaToken();
	    break;
	  case "ELSE":
	    avaliaToken();
	    break;
	  case "END":
	    avaliaToken();
	    break;
    }
  } else {
	//saida2 = false;	
  }
}

// essa funcao faz a analise dos ifs e determina as gerações corretas de cada elemento, e se existe subgeracao
function avaliaToken() {
  switch (noloopif[indexador].literal) {
    case "IF": // caso o elemento atual seja um IF ---->
	  if (indexador === 0) {
	    noloopif[indexador].geracao = 1;
	  } else {
	      switch (noloopif[indexador-1].literal) { // <----- entao olhamos para o elemento anterior a ele para determinar sua geração
	        case "IF":
	    	case "ELSE":
	    	  noloopif[indexador].geracao = noloopif[indexador-1].geracao + 1;
			  if (noloopif[indexador-1].subgeracao !== 0) {
			    noloopif[indexador].subgeracao = noloopif[indexador-1].subgeracao;
			  };
	    	  break;
	    	case "END":
	    	  noloopif[indexador].geracao = noloopif[indexador-1].geracao;
			  noloopif[indexador].subgeracao = noloopif[indexador-1].subgeracao + 1;
	    	  break;
	    	case "vazio":
              noloopif[indexador].geracao = 1;
              break;
	    	default:
              console.log("erro no case IF do switch (token) da funcao avaliaToken");
              break;
		  }
	    };
	  break;
	case "ELSE":
	  switch (noloopif[indexador-1].literal) {
	    case "IF":
		  noloopif[indexador].geracao = noloopif[indexador-1].geracao;
		  noloopif[indexador].subgeracao = noloopif[indexador-1].subgeracao;
		  break;
		case "END":
          noloopif[indexador].geracao = noloopif[indexador-1].geracao - 1;
		  if (noloopif[indexador-1].subgeracao !== 0) {
		     noloopif[indexador].subgeracao = noloopif[indexador-1].subgeracao - 1;
			}
		  break;
        default:
          console.log("erro no case ELSE do switch (token) da funcao avaliaToken");
          break;
	  };
	  if (noloopif[indexador].geracao === 1) {
	    noloopif[indexador].pai = "vazio";
	  };
	  break;
	case "END":
	  switch (noloopif[indexador-1].literal) {
	    case "IF":
		case "ELSE":
		  noloopif[indexador].geracao = noloopif[indexador-1].geracao;
		  if (noloopif[indexador-1].subgeracao !== 0) {
		     noloopif[indexador].subgeracao = noloopif[indexador-1].subgeracao;
		  }
		  break;
		case "END":
          noloopif[indexador].geracao = noloopif[indexador-1].geracao - 1;
		  if (noloopif[indexador-1].subgeracao !== 0) {
		     noloopif[indexador].subgeracao = noloopif[indexador-1].subgeracao;
		  }
		  break;
		default:
          console.log("erro no case END-IF do switch (token) da funcao avaliaToken");
          break;
	  };
	  if (noloopif[indexador].geracao === 1) {
	    noloopif[indexador].pai = "vazio";
	  };
      break;
	default:
      console.log("erro no switch (token) da funcao avaliaToken");
      break;
  }
}

// a parte abaixo é responsavel por popular os blocos condicionais e inverter quando necessário
var varauxloop;
var saida = 0;
var indiceelse;

function distribuiBlocosCondicao() {
  var i = 0;
  for (k = 0; k <= noloopif.length; k++) {
    if (!noloopif.hasOwnProperty(k)) {
		continue;
	}
    if (noloopif[k].literal == "IF") {
		noloopif[k].condition_block = arrayCondicionais[i];
		i = i + 1;
	} else {
	    if (noloopif[k].literal == "ELSE") {
		  if (noloopif[k-1].literal == "IF") {
		    noloopif[k].condition_block = inverteBlocosCondicao(arrayCondicionais[i-1])
		  } else {
		      varauxloop = k;
			  indiceelse = retornaLoop(varauxloop);
			  noloopif[k].condition_block = inverteBlocosCondicao(arrayCondicionais[indiceelse]);
		  }
		}
	  }
  }
}

function retornaLoop(x) {
   if (noloopif[x-1].literal == "END" || noloopif[x-1].geracao !== noloopif[k].geracao) {
      varauxloop = varauxloop - 1;
	  saida = retornaLoop(varauxloop);
   }
  return (varauxloop-1);
}

function inverteBlocosCondicao(cdtion) {
  arraycond = cdtion.split(" ");
  switch(arraycond[1]) {
  case "=":
   return cdtion.replace("=","!=");
  case ">":
    return cdtion.replace(">","<=");
  case "<":
    return cdtion.replace("<",">=");
  case "!=":
    return cdtion.replace("!=","=");
  case "<=":
    return cdtion.replace("<=",">");
  case ">=":
    return cdtion.replace(">=","<");
  default:
    window.alert("erro na inversao do sinal para captura das condicoes de algum nó else");
  }
}

var configuracaoArvore = {
    container: "#tree-simple", hideRootNode: false, connectors: {type: "bCurve"},
    node: {
        HTMLclass: 'nodeExample1'
    }
};

var filho00vazio00vazio = { text: "início" };

tree_structure = [];

function montaNodes() {

  tree_structure.push(configuracaoArvore); // insere no de configuracao da biblioteca TREANT
  tree_structure.push(filho00vazio00vazio); // insere nó vazio pai

  // primeira passada para incluir a geração 1 como filho do nó pai vazio.

																						  //*********************************************************************************
																						  //aqui abaixo tem que arrumar para acertar o caso de teste mais simples
																						  //*********************************************************************************
  
  var primeiraGeracao = noloopif.map(function(o){return o.geracao;}).indexOf(1);
  if (primeiraGeracao === -1) { primeiraGeracao = 1; quebra = "v" }  
  for (j in noloopif) { // esse primeiro loop serve apenas para montar os primeiros filhos no nó pai vazio          
    if (noloopif[j].geracao == noloopif[primeiraGeracao].geracao) {                                                 

	  noloopif[j].literalpai = "vazio";
	  noloopif[j].geracaopai = 0;
	  noloopif[j].subgeracaopai = 0;

	  eval("filho"+noloopif[j].geracao+noloopif[j].subgeracao+noloopif[j].literal+noloopif[j].geracaopai+noloopif[j].subgeracaopai+noloopif[j].literalpai+"={parent: filho00vazio00vazio}");

	  string = {};
	  string.name = noloopif[j].literal;
	  string.title = noloopif[j].condition_block;
	  string2 = "filho"+noloopif[j].geracao+noloopif[j].subgeracao+noloopif[j].literal+"00vazio";
	  sombra = "z-depth-2";

	  eval("filho"+noloopif[j].geracao+noloopif[j].subgeracao+noloopif[j].literal+noloopif[j].geracaopai+noloopif[j].subgeracaopai+noloopif[j].literalpai+".text = string;");

	  eval("filho"+noloopif[j].geracao+noloopif[j].subgeracao+noloopif[j].literal+noloopif[j].geracaopai+noloopif[j].subgeracaopai+noloopif[j].literalpai+".HTMLid = string2;");
	  
	  eval("filho"+noloopif[j].geracao+noloopif[j].subgeracao+noloopif[j].literal+noloopif[j].geracaopai+noloopif[j].subgeracaopai+noloopif[j].literalpai+".HTMLclass = sombra;");
 
	  eval("tree_structure.push(filho"+noloopif[j].geracao+noloopif[j].subgeracao+noloopif[j].literal+noloopif[j].geracaopai+noloopif[j].subgeracaopai+noloopif[j].literalpai+")"); // a variável dinamica criada anteriormente é passada como argumento do push para incluir um nó na árvore
	}
	j = j + 1;
  }

 // passadas para popular a árvore

 var arrayNos = noloopif.map(function(o){return o.geracao;});

 if (Math.max.apply(Math,arrayNos) !== 1 && Math.max.apply(Math,arrayNos) !== 0) {

 var posicaoGeracaoAtual = arrayNos.indexOf(2);
 var geracaoAtual = noloopif[posicaoGeracaoAtual].geracao;
 var numeroNiveis = Math.max.apply(Math,arrayNos); // pega o maior valor de geracao existente entre os elementos da arvore
 var chaveElse = 0;
 var chaveEnd = 0;
 var quebra = "falso";

 while (quebra == "falso") {
	for (a in noloopif) {
	  if (a==0) { continue; } else {
	    if (noloopif[a].geracao == geracaoAtual) { // se a geracao do elemento relativo ao indice a seja a geracao atual sendo mapeada:

		  noloopif[a].literalpai = noloopif[posicaoGeracaoAtual-1].literal;
		  noloopif[a].geracaopai = noloopif[posicaoGeracaoAtual-1].geracao;
	      noloopif[a].subgeracaopai = noloopif[posicaoGeracaoAtual-1].subgeracao;

		  eval("filho"+noloopif[a].geracao+noloopif[a].subgeracao+noloopif[a].literal+noloopif[posicaoGeracaoAtual-1].geracao+noloopif[posicaoGeracaoAtual-1].subgeracao+noloopif[posicaoGeracaoAtual-1].literal+" = {parent: filho"+noloopif[posicaoGeracaoAtual-1].geracao+noloopif[posicaoGeracaoAtual-1].subgeracao+noloopif[posicaoGeracaoAtual-1].literal+noloopif[posicaoGeracaoAtual-1].geracaopai+noloopif[posicaoGeracaoAtual-1].subgeracaopai+noloopif[posicaoGeracaoAtual-1].literalpai+"}");

		  string = {};
		  string.name = noloopif[a].literal;
		  string.title = noloopif[a].condition_block;

		  string2 = "filho"+noloopif[a].geracao+noloopif[a].subgeracao+noloopif[a].literal+noloopif[posicaoGeracaoAtual-1].geracaopai+noloopif[posicaoGeracaoAtual-1].subgeracaopai+noloopif[posicaoGeracaoAtual-1].literal;

		  eval("filho"+noloopif[a].geracao+noloopif[a].subgeracao+noloopif[a].literal+noloopif[posicaoGeracaoAtual-1].geracao+noloopif[posicaoGeracaoAtual-1].subgeracao+noloopif[posicaoGeracaoAtual-1].literal+".text = string;"); // insere a propriedade titulo e o nome (objeto)

		  eval("filho"+noloopif[a].geracao+noloopif[a].subgeracao+noloopif[a].literal+noloopif[posicaoGeracaoAtual-1].geracao+noloopif[posicaoGeracaoAtual-1].subgeracao+noloopif[posicaoGeracaoAtual-1].literal+".HTMLid = string2;"); // insere classe HTML
		  
		  eval("filho"+noloopif[a].geracao+noloopif[a].subgeracao+noloopif[a].literal+noloopif[posicaoGeracaoAtual-1].geracao+noloopif[posicaoGeracaoAtual-1].subgeracao+noloopif[posicaoGeracaoAtual-1].literal+".HTMLclass = sombra;");

          eval("tree_structure.push(filho"+noloopif[a].geracao+noloopif[a].subgeracao+noloopif[a].literal+noloopif[posicaoGeracaoAtual-1].geracao+noloopif[posicaoGeracaoAtual-1].subgeracao+noloopif[posicaoGeracaoAtual-1].literal+")");
		} else {
		    if (noloopif[a].geracao == geracaoAtual-1 && noloopif[a].literal !== "END") { // esse if testa se houve quebra na geracao e posiciona o novo pai para que os filhos consigam referenciá-lo corretamente.

			  posicaoNoAtual = a; //a quebra ocorre justamente porque olhamos para um elemento que esta na posicao relativa ao a
			  posicaoGeracaoAuxAtual = arrayNos.indexOf(geracaoAtual,posicaoNoAtual) // essa sentenca garante que a geracao dos filhos seja a geracao + 1 do pai. pode ser que retorne -1 (nao achou a geracao atual após aquela posição.

			  if (posicaoGeracaoAuxAtual !== -1 ) {
			    posicaoGeracaoAtual = posicaoGeracaoAuxAtual;
			  }
			}
		}
	  }
	}
	geracaoAtual = geracaoAtual + 1;
	if (geracaoAtual > numeroNiveis) {
	   quebra = "verdadeiro";
	}
  }
 }
   new Treant( tree_structure );
}

function executaArvore() {
  inserePai();
  executaBloco();
  distribuiBlocosCondicao();
  montaNodes();
  executaRotinaCasos()
}

function buscaFilhos(no) {
  var geracaofilho = no.geracao + 1;
  var literalpapi = no.literal;
  var arrayfilho = [];
  
	for (a in noloopif) {
		if (no.idno < noloopif[a].idno) { // faltou arruamr aqui :)
			var geracaocontexto = noloopif[a].geracao;                                        //*********************************************************************************
			if (geracaocontexto === geracaofilho && noloopif[a].literalpai === literalpapi) { //aqui tem alguns casos de subgeracoes que nao estao sendo preenchidos corretamente
				arrayfilho.push(															  //*********************************************************************************
					{filhoid: noloopif[a].idno,
					 filhocond: noloopif[a].condition_block
					}
				);
			}
		}
	}
  no.filhos = arrayfilho; 
}

function populaFilhos() {
	for (i in noloopif) {
		buscaFilhos(noloopif[i]);
	}
}

listaCasosTeste = [];
listaCasosTesteAux = [];
var indicadorifouelse = 0;

function geradorCasos(array) {
	var arvore = array;
	for (i in arvore) {
		if (arvore[i].filhos.length === 0 && arvore[i].literal !== "END") {
			listaCasosTesteAux = [];
			caminhadaRede(arvore[i]);
		}
	}
}

function caminhadaRede(no) {
	listaCasosTesteAux.push(no.condition_block);
	if (no.pai === "vazio") {
		console.log("no terminal");
		listaCasosTeste.push(listaCasosTesteAux);
		listaCasosTesteAux = [];
	}
	else {
		indicenopai = buscaIndicePai(no);
		nopai = noloopif[indicenopai];
		caminhadaRede(nopai);
	}
}

function buscaIndicePai(no) {
	for (var i = 0; i < noloopif.length; i += 1) {
		if (noloopif[i].filhos.length > 0) {
			for (var j = 0; j < noloopif[i].filhos.length; j += 1) {
				if (noloopif[i].filhos[j].filhoid === no.idno) {
					return i;
				}
			}
		}
	}
}



estruturalista = [];

function executaRotinaCasos() {
	var objetolista = {};
	populaFilhos();
	geradorCasos(noloopif);
	for (var i in listaCasosTeste){
		objetolista.ct = i;
		objetolista.textoct = listaCasosTeste[i].reverse().toString();
		objetolista.done = false;
		objetolista.mostratxt = false;
		estruturalista.push(objetolista);
		objetolista = {};
	}
}