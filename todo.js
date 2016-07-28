angular.module('myApp',[])
 .controller('CasosController', function($scope) {
	
	$scope.itens = [];
	
    $scope.myFunction = function() {
	  
	  for (i=0; i < estruturalista.length; i++) {
		    $scope.itens.push(estruturalista[i]);
      }

    };
	
	$scope.mostraTexto = function(id) {
			if ($scope.itens[id].mostratxt === false) {
				$scope.itens[id].mostratxt = true;
			} else {
				$scope.itens[id].mostratxt = false;
			}
	};
	
   });
   

   
 
  
  
